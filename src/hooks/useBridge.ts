import { useState, useCallback, useMemo, useRef } from 'react';
import { useGiwaManagers } from '../providers/GiwaProvider';
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
 * 최적화:
 * - useGiwaManagers만 사용 (wallet 상태 불필요)
 * - useRef로 bridgeManager 참조 안정화
 * - 반환 객체 useMemo로 메모이제이션
 */
export function useBridge(): UseBridgeReturn {
  const { bridgeManager } = useGiwaManagers();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // bridgeManager를 ref로 저장
  const bridgeManagerRef = useRef(bridgeManager);
  bridgeManagerRef.current = bridgeManager;

  const withdrawETH = useCallback(
    async (amount: string, to?: Address): Promise<Hash> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await bridgeManagerRef.current.withdrawETH(amount, to);
        return result.hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('ETH 출금 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const withdrawToken = useCallback(
    async (
      l2TokenAddress: Address,
      amount: bigint,
      to?: Address
    ): Promise<Hash> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await bridgeManagerRef.current.withdrawToken(l2TokenAddress, amount, to);
        return result.hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('토큰 출금 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

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

  // 반환 객체 메모이제이션
  return useMemo(() => ({
    withdrawETH,
    withdrawToken,
    getPendingTransactions,
    getTransaction,
    getEstimatedWithdrawalTime,
    isLoading,
    error,
  }), [
    withdrawETH,
    withdrawToken,
    getPendingTransactions,
    getTransaction,
    getEstimatedWithdrawalTime,
    isLoading,
    error,
  ]);
}
