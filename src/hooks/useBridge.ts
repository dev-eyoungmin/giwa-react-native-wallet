import { useState, useCallback } from 'react';
import { useGiwaContext } from '../providers/GiwaProvider';
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
 */
export function useBridge(): UseBridgeReturn {
  const { bridgeManager } = useGiwaContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const withdrawETH = useCallback(
    async (amount: string, to?: Address): Promise<Hash> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await bridgeManager.withdrawETH(amount, to);
        return result.hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('ETH 출금 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [bridgeManager]
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
        const result = await bridgeManager.withdrawToken(l2TokenAddress, amount, to);
        return result.hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('토큰 출금 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [bridgeManager]
  );

  const getPendingTransactions = useCallback((): BridgeTransaction[] => {
    return bridgeManager.getPendingTransactions();
  }, [bridgeManager]);

  const getTransaction = useCallback(
    (hash: Hash): BridgeTransaction | undefined => {
      return bridgeManager.getTransaction(hash);
    },
    [bridgeManager]
  );

  const getEstimatedWithdrawalTime = useCallback((): number => {
    return bridgeManager.getEstimatedWithdrawalTime();
  }, [bridgeManager]);

  return {
    withdrawETH,
    withdrawToken,
    getPendingTransactions,
    getTransaction,
    getEstimatedWithdrawalTime,
    isLoading,
    error,
  };
}
