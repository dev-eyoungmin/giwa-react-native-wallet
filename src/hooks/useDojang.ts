import { useState, useCallback, useMemo, useRef } from 'react';
import { useGiwaManagers } from '../providers/GiwaProvider';
import type { Address, Hex } from 'viem';
import type { Attestation } from '../types';

export interface UseDojangReturn {
  getAttestation: (uid: Hex) => Promise<Attestation | null>;
  isAttestationValid: (uid: Hex) => Promise<boolean>;
  hasVerifiedAddress: (address: Address) => Promise<boolean>;
  getVerifiedBalance: (uid: Hex) => Promise<{ balance: bigint; timestamp: bigint } | null>;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for Dojang (EAS-based attestation) operations
 *
 * 최적화:
 * - useGiwaManagers만 사용 (wallet 상태 불필요)
 * - useRef로 dojangManager 참조 안정화
 * - 반환 객체 useMemo로 메모이제이션
 */
export function useDojang(): UseDojangReturn {
  const { dojangManager } = useGiwaManagers();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // dojangManager를 ref로 저장
  const dojangManagerRef = useRef(dojangManager);
  dojangManagerRef.current = dojangManager;

  const getAttestation = useCallback(
    async (uid: Hex): Promise<Attestation | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await dojangManagerRef.current.getAttestation(uid);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('증명 조회 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const isAttestationValid = useCallback(
    async (uid: Hex): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        return await dojangManagerRef.current.isAttestationValid(uid);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('증명 유효성 확인 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const hasVerifiedAddress = useCallback(
    async (address: Address): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        return await dojangManagerRef.current.hasVerifiedAddress(address);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('인증된 주소 확인 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getVerifiedBalance = useCallback(
    async (uid: Hex): Promise<{ balance: bigint; timestamp: bigint } | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await dojangManagerRef.current.getVerifiedBalance(uid);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('인증된 잔액 조회 실패');
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
    getAttestation,
    isAttestationValid,
    hasVerifiedAddress,
    getVerifiedBalance,
    isLoading,
    error,
  }), [
    getAttestation,
    isAttestationValid,
    hasVerifiedAddress,
    getVerifiedBalance,
    isLoading,
    error,
  ]);
}
