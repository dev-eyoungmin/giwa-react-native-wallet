import { useState, useCallback } from 'react';
import { useGiwaContext } from '../providers/GiwaProvider';
import type { GiwaWallet, WalletCreationResult, SecureStorageOptions } from '../types';
import type { Hex } from 'viem';

export interface UseGiwaWalletReturn {
  wallet: GiwaWallet | null;
  isLoading: boolean;
  error: Error | null;
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
 */
export function useGiwaWallet(): UseGiwaWalletReturn {
  const { walletManager, wallet, setWallet } = useGiwaContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasWallet, setHasWallet] = useState(false);

  const createWallet = useCallback(
    async (options?: SecureStorageOptions): Promise<WalletCreationResult> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await walletManager.createWallet(options);
        setWallet(result.wallet);
        setHasWallet(true);
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('지갑 생성 실패');
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
      setIsLoading(true);
      setError(null);
      try {
        const recoveredWallet = await walletManager.recoverWallet(mnemonic, options);
        setWallet(recoveredWallet);
        setHasWallet(true);
        return recoveredWallet;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('지갑 복구 실패');
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
      setIsLoading(true);
      setError(null);
      try {
        const importedWallet = await walletManager.importFromPrivateKey(
          privateKey,
          options
        );
        setWallet(importedWallet);
        setHasWallet(true);
        return importedWallet;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('지갑 가져오기 실패');
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
      setIsLoading(true);
      setError(null);
      try {
        const loadedWallet = await walletManager.loadWallet(options);
        if (loadedWallet) {
          setWallet(loadedWallet);
          setHasWallet(true);
        }
        return loadedWallet;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('지갑 로드 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [walletManager, setWallet]
  );

  const deleteWallet = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await walletManager.deleteWallet();
      setWallet(null);
      setHasWallet(false);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('지갑 삭제 실패');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [walletManager, setWallet]);

  const exportMnemonic = useCallback(
    async (options?: SecureStorageOptions): Promise<string | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await walletManager.exportMnemonic(options);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('복구 구문 내보내기 실패');
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
      setIsLoading(true);
      setError(null);
      try {
        return await walletManager.exportPrivateKey(options);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('개인키 내보내기 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [walletManager]
  );

  return {
    wallet,
    isLoading,
    error,
    hasWallet,
    createWallet,
    recoverWallet,
    importFromPrivateKey,
    loadWallet,
    deleteWallet,
    exportMnemonic,
    exportPrivateKey,
  };
}
