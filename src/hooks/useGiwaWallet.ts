import { useState, useCallback, useMemo } from 'react';
import { useGiwaManagers, useGiwaWalletContext } from '../providers/GiwaProvider';
import type { GiwaWallet, WalletCreationResult, SecureStorageOptions } from '../types';
import type { Hex } from 'viem';

export interface UseGiwaWalletReturn {
  wallet: GiwaWallet | null;
  isLoading: boolean;
  error: Error | null;
  /** wallet !== null 파생 상태 (별도 상태 관리 불필요) */
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
 * 최적화:
 * - useGiwaManagers, useGiwaWalletContext 분리 사용으로 불필요한 리렌더링 방지
 * - hasWallet을 파생 상태로 변경 (별도 useState 제거)
 * - 반환 객체 useMemo로 메모이제이션
 */
export function useGiwaWallet(): UseGiwaWalletReturn {
  const { walletManager } = useGiwaManagers();
  const { wallet, setWallet } = useGiwaWalletContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // hasWallet을 파생 상태로 계산 (별도 상태 관리 불필요)
  const hasWallet = wallet !== null;

  const createWallet = useCallback(
    async (options?: SecureStorageOptions): Promise<WalletCreationResult> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await walletManager.createWallet(options);
        setWallet(result.wallet);
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

  // 반환 객체 메모이제이션으로 불필요한 리렌더링 방지
  return useMemo(() => ({
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
  }), [
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
  ]);
}
