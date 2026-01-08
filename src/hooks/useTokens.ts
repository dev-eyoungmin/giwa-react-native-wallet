import { useState, useCallback, useMemo, useRef } from 'react';
import { useGiwaManagers, useGiwaWalletContext, useGiwaState } from '../providers/GiwaProvider';
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
  isInitializing: boolean;
  error: Error | null;
}

/**
 * Hook for ERC-20 token operations
 *
 * Clean code principles:
 * - Removed duplicate state management logic with useAsyncActions
 * - Using ErrorMessages constants
 * - Returns isInitializing=true during SDK initialization
 */
export function useTokens(): UseTokensReturn {
  const managers = useGiwaManagers();
  const { wallet } = useGiwaWalletContext();
  const { isLoading: sdkLoading } = useGiwaState();
  const [customTokens, setCustomTokens] = useState<Token[]>([]);

  const tokenManager = managers?.tokenManager ?? null;
  const tokenManagerRef = useRef(tokenManager);
  tokenManagerRef.current = tokenManager;

  const walletAddressRef = useRef(wallet?.address);
  walletAddressRef.current = wallet?.address;

  const actions = useAsyncActions({
    getToken: (tokenAddress: Address) => {
      if (!tokenManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      return tokenManagerRef.current.getToken(tokenAddress);
    },
    getBalance: (tokenAddress: Address, walletAddress?: Address) => {
      if (!tokenManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      const address = walletAddress || walletAddressRef.current;
      if (!address) {
        throw new Error(ErrorMessages.WALLET_ADDRESS_REQUIRED);
      }
      return tokenManagerRef.current.getBalance(tokenAddress, address);
    },
    transfer: async (tokenAddress: Address, to: Address, amount: string) => {
      if (!tokenManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      const result = await tokenManagerRef.current.transfer(tokenAddress, to, amount);
      return result.hash;
    },
    approve: async (tokenAddress: Address, spender: Address, amount: string) => {
      if (!tokenManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      const result = await tokenManagerRef.current.approve(tokenAddress, spender, amount);
      return result.hash;
    },
    getAllowance: (tokenAddress: Address, owner: Address, spender: Address) => {
      if (!tokenManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      return tokenManagerRef.current.getAllowance(tokenAddress, owner, spender);
    },
  });

  const addCustomToken = useCallback((token: Token): void => {
    if (!tokenManagerRef.current) return;
    tokenManagerRef.current.addCustomToken(token);
    setCustomTokens(tokenManagerRef.current.getCustomTokens());
  }, []);

  const removeCustomToken = useCallback((tokenAddress: Address): void => {
    if (!tokenManagerRef.current) return;
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
    isInitializing: sdkLoading,
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
    sdkLoading,
    error,
  ]);
}
