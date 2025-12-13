import { useState, useCallback } from 'react';
import { useGiwaContext } from '../providers/GiwaProvider';
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
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for Flashblocks (~200ms preconfirmation) operations
 */
export function useFlashblocks(): UseFlashblocksReturn {
  const { flashblocksManager } = useGiwaContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const isEnabled = flashblocksManager.isEnabled();

  const setEnabled = useCallback(
    (enabled: boolean): void => {
      flashblocksManager.setEnabled(enabled);
    },
    [flashblocksManager]
  );

  const sendTransaction = useCallback(
    async (
      request: TransactionRequest
    ): Promise<{
      preconfirmation: FlashblocksPreconfirmation;
      result: TransactionResult;
    }> => {
      setIsLoading(true);
      setError(null);
      try {
        return await flashblocksManager.sendTransaction(request);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Flashblocks 트랜잭션 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [flashblocksManager]
  );

  const getPreconfirmation = useCallback(
    (hash: Hash): FlashblocksPreconfirmation | undefined => {
      return flashblocksManager.getPreconfirmation(hash);
    },
    [flashblocksManager]
  );

  const getAllPreconfirmations = useCallback((): FlashblocksPreconfirmation[] => {
    return flashblocksManager.getAllPreconfirmations();
  }, [flashblocksManager]);

  const getConfirmationLatency = useCallback(
    (hash: Hash): number | null => {
      return flashblocksManager.getConfirmationLatency(hash);
    },
    [flashblocksManager]
  );

  const getAverageLatency = useCallback((): number | null => {
    return flashblocksManager.getAverageLatency();
  }, [flashblocksManager]);

  return {
    isEnabled,
    setEnabled,
    sendTransaction,
    getPreconfirmation,
    getAllPreconfirmations,
    getConfirmationLatency,
    getAverageLatency,
    isLoading,
    error,
  };
}
