import { useState, useCallback, useMemo, useRef } from 'react';
import { useGiwaManagers } from '../providers/GiwaProvider';
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
  error: Error | null;
  lastTxHash: Hash | null;
}

/**
 * Hook for sending transactions
 *
 * 최적화:
 * - useGiwaManagers만 사용 (wallet 상태 불필요)
 * - useRef로 client 참조 안정화
 * - 반환 객체 useMemo로 메모이제이션
 */
export function useTransaction(): UseTransactionReturn {
  const { client } = useGiwaManagers();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastTxHash, setLastTxHash] = useState<Hash | null>(null);

  // client를 ref로 저장하여 안정적인 참조 유지
  const clientRef = useRef(client);
  clientRef.current = client;

  const sendTransaction = useCallback(
    async (params: SendTransactionParams): Promise<Hash> => {
      const walletClient = clientRef.current.getWalletClient();
      if (!walletClient) {
        throw new Error('지갑이 연결되지 않았습니다.');
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
        const error = err instanceof Error ? err : new Error('트랜잭션 전송 실패');
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
        const error = err instanceof Error ? err : new Error('트랜잭션 확인 실패');
        setError(error);
        throw error;
      }
    },
    []
  );

  // 반환 객체 메모이제이션
  return useMemo(() => ({
    sendTransaction,
    waitForReceipt,
    isLoading,
    error,
    lastTxHash,
  }), [sendTransaction, waitForReceipt, isLoading, error, lastTxHash]);
}
