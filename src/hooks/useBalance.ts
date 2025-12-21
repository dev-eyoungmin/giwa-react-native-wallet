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
 * 최적화:
 * - useRef로 tokenManager 참조를 안정화하여 무한 루프 방지
 * - 반환 객체 useMemo로 메모이제이션
 * - useGiwaManagers, useGiwaWalletContext 분리 사용
 */
export function useBalance(address?: Address): UseBalanceReturn {
  const { tokenManager } = useGiwaManagers();
  const { wallet } = useGiwaWalletContext();
  const [balance, setBalance] = useState<bigint | null>(null);
  const [formattedBalance, setFormattedBalance] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // tokenManager를 ref로 저장하여 useCallback 의존성에서 제외
  const tokenManagerRef = useRef(tokenManager);
  tokenManagerRef.current = tokenManager;

  const targetAddress = address || wallet?.address;

  // fetchBalance를 targetAddress만 의존하도록 최적화
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
      const error = err instanceof Error ? err : new Error('잔액 조회 실패');
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [targetAddress]);

  // targetAddress가 변경될 때만 fetch 실행
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // 반환 객체 메모이제이션
  return useMemo(() => ({
    balance,
    formattedBalance,
    isLoading,
    error,
    refetch: fetchBalance,
  }), [balance, formattedBalance, isLoading, error, fetchBalance]);
}
