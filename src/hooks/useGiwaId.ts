import { useMemo, useRef } from 'react';
import { useGiwaManagers } from '../providers/GiwaProvider';
import { useAsyncActions } from './shared/useAsyncAction';
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
 * Clean code principles:
 * - Removed duplicate state management logic with useAsyncActions
 */
export function useGiwaId(): UseGiwaIdReturn {
  const { giwaIdManager } = useGiwaManagers();

  const giwaIdManagerRef = useRef(giwaIdManager);
  giwaIdManagerRef.current = giwaIdManager;

  const actions = useAsyncActions({
    resolveAddress: (giwaId: string) => giwaIdManagerRef.current.resolveAddress(giwaId),
    resolveName: (address: Address) => giwaIdManagerRef.current.resolveName(address),
    getGiwaId: (giwaId: string) => giwaIdManagerRef.current.getGiwaId(giwaId),
    getTextRecord: (giwaId: string, key: string) => giwaIdManagerRef.current.getTextRecord(giwaId, key),
    setTextRecord: async (giwaId: string, key: string, value: string) => {
      const result = await giwaIdManagerRef.current.setTextRecord(giwaId, key, value);
      return result.hash;
    },
    isAvailable: (giwaId: string) => giwaIdManagerRef.current.isAvailable(giwaId),
  });

  const isLoading =
    actions.resolveAddress.isLoading ||
    actions.resolveName.isLoading ||
    actions.getGiwaId.isLoading ||
    actions.getTextRecord.isLoading ||
    actions.setTextRecord.isLoading ||
    actions.isAvailable.isLoading;

  const error =
    actions.resolveAddress.error ||
    actions.resolveName.error ||
    actions.getGiwaId.error ||
    actions.getTextRecord.error ||
    actions.setTextRecord.error ||
    actions.isAvailable.error;

  return useMemo(() => ({
    resolveAddress: actions.resolveAddress.execute,
    resolveName: actions.resolveName.execute,
    getGiwaId: actions.getGiwaId.execute,
    getTextRecord: actions.getTextRecord.execute,
    setTextRecord: actions.setTextRecord.execute,
    isAvailable: actions.isAvailable.execute,
    isLoading,
    error,
  }), [
    actions.resolveAddress.execute,
    actions.resolveName.execute,
    actions.getGiwaId.execute,
    actions.getTextRecord.execute,
    actions.setTextRecord.execute,
    actions.isAvailable.execute,
    isLoading,
    error,
  ]);
}
