import {
  type Address,
  type Chain,
  type ChainContract,
  type Hash,
} from 'viem';
import { getWithdrawals, type GetTimeToFinalizeReturnType, type GetTimeToProveReturnType } from 'viem/op-stack';
import type { GiwaClient, GiwaL1PublicClient, GiwaL1WalletClient } from './GiwaClient';
import type { BridgeTransaction, TransactionResult, WithdrawalStatus } from '../types';
import { GiwaError, GiwaTransactionError, ErrorCodes, ErrorMessages } from '../utils/errors';
import { ZERO_ADDRESS } from '../constants/contracts';
import {
  validateBridgeAmount,
  validateAndChecksumAddress,
  validateTokenAddress,
  validateWeiAmount,
} from '../utils/validation';

/**
 * `GiwaClient.getChain()` returns the general viem `Chain` type, whose
 * `contracts` map is optional and loosely typed (arbitrary string keys).
 * viem's op-stack actions used below (`depositTransaction`,
 * `getWithdrawalStatus`, `getTimeToProve`, `getTimeToFinalize`,
 * `waitToProve`, `proveWithdrawal`, `finalizeWithdrawal`) require a
 * `targetChain` whose `contracts.portal` / `disputeGameFactory` are
 * statically known to be present, keyed by the L1 chain id.
 * `GiwaClient`'s `createGiwaChain` populates exactly those two - GIWA is
 * fault-proof only and has no `l2OutputOracle`, which viem only reads
 * behind an on-chain `getPortalVersion() < 3` check that GIWA never
 * satisfies. `requireL1`/`requireL1Wallet` guard that both addresses are
 * actually deployed for every call site that uses this narrowing.
 */
type OpStackTargetChain = Chain & {
  contracts: NonNullable<Chain['contracts']> & {
    portal: Record<number, ChainContract>;
    disputeGameFactory: Record<number, ChainContract>;
  };
};

// L2 Standard Bridge ABI (simplified)
const L2_STANDARD_BRIDGE_ABI = [
  {
    name: 'withdraw',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: '_l2Token', type: 'address' },
      { name: '_amount', type: 'uint256' },
      { name: '_minGasLimit', type: 'uint32' },
      { name: '_extraData', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    name: 'withdrawTo',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: '_l2Token', type: 'address' },
      { name: '_to', type: 'address' },
      { name: '_amount', type: 'uint256' },
      { name: '_minGasLimit', type: 'uint32' },
      { name: '_extraData', type: 'bytes' },
    ],
    outputs: [],
  },
] as const;

// L1 Standard Bridge ABI (simplified) - used for the ERC-20 deposit path.
const L1_STANDARD_BRIDGE_ABI = [
  {
    name: 'depositERC20To',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_l1Token', type: 'address' },
      { name: '_l2Token', type: 'address' },
      { name: '_to', type: 'address' },
      { name: '_amount', type: 'uint256' },
      { name: '_minGasLimit', type: 'uint32' },
      { name: '_extraData', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    name: 'depositETHTo',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_minGasLimit', type: 'uint32' },
      { name: '_extraData', type: 'bytes' },
    ],
    outputs: [],
  },
] as const;

// Minimal ERC-20 ABI - only what's needed for the allowance/approve dance
// ahead of an ERC-20 deposit (docs.giwa.io/get-started/bridging/erc-20).
const ERC20_ABI = [
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ type: 'bool' }],
  },
] as const;

// ETH address constant for bridge
const ETH_ADDRESS = '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000' as Address;

// Minimum gas limit forwarded to the L2 side of an L1StandardBridge deposit.
const DEFAULT_DEPOSIT_MIN_GAS_LIMIT = 200000;

/**
 * The L1 contracts a bridge operation can depend on. Each method declares
 * only the ones the underlying viem action actually reads or writes, so a
 * partially configured `customContracts` still enables the paths it covers.
 */
type L1BridgeContract = 'l1StandardBridge' | 'optimismPortal' | 'disputeGameFactory';

const PORTAL = 'optimismPortal' satisfies L1BridgeContract;
const DISPUTE_GAME_FACTORY = 'disputeGameFactory' satisfies L1BridgeContract;
const STANDARD_BRIDGE = 'l1StandardBridge' satisfies L1BridgeContract;

/**
 * Bridge Manager - handles L1↔L2 bridge operations
 */
export class BridgeManager {
  private client: GiwaClient;
  private pendingTransactions: Map<Hash, BridgeTransaction> = new Map();

  constructor(client: GiwaClient) {
    this.client = client;
  }

  /**
   * Withdraw ETH from L2 to L1
   * @param amount - Amount in ETH (e.g., "0.1")
   * @param to - Optional recipient address on L1
   */
  async withdrawETH(
    amount: string,
    to?: Address
  ): Promise<TransactionResult> {
    // Validate amount with bridge-specific limits
    const amountInWei = validateBridgeAmount(amount, 'ETH');

    // Validate recipient if provided
    const validatedRecipient = to
      ? validateAndChecksumAddress(to, 'recipient')
      : undefined;

    const walletClient = this.client.getWalletClient();
    if (!walletClient) {
      throw new GiwaTransactionError('Wallet is not connected.');
    }

    const contracts = this.client.getContractAddresses();

    let hash: Hash;

    if (validatedRecipient) {
      hash = await walletClient.writeContract({
        address: contracts.l2StandardBridge,
        abi: L2_STANDARD_BRIDGE_ABI,
        functionName: 'withdrawTo',
        args: [ETH_ADDRESS, validatedRecipient, amountInWei, 200000, '0x'],
        value: amountInWei,
      });
    } else {
      hash = await walletClient.writeContract({
        address: contracts.l2StandardBridge,
        abi: L2_STANDARD_BRIDGE_ABI,
        functionName: 'withdraw',
        args: [ETH_ADDRESS, amountInWei, 200000, '0x'],
        value: amountInWei,
      });
    }

    // Track transaction
    this.pendingTransactions.set(hash, {
      direction: 'withdraw',
      amount: amountInWei,
      l2TxHash: hash,
      status: 'pending',
    });

    const publicClient = this.client.getPublicClient();

    return {
      hash,
      wait: async () => {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        // Update status
        const tx = this.pendingTransactions.get(hash);
        if (tx) {
          tx.status = receipt.status === 'success' ? 'confirmed' : 'failed';
        }

        return {
          hash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          status: receipt.status === 'success' ? 'success' : 'reverted',
          gasUsed: receipt.gasUsed,
        };
      },
    };
  }

  /**
   * Withdraw ERC-20 tokens from L2 to L1
   * @param l2TokenAddress - L2 token contract address
   * @param amount - Amount to withdraw (in token units)
   * @param to - Optional recipient address on L1
   */
  async withdrawToken(
    l2TokenAddress: Address,
    amount: bigint,
    to?: Address
  ): Promise<TransactionResult> {
    // Validate inputs
    const validatedTokenAddress = validateTokenAddress(l2TokenAddress);
    validateWeiAmount(amount, 'withdrawal amount');

    // Validate recipient if provided
    const validatedRecipient = to
      ? validateAndChecksumAddress(to, 'recipient')
      : undefined;

    const walletClient = this.client.getWalletClient();
    if (!walletClient) {
      throw new GiwaTransactionError('Wallet is not connected.');
    }

    const contracts = this.client.getContractAddresses();

    let hash: Hash;

    if (validatedRecipient) {
      hash = await walletClient.writeContract({
        address: contracts.l2StandardBridge,
        abi: L2_STANDARD_BRIDGE_ABI,
        functionName: 'withdrawTo',
        args: [validatedTokenAddress, validatedRecipient, amount, 200000, '0x'],
      });
    } else {
      hash = await walletClient.writeContract({
        address: contracts.l2StandardBridge,
        abi: L2_STANDARD_BRIDGE_ABI,
        functionName: 'withdraw',
        args: [validatedTokenAddress, amount, 200000, '0x'],
      });
    }

    // Track transaction
    this.pendingTransactions.set(hash, {
      direction: 'withdraw',
      amount,
      token: l2TokenAddress,
      l2TxHash: hash,
      status: 'pending',
    });

    const publicClient = this.client.getPublicClient();

    return {
      hash,
      wait: async () => {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        const tx = this.pendingTransactions.get(hash);
        if (tx) {
          tx.status = receipt.status === 'success' ? 'confirmed' : 'failed';
        }

        return {
          hash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          status: receipt.status === 'success' ? 'success' : 'reverted',
          gasUsed: receipt.gasUsed,
        };
      },
    };
  }

  /**
   * Deposit ETH from L1 to L2.
   *
   * Builds an L2 deposit transaction via viem's `buildDepositTransaction`
   * (against the L2 public client) and submits it through the
   * `OptimismPortal` contract via `depositTransaction` (on the L1 wallet
   * client).
   *
   * IMPORTANT: `wait()` resolves once the **L1** transaction is confirmed,
   * not once the funds land on L2. Deposits are relayed to L2 asynchronously
   * (usually within a couple of minutes); the returned hash is the L1
   * transaction hash, not an L2 transaction hash.
   *
   * @param amount - Amount in ETH (e.g., "0.1")
   * @param to - Optional recipient address on L2 (defaults to the sender)
   */
  async depositETH(amount: string, to?: Address): Promise<TransactionResult> {
    const amountInWei = validateBridgeAmount(amount, 'ETH');

    const validatedRecipient = to
      ? validateAndChecksumAddress(to, 'recipient')
      : undefined;

    // `depositTransaction` writes to the OptimismPortal only.
    const { publicClientL1, walletClientL1 } = this.requireL1Wallet([PORTAL]);
    const publicClientL2 = this.client.getPublicClient();
    const targetChain = this.getTargetChain();

    const depositArgs = await publicClientL2.buildDepositTransaction({
      mint: amountInWei,
      to: validatedRecipient ?? walletClientL1.account.address,
    });

    // Built explicitly (rather than `{ ...depositArgs, targetChain }`):
    // `buildDepositTransaction`'s return type carries the same
    // `targetChain`-or-`portalAddress` union as `depositTransaction`'s
    // parameters, and spreading it would retain a leftover `portalAddress`
    // member alongside our own `targetChain`, which fails to type-check
    // against either union arm.
    const hash = await walletClientL1.depositTransaction({
      account: depositArgs.account,
      request: depositArgs.request,
      targetChain,
    });

    // Track transaction
    this.pendingTransactions.set(hash, {
      direction: 'deposit',
      amount: amountInWei,
      l1TxHash: hash,
      status: 'pending',
    });

    return {
      hash,
      wait: async () => {
        const receipt = await publicClientL1.waitForTransactionReceipt({ hash });

        const tx = this.pendingTransactions.get(hash);
        if (tx) {
          tx.status = receipt.status === 'success' ? 'confirmed' : 'failed';
        }

        return {
          hash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          status: receipt.status === 'success' ? 'success' : 'reverted',
          gasUsed: receipt.gasUsed,
        };
      },
    };
  }

  /**
   * Deposit ERC-20 tokens from L1 to L2.
   *
   * Per docs.giwa.io/get-started/bridging/erc-20: reads the L1 token
   * allowance for the `L1StandardBridge`, sends an `approve` first (and
   * waits for its receipt) only if the current allowance is insufficient,
   * then calls `L1StandardBridge.depositERC20To`.
   *
   * IMPORTANT: `wait()` resolves once the **L1** deposit transaction is
   * confirmed, not once the tokens land on L2.
   *
   * @param l1TokenAddress - L1 token contract address
   * @param l2TokenAddress - Corresponding L2 token contract address
   * @param amount - Amount to deposit (in token units)
   * @param to - Optional recipient address on L2 (defaults to the sender)
   */
  async depositToken(
    l1TokenAddress: Address,
    l2TokenAddress: Address,
    amount: bigint,
    to?: Address
  ): Promise<TransactionResult> {
    const validatedL1Token = validateTokenAddress(l1TokenAddress);
    const validatedL2Token = validateTokenAddress(l2TokenAddress);
    validateWeiAmount(amount, 'deposit amount');

    const validatedRecipient = to
      ? validateAndChecksumAddress(to, 'recipient')
      : undefined;

    // ERC-20 deposits go through the L1StandardBridge, not the portal.
    const { publicClientL1, walletClientL1 } = this.requireL1Wallet([STANDARD_BRIDGE]);
    const contracts = this.client.getContractAddresses();
    const owner = walletClientL1.account.address;
    const recipient = validatedRecipient ?? owner;

    const allowance = await publicClientL1.readContract({
      address: validatedL1Token,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [owner, contracts.l1StandardBridge],
    });

    if (allowance < amount) {
      const approveHash = await walletClientL1.writeContract({
        address: validatedL1Token,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [contracts.l1StandardBridge, amount],
      });
      await publicClientL1.waitForTransactionReceipt({ hash: approveHash });
    }

    const hash = await walletClientL1.writeContract({
      address: contracts.l1StandardBridge,
      abi: L1_STANDARD_BRIDGE_ABI,
      functionName: 'depositERC20To',
      args: [
        validatedL1Token,
        validatedL2Token,
        recipient,
        amount,
        DEFAULT_DEPOSIT_MIN_GAS_LIMIT,
        '0x',
      ],
    });

    // Track transaction
    this.pendingTransactions.set(hash, {
      direction: 'deposit',
      amount,
      token: validatedL1Token,
      l1TxHash: hash,
      status: 'pending',
    });

    return {
      hash,
      wait: async () => {
        const receipt = await publicClientL1.waitForTransactionReceipt({ hash });

        const tx = this.pendingTransactions.get(hash);
        if (tx) {
          tx.status = receipt.status === 'success' ? 'confirmed' : 'failed';
        }

        return {
          hash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          status: receipt.status === 'success' ? 'success' : 'reverted',
          gasUsed: receipt.gasUsed,
        };
      },
    };
  }

  /**
   * Get the current status of an L2 -> L1 withdrawal.
   * @param l2TxHash - The L2 transaction hash that initiated the withdrawal
   */
  async getWithdrawalStatus(l2TxHash: Hash): Promise<WithdrawalStatus> {
    // Reads the portal, then resolves the covering dispute game.
    const publicClientL1 = this.requireL1([PORTAL, DISPUTE_GAME_FACTORY]);
    const publicClientL2 = this.client.getPublicClient();

    const receipt = await publicClientL2.getTransactionReceipt({ hash: l2TxHash });

    return publicClientL1.getWithdrawalStatus({
      receipt,
      targetChain: this.getTargetChain(),
    });
  }

  /**
   * Get the estimated time until a withdrawal is ready to prove.
   * @param l2TxHash - The L2 transaction hash that initiated the withdrawal
   */
  async getTimeToProve(l2TxHash: Hash): Promise<GetTimeToProveReturnType> {
    // Waits on the next dispute game, resolved via the factory.
    const publicClientL1 = this.requireL1([PORTAL, DISPUTE_GAME_FACTORY]);
    const publicClientL2 = this.client.getPublicClient();

    const receipt = await publicClientL2.getTransactionReceipt({ hash: l2TxHash });

    return publicClientL1.getTimeToProve({
      receipt,
      targetChain: this.getTargetChain(),
    });
  }

  /**
   * Get the estimated time until a proved withdrawal is ready to finalize.
   * @param l2TxHash - The L2 transaction hash that initiated the withdrawal
   */
  async getTimeToFinalize(l2TxHash: Hash): Promise<GetTimeToFinalizeReturnType> {
    // Portal-only on the fault-proof (v3+) path GIWA takes.
    const publicClientL1 = this.requireL1([PORTAL]);
    const publicClientL2 = this.client.getPublicClient();

    const receipt = await publicClientL2.getTransactionReceipt({ hash: l2TxHash });
    const withdrawal = this.requireWithdrawal(receipt);

    return publicClientL1.getTimeToFinalize({
      withdrawalHash: withdrawal.withdrawalHash,
      // `getTimeToFinalize` is the one action whose parameter type also
      // demands `contracts.l2OutputOracle`, even though it only reads it
      // behind an on-chain `getPortalVersion().major < 3` branch - the
      // pre-fault-proof path, which GIWA (portal v3+) never takes. The
      // cast is confined here rather than baked into `OpStackTargetChain`,
      // which would claim an address GIWA does not have.
      targetChain: this.getTargetChain() as OpStackTargetChain & {
        contracts: { l2OutputOracle: Record<number, ChainContract> };
      },
    });
  }

  /**
   * Prove an L2 -> L1 withdrawal on L1.
   *
   * WARNING: this method blocks until the withdrawal is provable, which can
   * take hours (it waits for the L2 output root / dispute game that covers
   * the withdrawal's block to be submitted on L1). Use
   * `getWithdrawalStatus`/`getTimeToProve` for a non-blocking readiness
   * check before calling this.
   *
   * `wait()` resolves once the **L1** prove transaction is confirmed.
   *
   * @param l2TxHash - The L2 transaction hash that initiated the withdrawal
   */
  async proveWithdrawal(l2TxHash: Hash): Promise<TransactionResult> {
    // `waitToProve` polls the dispute game factory before proving on the portal.
    const { publicClientL1, walletClientL1 } = this.requireL1Wallet([
      PORTAL,
      DISPUTE_GAME_FACTORY,
    ]);
    const publicClientL2 = this.client.getPublicClient();
    const targetChain = this.getTargetChain();

    const receipt = await publicClientL2.getTransactionReceipt({ hash: l2TxHash });

    // Blocks until the withdrawal's L2 output/dispute game is available on L1.
    const { output, withdrawal } = await publicClientL1.waitToProve({
      receipt,
      targetChain,
    });

    const args = await publicClientL2.buildProveWithdrawal({ output, withdrawal });
    const hash = await walletClientL1.proveWithdrawal({ ...args, targetChain });

    // Track transaction
    this.pendingTransactions.set(hash, {
      direction: 'withdraw',
      amount: withdrawal.value,
      l1TxHash: hash,
      l2TxHash,
      status: 'pending',
    });

    return {
      hash,
      wait: async () => {
        const proveReceipt = await publicClientL1.waitForTransactionReceipt({ hash });

        const tx = this.pendingTransactions.get(hash);
        if (tx) {
          tx.status = proveReceipt.status === 'success' ? 'proved' : 'failed';
        }

        return {
          hash: proveReceipt.transactionHash,
          blockNumber: proveReceipt.blockNumber,
          status: proveReceipt.status === 'success' ? 'success' : 'reverted',
          gasUsed: proveReceipt.gasUsed,
        };
      },
    };
  }

  /**
   * Finalize a proved L2 -> L1 withdrawal on L1, releasing the funds.
   *
   * Does NOT wait for the finalization window to elapse - callers must
   * confirm readiness themselves first (e.g. via `getWithdrawalStatus` ===
   * `'ready-to-finalize'`, or `getTimeToFinalize`). Calling this before the
   * withdrawal is ready to finalize will revert on L1.
   *
   * `wait()` resolves once the **L1** finalize transaction is confirmed.
   *
   * @param l2TxHash - The L2 transaction hash that initiated the withdrawal
   */
  async finalizeWithdrawal(l2TxHash: Hash): Promise<TransactionResult> {
    // `finalizeWithdrawalTransaction` is a portal call.
    const { publicClientL1, walletClientL1 } = this.requireL1Wallet([PORTAL]);
    const publicClientL2 = this.client.getPublicClient();
    const targetChain = this.getTargetChain();

    const receipt = await publicClientL2.getTransactionReceipt({ hash: l2TxHash });
    const withdrawal = this.requireWithdrawal(receipt);

    const hash = await walletClientL1.finalizeWithdrawal({ targetChain, withdrawal });

    // Track transaction
    this.pendingTransactions.set(hash, {
      direction: 'withdraw',
      amount: withdrawal.value,
      l1TxHash: hash,
      l2TxHash,
      status: 'pending',
    });

    return {
      hash,
      wait: async () => {
        const finalizeReceipt = await publicClientL1.waitForTransactionReceipt({ hash });

        const tx = this.pendingTransactions.get(hash);
        if (tx) {
          tx.status = finalizeReceipt.status === 'success' ? 'finalized' : 'failed';
        }

        return {
          hash: finalizeReceipt.transactionHash,
          blockNumber: finalizeReceipt.blockNumber,
          status: finalizeReceipt.status === 'success' ? 'success' : 'reverted',
          gasUsed: finalizeReceipt.gasUsed,
        };
      },
    };
  }

  /**
   * Get pending bridge transactions
   */
  getPendingTransactions(): BridgeTransaction[] {
    return Array.from(this.pendingTransactions.values());
  }

  /**
   * Get bridge transaction by hash
   */
  getTransaction(hash: Hash): BridgeTransaction | undefined {
    return this.pendingTransactions.get(hash);
  }

  /**
   * Estimate withdrawal time
   * @returns Estimated time in seconds
   */
  getEstimatedWithdrawalTime(): number {
    // OP Stack typically has a 7-day challenge period
    return 7 * 24 * 60 * 60; // 7 days in seconds
  }

  /**
   * Clear pending transactions
   */
  clearPendingTransactions(): void {
    this.pendingTransactions.clear();
  }

  /**
   * Require L1 (Ethereum) read support:
   * - `config.endpoints.l1RpcUrl` supplied to the client
   *   (`L1_RPC_NOT_CONFIGURED`), and
   * - the `required` L1 bridge contracts - the ones this particular
   *   operation calls - actually deployed on the selected network
   *   (`L1_BRIDGE_CONTRACTS_NOT_CONFIGURED`).
   *
   * The second check matters: on GIWA mainnet (not launched) every L1
   * address is `ZERO_ADDRESS`. Without it, a deposit would be sent to
   * `0x000...0`, which has no code, so the call succeeds trivially and
   * `wait()` reports `status: 'success'` while no funds ever move.
   */
  private requireL1(required: L1BridgeContract[]): GiwaL1PublicClient {
    if (!this.client.hasL1Support()) {
      throw new GiwaError(ErrorMessages.L1_RPC_NOT_CONFIGURED, ErrorCodes.L1_RPC_NOT_CONFIGURED);
    }

    const publicClientL1 = this.client.getL1PublicClient();
    if (!publicClientL1) {
      // Defensive: hasL1Support() guarantees this is non-null by construction.
      throw new GiwaError(ErrorMessages.L1_RPC_NOT_CONFIGURED, ErrorCodes.L1_RPC_NOT_CONFIGURED);
    }

    this.requireL1BridgeContracts(required);

    return publicClientL1;
  }

  /**
   * Assert that the L1 bridge contracts a specific operation calls are real
   * deployed addresses rather than the `ZERO_ADDRESS` placeholder.
   *
   * Checked per operation rather than all at once: `customContracts` is a
   * `Partial<ContractAddresses>`, so a caller may legitimately configure
   * only the subset a given path needs (e.g. the portal for ETH deposits
   * without an `l1StandardBridge` for ERC-20).
   */
  private requireL1BridgeContracts(required: L1BridgeContract[]): void {
    const contracts = this.client.getContractAddresses();
    const missing = required.filter((name) => contracts[name] === ZERO_ADDRESS);

    if (missing.length > 0) {
      throw new GiwaError(
        `${ErrorMessages.L1_BRIDGE_CONTRACTS_NOT_CONFIGURED} Missing: ${missing.join(', ')}.`,
        ErrorCodes.L1_BRIDGE_CONTRACTS_NOT_CONFIGURED
      );
    }
  }

  /**
   * Require L1 (Ethereum) write support: L1 read support (see `requireL1`)
   * plus a connected account.
   */
  private requireL1Wallet(required: L1BridgeContract[]): {
    publicClientL1: GiwaL1PublicClient;
    walletClientL1: GiwaL1WalletClient;
  } {
    const publicClientL1 = this.requireL1(required);

    const walletClientL1 = this.client.getL1WalletClient();
    if (!walletClientL1) {
      throw new GiwaTransactionError(ErrorMessages.WALLET_NOT_CONNECTED);
    }

    return { publicClientL1, walletClientL1 };
  }

  /**
   * Extract the single withdrawal a receipt is expected to contain.
   *
   * Mirrors viem's own `ReceiptContainsNoWithdrawalsError` guard: a receipt
   * for a transaction that never initiated a withdrawal yields an empty
   * list, and indexing it blindly would surface as an opaque
   * `Cannot read properties of undefined` further down the call stack.
   */
  private requireWithdrawal(
    receipt: Parameters<typeof getWithdrawals>[0]
  ): ReturnType<typeof getWithdrawals>[number] {
    const [withdrawal] = getWithdrawals(receipt);

    if (!withdrawal) {
      throw new GiwaTransactionError(
        ErrorMessages.NO_WITHDRAWAL_IN_RECEIPT,
        ErrorCodes.NO_WITHDRAWAL_IN_RECEIPT
      );
    }

    return withdrawal;
  }

  /**
   * The GIWA chain (`client.getChain()`) narrowed to the op-stack contract
   * shape required by `targetChain` params. See `OpStackTargetChain` above
   * for why this narrowing is necessary and safe.
   */
  private getTargetChain(): OpStackTargetChain {
    return this.client.getChain() as OpStackTargetChain;
  }
}
