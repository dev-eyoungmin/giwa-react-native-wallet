// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { Address, Hash } from 'viem';
import type { GetTimeToFinalizeReturnType, GetTimeToProveReturnType } from 'viem/op-stack';
import type { BridgeTransaction, WithdrawalStatus } from '../types';

// `../providers/GiwaProvider` transitively imports `react-native` (via
// AdapterFactory), which ships Flow-typed source that cannot load under
// vitest's node/jsdom runtime. Mocking the module keeps React Native out of
// the module graph entirely; only the two hooks `useBridge` consumes are
// provided.
vi.mock('../providers/GiwaProvider', () => ({
  useGiwaManagers: vi.fn(),
  useGiwaState: vi.fn(),
}));

import { useGiwaManagers, useGiwaState } from '../providers/GiwaProvider';
import { useBridge } from './useBridge';

const mockedUseGiwaManagers = vi.mocked(useGiwaManagers);
const mockedUseGiwaState = vi.mocked(useGiwaState);

// Structural types pulled from the (unexported) provider return types, so the
// test doubles stay in sync with the real hook signatures without needing to
// import react-native-tainted modules.
type ManagersReturn = ReturnType<typeof useGiwaManagers>;
type GiwaStateReturn = ReturnType<typeof useGiwaState>;

function createMockBridgeManager() {
  return {
    withdrawETH: vi.fn(),
    withdrawToken: vi.fn(),
    depositETH: vi.fn(),
    depositToken: vi.fn(),
    getWithdrawalStatus: vi.fn(),
    getTimeToProve: vi.fn(),
    getTimeToFinalize: vi.fn(),
    proveWithdrawal: vi.fn(),
    finalizeWithdrawal: vi.fn(),
    getPendingTransactions: vi.fn(),
    getTransaction: vi.fn(),
    getEstimatedWithdrawalTime: vi.fn(),
  };
}

type MockBridgeManager = ReturnType<typeof createMockBridgeManager>;

function createManagers(bridgeManager: MockBridgeManager, hasL1Support = true): ManagersReturn {
  return {
    client: { hasL1Support: vi.fn(() => hasL1Support) },
    bridgeManager,
  } as unknown as ManagersReturn;
}

const READY_STATE = {
  isInitialized: true,
  isLoading: false,
  error: null,
  environment: 'testnet',
} as unknown as GiwaStateReturn;

/** Deferred promise helper, so tests can control exactly when an async
 * manager call resolves/rejects — needed to assert on in-flight loading
 * state without relying on real timers. */
function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const HASH_A = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as Hash;
const HASH_B = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as Hash;
const ADDR_1 = '0x1111111111111111111111111111111111111111' as Address;
const ADDR_2 = '0x2222222222222222222222222222222222222222' as Address;

beforeEach(() => {
  vi.clearAllMocks();
  mockedUseGiwaState.mockReturnValue(READY_STATE);
});

describe('useBridge - action delegation', () => {
  it('depositETH delegates to bridgeManager.depositETH and unwraps the hash', async () => {
    const bridgeManager = createMockBridgeManager();
    bridgeManager.depositETH.mockResolvedValue({ hash: HASH_A, wait: vi.fn() });
    mockedUseGiwaManagers.mockReturnValue(createManagers(bridgeManager));

    const { result } = renderHook(() => useBridge());

    let returned: Hash | undefined;
    await act(async () => {
      returned = await result.current.depositETH('0.5', ADDR_1);
    });

    expect(bridgeManager.depositETH).toHaveBeenCalledWith('0.5', ADDR_1);
    expect(returned).toBe(HASH_A);
  });

  it('depositToken delegates to bridgeManager.depositToken with all args and unwraps the hash', async () => {
    const bridgeManager = createMockBridgeManager();
    bridgeManager.depositToken.mockResolvedValue({ hash: HASH_A, wait: vi.fn() });
    mockedUseGiwaManagers.mockReturnValue(createManagers(bridgeManager));

    const { result } = renderHook(() => useBridge());

    let returned: Hash | undefined;
    await act(async () => {
      returned = await result.current.depositToken(ADDR_1, ADDR_2, 100n, ADDR_1);
    });

    expect(bridgeManager.depositToken).toHaveBeenCalledWith(ADDR_1, ADDR_2, 100n, ADDR_1);
    expect(returned).toBe(HASH_A);
  });

  it('withdrawETH delegates to bridgeManager.withdrawETH and unwraps the hash', async () => {
    const bridgeManager = createMockBridgeManager();
    bridgeManager.withdrawETH.mockResolvedValue({ hash: HASH_A, wait: vi.fn() });
    mockedUseGiwaManagers.mockReturnValue(createManagers(bridgeManager));

    const { result } = renderHook(() => useBridge());

    let returned: Hash | undefined;
    await act(async () => {
      returned = await result.current.withdrawETH('0.1', ADDR_2);
    });

    expect(bridgeManager.withdrawETH).toHaveBeenCalledWith('0.1', ADDR_2);
    expect(returned).toBe(HASH_A);
  });

  it('withdrawToken delegates to bridgeManager.withdrawToken and unwraps the hash', async () => {
    const bridgeManager = createMockBridgeManager();
    bridgeManager.withdrawToken.mockResolvedValue({ hash: HASH_A, wait: vi.fn() });
    mockedUseGiwaManagers.mockReturnValue(createManagers(bridgeManager));

    const { result } = renderHook(() => useBridge());

    let returned: Hash | undefined;
    await act(async () => {
      returned = await result.current.withdrawToken(ADDR_1, 50n, ADDR_2);
    });

    expect(bridgeManager.withdrawToken).toHaveBeenCalledWith(ADDR_1, 50n, ADDR_2);
    expect(returned).toBe(HASH_A);
  });

  it('proveWithdrawal delegates to bridgeManager.proveWithdrawal and unwraps the hash', async () => {
    const bridgeManager = createMockBridgeManager();
    bridgeManager.proveWithdrawal.mockResolvedValue({ hash: HASH_A, wait: vi.fn() });
    mockedUseGiwaManagers.mockReturnValue(createManagers(bridgeManager));

    const { result } = renderHook(() => useBridge());

    let returned: Hash | undefined;
    await act(async () => {
      returned = await result.current.proveWithdrawal(HASH_B);
    });

    expect(bridgeManager.proveWithdrawal).toHaveBeenCalledWith(HASH_B);
    expect(returned).toBe(HASH_A);
  });

  it('finalizeWithdrawal delegates to bridgeManager.finalizeWithdrawal and unwraps the hash', async () => {
    const bridgeManager = createMockBridgeManager();
    bridgeManager.finalizeWithdrawal.mockResolvedValue({ hash: HASH_A, wait: vi.fn() });
    mockedUseGiwaManagers.mockReturnValue(createManagers(bridgeManager));

    const { result } = renderHook(() => useBridge());

    let returned: Hash | undefined;
    await act(async () => {
      returned = await result.current.finalizeWithdrawal(HASH_B);
    });

    expect(bridgeManager.finalizeWithdrawal).toHaveBeenCalledWith(HASH_B);
    expect(returned).toBe(HASH_A);
  });

  it('getWithdrawalStatus delegates and returns the manager result verbatim (no hash unwrapping)', async () => {
    const bridgeManager = createMockBridgeManager();
    const status: WithdrawalStatus = 'ready-to-prove';
    bridgeManager.getWithdrawalStatus.mockResolvedValue(status);
    mockedUseGiwaManagers.mockReturnValue(createManagers(bridgeManager));

    const { result } = renderHook(() => useBridge());

    let returned: WithdrawalStatus | undefined;
    await act(async () => {
      returned = await result.current.getWithdrawalStatus(HASH_B);
    });

    expect(bridgeManager.getWithdrawalStatus).toHaveBeenCalledWith(HASH_B);
    expect(returned).toBe(status);
  });

  it('getTimeToProve delegates and returns the manager result verbatim', async () => {
    const bridgeManager = createMockBridgeManager();
    const timeToProve = {
      period: 'challenge',
      seconds: 120,
      timestamp: 1_700_000_000,
    } as unknown as GetTimeToProveReturnType;
    bridgeManager.getTimeToProve.mockResolvedValue(timeToProve);
    mockedUseGiwaManagers.mockReturnValue(createManagers(bridgeManager));

    const { result } = renderHook(() => useBridge());

    let returned: GetTimeToProveReturnType | undefined;
    await act(async () => {
      returned = await result.current.getTimeToProve(HASH_B);
    });

    expect(bridgeManager.getTimeToProve).toHaveBeenCalledWith(HASH_B);
    expect(returned).toBe(timeToProve);
  });

  it('getTimeToFinalize delegates and returns the manager result verbatim', async () => {
    const bridgeManager = createMockBridgeManager();
    const timeToFinalize = {
      period: 'ready',
      seconds: 0,
      timestamp: 1_700_000_500,
    } as unknown as GetTimeToFinalizeReturnType;
    bridgeManager.getTimeToFinalize.mockResolvedValue(timeToFinalize);
    mockedUseGiwaManagers.mockReturnValue(createManagers(bridgeManager));

    const { result } = renderHook(() => useBridge());

    let returned: GetTimeToFinalizeReturnType | undefined;
    await act(async () => {
      returned = await result.current.getTimeToFinalize(HASH_B);
    });

    expect(bridgeManager.getTimeToFinalize).toHaveBeenCalledWith(HASH_B);
    expect(returned).toBe(timeToFinalize);
  });

  it('exposes synchronous getters that delegate to the bridge manager', () => {
    const bridgeManager = createMockBridgeManager();
    const pending: BridgeTransaction[] = [
      { direction: 'withdraw', amount: 1n, status: 'pending' },
    ];
    bridgeManager.getPendingTransactions.mockReturnValue(pending);
    bridgeManager.getTransaction.mockReturnValue(pending[0]);
    bridgeManager.getEstimatedWithdrawalTime.mockReturnValue(604_800);
    mockedUseGiwaManagers.mockReturnValue(createManagers(bridgeManager));

    const { result } = renderHook(() => useBridge());

    expect(result.current.getPendingTransactions()).toBe(pending);
    expect(result.current.getTransaction(HASH_B)).toBe(pending[0]);
    expect(bridgeManager.getTransaction).toHaveBeenCalledWith(HASH_B);
    expect(result.current.getEstimatedWithdrawalTime()).toBe(604_800);
  });
});

describe('useBridge - loading state', () => {
  it('flips isLoading true while an action is in flight and back to false on success', async () => {
    const bridgeManager = createMockBridgeManager();
    const deferred = createDeferred<{ hash: Hash; wait: () => Promise<never> }>();
    bridgeManager.depositETH.mockReturnValue(deferred.promise);
    mockedUseGiwaManagers.mockReturnValue(createManagers(bridgeManager));

    const { result } = renderHook(() => useBridge());

    expect(result.current.isLoading).toBe(false);

    let actionPromise!: Promise<Hash>;
    act(() => {
      actionPromise = result.current.depositETH('1.0');
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      deferred.resolve({ hash: HASH_A, wait: vi.fn() });
      await actionPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('flips isLoading back to false on failure too', async () => {
    const bridgeManager = createMockBridgeManager();
    const deferred = createDeferred<{ hash: Hash; wait: () => Promise<never> }>();
    bridgeManager.depositETH.mockReturnValue(deferred.promise);
    mockedUseGiwaManagers.mockReturnValue(createManagers(bridgeManager));

    const { result } = renderHook(() => useBridge());

    let actionPromise!: Promise<Hash>;
    act(() => {
      actionPromise = result.current.depositETH('1.0');
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      deferred.reject(new Error('deposit failed'));
      await actionPromise.catch(() => undefined);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('keeps concurrent actions independent: one settling does not clear isLoading while another is still pending', async () => {
    const bridgeManager = createMockBridgeManager();
    const depositDeferred = createDeferred<{ hash: Hash; wait: () => Promise<never> }>();
    const withdrawDeferred = createDeferred<{ hash: Hash; wait: () => Promise<never> }>();
    bridgeManager.depositETH.mockReturnValue(depositDeferred.promise);
    bridgeManager.withdrawETH.mockReturnValue(withdrawDeferred.promise);
    mockedUseGiwaManagers.mockReturnValue(createManagers(bridgeManager));

    const { result } = renderHook(() => useBridge());

    let depositPromise!: Promise<Hash>;
    let withdrawPromise!: Promise<Hash>;
    act(() => {
      depositPromise = result.current.depositETH('1.0');
      withdrawPromise = result.current.withdrawETH('0.5');
    });

    expect(result.current.isLoading).toBe(true);

    // Resolving only the deposit must NOT clear the aggregate isLoading flag
    // while the withdrawal is still pending — proves the two actions track
    // independent internal loading state rather than sharing one flag.
    await act(async () => {
      depositDeferred.resolve({ hash: HASH_A, wait: vi.fn() });
      await depositPromise;
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      withdrawDeferred.resolve({ hash: HASH_B, wait: vi.fn() });
      await withdrawPromise;
    });

    expect(result.current.isLoading).toBe(false);
  });
});

describe('useBridge - error state', () => {
  it('surfaces a rejecting manager call as hook error instead of an unhandled rejection', async () => {
    const bridgeManager = createMockBridgeManager();
    const failure = new Error('deposit reverted');
    bridgeManager.depositETH.mockRejectedValue(failure);
    mockedUseGiwaManagers.mockReturnValue(createManagers(bridgeManager));

    const { result } = renderHook(() => useBridge());

    await act(async () => {
      await expect(result.current.depositETH('1.0')).rejects.toThrow('deposit reverted');
    });

    expect(result.current.error).toBe(failure);
  });

  it('clears the error once a subsequent call to the same action succeeds', async () => {
    const bridgeManager = createMockBridgeManager();
    bridgeManager.depositETH.mockRejectedValueOnce(new Error('deposit reverted'));
    bridgeManager.depositETH.mockResolvedValueOnce({ hash: HASH_A, wait: vi.fn() });
    mockedUseGiwaManagers.mockReturnValue(createManagers(bridgeManager));

    const { result } = renderHook(() => useBridge());

    await act(async () => {
      await result.current.depositETH('1.0').catch(() => undefined);
    });
    expect(result.current.error).not.toBeNull();

    await act(async () => {
      await result.current.depositETH('1.0');
    });
    expect(result.current.error).toBeNull();
  });
});

describe('useBridge - isL1Configured', () => {
  it('reflects client.hasL1Support() synchronously as a boolean, not a promise', () => {
    const bridgeManager = createMockBridgeManager();
    mockedUseGiwaManagers.mockReturnValue(createManagers(bridgeManager, true));

    const { result } = renderHook(() => useBridge());

    expect(result.current.isL1Configured).toBe(true);
    expect(typeof result.current.isL1Configured).toBe('boolean');
  });

  it('is false when the client reports no L1 support', () => {
    const bridgeManager = createMockBridgeManager();
    mockedUseGiwaManagers.mockReturnValue(createManagers(bridgeManager, false));

    const { result } = renderHook(() => useBridge());

    expect(result.current.isL1Configured).toBe(false);
  });

  it('is false when managers are not yet available (SDK still initializing)', () => {
    mockedUseGiwaManagers.mockReturnValue(null);
    mockedUseGiwaState.mockReturnValue({
      ...READY_STATE,
      isLoading: true,
    } as unknown as GiwaStateReturn);

    const { result } = renderHook(() => useBridge());

    expect(result.current.isL1Configured).toBe(false);
    expect(result.current.isInitializing).toBe(true);
  });
});

describe('useBridge - no stale closures', () => {
  it('binds actions to the latest manager instance after a re-render', async () => {
    const bridgeManagerA = createMockBridgeManager();
    const bridgeManagerB = createMockBridgeManager();
    bridgeManagerA.depositETH.mockResolvedValue({ hash: HASH_A, wait: vi.fn() });
    bridgeManagerB.depositETH.mockResolvedValue({ hash: HASH_B, wait: vi.fn() });

    mockedUseGiwaManagers.mockReturnValue(createManagers(bridgeManagerA));
    const { result, rerender } = renderHook(() => useBridge());

    mockedUseGiwaManagers.mockReturnValue(createManagers(bridgeManagerB));
    rerender();

    let returned: Hash | undefined;
    await act(async () => {
      returned = await result.current.depositETH('1.0');
    });

    expect(bridgeManagerB.depositETH).toHaveBeenCalledWith('1.0', undefined);
    expect(bridgeManagerA.depositETH).not.toHaveBeenCalled();
    expect(returned).toBe(HASH_B);
  });
});
