import { useMemo, useRef } from 'react';
import { useGiwaManagers, useGiwaState } from '../providers/GiwaProvider';
import { useAsyncActions } from './shared/useAsyncAction';
import type { Address } from 'viem';
import type { GiwaId } from '../types';

export interface UseGiwaIdReturn {
  resolveAddress: (name: string) => Promise<Address | null>;
  resolveName: (address: Address) => Promise<string | null>;
  getGiwaId: (name: string) => Promise<GiwaId | null>;
  isAvailable: (name: string) => Promise<boolean>;
  isInitializing: boolean;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for GIWA ID (`up.id`) operations, resolved via the on-chain
 * UpnameRegistry.
 *
 * Clean code principles:
 * - Removed duplicate state management logic with useAsyncActions
 */
export function useGiwaId(): UseGiwaIdReturn {
  const managers = useGiwaManagers();
  const { isLoading: sdkLoading } = useGiwaState();
  const giwaIdManager = managers?.giwaIdManager ?? null;

  const giwaIdManagerRef = useRef(giwaIdManager);
  giwaIdManagerRef.current = giwaIdManager;

  const actions = useAsyncActions({
    resolveAddress: (name: string) => {
      if (!giwaIdManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      return giwaIdManagerRef.current.resolveAddress(name);
    },
    resolveName: (address: Address) => {
      if (!giwaIdManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      return giwaIdManagerRef.current.resolveName(address);
    },
    getGiwaId: (name: string) => {
      if (!giwaIdManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      return giwaIdManagerRef.current.getGiwaId(name);
    },
    isAvailable: (name: string) => {
      if (!giwaIdManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      return giwaIdManagerRef.current.isAvailable(name);
    },
  });

  const isLoading =
    actions.resolveAddress.isLoading ||
    actions.resolveName.isLoading ||
    actions.getGiwaId.isLoading ||
    actions.isAvailable.isLoading;

  const error =
    actions.resolveAddress.error ||
    actions.resolveName.error ||
    actions.getGiwaId.error ||
    actions.isAvailable.error;

  return useMemo(() => ({
    resolveAddress: actions.resolveAddress.execute,
    resolveName: actions.resolveName.execute,
    getGiwaId: actions.getGiwaId.execute,
    isAvailable: actions.isAvailable.execute,
    isInitializing: sdkLoading,
    isLoading,
    error,
  }), [
    actions.resolveAddress.execute,
    actions.resolveName.execute,
    actions.getGiwaId.execute,
    actions.isAvailable.execute,
    sdkLoading,
    isLoading,
    error,
  ]);
}
