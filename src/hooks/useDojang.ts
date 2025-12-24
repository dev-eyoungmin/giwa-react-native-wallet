import { useMemo, useRef } from 'react';
import { useGiwaManagers } from '../providers/GiwaProvider';
import { useAsyncActions } from './shared/useAsyncAction';
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
 * Clean code principles:
 * - Removed duplicate state management logic with useAsyncActions
 */
export function useDojang(): UseDojangReturn {
  const { dojangManager } = useGiwaManagers();

  const dojangManagerRef = useRef(dojangManager);
  dojangManagerRef.current = dojangManager;

  const actions = useAsyncActions({
    getAttestation: (uid: Hex) => dojangManagerRef.current.getAttestation(uid),
    isAttestationValid: (uid: Hex) => dojangManagerRef.current.isAttestationValid(uid),
    hasVerifiedAddress: (address: Address) => dojangManagerRef.current.hasVerifiedAddress(address),
    getVerifiedBalance: (uid: Hex) => dojangManagerRef.current.getVerifiedBalance(uid),
  });

  const isLoading =
    actions.getAttestation.isLoading ||
    actions.isAttestationValid.isLoading ||
    actions.hasVerifiedAddress.isLoading ||
    actions.getVerifiedBalance.isLoading;

  const error =
    actions.getAttestation.error ||
    actions.isAttestationValid.error ||
    actions.hasVerifiedAddress.error ||
    actions.getVerifiedBalance.error;

  return useMemo(() => ({
    getAttestation: actions.getAttestation.execute,
    isAttestationValid: actions.isAttestationValid.execute,
    hasVerifiedAddress: actions.hasVerifiedAddress.execute,
    getVerifiedBalance: actions.getVerifiedBalance.execute,
    isLoading,
    error,
  }), [
    actions.getAttestation.execute,
    actions.isAttestationValid.execute,
    actions.hasVerifiedAddress.execute,
    actions.getVerifiedBalance.execute,
    isLoading,
    error,
  ]);
}
