import { useCallback, useMemo, useRef } from 'react';
import { useGiwaManagers } from '../providers/GiwaProvider';
import { useAsyncActions } from './shared/useAsyncAction';
import type { Address, Hash } from 'viem';
import type { BridgeTransaction } from '../types';

export interface UseBridgeReturn {
  withdrawETH: (amount: string, to?: Address) => Promise<Hash>;
  withdrawToken: (l2TokenAddress: Address, amount: bigint, to?: Address) => Promise<Hash>;
  getPendingTransactions: () => BridgeTransaction[];
  getTransaction: (hash: Hash) => BridgeTransaction | undefined;
  getEstimatedWithdrawalTime: () => number;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for L1↔L2 bridge operations
 *
 * 클린 코드 적용:
 * - useAsyncActions로 중복 상태 관리 로직 제거
 * - ErrorMessages 상수 사용으로 매직 스트링 제거
 */
export function useBridge(): UseBridgeReturn {
  const { bridgeManager } = useGiwaManagers();

  const bridgeManagerRef = useRef(bridgeManager);
  bridgeManagerRef.current = bridgeManager;

  // useAsyncActions로 비동기 액션 상태 관리
  const actions = useAsyncActions({
    withdrawETH: async (amount: string, to?: Address) => {
      const result = await bridgeManagerRef.current.withdrawETH(amount, to);
      return result.hash;
    },
    withdrawToken: async (l2TokenAddress: Address, amount: bigint, to?: Address) => {
      const result = await bridgeManagerRef.current.withdrawToken(l2TokenAddress, amount, to);
      return result.hash;
    },
  });

  // 동기 메서드들
  const getPendingTransactions = useCallback((): BridgeTransaction[] => {
    return bridgeManagerRef.current.getPendingTransactions();
  }, []);

  const getTransaction = useCallback(
    (hash: Hash): BridgeTransaction | undefined => {
      return bridgeManagerRef.current.getTransaction(hash);
    },
    []
  );

  const getEstimatedWithdrawalTime = useCallback((): number => {
    return bridgeManagerRef.current.getEstimatedWithdrawalTime();
  }, []);

  // 통합 로딩/에러 상태
  const isLoading = actions.withdrawETH.isLoading || actions.withdrawToken.isLoading;
  const error = actions.withdrawETH.error || actions.withdrawToken.error;

  return useMemo(() => ({
    withdrawETH: actions.withdrawETH.execute,
    withdrawToken: actions.withdrawToken.execute,
    getPendingTransactions,
    getTransaction,
    getEstimatedWithdrawalTime,
    isLoading,
    error,
  }), [
    actions.withdrawETH.execute,
    actions.withdrawToken.execute,
    getPendingTransactions,
    getTransaction,
    getEstimatedWithdrawalTime,
    isLoading,
    error,
  ]);
}
