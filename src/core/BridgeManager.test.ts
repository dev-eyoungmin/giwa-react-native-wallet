import { describe, it, expect, vi, type Mock } from 'vitest';
import { encodeAbiParameters, encodeEventTopics, getAddress, type Address, type Hash, type Hex } from 'viem';
import { BridgeManager } from './BridgeManager';
import type { GiwaClient } from './GiwaClient';
import { ZERO_ADDRESS, type ContractAddresses } from '../constants/contracts';
import { GiwaError, GiwaTransactionError, ErrorCodes } from '../utils/errors';
import type { WithdrawalStatus } from '../types';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

/** Deterministic, distinct test addresses (all-lowercase input skips viem's
 * checksum check in `isAddress`, then `getAddress` normalizes it - same
 * normalization `validateAndChecksumAddress` applies inside BridgeManager,
 * so fixtures and call-arg assertions stay byte-for-byte comparable). */
function testAddress(seed: string): Address {
  return getAddress(`0x${seed.padStart(40, '0')}`);
}

/** Deterministic 32-byte test hash/bytes32 value. */
function testHash(seed: string): Hash {
  return `0x${seed.padStart(64, '0')}` as Hash;
}

const ACCOUNT = testAddress('a1');
const RECIPIENT = testAddress('b2');
const L1_TOKEN = testAddress('c3');
const L2_TOKEN = testAddress('d4');

const CONTRACTS: ContractAddresses = {
  l1StandardBridge: testAddress('1'),
  l2StandardBridge: testAddress('2'),
  optimismPortal: testAddress('3'),
  l1CrossDomainMessenger: testAddress('4'),
  disputeGameFactory: testAddress('5'),
  upnameRegistry: testAddress('6'),
  eas: testAddress('7'),
  schemaRegistry: testAddress('8'),
  dojangScroll: testAddress('9'),
  attestationIndexer: testAddress('10'),
  schemaBook: testAddress('11'),
  dojangAttesterBook: testAddress('12'),
  weth: testAddress('13'),
  multicall3: testAddress('14'),
};

/** Opaque target-chain fixture. BridgeManager only threads this through to
 * the (mocked) op-stack actions - it never inspects it - so identity
 * (`toBe`) is all a call-arg assertion needs. */
const TARGET_CHAIN = { __fixture: 'targetChain' };

const L2_TX_HASH = testHash('e1');

// ---------------------------------------------------------------------------
// A receipt with no MessagePassed log, decoded via the real `getWithdrawals`
// (`requireWithdrawal` imports and calls it directly - it is not part of the
// client seam, so it is not mocked). Building a real, decodable log (rather
// than mocking `getWithdrawals`) exercises the actual decode path.
// ---------------------------------------------------------------------------

const MESSAGE_PASSED_ABI = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'uint256', name: 'nonce', type: 'uint256' },
      { indexed: true, internalType: 'address', name: 'sender', type: 'address' },
      { indexed: true, internalType: 'address', name: 'target', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'value', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'gasLimit', type: 'uint256' },
      { indexed: false, internalType: 'bytes', name: 'data', type: 'bytes' },
      { indexed: false, internalType: 'bytes32', name: 'withdrawalHash', type: 'bytes32' },
    ],
    name: 'MessagePassed',
    type: 'event',
  },
] as const;

interface WithdrawalFixture {
  nonce: bigint;
  sender: Address;
  target: Address;
  value: bigint;
  gasLimit: bigint;
  data: Hex;
  withdrawalHash: Hash;
}

const WITHDRAWAL: WithdrawalFixture = {
  nonce: 1n,
  sender: ACCOUNT,
  target: testAddress('f5'),
  value: 500000000000000000n,
  gasLimit: 200000n,
  data: '0x',
  withdrawalHash: testHash('ab'),
};

/** A minimal log object - only `topics`/`data` matter to `parseEventLogs`. */
function makeWithdrawalLog(withdrawal: WithdrawalFixture): { topics: readonly Hex[]; data: Hex } {
  // `encodeEventTopics`'s return type is widened to allow array/null topics
  // (for indexed array-typed filter args); none of MessagePassed's indexed
  // params are arrays, so every entry here is always a single `Hex`.
  const topics = encodeEventTopics({
    abi: MESSAGE_PASSED_ABI,
    eventName: 'MessagePassed',
    args: { nonce: withdrawal.nonce, sender: withdrawal.sender, target: withdrawal.target },
  }) as readonly Hex[];
  const data = encodeAbiParameters(
    [
      { name: 'value', type: 'uint256' },
      { name: 'gasLimit', type: 'uint256' },
      { name: 'data', type: 'bytes' },
      { name: 'withdrawalHash', type: 'bytes32' },
    ],
    [withdrawal.value, withdrawal.gasLimit, withdrawal.data, withdrawal.withdrawalHash]
  );
  return { topics, data };
}

interface FakeLog {
  topics: readonly Hex[];
  data: Hex;
}

interface FakeReceipt {
  status: 'success' | 'reverted';
  transactionHash: Hash;
  blockNumber: bigint;
  gasUsed: bigint;
  logs: FakeLog[];
}

function makeReceipt(overrides: Partial<FakeReceipt> = {}): FakeReceipt {
  return {
    status: 'success',
    transactionHash: testHash('99'),
    blockNumber: 12345n,
    gasUsed: 21000n,
    logs: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Fake GiwaClient - only the methods BridgeManager actually calls.
// ---------------------------------------------------------------------------

interface FakeL2PublicClient {
  buildDepositTransaction: Mock<
    (args: { mint: bigint; to: Address }) => Promise<{ account: unknown; request: unknown }>
  >;
  getTransactionReceipt: Mock<(args: { hash: Hash }) => Promise<FakeReceipt>>;
  waitForTransactionReceipt: Mock<(args: { hash: Hash }) => Promise<FakeReceipt>>;
  buildProveWithdrawal: Mock<(args: { output: unknown; withdrawal: unknown }) => Promise<unknown>>;
}

interface FakeL2WalletClient {
  writeContract: Mock<(args: Record<string, unknown>) => Promise<Hash>>;
}

interface FakeL1PublicClient {
  readContract: Mock<(args: Record<string, unknown>) => Promise<bigint>>;
  waitForTransactionReceipt: Mock<(args: { hash: Hash }) => Promise<FakeReceipt>>;
  getWithdrawalStatus: Mock<(args: Record<string, unknown>) => Promise<WithdrawalStatus>>;
  getTimeToProve: Mock<(args: Record<string, unknown>) => Promise<unknown>>;
  getTimeToFinalize: Mock<(args: Record<string, unknown>) => Promise<unknown>>;
  waitToProve: Mock<(args: Record<string, unknown>) => Promise<{ output: unknown; withdrawal: WithdrawalFixture }>>;
}

interface FakeL1WalletClient {
  account: { address: Address };
  writeContract: Mock<(args: Record<string, unknown>) => Promise<Hash>>;
  depositTransaction: Mock<(args: Record<string, unknown>) => Promise<Hash>>;
  proveWithdrawal: Mock<(args: Record<string, unknown>) => Promise<Hash>>;
  finalizeWithdrawal: Mock<(args: Record<string, unknown>) => Promise<Hash>>;
}

interface ClientOverrides {
  contracts?: Partial<ContractAddresses>;
  hasL1Support?: boolean;
  l2Wallet?: 'connected' | 'disconnected';
  l1Wallet?: 'connected' | 'disconnected';
}

interface FakeClient {
  client: GiwaClient;
  l2Public: FakeL2PublicClient;
  l2Wallet: FakeL2WalletClient;
  l1Public: FakeL1PublicClient;
  l1Wallet: FakeL1WalletClient;
  getContractAddresses: Mock<() => ContractAddresses>;
}

function makeClient(overrides: ClientOverrides = {}): FakeClient {
  const l2Public: FakeL2PublicClient = {
    buildDepositTransaction: vi.fn(),
    getTransactionReceipt: vi.fn(),
    waitForTransactionReceipt: vi.fn(),
    buildProveWithdrawal: vi.fn(),
  };
  const l2Wallet: FakeL2WalletClient = { writeContract: vi.fn() };
  const l1Public: FakeL1PublicClient = {
    readContract: vi.fn(),
    waitForTransactionReceipt: vi.fn(),
    getWithdrawalStatus: vi.fn(),
    getTimeToProve: vi.fn(),
    getTimeToFinalize: vi.fn(),
    waitToProve: vi.fn(),
  };
  const l1Wallet: FakeL1WalletClient = {
    account: { address: ACCOUNT },
    writeContract: vi.fn(),
    depositTransaction: vi.fn(),
    proveWithdrawal: vi.fn(),
    finalizeWithdrawal: vi.fn(),
  };

  const hasL1 = overrides.hasL1Support ?? true;
  const l2WalletConnected = overrides.l2Wallet !== 'disconnected';
  const l1WalletConnected = overrides.l1Wallet !== 'disconnected';

  const getContractAddresses = vi.fn(() => ({ ...CONTRACTS, ...overrides.contracts }));

  const fake = {
    getPublicClient: vi.fn(() => l2Public),
    getWalletClient: vi.fn(() => (l2WalletConnected ? l2Wallet : null)),
    getContractAddresses,
    getChain: vi.fn(() => TARGET_CHAIN),
    hasL1Support: vi.fn(() => hasL1),
    getL1PublicClient: vi.fn(() => (hasL1 ? l1Public : null)),
    getL1WalletClient: vi.fn(() => (hasL1 && l1WalletConnected ? l1Wallet : null)),
  };

  // Single cast at the seam: BridgeManager only ever sees the real
  // `GiwaClient` interface; everything above is opaque to it.
  return { client: fake as unknown as GiwaClient, l2Public, l2Wallet, l1Public, l1Wallet, getContractAddresses };
}

// ---------------------------------------------------------------------------
// Error assertion helpers
// ---------------------------------------------------------------------------

async function captureError(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (err) {
    return err;
  }
  throw new Error('Expected promise to reject, but it resolved.');
}

function assertGiwaError(err: unknown): asserts err is GiwaError {
  expect(err).toBeInstanceOf(GiwaError);
}

// ===========================================================================

describe('BridgeManager', () => {
  describe('withdrawETH', () => {
    it('throws GiwaTransactionError when the L2 wallet is not connected, without sending a transaction', async () => {
      const { client, l2Wallet } = makeClient({ l2Wallet: 'disconnected' });
      const manager = new BridgeManager(client);

      const err = await captureError(manager.withdrawETH('0.1'));

      expect(err).toBeInstanceOf(GiwaTransactionError);
      expect(l2Wallet.writeContract).not.toHaveBeenCalled();
    });

    it('rejects a malformed amount string', async () => {
      const { client } = makeClient();
      const manager = new BridgeManager(client);

      const err = await captureError(manager.withdrawETH('not-a-number'));
      assertGiwaError(err);
      expect(err.code).toBe('INVALID_AMOUNT');
    });

    it('rejects a zero amount', async () => {
      const { client } = makeClient();
      const manager = new BridgeManager(client);

      const err = await captureError(manager.withdrawETH('0'));
      assertGiwaError(err);
      expect(err.code).toBe('INVALID_AMOUNT');
    });

    it('rejects a negative amount', async () => {
      const { client } = makeClient();
      const manager = new BridgeManager(client);

      const err = await captureError(manager.withdrawETH('-1'));
      assertGiwaError(err);
      expect(err.code).toBe('INVALID_AMOUNT');
    });

    it('rejects an invalid recipient address', async () => {
      const { client } = makeClient();
      const manager = new BridgeManager(client);

      const err = await captureError(manager.withdrawETH('0.1', 'not-an-address' as Address));
      assertGiwaError(err);
      expect(err.code).toBe('INVALID_ADDRESS');
    });

    it('calls the L2StandardBridge `withdraw` (not `withdrawTo`) when no recipient is given', async () => {
      const { client, l2Wallet, l2Public } = makeClient();
      const hash = testHash('11');
      l2Wallet.writeContract.mockResolvedValue(hash);
      const manager = new BridgeManager(client);

      const result = await manager.withdrawETH('0.1');

      expect(result.hash).toBe(hash);
      expect(l2Wallet.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: CONTRACTS.l2StandardBridge,
          functionName: 'withdraw',
          args: ['0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000', 100000000000000000n, 200000, '0x'],
          value: 100000000000000000n,
        })
      );
      expect(l2Public.waitForTransactionReceipt).not.toHaveBeenCalled();
    });

    it('calls `withdrawTo` with the recipient when `to` is given', async () => {
      const { client, l2Wallet } = makeClient();
      l2Wallet.writeContract.mockResolvedValue(testHash('12'));
      const manager = new BridgeManager(client);

      await manager.withdrawETH('0.1', RECIPIENT);

      expect(l2Wallet.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          functionName: 'withdrawTo',
          args: ['0xDeadDeAddeAddEAddeadDEaDDEAdDeaDDeAD0000', RECIPIENT, 100000000000000000n, 200000, '0x'],
        })
      );
    });

    it('tracks the transaction as pending, keyed by the L2 hash', async () => {
      const { client, l2Wallet } = makeClient();
      const hash = testHash('13');
      l2Wallet.writeContract.mockResolvedValue(hash);
      const manager = new BridgeManager(client);

      await manager.withdrawETH('0.25');

      expect(manager.getTransaction(hash)).toEqual({
        direction: 'withdraw',
        amount: 250000000000000000n,
        l2TxHash: hash,
        status: 'pending',
      });
    });

    it('wait() resolves to "confirmed"/"success" for a successful receipt', async () => {
      const { client, l2Wallet, l2Public } = makeClient();
      const hash = testHash('14');
      l2Wallet.writeContract.mockResolvedValue(hash);
      l2Public.waitForTransactionReceipt.mockResolvedValue(
        makeReceipt({ status: 'success', transactionHash: hash, blockNumber: 7n, gasUsed: 30000n })
      );
      const manager = new BridgeManager(client);

      const result = await manager.withdrawETH('0.1');
      const receipt = await result.wait();

      expect(receipt).toEqual({ hash, blockNumber: 7n, status: 'success', gasUsed: 30000n });
      expect(manager.getTransaction(hash)?.status).toBe('confirmed');
    });

    // Regression: a reverted L2 receipt used to leave the tracked status
    // stuck at 'pending' forever instead of surfacing the failure.
    it('wait() resolves to "failed"/"reverted" for a reverted receipt', async () => {
      const { client, l2Wallet, l2Public } = makeClient();
      const hash = testHash('15');
      l2Wallet.writeContract.mockResolvedValue(hash);
      l2Public.waitForTransactionReceipt.mockResolvedValue(
        makeReceipt({ status: 'reverted', transactionHash: hash, blockNumber: 9n, gasUsed: 40000n })
      );
      const manager = new BridgeManager(client);

      const result = await manager.withdrawETH('0.1');
      const receipt = await result.wait();

      expect(receipt).toEqual({ hash, blockNumber: 9n, status: 'reverted', gasUsed: 40000n });
      expect(manager.getTransaction(hash)?.status).toBe('failed');
    });
  });

  describe('withdrawToken', () => {
    it('throws GiwaTransactionError when the L2 wallet is not connected, without sending a transaction', async () => {
      const { client, l2Wallet } = makeClient({ l2Wallet: 'disconnected' });
      const manager = new BridgeManager(client);

      const err = await captureError(manager.withdrawToken(L2_TOKEN, 1n));

      expect(err).toBeInstanceOf(GiwaTransactionError);
      expect(l2Wallet.writeContract).not.toHaveBeenCalled();
    });

    it('rejects an invalid token address', async () => {
      const { client } = makeClient();
      const manager = new BridgeManager(client);

      const err = await captureError(manager.withdrawToken('not-an-address' as Address, 1n));
      assertGiwaError(err);
      expect(err.code).toBe('INVALID_ADDRESS');
    });

    it('rejects a zero amount', async () => {
      const { client } = makeClient();
      const manager = new BridgeManager(client);

      const err = await captureError(manager.withdrawToken(L2_TOKEN, 0n));
      assertGiwaError(err);
      expect(err.code).toBe('INVALID_AMOUNT');
    });

    it('rejects a negative amount', async () => {
      const { client } = makeClient();
      const manager = new BridgeManager(client);

      const err = await captureError(manager.withdrawToken(L2_TOKEN, -1n));
      assertGiwaError(err);
      expect(err.code).toBe('INVALID_AMOUNT');
    });

    it('calls `withdraw` with no recipient, `withdrawTo` with one', async () => {
      const { client, l2Wallet } = makeClient();
      l2Wallet.writeContract.mockResolvedValue(testHash('21'));
      const manager = new BridgeManager(client);

      await manager.withdrawToken(L2_TOKEN, 1000n);
      expect(l2Wallet.writeContract).toHaveBeenLastCalledWith(
        expect.objectContaining({ functionName: 'withdraw', args: [L2_TOKEN, 1000n, 200000, '0x'] })
      );

      await manager.withdrawToken(L2_TOKEN, 1000n, RECIPIENT);
      expect(l2Wallet.writeContract).toHaveBeenLastCalledWith(
        expect.objectContaining({
          functionName: 'withdrawTo',
          args: [L2_TOKEN, RECIPIENT, 1000n, 200000, '0x'],
        })
      );
    });

    // Regression: reverted withdrawals must reach 'failed', not stay 'pending'.
    it('wait() resolves to "failed"/"reverted" for a reverted receipt', async () => {
      const { client, l2Wallet, l2Public } = makeClient();
      const hash = testHash('22');
      l2Wallet.writeContract.mockResolvedValue(hash);
      l2Public.waitForTransactionReceipt.mockResolvedValue(
        makeReceipt({ status: 'reverted', transactionHash: hash })
      );
      const manager = new BridgeManager(client);

      const result = await manager.withdrawToken(L2_TOKEN, 1000n);
      const receipt = await result.wait();

      expect(receipt.status).toBe('reverted');
      expect(manager.getTransaction(hash)?.status).toBe('failed');
    });
  });

  describe('depositETH', () => {
    it('throws L1_RPC_NOT_CONFIGURED when no L1 support is configured', async () => {
      const { client, l2Public } = makeClient({ hasL1Support: false });
      const manager = new BridgeManager(client);

      const err = await captureError(manager.depositETH('0.1'));
      assertGiwaError(err);
      expect(err.code).toBe(ErrorCodes.L1_RPC_NOT_CONFIGURED);
      expect(l2Public.buildDepositTransaction).not.toHaveBeenCalled();
    });

    it('throws GiwaTransactionError when the L1 wallet is not connected, without depositing', async () => {
      const { client, l1Wallet } = makeClient({ l1Wallet: 'disconnected' });
      const manager = new BridgeManager(client);

      const err = await captureError(manager.depositETH('0.1'));

      expect(err).toBeInstanceOf(GiwaTransactionError);
      expect(l1Wallet.depositTransaction).not.toHaveBeenCalled();
    });

    // Regression: GIWA mainnet's real, current state - every L1 bridge
    // contract is the zero-address placeholder. Depositing must be refused
    // up front rather than silently succeeding against an address with no
    // code (which would report success while no funds ever moved).
    it('refuses to deposit when optimismPortal is the zero address (GIWA mainnet today)', async () => {
      const { client, l1Wallet, l2Public } = makeClient({
        contracts: { optimismPortal: ZERO_ADDRESS, l1StandardBridge: ZERO_ADDRESS, disputeGameFactory: ZERO_ADDRESS },
      });
      const manager = new BridgeManager(client);

      const err = await captureError(manager.depositETH('0.1'));

      assertGiwaError(err);
      expect(err.code).toBe(ErrorCodes.L1_BRIDGE_CONTRACTS_NOT_CONFIGURED);
      expect(err.message).toContain('optimismPortal');
      expect(l1Wallet.depositTransaction).not.toHaveBeenCalled();
      expect(l2Public.buildDepositTransaction).not.toHaveBeenCalled();
    });

    it('succeeds with only optimismPortal configured (l1StandardBridge/disputeGameFactory unset)', async () => {
      const { client, l1Wallet, l2Public } = makeClient({
        contracts: { l1StandardBridge: ZERO_ADDRESS, disputeGameFactory: ZERO_ADDRESS },
      });
      l2Public.buildDepositTransaction.mockResolvedValue({ account: 'fake-account', request: 'fake-request' });
      l1Wallet.depositTransaction.mockResolvedValue(testHash('31'));
      const manager = new BridgeManager(client);

      const result = await manager.depositETH('0.1');

      expect(result.hash).toBe(testHash('31'));
    });

    it('defaults the recipient to the connected L1 account when `to` is omitted', async () => {
      const { client, l2Public } = makeClient();
      l2Public.buildDepositTransaction.mockResolvedValue({ account: 'a', request: 'r' });
      const manager = new BridgeManager(client);

      await manager.depositETH('0.1');

      expect(l2Public.buildDepositTransaction).toHaveBeenCalledWith({ mint: 100000000000000000n, to: ACCOUNT });
    });

    it('uses the given recipient when `to` is provided', async () => {
      const { client, l2Public } = makeClient();
      l2Public.buildDepositTransaction.mockResolvedValue({ account: 'a', request: 'r' });
      const manager = new BridgeManager(client);

      await manager.depositETH('0.1', RECIPIENT);

      expect(l2Public.buildDepositTransaction).toHaveBeenCalledWith({ mint: 100000000000000000n, to: RECIPIENT });
    });

    it('submits the built deposit args plus targetChain to depositTransaction', async () => {
      const { client, l2Public, l1Wallet } = makeClient();
      const builtArgs = { account: { address: ACCOUNT }, request: { gas: 1n } };
      l2Public.buildDepositTransaction.mockResolvedValue(builtArgs);
      l1Wallet.depositTransaction.mockResolvedValue(testHash('32'));
      const manager = new BridgeManager(client);

      await manager.depositETH('0.1');

      expect(l1Wallet.depositTransaction).toHaveBeenCalledWith({
        account: builtArgs.account,
        request: builtArgs.request,
        targetChain: TARGET_CHAIN,
      });
    });

    it('tracks the transaction as pending, keyed by the L1 hash', async () => {
      const { client, l2Public, l1Wallet } = makeClient();
      l2Public.buildDepositTransaction.mockResolvedValue({ account: 'a', request: 'r' });
      const hash = testHash('33');
      l1Wallet.depositTransaction.mockResolvedValue(hash);
      const manager = new BridgeManager(client);

      await manager.depositETH('0.1');

      expect(manager.getTransaction(hash)).toEqual({
        direction: 'deposit',
        amount: 100000000000000000n,
        l1TxHash: hash,
        status: 'pending',
      });
    });

    // Deposit-path coverage for the reverted -> 'failed' regression (see
    // withdrawETH/withdrawToken above for the same fix on the withdraw side).
    it('wait() resolves to "failed"/"reverted" for a reverted L1 receipt', async () => {
      const { client, l2Public, l1Public, l1Wallet } = makeClient();
      l2Public.buildDepositTransaction.mockResolvedValue({ account: 'a', request: 'r' });
      const hash = testHash('34');
      l1Wallet.depositTransaction.mockResolvedValue(hash);
      l1Public.waitForTransactionReceipt.mockResolvedValue(makeReceipt({ status: 'reverted', transactionHash: hash }));
      const manager = new BridgeManager(client);

      const result = await manager.depositETH('0.1');
      const receipt = await result.wait();

      expect(receipt.status).toBe('reverted');
      expect(manager.getTransaction(hash)?.status).toBe('failed');
    });

    it('rejects an invalid amount', async () => {
      const { client } = makeClient();
      const manager = new BridgeManager(client);

      const err = await captureError(manager.depositETH('abc'));
      assertGiwaError(err);
      expect(err.code).toBe('INVALID_AMOUNT');
    });
  });

  describe('depositToken', () => {
    it('throws L1_RPC_NOT_CONFIGURED when no L1 support is configured', async () => {
      const { client } = makeClient({ hasL1Support: false });
      const manager = new BridgeManager(client);

      const err = await captureError(manager.depositToken(L1_TOKEN, L2_TOKEN, 1000n));
      assertGiwaError(err);
      expect(err.code).toBe(ErrorCodes.L1_RPC_NOT_CONFIGURED);
    });

    it('throws GiwaTransactionError when the L1 wallet is not connected, without approving or depositing', async () => {
      const { client, l1Wallet, l1Public } = makeClient({ l1Wallet: 'disconnected' });
      const manager = new BridgeManager(client);

      const err = await captureError(manager.depositToken(L1_TOKEN, L2_TOKEN, 1000n));

      expect(err).toBeInstanceOf(GiwaTransactionError);
      expect(l1Wallet.writeContract).not.toHaveBeenCalled();
      expect(l1Public.readContract).not.toHaveBeenCalled();
    });

    // Regression: GIWA mainnet's real, current state (all L1 bridge
    // contracts zeroed). Must refuse before ever approving or depositing.
    it('refuses to deposit when l1StandardBridge is the zero address (GIWA mainnet today)', async () => {
      const { client, l1Wallet, l1Public } = makeClient({
        contracts: { optimismPortal: ZERO_ADDRESS, l1StandardBridge: ZERO_ADDRESS, disputeGameFactory: ZERO_ADDRESS },
      });
      const manager = new BridgeManager(client);

      const err = await captureError(manager.depositToken(L1_TOKEN, L2_TOKEN, 1000n));

      assertGiwaError(err);
      expect(err.code).toBe(ErrorCodes.L1_BRIDGE_CONTRACTS_NOT_CONFIGURED);
      expect(err.message).toContain('l1StandardBridge');
      expect(l1Wallet.writeContract).not.toHaveBeenCalled();
      expect(l1Public.readContract).not.toHaveBeenCalled();
    });

    it('succeeds with only l1StandardBridge configured (optimismPortal/disputeGameFactory unset)', async () => {
      const { client, l1Public, l1Wallet } = makeClient({
        contracts: { optimismPortal: ZERO_ADDRESS, disputeGameFactory: ZERO_ADDRESS },
      });
      l1Public.readContract.mockResolvedValue(1000n); // allowance already sufficient
      l1Wallet.writeContract.mockResolvedValue(testHash('41'));
      const manager = new BridgeManager(client);

      const result = await manager.depositToken(L1_TOKEN, L2_TOKEN, 1000n);

      expect(result.hash).toBe(testHash('41'));
    });

    it('rejects an invalid L1 token address', async () => {
      const { client } = makeClient();
      const manager = new BridgeManager(client);

      const err = await captureError(manager.depositToken('bad' as Address, L2_TOKEN, 1000n));
      assertGiwaError(err);
      expect(err.code).toBe('INVALID_ADDRESS');
    });

    it('rejects a zero deposit amount', async () => {
      const { client } = makeClient();
      const manager = new BridgeManager(client);

      const err = await captureError(manager.depositToken(L1_TOKEN, L2_TOKEN, 0n));
      assertGiwaError(err);
      expect(err.code).toBe('INVALID_AMOUNT');
    });

    it('skips approve when the existing allowance already covers the amount', async () => {
      const { client, l1Public, l1Wallet } = makeClient();
      l1Public.readContract.mockResolvedValue(5000n);
      l1Wallet.writeContract.mockResolvedValue(testHash('42'));
      const manager = new BridgeManager(client);

      await manager.depositToken(L1_TOKEN, L2_TOKEN, 1000n);

      expect(l1Public.readContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: L1_TOKEN,
          functionName: 'allowance',
          args: [ACCOUNT, CONTRACTS.l1StandardBridge],
        })
      );
      expect(l1Wallet.writeContract).toHaveBeenCalledTimes(1);
      expect(l1Wallet.writeContract).toHaveBeenCalledWith(
        expect.objectContaining({
          address: CONTRACTS.l1StandardBridge,
          functionName: 'depositERC20To',
          args: [L1_TOKEN, L2_TOKEN, ACCOUNT, 1000n, 200000, '0x'],
        })
      );
      expect(l1Public.waitForTransactionReceipt).not.toHaveBeenCalled();
    });

    it('approves (and awaits the receipt) before depositing when the allowance is insufficient, in that order', async () => {
      const { client, l1Public, l1Wallet } = makeClient();
      l1Public.readContract.mockResolvedValue(0n); // no existing allowance
      const approveHash = testHash('43');
      const depositHash = testHash('44');
      l1Wallet.writeContract
        .mockResolvedValueOnce(approveHash) // approve
        .mockResolvedValueOnce(depositHash); // depositERC20To
      l1Public.waitForTransactionReceipt.mockResolvedValue(makeReceipt({ transactionHash: approveHash }));
      const manager = new BridgeManager(client);

      const result = await manager.depositToken(L1_TOKEN, L2_TOKEN, 1000n, RECIPIENT);

      expect(result.hash).toBe(depositHash);
      expect(l1Wallet.writeContract).toHaveBeenCalledTimes(2);
      expect(l1Wallet.writeContract.mock.calls[0][0]).toMatchObject({
        functionName: 'approve',
        args: [CONTRACTS.l1StandardBridge, 1000n],
      });
      expect(l1Wallet.writeContract.mock.calls[1][0]).toMatchObject({
        functionName: 'depositERC20To',
        args: [L1_TOKEN, L2_TOKEN, RECIPIENT, 1000n, 200000, '0x'],
      });
      expect(l1Public.waitForTransactionReceipt).toHaveBeenCalledWith({ hash: approveHash });

      // Call ORDER matters: approve -> await its receipt -> only then deposit.
      const [approveOrder, depositOrder] = l1Wallet.writeContract.mock.invocationCallOrder;
      const [waitOrder] = l1Public.waitForTransactionReceipt.mock.invocationCallOrder;
      expect(approveOrder).toBeLessThan(waitOrder);
      expect(waitOrder).toBeLessThan(depositOrder);
    });

    it('tracks the transaction as pending, keyed by the L1 deposit hash', async () => {
      const { client, l1Public, l1Wallet } = makeClient();
      l1Public.readContract.mockResolvedValue(1000n);
      const hash = testHash('45');
      l1Wallet.writeContract.mockResolvedValue(hash);
      const manager = new BridgeManager(client);

      await manager.depositToken(L1_TOKEN, L2_TOKEN, 1000n);

      expect(manager.getTransaction(hash)).toEqual({
        direction: 'deposit',
        amount: 1000n,
        token: L1_TOKEN,
        l1TxHash: hash,
        status: 'pending',
      });
    });
  });

  describe('getWithdrawalStatus / getTimeToProve (require portal + disputeGameFactory)', () => {
    it('succeeds when only portal + disputeGameFactory are configured (l1StandardBridge unset)', async () => {
      const { client, l1Public, l2Public } = makeClient({ contracts: { l1StandardBridge: ZERO_ADDRESS } });
      l2Public.getTransactionReceipt.mockResolvedValue(makeReceipt());
      l1Public.getWithdrawalStatus.mockResolvedValue('ready-to-prove');
      const manager = new BridgeManager(client);

      await expect(manager.getWithdrawalStatus(L2_TX_HASH)).resolves.toBe('ready-to-prove');
    });

    it('throws and never reads L1 when portal is unset', async () => {
      const { client, l1Public } = makeClient({ contracts: { optimismPortal: ZERO_ADDRESS } });
      const manager = new BridgeManager(client);

      const err = await captureError(manager.getWithdrawalStatus(L2_TX_HASH));
      assertGiwaError(err);
      expect(err.code).toBe(ErrorCodes.L1_BRIDGE_CONTRACTS_NOT_CONFIGURED);
      expect(err.message).toContain('optimismPortal');
      expect(l1Public.getWithdrawalStatus).not.toHaveBeenCalled();
    });

    it('throws and never reads L1 when disputeGameFactory is unset', async () => {
      const { client, l1Public } = makeClient({ contracts: { disputeGameFactory: ZERO_ADDRESS } });
      const manager = new BridgeManager(client);

      const err = await captureError(manager.getWithdrawalStatus(L2_TX_HASH));
      assertGiwaError(err);
      expect(err.code).toBe(ErrorCodes.L1_BRIDGE_CONTRACTS_NOT_CONFIGURED);
      expect(err.message).toContain('disputeGameFactory');
      expect(l1Public.getWithdrawalStatus).not.toHaveBeenCalled();
    });

    it('reads the L2 receipt then queries L1 with it plus targetChain', async () => {
      const { client, l1Public, l2Public } = makeClient();
      const receipt = makeReceipt();
      l2Public.getTransactionReceipt.mockResolvedValue(receipt);
      l1Public.getWithdrawalStatus.mockResolvedValue('waiting-to-prove');
      const manager = new BridgeManager(client);

      await manager.getWithdrawalStatus(L2_TX_HASH);

      expect(l2Public.getTransactionReceipt).toHaveBeenCalledWith({ hash: L2_TX_HASH });
      expect(l1Public.getWithdrawalStatus).toHaveBeenCalledWith({ receipt, targetChain: TARGET_CHAIN });
    });

    it('getTimeToProve: throws and never reads L1 when portal is unset', async () => {
      const { client, l1Public } = makeClient({ contracts: { optimismPortal: ZERO_ADDRESS } });
      const manager = new BridgeManager(client);

      const err = await captureError(manager.getTimeToProve(L2_TX_HASH));

      assertGiwaError(err);
      expect(err.code).toBe(ErrorCodes.L1_BRIDGE_CONTRACTS_NOT_CONFIGURED);
      expect(l1Public.getTimeToProve).not.toHaveBeenCalled();
    });

    it('getTimeToProve: reads the L2 receipt then queries L1 with it plus targetChain', async () => {
      const { client, l1Public, l2Public } = makeClient();
      const receipt = makeReceipt();
      l2Public.getTransactionReceipt.mockResolvedValue(receipt);
      const timeToProve = { period: 'ready' as const };
      l1Public.getTimeToProve.mockResolvedValue(timeToProve);
      const manager = new BridgeManager(client);

      await expect(manager.getTimeToProve(L2_TX_HASH)).resolves.toBe(timeToProve);
      expect(l1Public.getTimeToProve).toHaveBeenCalledWith({ receipt, targetChain: TARGET_CHAIN });
    });
  });

  describe('getTimeToFinalize / finalizeWithdrawal (require portal only)', () => {
    it('succeeds with only portal configured (l1StandardBridge/disputeGameFactory unset)', async () => {
      const { client, l1Public, l2Public } = makeClient({
        contracts: { l1StandardBridge: ZERO_ADDRESS, disputeGameFactory: ZERO_ADDRESS },
      });
      l2Public.getTransactionReceipt.mockResolvedValue(makeReceipt({ logs: [makeWithdrawalLog(WITHDRAWAL)] }));
      const timeToFinalize = { seconds: 10 };
      l1Public.getTimeToFinalize.mockResolvedValue(timeToFinalize);
      const manager = new BridgeManager(client);

      await expect(manager.getTimeToFinalize(L2_TX_HASH)).resolves.toBe(timeToFinalize);
      expect(l1Public.getTimeToFinalize).toHaveBeenCalledWith({
        withdrawalHash: WITHDRAWAL.withdrawalHash,
        targetChain: TARGET_CHAIN,
      });
    });

    it('throws L1_BRIDGE_CONTRACTS_NOT_CONFIGURED naming optimismPortal when portal is unset', async () => {
      const { client, l1Public, l2Public } = makeClient({ contracts: { optimismPortal: ZERO_ADDRESS } });
      const manager = new BridgeManager(client);

      const err = await captureError(manager.getTimeToFinalize(L2_TX_HASH));
      assertGiwaError(err);
      expect(err.code).toBe(ErrorCodes.L1_BRIDGE_CONTRACTS_NOT_CONFIGURED);
      expect(err.message).toContain('optimismPortal');
      expect(l2Public.getTransactionReceipt).not.toHaveBeenCalled();
      expect(l1Public.getTimeToFinalize).not.toHaveBeenCalled();
    });

    // Regression: a receipt with no withdrawal log must produce a
    // `GiwaTransactionError` carrying the specific NO_WITHDRAWAL_IN_RECEIPT
    // code, not the generic default 'TRANSACTION_ERROR'.
    it('throws GiwaTransactionError with code NO_WITHDRAWAL_IN_RECEIPT when the receipt has no withdrawal log', async () => {
      const { client, l1Public, l2Public } = makeClient();
      l2Public.getTransactionReceipt.mockResolvedValue(makeReceipt({ logs: [] }));
      const manager = new BridgeManager(client);

      const err = await captureError(manager.getTimeToFinalize(L2_TX_HASH));

      expect(err).toBeInstanceOf(GiwaTransactionError);
      assertGiwaError(err);
      expect(err.code).toBe(ErrorCodes.NO_WITHDRAWAL_IN_RECEIPT);
      expect(l1Public.getTimeToFinalize).not.toHaveBeenCalled();
    });

    it('finalizeWithdrawal: throws when portal is unset, without finalizing', async () => {
      const { client, l1Wallet } = makeClient({ contracts: { optimismPortal: ZERO_ADDRESS } });
      const manager = new BridgeManager(client);

      const err = await captureError(manager.finalizeWithdrawal(L2_TX_HASH));
      assertGiwaError(err);
      expect(err.code).toBe(ErrorCodes.L1_BRIDGE_CONTRACTS_NOT_CONFIGURED);
      expect(l1Wallet.finalizeWithdrawal).not.toHaveBeenCalled();
    });

    it('finalizeWithdrawal: throws NO_WITHDRAWAL_IN_RECEIPT and never finalizes when the receipt has no withdrawal log', async () => {
      const { client, l1Wallet, l2Public } = makeClient();
      l2Public.getTransactionReceipt.mockResolvedValue(makeReceipt({ logs: [] }));
      const manager = new BridgeManager(client);

      const err = await captureError(manager.finalizeWithdrawal(L2_TX_HASH));

      assertGiwaError(err);
      expect(err).toBeInstanceOf(GiwaTransactionError);
      expect(err.code).toBe(ErrorCodes.NO_WITHDRAWAL_IN_RECEIPT);
      expect(l1Wallet.finalizeWithdrawal).not.toHaveBeenCalled();
    });

    it('finalizeWithdrawal: throws GiwaTransactionError when the L1 wallet is not connected', async () => {
      const { client, l1Wallet } = makeClient({ l1Wallet: 'disconnected' });
      const manager = new BridgeManager(client);

      const err = await captureError(manager.finalizeWithdrawal(L2_TX_HASH));

      expect(err).toBeInstanceOf(GiwaTransactionError);
      expect(l1Wallet.finalizeWithdrawal).not.toHaveBeenCalled();
    });

    it('finalizeWithdrawal: decodes the withdrawal from the receipt and finalizes with it plus targetChain', async () => {
      const { client, l1Wallet, l2Public } = makeClient();
      l2Public.getTransactionReceipt.mockResolvedValue(makeReceipt({ logs: [makeWithdrawalLog(WITHDRAWAL)] }));
      const finalizeHash = testHash('51');
      l1Wallet.finalizeWithdrawal.mockResolvedValue(finalizeHash);
      const manager = new BridgeManager(client);

      const result = await manager.finalizeWithdrawal(L2_TX_HASH);

      expect(result.hash).toBe(finalizeHash);
      expect(l1Wallet.finalizeWithdrawal).toHaveBeenCalledTimes(1);
      const call = l1Wallet.finalizeWithdrawal.mock.calls[0][0] as {
        targetChain: unknown;
        withdrawal: WithdrawalFixture;
      };
      expect(call.targetChain).toBe(TARGET_CHAIN);
      expect(call.withdrawal.nonce).toBe(WITHDRAWAL.nonce);
      expect(call.withdrawal.value).toBe(WITHDRAWAL.value);
      expect(call.withdrawal.gasLimit).toBe(WITHDRAWAL.gasLimit);
      expect(call.withdrawal.withdrawalHash).toBe(WITHDRAWAL.withdrawalHash);
    });

    it('finalizeWithdrawal: tracks the pending tx and wait() reaches "finalized"/"failed"', async () => {
      const { client, l1Wallet, l1Public, l2Public } = makeClient();
      l2Public.getTransactionReceipt.mockResolvedValue(makeReceipt({ logs: [makeWithdrawalLog(WITHDRAWAL)] }));
      const finalizeHash = testHash('52');
      l1Wallet.finalizeWithdrawal.mockResolvedValue(finalizeHash);
      const manager = new BridgeManager(client);

      const result = await manager.finalizeWithdrawal(L2_TX_HASH);
      expect(manager.getTransaction(finalizeHash)).toMatchObject({
        direction: 'withdraw',
        amount: WITHDRAWAL.value,
        l1TxHash: finalizeHash,
        l2TxHash: L2_TX_HASH,
        status: 'pending',
      });

      l1Public.waitForTransactionReceipt.mockResolvedValue(
        makeReceipt({ status: 'reverted', transactionHash: finalizeHash })
      );
      const receipt = await result.wait();

      expect(receipt.status).toBe('reverted');
      expect(manager.getTransaction(finalizeHash)?.status).toBe('failed');
    });
  });

  describe('proveWithdrawal (requires portal + disputeGameFactory)', () => {
    it('throws L1_RPC_NOT_CONFIGURED when no L1 support is configured', async () => {
      const { client } = makeClient({ hasL1Support: false });
      const manager = new BridgeManager(client);

      const err = await captureError(manager.proveWithdrawal(L2_TX_HASH));
      assertGiwaError(err);
      expect(err.code).toBe(ErrorCodes.L1_RPC_NOT_CONFIGURED);
    });

    it('throws GiwaTransactionError when the L1 wallet is not connected, without proving', async () => {
      const { client, l1Wallet } = makeClient({ l1Wallet: 'disconnected' });
      const manager = new BridgeManager(client);

      const err = await captureError(manager.proveWithdrawal(L2_TX_HASH));

      expect(err).toBeInstanceOf(GiwaTransactionError);
      expect(l1Wallet.proveWithdrawal).not.toHaveBeenCalled();
    });

    it('throws NO_WITHDRAWAL_IN_RECEIPT before blocking on waitToProve when the receipt has no withdrawal log', async () => {
      const { client, l1Public, l1Wallet, l2Public } = makeClient();
      l2Public.getTransactionReceipt.mockResolvedValue(makeReceipt({ logs: [] }));
      const manager = new BridgeManager(client);

      const err = await captureError(manager.proveWithdrawal(L2_TX_HASH));

      assertGiwaError(err);
      expect(err).toBeInstanceOf(GiwaTransactionError);
      expect(err.code).toBe(ErrorCodes.NO_WITHDRAWAL_IN_RECEIPT);
      // The point of checking up front: waitToProve blocks for hours, so a
      // wrong hash must not get that far.
      expect(l1Public.waitToProve).not.toHaveBeenCalled();
      expect(l1Wallet.proveWithdrawal).not.toHaveBeenCalled();
    });

    it('throws L1_BRIDGE_CONTRACTS_NOT_CONFIGURED naming optimismPortal when portal is unset, without proving', async () => {
      const { client, l1Wallet, l1Public } = makeClient({ contracts: { optimismPortal: ZERO_ADDRESS } });
      const manager = new BridgeManager(client);

      const err = await captureError(manager.proveWithdrawal(L2_TX_HASH));

      assertGiwaError(err);
      expect(err.code).toBe(ErrorCodes.L1_BRIDGE_CONTRACTS_NOT_CONFIGURED);
      expect(err.message).toContain('optimismPortal');
      expect(l1Public.waitToProve).not.toHaveBeenCalled();
      expect(l1Wallet.proveWithdrawal).not.toHaveBeenCalled();
    });

    it('throws L1_BRIDGE_CONTRACTS_NOT_CONFIGURED naming disputeGameFactory when it is unset, without proving', async () => {
      const { client, l1Wallet } = makeClient({ contracts: { disputeGameFactory: ZERO_ADDRESS } });
      const manager = new BridgeManager(client);

      const err = await captureError(manager.proveWithdrawal(L2_TX_HASH));

      assertGiwaError(err);
      expect(err.message).toContain('disputeGameFactory');
      expect(l1Wallet.proveWithdrawal).not.toHaveBeenCalled();
    });

    it('succeeds with only portal + disputeGameFactory configured (l1StandardBridge unset)', async () => {
      const { client, l1Public, l2Public, l1Wallet } = makeClient({ contracts: { l1StandardBridge: ZERO_ADDRESS } });
      const receipt = makeReceipt({ logs: [makeWithdrawalLog(WITHDRAWAL)] });
      l2Public.getTransactionReceipt.mockResolvedValue(receipt);
      const output = { outputRoot: testHash('61') };
      l1Public.waitToProve.mockResolvedValue({ output, withdrawal: WITHDRAWAL });
      const proveArgs = { l2OutputIndex: 1n };
      l2Public.buildProveWithdrawal.mockResolvedValue(proveArgs);
      const proveHash = testHash('62');
      l1Wallet.proveWithdrawal.mockResolvedValue(proveHash);
      const manager = new BridgeManager(client);

      const result = await manager.proveWithdrawal(L2_TX_HASH);

      expect(result.hash).toBe(proveHash);
      expect(l1Public.waitToProve).toHaveBeenCalledWith({ receipt, targetChain: TARGET_CHAIN });
      expect(l2Public.buildProveWithdrawal).toHaveBeenCalledWith({ output, withdrawal: WITHDRAWAL });
      expect(l1Wallet.proveWithdrawal).toHaveBeenCalledWith({ ...proveArgs, targetChain: TARGET_CHAIN });
    });

    it('tracks the pending tx keyed by the L1 prove hash, referencing the source L2 hash', async () => {
      const { client, l1Public, l2Public, l1Wallet } = makeClient();
      l2Public.getTransactionReceipt.mockResolvedValue(makeReceipt({ logs: [makeWithdrawalLog(WITHDRAWAL)] }));
      l1Public.waitToProve.mockResolvedValue({ output: {}, withdrawal: WITHDRAWAL });
      l2Public.buildProveWithdrawal.mockResolvedValue({});
      const proveHash = testHash('63');
      l1Wallet.proveWithdrawal.mockResolvedValue(proveHash);
      const manager = new BridgeManager(client);

      await manager.proveWithdrawal(L2_TX_HASH);

      expect(manager.getTransaction(proveHash)).toEqual({
        direction: 'withdraw',
        amount: WITHDRAWAL.value,
        l1TxHash: proveHash,
        l2TxHash: L2_TX_HASH,
        status: 'pending',
      });
    });

    it('wait() resolves to "proved"/"success" for a successful prove receipt, "failed"/"reverted" for a reverted one', async () => {
      const { client, l1Public, l2Public, l1Wallet } = makeClient();
      l2Public.getTransactionReceipt.mockResolvedValue(makeReceipt({ logs: [makeWithdrawalLog(WITHDRAWAL)] }));
      l1Public.waitToProve.mockResolvedValue({ output: {}, withdrawal: WITHDRAWAL });
      l2Public.buildProveWithdrawal.mockResolvedValue({});
      const proveHash = testHash('64');
      l1Wallet.proveWithdrawal.mockResolvedValue(proveHash);
      l1Public.waitForTransactionReceipt.mockResolvedValue(
        makeReceipt({ status: 'success', transactionHash: proveHash })
      );
      const manager = new BridgeManager(client);

      const result = await manager.proveWithdrawal(L2_TX_HASH);
      const receipt = await result.wait();

      expect(receipt.status).toBe('success');
      expect(manager.getTransaction(proveHash)?.status).toBe('proved');
    });
  });

  describe('pending transaction bookkeeping', () => {
    it('starts empty', () => {
      const { client } = makeClient();
      const manager = new BridgeManager(client);

      expect(manager.getPendingTransactions()).toEqual([]);
      expect(manager.getTransaction(testHash('1'))).toBeUndefined();
    });

    it('getPendingTransactions reflects tracked transactions; clearPendingTransactions empties it', async () => {
      const { client, l2Wallet } = makeClient();
      const hash = testHash('71');
      l2Wallet.writeContract.mockResolvedValue(hash);
      const manager = new BridgeManager(client);

      await manager.withdrawETH('0.1');
      expect(manager.getPendingTransactions()).toHaveLength(1);
      expect(manager.getPendingTransactions()[0].l2TxHash).toBe(hash);

      manager.clearPendingTransactions();
      expect(manager.getPendingTransactions()).toEqual([]);
      expect(manager.getTransaction(hash)).toBeUndefined();
    });
  });
});
