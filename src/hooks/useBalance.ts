import { useState, useEffect, useCallback } from 'react';
import { useGiwaContext } from '../providers/GiwaProvider';
import type { Address } from 'viem';

export interface UseBalanceReturn {
  balance: bigint | null;
  formattedBalance: string | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching ETH balance
 */
export function useBalance(address?: Address): UseBalanceReturn {
  const { tokenManager, wallet } = useGiwaContext();
  const [balance, setBalance] = useState<bigint | null>(null);
  const [formattedBalance, setFormattedBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const targetAddress = address || wallet?.address;

  const fetchBalance = useCallback(async () => {
    if (!targetAddress) {
      setBalance(null);
      setFormattedBalance(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await tokenManager.getEthBalance(targetAddress);
      setBalance(result.balance);
      setFormattedBalance(result.formattedBalance);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('잔액 조회 실패');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [targetAddress, tokenManager]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return {
    balance,
    formattedBalance,
    isLoading,
    error,
    refetch: fetchBalance,
  };
}
