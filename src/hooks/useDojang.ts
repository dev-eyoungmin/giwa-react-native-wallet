import { useState, useCallback } from 'react';
import { useGiwaContext } from '../providers/GiwaProvider';
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
 */
export function useDojang(): UseDojangReturn {
  const { dojangManager } = useGiwaContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const getAttestation = useCallback(
    async (uid: Hex): Promise<Attestation | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await dojangManager.getAttestation(uid);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('증명 조회 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [dojangManager]
  );

  const isAttestationValid = useCallback(
    async (uid: Hex): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        return await dojangManager.isAttestationValid(uid);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('증명 유효성 확인 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [dojangManager]
  );

  const hasVerifiedAddress = useCallback(
    async (address: Address): Promise<boolean> => {
      setIsLoading(true);
      setError(null);
      try {
        return await dojangManager.hasVerifiedAddress(address);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('인증된 주소 확인 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [dojangManager]
  );

  const getVerifiedBalance = useCallback(
    async (uid: Hex): Promise<{ balance: bigint; timestamp: bigint } | null> => {
      setIsLoading(true);
      setError(null);
      try {
        return await dojangManager.getVerifiedBalance(uid);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('인증된 잔액 조회 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [dojangManager]
  );

  return {
    getAttestation,
    isAttestationValid,
    hasVerifiedAddress,
    getVerifiedBalance,
    isLoading,
    error,
  };
}
