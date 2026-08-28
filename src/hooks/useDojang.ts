import { useCallback, useMemo, useRef } from 'react';
import { useGiwaManagers, useGiwaState } from '../providers/GiwaProvider';
import { useAsyncActions } from './shared/useAsyncAction';
import type { Address, Hex } from 'viem';
import type { Attestation, DojangAttestationData } from '../types';

export interface UseDojangReturn {
  getAttestation: (uid: Hex) => Promise<Attestation | null>;
  isAttestationValid: (uid: Hex) => Promise<boolean>;
  hasVerifiedAddress: (address: Address, attesterId?: Hex) => Promise<boolean>;
  getVerifiedAddressAttestationUid: (
    address: Address,
    attesterId?: Hex
  ) => Promise<Hex | null>;
  getAttestationsForAddress: (address: Address) => Promise<Attestation[]>;
  getVerifiedBalance: (
    recipient: Address,
    coinType: bigint,
    snapshotAt: bigint,
    attesterId?: Hex
  ) => Promise<bigint | null>;
  isVerifiedCode: (codeHash: Hex, domain: string, attesterId?: Hex) => Promise<boolean>;
  decodeAttestationData: (
    attestation: Pick<Attestation, 'attestationType' | 'data'>
  ) => DojangAttestationData | null;
  isInitializing: boolean;
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
  const managers = useGiwaManagers();
  const { isLoading: sdkLoading } = useGiwaState();
  const dojangManager = managers?.dojangManager ?? null;

  const dojangManagerRef = useRef(dojangManager);
  dojangManagerRef.current = dojangManager;

  const actions = useAsyncActions({
    getAttestation: (uid: Hex) => {
      if (!dojangManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      return dojangManagerRef.current.getAttestation(uid);
    },
    isAttestationValid: (uid: Hex) => {
      if (!dojangManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      return dojangManagerRef.current.isAttestationValid(uid);
    },
    hasVerifiedAddress: (address: Address, attesterId?: Hex) => {
      if (!dojangManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      return dojangManagerRef.current.hasVerifiedAddress(address, attesterId);
    },
    getVerifiedAddressAttestationUid: (address: Address, attesterId?: Hex) => {
      if (!dojangManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      return dojangManagerRef.current.getVerifiedAddressAttestationUid(address, attesterId);
    },
    getAttestationsForAddress: (address: Address) => {
      if (!dojangManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      return dojangManagerRef.current.getAttestationsForAddress(address);
    },
    getVerifiedBalance: (
      recipient: Address,
      coinType: bigint,
      snapshotAt: bigint,
      attesterId?: Hex
    ) => {
      if (!dojangManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      return dojangManagerRef.current.getVerifiedBalance(
        recipient,
        coinType,
        snapshotAt,
        attesterId
      );
    },
    isVerifiedCode: (codeHash: Hex, domain: string, attesterId?: Hex) => {
      if (!dojangManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      return dojangManagerRef.current.isVerifiedCode(codeHash, domain, attesterId);
    },
  });

  // Synchronous decode helper - no network call, so it bypasses useAsyncActions.
  const decodeAttestationData = useCallback(
    (attestation: Pick<Attestation, 'attestationType' | 'data'>): DojangAttestationData | null => {
      if (!dojangManagerRef.current) {
        return null;
      }
      return dojangManagerRef.current.decodeAttestationData(attestation);
    },
    []
  );

  const isLoading =
    actions.getAttestation.isLoading ||
    actions.isAttestationValid.isLoading ||
    actions.hasVerifiedAddress.isLoading ||
    actions.getVerifiedAddressAttestationUid.isLoading ||
    actions.getAttestationsForAddress.isLoading ||
    actions.getVerifiedBalance.isLoading ||
    actions.isVerifiedCode.isLoading;

  const error =
    actions.getAttestation.error ||
    actions.isAttestationValid.error ||
    actions.hasVerifiedAddress.error ||
    actions.getVerifiedAddressAttestationUid.error ||
    actions.getAttestationsForAddress.error ||
    actions.getVerifiedBalance.error ||
    actions.isVerifiedCode.error;

  return useMemo(() => ({
    getAttestation: actions.getAttestation.execute,
    isAttestationValid: actions.isAttestationValid.execute,
    hasVerifiedAddress: actions.hasVerifiedAddress.execute,
    getVerifiedAddressAttestationUid: actions.getVerifiedAddressAttestationUid.execute,
    getAttestationsForAddress: actions.getAttestationsForAddress.execute,
    getVerifiedBalance: actions.getVerifiedBalance.execute,
    isVerifiedCode: actions.isVerifiedCode.execute,
    decodeAttestationData,
    isInitializing: sdkLoading,
    isLoading,
    error,
  }), [
    actions.getAttestation.execute,
    actions.isAttestationValid.execute,
    actions.hasVerifiedAddress.execute,
    actions.getVerifiedAddressAttestationUid.execute,
    actions.getAttestationsForAddress.execute,
    actions.getVerifiedBalance.execute,
    actions.isVerifiedCode.execute,
    decodeAttestationData,
    sdkLoading,
    isLoading,
    error,
  ]);
}
