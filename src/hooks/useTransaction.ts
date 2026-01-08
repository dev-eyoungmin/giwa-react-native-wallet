import { useState, useCallback, useMemo, useRef } from 'react';
import { useGiwaManagers, useGiwaState } from '../providers/GiwaProvider';
import { parseEther, type Address, type Hash } from 'viem';
import type { TransactionReceipt } from '../types';

export interface SendTransactionParams {
  to: Address;
  value: string; // ETH amount as string (e.g., "0.1")
  data?: `0x${string}`;
}

export interface UseTransactionReturn {
  sendTransaction: (params: SendTransactionParams) => Promise<Hash>;
  waitForReceipt: (hash: Hash) => Promise<TransactionReceipt>;
  isLoading: boolean;
  isInitializing: boolean;
  error: Error | null;
  lastTxHash: Hash | null;
}

/**
 * Hook for sending transactions
 *
 * Optimizations:
 * - Only use useGiwaManagers (wallet state not needed)
 * - Stabilize client reference with useRef
 * - Return object memoized with useMemo
 * - Returns isInitializing=true during SDK initialization
 */
export function useTransaction(): UseTransactionReturn {
  const managers = useGiwaManagers();
  const { isLoading: sdkLoading } = useGiwaState();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastTxHash, setLastTxHash] = useState<Hash | null>(null);

  const client = managers?.client ?? null;

  // Store client in ref to maintain stable reference
  const clientRef = useRef(client);
  clientRef.current = client;

  const sendTransaction = useCallback(
    async (params: SendTransactionParams): Promise<Hash> => {
      if (!clientRef.current) {
        throw new Error('SDK is still initializing');
      }

      const walletClient = clientRef.current.getWalletClient();
      if (!walletClient) {
        throw new Error('Wallet is not connected.');
      }

      setIsLoading(true);
      setError(null);

      try {
        const hash = await walletClient.sendTransaction({
          to: params.to,
          value: parseEther(params.value),
          data: params.data,
        });

        setLastTxHash(hash);
        return hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to send transaction');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const waitForReceipt = useCallback(
    async (hash: Hash): Promise<TransactionReceipt> => {
      if (!clientRef.current) {
        throw new Error('SDK is still initializing');
      }

      const publicClient = clientRef.current.getPublicClient();

      try {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });

        return {
          hash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          status: receipt.status === 'success' ? 'success' : 'reverted',
          gasUsed: receipt.gasUsed,
        };
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to confirm transaction');
        setError(error);
        throw error;
      }
    },
    []
  );

  // Memoize return object
  return useMemo(() => ({
    sendTransaction,
    waitForReceipt,
    isLoading,
    isInitializing: sdkLoading,
    error,
    lastTxHash,
  }), [sendTransaction, waitForReceipt, isLoading, sdkLoading, error, lastTxHash]);
}
