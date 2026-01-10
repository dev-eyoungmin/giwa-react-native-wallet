import { useState, useCallback, useMemo, useRef } from 'react';
import { useGiwaManagers, useGiwaState } from '../providers/GiwaProvider';
import type { Hash } from 'viem';
import type { FlashblocksPreconfirmation, TransactionRequest, TransactionResult } from '../types';

export interface UseFlashblocksReturn {
  isEnabled: boolean;
  setEnabled: (enabled: boolean) => void;
  sendTransaction: (request: TransactionRequest) => Promise<{
    preconfirmation: FlashblocksPreconfirmation;
    result: TransactionResult;
  }>;
  getPreconfirmation: (hash: Hash) => FlashblocksPreconfirmation | undefined;
  getAllPreconfirmations: () => FlashblocksPreconfirmation[];
  getConfirmationLatency: (hash: Hash) => number | null;
  getAverageLatency: () => number | null;
  isInitializing: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for Flashblocks (~200ms preconfirmation) operations
 *
 * Optimizations:
 * - Only use useGiwaManagers (wallet state not needed)
 * - Stabilize flashblocksManager reference with useRef
 * - Cache isEnabled with useMemo
 * - Return object memoized with useMemo
 */
export function useFlashblocks(): UseFlashblocksReturn {
  const managers = useGiwaManagers();
  const { isLoading: sdkLoading } = useGiwaState();
  const flashblocksManager = managers?.flashblocksManager ?? null;

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Manage isEnabled state in React to trigger re-render on change
  const [enabledState, setEnabledState] = useState(() => flashblocksManager?.isEnabled() ?? false);

  // Store flashblocksManager in ref
  const flashblocksManagerRef = useRef(flashblocksManager);
  flashblocksManagerRef.current = flashblocksManager;

  const setEnabled = useCallback(
    (enabled: boolean): void => {
      if (!flashblocksManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      flashblocksManagerRef.current.setEnabled(enabled);
      setEnabledState(enabled);
    },
    []
  );

  const sendTransaction = useCallback(
    async (
      request: TransactionRequest
    ): Promise<{
      preconfirmation: FlashblocksPreconfirmation;
      result: TransactionResult;
    }> => {
      if (!flashblocksManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      setIsLoading(true);
      setError(null);
      try {
        return await flashblocksManagerRef.current.sendTransaction(request);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Flashblocks transaction failed');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getPreconfirmation = useCallback(
    (hash: Hash): FlashblocksPreconfirmation | undefined => {
      if (!flashblocksManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      return flashblocksManagerRef.current.getPreconfirmation(hash);
    },
    []
  );

  const getAllPreconfirmations = useCallback((): FlashblocksPreconfirmation[] => {
    if (!flashblocksManagerRef.current) {
      throw new Error('SDK is still initializing');
    }
    return flashblocksManagerRef.current.getAllPreconfirmations();
  }, []);

  const getConfirmationLatency = useCallback(
    (hash: Hash): number | null => {
      if (!flashblocksManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      return flashblocksManagerRef.current.getConfirmationLatency(hash);
    },
    []
  );

  const getAverageLatency = useCallback((): number | null => {
    if (!flashblocksManagerRef.current) {
      throw new Error('SDK is still initializing');
    }
    return flashblocksManagerRef.current.getAverageLatency();
  }, []);

  // Memoize return object
  return useMemo(() => ({
    isEnabled: enabledState,
    setEnabled,
    sendTransaction,
    getPreconfirmation,
    getAllPreconfirmations,
    getConfirmationLatency,
    getAverageLatency,
    isInitializing: sdkLoading,
    isLoading,
    error,
  }), [
    enabledState,
    setEnabled,
    sendTransaction,
    getPreconfirmation,
    getAllPreconfirmations,
    getConfirmationLatency,
    getAverageLatency,
    sdkLoading,
    isLoading,
    error,
  ]);
}
