import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useGiwaManagers, useGiwaWalletContext } from '../providers/GiwaProvider';
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
 *
 * Optimizations:
 * - Stabilize tokenManager reference with useRef to prevent infinite loops
 * - Return object memoized with useMemo
 * - Separate usage of useGiwaManagers, useGiwaWalletContext
 */
export function useBalance(address?: Address): UseBalanceReturn {
  const { tokenManager } = useGiwaManagers();
  const { wallet } = useGiwaWalletContext();
  const [balance, setBalance] = useState<bigint | null>(null);
  const [formattedBalance, setFormattedBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Store tokenManager in ref to exclude from useCallback dependencies
  const tokenManagerRef = useRef(tokenManager);
  tokenManagerRef.current = tokenManager;

  const targetAddress = address || wallet?.address;

  // Optimize fetchBalance to depend only on targetAddress
  const fetchBalance = useCallback(async () => {
    if (!targetAddress) {
      setBalance(null);
      setFormattedBalance(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await tokenManagerRef.current.getEthBalance(targetAddress);
      setBalance(result.balance);
      setFormattedBalance(result.formattedBalance);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch balance');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [targetAddress]);

  // Execute fetch only when targetAddress changes
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Memoize return object
  return useMemo(() => ({
    balance,
    formattedBalance,
    isLoading,
    error,
    refetch: fetchBalance,
  }), [balance, formattedBalance, isLoading, error, fetchBalance]);
}
