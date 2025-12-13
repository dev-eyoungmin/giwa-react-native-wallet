import { useState, useCallback } from 'react';
import { useGiwaContext } from '../providers/GiwaProvider';
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
 */
export function useTokens(): UseTokensReturn {
  const { tokenManager, wallet } = useGiwaContext();
  const [customTokens, setCustomTokens] = useState<Token[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getToken = useCallback(
    async (tokenAddress: Address): Promise<Token> => {
      setIsLoading(true);
      setError(null);
      try {
        return await tokenManager.getToken(tokenAddress);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('토큰 정보 조회 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [tokenManager]
  );

  const getBalance = useCallback(
    async (tokenAddress: Address, walletAddress?: Address): Promise<TokenBalance> => {
      const address = walletAddress || wallet?.address;
      if (!address) {
        throw new Error('지갑 주소가 필요합니다.');
      }

      setIsLoading(true);
      setError(null);
      try {
        return await tokenManager.getBalance(tokenAddress, address);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('토큰 잔액 조회 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [tokenManager, wallet]
  );

  const transfer = useCallback(
    async (tokenAddress: Address, to: Address, amount: string): Promise<Hash> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await tokenManager.transfer(tokenAddress, to, amount);
        return result.hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('토큰 전송 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [tokenManager]
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
        const result = await tokenManager.approve(tokenAddress, spender, amount);
        return result.hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('토큰 승인 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [tokenManager]
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
        return await tokenManager.getAllowance(tokenAddress, owner, spender);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('허용량 조회 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [tokenManager]
  );

  const addCustomToken = useCallback(
    (token: Token): void => {
      tokenManager.addCustomToken(token);
      setCustomTokens(tokenManager.getCustomTokens());
    },
    [tokenManager]
  );

  const removeCustomToken = useCallback(
    (tokenAddress: Address): void => {
      tokenManager.removeCustomToken(tokenAddress);
      setCustomTokens(tokenManager.getCustomTokens());
    },
    [tokenManager]
  );

  return {
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
  };
}
