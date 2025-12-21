import { useState, useCallback, useMemo, useRef } from 'react';
import { useGiwaManagers, useGiwaWalletContext } from '../providers/GiwaProvider';
import { useAsyncActions } from './shared/useAsyncAction';
import { ErrorMessages } from '../utils/errors';
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
 * 클린 코드 적용:
 * - useAsyncActions로 중복 상태 관리 로직 제거
 * - ErrorMessages 상수 사용
 */
export function useTokens(): UseTokensReturn {
  const { tokenManager } = useGiwaManagers();
  const { wallet } = useGiwaWalletContext();
  const [customTokens, setCustomTokens] = useState<Token[]>([]);

  const tokenManagerRef = useRef(tokenManager);
  tokenManagerRef.current = tokenManager;

  const walletAddressRef = useRef(wallet?.address);
  walletAddressRef.current = wallet?.address;

  const actions = useAsyncActions({
    getToken: (tokenAddress: Address) => tokenManagerRef.current.getToken(tokenAddress),
    getBalance: (tokenAddress: Address, walletAddress?: Address) => {
      const address = walletAddress || walletAddressRef.current;
      if (!address) {
        throw new Error(ErrorMessages.WALLET_ADDRESS_REQUIRED);
      }
      return tokenManagerRef.current.getBalance(tokenAddress, address);
    },
    transfer: async (tokenAddress: Address, to: Address, amount: string) => {
      const result = await tokenManagerRef.current.transfer(tokenAddress, to, amount);
      return result.hash;
    },
    approve: async (tokenAddress: Address, spender: Address, amount: string) => {
      const result = await tokenManagerRef.current.approve(tokenAddress, spender, amount);
      return result.hash;
    },
    getAllowance: (tokenAddress: Address, owner: Address, spender: Address) =>
      tokenManagerRef.current.getAllowance(tokenAddress, owner, spender),
  });

  const addCustomToken = useCallback((token: Token): void => {
    tokenManagerRef.current.addCustomToken(token);
    setCustomTokens(tokenManagerRef.current.getCustomTokens());
  }, []);

  const removeCustomToken = useCallback((tokenAddress: Address): void => {
    tokenManagerRef.current.removeCustomToken(tokenAddress);
    setCustomTokens(tokenManagerRef.current.getCustomTokens());
  }, []);

  const isLoading =
    actions.getToken.isLoading ||
    actions.getBalance.isLoading ||
    actions.transfer.isLoading ||
    actions.approve.isLoading ||
    actions.getAllowance.isLoading;

  const error =
    actions.getToken.error ||
    actions.getBalance.error ||
    actions.transfer.error ||
    actions.approve.error ||
    actions.getAllowance.error;

  return useMemo(() => ({
    getToken: actions.getToken.execute,
    getBalance: actions.getBalance.execute,
    transfer: actions.transfer.execute,
    approve: actions.approve.execute,
    getAllowance: actions.getAllowance.execute,
    addCustomToken,
    removeCustomToken,
    customTokens,
    isLoading,
    error,
  }), [
    actions.getToken.execute,
    actions.getBalance.execute,
    actions.transfer.execute,
    actions.approve.execute,
    actions.getAllowance.execute,
    addCustomToken,
    removeCustomToken,
    customTokens,
    isLoading,
    error,
  ]);
}
