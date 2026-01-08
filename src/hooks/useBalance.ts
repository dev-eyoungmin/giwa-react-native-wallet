import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useGiwaManagers, useGiwaWalletContext, useGiwaState } from '../providers/GiwaProvider';
import type { Address } from 'viem';

export interface UseBalanceReturn {
  balance: bigint;
  formattedBalance: string;
  isLoading: boolean;
  isInitializing: boolean;
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
 * - Returns isInitializing=true during SDK initialization
 */
export function useBalance(address?: Address): UseBalanceReturn {
  const managers = useGiwaManagers();
  const { wallet } = useGiwaWalletContext();
  const { isLoading: sdkLoading } = useGiwaState();
  const [balance, setBalance] = useState<bigint>(0n);
  const [formattedBalance, setFormattedBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const tokenManager = managers?.tokenManager ?? null;

  // Store tokenManager in ref to exclude from useCallback dependencies
  const tokenManagerRef = useRef(tokenManager);
  tokenManagerRef.current = tokenManager;

  const targetAddress = address || wallet?.address;

  // Optimize fetchBalance to depend only on targetAddress
  const fetchBalance = useCallback(async () => {
    if (!targetAddress || !tokenManagerRef.current) {
      setBalance(0n);
      setFormattedBalance('0');
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

  // Execute fetch only when targetAddress changes and tokenManager is ready
  useEffect(() => {
    if (tokenManager) {
      fetchBalance();
    }
  }, [fetchBalance, tokenManager]);

  // Memoize return object
  return useMemo(() => ({
    balance,
    formattedBalance,
    isLoading,
    isInitializing: sdkLoading,
    error,
    refetch: fetchBalance,
  }), [balance, formattedBalance, isLoading, sdkLoading, error, fetchBalance]);
}
