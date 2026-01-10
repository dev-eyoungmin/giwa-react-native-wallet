import {
  type Address,
  type Hash,
} from 'viem';
import type { GiwaClient } from './GiwaClient';
import type { BridgeTransaction, TransactionResult } from '../types';
import { GiwaTransactionError } from '../utils/errors';
import {
  validateBridgeAmount,
  validateAndChecksumAddress,
  validateTokenAddress,
  validateWeiAmount,
} from '../utils/validation';

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

// ETH address constant for bridge
const ETH_ADDRESS = '0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000' as Address;

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
          tx.status = receipt.status === 'success' ? 'confirmed' : 'pending';
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
          tx.status = receipt.status === 'success' ? 'confirmed' : 'pending';
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
}
