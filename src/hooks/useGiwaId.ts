import { useState, useCallback } from 'react';
import { useGiwaContext } from '../providers/GiwaProvider';
import type { Address, Hash } from 'viem';
import type { GiwaId } from '../types';

export interface UseGiwaIdReturn {
  resolveAddress: (giwaId: string) => Promise<Address | null>;
  resolveName: (address: Address) => Promise<string | null>;
  getGiwaId: (giwaId: string) => Promise<GiwaId | null>;
  getTextRecord: (giwaId: string, key: string) => Promise<string | null>;
  setTextRecord: (giwaId: string, key: string, value: string) => Promise<Hash>;
  isAvailable: (giwaId: string) => Promise<boolean>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for GIWA ID (ENS-based naming) operations
 */
export function useGiwaId(): UseGiwaIdReturn {
  const { giwaIdManager } = useGiwaContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const resolveAddress = useCallback(
    async (giwaId: string): Promise<Address | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await giwaIdManager.resolveAddress(giwaId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('GIWA ID 주소 조회 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [giwaIdManager]
  );

  const resolveName = useCallback(
    async (address: Address): Promise<string | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await giwaIdManager.resolveName(address);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('GIWA ID 이름 조회 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [giwaIdManager]
  );

  const getGiwaId = useCallback(
    async (giwaId: string): Promise<GiwaId | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await giwaIdManager.getGiwaId(giwaId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('GIWA ID 정보 조회 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [giwaIdManager]
  );

  const getTextRecord = useCallback(
    async (giwaId: string, key: string): Promise<string | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await giwaIdManager.getTextRecord(giwaId, key);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('텍스트 레코드 조회 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [giwaIdManager]
  );

  const setTextRecord = useCallback(
    async (giwaId: string, key: string, value: string): Promise<Hash> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await giwaIdManager.setTextRecord(giwaId, key, value);
        return result.hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('텍스트 레코드 설정 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [giwaIdManager]
  );

  const isAvailable = useCallback(
    async (giwaId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        return await giwaIdManager.isAvailable(giwaId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('GIWA ID 가용성 확인 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [giwaIdManager]
  );

  return {
    resolveAddress,
    resolveName,
    getGiwaId,
    getTextRecord,
    setTextRecord,
    isAvailable,
    isLoading,
    error,
  };
}
