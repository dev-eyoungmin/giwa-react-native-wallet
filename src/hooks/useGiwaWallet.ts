import { useState, useCallback, useMemo } from 'react';
import { useGiwaManagers, useGiwaWalletContext, useGiwaState } from '../providers/GiwaProvider';
import type { GiwaWallet, WalletCreationResult, SecureStorageOptions } from '../types';
import type { Hex } from 'viem';

export interface UseGiwaWalletReturn {
  wallet: GiwaWallet | null;
  isLoading: boolean;
  /** Indicates SDK is still initializing */
  isInitializing: boolean;
  error: Error | null;
  /** Derived state for wallet !== null (no separate state management needed) */
  hasWallet: boolean;
  createWallet: (options?: SecureStorageOptions) => Promise<WalletCreationResult>;
  recoverWallet: (mnemonic: string, options?: SecureStorageOptions) => Promise<GiwaWallet>;
  importFromPrivateKey: (privateKey: Hex, options?: SecureStorageOptions) => Promise<GiwaWallet>;
  loadWallet: (options?: SecureStorageOptions) => Promise<GiwaWallet | null>;
  deleteWallet: () => Promise<void>;
  exportMnemonic: (options?: SecureStorageOptions) => Promise<string | null>;
  exportPrivateKey: (options?: SecureStorageOptions) => Promise<Hex | null>;
}

/**
 * Hook for wallet management
 *
 * Optimizations:
 * - Separate usage of useGiwaManagers, useGiwaWalletContext to prevent unnecessary re-renders
 * - Changed hasWallet to derived state (removed separate useState)
 * - Return object memoized with useMemo
 * - Returns isInitializing=true during SDK initialization phase
 */
export function useGiwaWallet(): UseGiwaWalletReturn {
  const managers = useGiwaManagers();
  const { wallet, setWallet } = useGiwaWalletContext();
  const { isLoading: sdkLoading, error: sdkError } = useGiwaState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const walletManager = managers?.walletManager ?? null;

  // Compute hasWallet as derived state (no separate state management needed)
  const hasWallet = wallet !== null;

  const createWallet = useCallback(
    async (options?: SecureStorageOptions): Promise<WalletCreationResult> => {
      if (!walletManager) {
        throw new Error('SDK is still initializing');
      }
      setIsLoading(true);
      setError(null);
      try {
        const result = await walletManager.createWallet(options);
        setWallet(result.wallet);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create wallet');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [walletManager, setWallet]
  );

  const recoverWallet = useCallback(
    async (
      mnemonic: string,
      options?: SecureStorageOptions
    ): Promise<GiwaWallet> => {
      if (!walletManager) {
        throw new Error('SDK is still initializing');
      }
      setIsLoading(true);
      setError(null);
      try {
        const recoveredWallet = await walletManager.recoverWallet(mnemonic, options);
        setWallet(recoveredWallet);
        return recoveredWallet;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to recover wallet');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [walletManager, setWallet]
  );

  const importFromPrivateKey = useCallback(
    async (
      privateKey: Hex,
      options?: SecureStorageOptions
    ): Promise<GiwaWallet> => {
      if (!walletManager) {
        throw new Error('SDK is still initializing');
      }
      setIsLoading(true);
      setError(null);
      try {
        const importedWallet = await walletManager.importFromPrivateKey(
          privateKey,
          options
        );
        setWallet(importedWallet);
        return importedWallet;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to import wallet');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [walletManager, setWallet]
  );

  const loadWallet = useCallback(
    async (options?: SecureStorageOptions): Promise<GiwaWallet | null> => {
      if (!walletManager) {
        throw new Error('SDK is still initializing');
      }
      setIsLoading(true);
      setError(null);
      try {
        const loadedWallet = await walletManager.loadWallet(options);
        if (loadedWallet) {
          setWallet(loadedWallet);
        }
        return loadedWallet;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load wallet');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [walletManager, setWallet]
  );

  const deleteWallet = useCallback(async (): Promise<void> => {
    if (!walletManager) {
      throw new Error('SDK is still initializing');
    }
    setIsLoading(true);
    setError(null);
    try {
      await walletManager.deleteWallet();
      setWallet(null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete wallet');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [walletManager, setWallet]);

  const exportMnemonic = useCallback(
    async (options?: SecureStorageOptions): Promise<string | null> => {
      if (!walletManager) {
        throw new Error('SDK is still initializing');
      }
      setIsLoading(true);
      setError(null);
      try {
        return await walletManager.exportMnemonic(options);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to export mnemonic');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [walletManager]
  );

  const exportPrivateKey = useCallback(
    async (options?: SecureStorageOptions): Promise<Hex | null> => {
      if (!walletManager) {
        throw new Error('SDK is still initializing');
      }
      setIsLoading(true);
      setError(null);
      try {
        return await walletManager.exportPrivateKey(options);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to export private key');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [walletManager]
  );

  // Memoize return object to prevent unnecessary re-renders
  return useMemo(() => ({
    wallet,
    isLoading,
    isInitializing: sdkLoading,
    error: error || sdkError,
    hasWallet,
    createWallet,
    recoverWallet,
    importFromPrivateKey,
    loadWallet,
    deleteWallet,
    exportMnemonic,
    exportPrivateKey,
  }), [
    wallet,
    isLoading,
    sdkLoading,
    error,
    sdkError,
    hasWallet,
    createWallet,
    recoverWallet,
    importFromPrivateKey,
    loadWallet,
    deleteWallet,
    exportMnemonic,
    exportPrivateKey,
  ]);
}
