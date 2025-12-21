import { useState, useCallback, useMemo, useRef } from 'react';
import { useGiwaManagers, useGiwaWalletContext } from '../providers/GiwaProvider';
import type { Address, Hash } from 'viem';
import type { Token, TokenBalance } from '../types';

export interface UseTokensReturn {
  getToken: (tokenAddress: Address) => Promise<Token>;
  getBalance: (tokenAddress: Address, walletAddress?: Address) => Promise<TokenBalance>;
  transfer: (tokenAddress: Address, to: Address, amount: string) => Promise<Hash>;
  approve: (tokenAddress: Address, spender: Address, amount: string) => Promise<Hash>;
  getAllowance: (tokenAddress: Address, owner: Address, spender: Address) => Promise<bigint>;
  addCustomToken: (token: Token) => void;
  removeCustomToken: (tokenAddress: Address) => void;
  customTokens: Token[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for ERC-20 token operations
 *
 * 최적화:
 * - useRef로 tokenManager 참조 안정화
 * - 반환 객체 useMemo로 메모이제이션
 * - useGiwaManagers, useGiwaWalletContext 분리 사용
 */
export function useTokens(): UseTokensReturn {
  const { tokenManager } = useGiwaManagers();
  const { wallet } = useGiwaWalletContext();
  const [customTokens, setCustomTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // tokenManager를 ref로 저장
  const tokenManagerRef = useRef(tokenManager);
  tokenManagerRef.current = tokenManager;

  // wallet address를 ref로 저장
  const walletAddressRef = useRef(wallet?.address);
  walletAddressRef.current = wallet?.address;

  const getToken = useCallback(
    async (tokenAddress: Address): Promise<Token> => {
      setIsLoading(true);
      setError(null);
      try {
        return await tokenManagerRef.current.getToken(tokenAddress);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('토큰 정보 조회 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getBalance = useCallback(
    async (tokenAddress: Address, walletAddress?: Address): Promise<TokenBalance> => {
      const address = walletAddress || walletAddressRef.current;
      if (!address) {
        throw new Error('지갑 주소가 필요합니다.');
      }

      setIsLoading(true);
      setError(null);
      try {
        return await tokenManagerRef.current.getBalance(tokenAddress, address);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('토큰 잔액 조회 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const transfer = useCallback(
    async (tokenAddress: Address, to: Address, amount: string): Promise<Hash> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await tokenManagerRef.current.transfer(tokenAddress, to, amount);
        return result.hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('토큰 전송 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const approve = useCallback(
    async (
      tokenAddress: Address,
      spender: Address,
      amount: string
    ): Promise<Hash> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await tokenManagerRef.current.approve(tokenAddress, spender, amount);
        return result.hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('토큰 승인 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getAllowance = useCallback(
    async (
      tokenAddress: Address,
      owner: Address,
      spender: Address
    ): Promise<bigint> => {
      setIsLoading(true);
      setError(null);
      try {
        return await tokenManagerRef.current.getAllowance(tokenAddress, owner, spender);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('허용량 조회 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const addCustomToken = useCallback(
    (token: Token): void => {
      tokenManagerRef.current.addCustomToken(token);
      setCustomTokens(tokenManagerRef.current.getCustomTokens());
    },
    []
  );

  const removeCustomToken = useCallback(
    (tokenAddress: Address): void => {
      tokenManagerRef.current.removeCustomToken(tokenAddress);
      setCustomTokens(tokenManagerRef.current.getCustomTokens());
    },
    []
  );

  // 반환 객체 메모이제이션
  return useMemo(() => ({
    getToken,
    getBalance,
    transfer,
    approve,
    getAllowance,
    addCustomToken,
    removeCustomToken,
    customTokens,
    isLoading,
    error,
  }), [
    getToken,
    getBalance,
    transfer,
    approve,
    getAllowance,
    addCustomToken,
    removeCustomToken,
    customTokens,
    isLoading,
    error,
  ]);
}
