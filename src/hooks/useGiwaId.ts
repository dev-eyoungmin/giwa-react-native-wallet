import { useState, useCallback, useMemo, useRef } from 'react';
import { useGiwaManagers } from '../providers/GiwaProvider';
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
 *
 * 최적화:
 * - useGiwaManagers만 사용 (wallet 상태 불필요)
 * - useRef로 giwaIdManager 참조 안정화
 * - 반환 객체 useMemo로 메모이제이션
 */
export function useGiwaId(): UseGiwaIdReturn {
  const { giwaIdManager } = useGiwaManagers();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // giwaIdManager를 ref로 저장
  const giwaIdManagerRef = useRef(giwaIdManager);
  giwaIdManagerRef.current = giwaIdManager;

  const resolveAddress = useCallback(
    async (giwaId: string): Promise<Address | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await giwaIdManagerRef.current.resolveAddress(giwaId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('GIWA ID 주소 조회 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const resolveName = useCallback(
    async (address: Address): Promise<string | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await giwaIdManagerRef.current.resolveName(address);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('GIWA ID 이름 조회 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getGiwaId = useCallback(
    async (giwaId: string): Promise<GiwaId | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await giwaIdManagerRef.current.getGiwaId(giwaId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('GIWA ID 정보 조회 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getTextRecord = useCallback(
    async (giwaId: string, key: string): Promise<string | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await giwaIdManagerRef.current.getTextRecord(giwaId, key);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('텍스트 레코드 조회 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const setTextRecord = useCallback(
    async (giwaId: string, key: string, value: string): Promise<Hash> => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await giwaIdManagerRef.current.setTextRecord(giwaId, key, value);
        return result.hash;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('텍스트 레코드 설정 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const isAvailable = useCallback(
    async (giwaId: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        return await giwaIdManagerRef.current.isAvailable(giwaId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('GIWA ID 가용성 확인 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // 반환 객체 메모이제이션
  return useMemo(() => ({
    resolveAddress,
    resolveName,
    getGiwaId,
    getTextRecord,
    setTextRecord,
    isAvailable,
    isLoading,
    error,
  }), [
    resolveAddress,
    resolveName,
    getGiwaId,
    getTextRecord,
    setTextRecord,
    isAvailable,
    isLoading,
    error,
  ]);
}
