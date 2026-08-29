import { useCallback, useMemo, useRef } from 'react';
import { useGiwaManagers, useGiwaState } from '../providers/GiwaProvider';
import { useAsyncActions } from './shared/useAsyncAction';
import type { Address, Hash } from 'viem';
import type { GetTimeToFinalizeReturnType, GetTimeToProveReturnType } from 'viem/op-stack';
import type { BridgeTransaction, WithdrawalStatus } from '../types';

export interface UseBridgeReturn {
  withdrawETH: (amount: string, to?: Address) => Promise<Hash>;
  withdrawToken: (l2TokenAddress: Address, amount: bigint, to?: Address) => Promise<Hash>;
  depositETH: (amount: string, to?: Address) => Promise<Hash>;
  depositToken: (
    l1TokenAddress: Address,
    l2TokenAddress: Address,
    amount: bigint,
    to?: Address
  ) => Promise<Hash>;
  getWithdrawalStatus: (l2TxHash: Hash) => Promise<WithdrawalStatus>;
  getTimeToProve: (l2TxHash: Hash) => Promise<GetTimeToProveReturnType>;
  getTimeToFinalize: (l2TxHash: Hash) => Promise<GetTimeToFinalizeReturnType>;
  proveWithdrawal: (l2TxHash: Hash) => Promise<Hash>;
  finalizeWithdrawal: (l2TxHash: Hash) => Promise<Hash>;
  getPendingTransactions: () => BridgeTransaction[];
  getTransaction: (hash: Hash) => BridgeTransaction | undefined;
  getEstimatedWithdrawalTime: () => number;
  /** Whether L1 (Ethereum) support is configured (`config.endpoints.l1RpcUrl`). */
  isL1Configured: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  error: Error | null;
}

/**
 * Hook for L1↔L2 bridge operations
 *
 * Clean code principles:
 * - Removed duplicate state management logic with useAsyncActions
 * - Eliminated magic strings with ErrorMessages constants
 * - Returns isInitializing=true during SDK initialization
 */
export function useBridge(): UseBridgeReturn {
  const managers = useGiwaManagers();
  const { isLoading: sdkLoading } = useGiwaState();

  const bridgeManager = managers?.bridgeManager ?? null;
  const bridgeManagerRef = useRef(bridgeManager);
  bridgeManagerRef.current = bridgeManager;

  // Manage async action state with useAsyncActions
  const actions = useAsyncActions({
    withdrawETH: async (amount: string, to?: Address) => {
      if (!bridgeManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      const result = await bridgeManagerRef.current.withdrawETH(amount, to);
      return result.hash;
    },
    withdrawToken: async (l2TokenAddress: Address, amount: bigint, to?: Address) => {
      if (!bridgeManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      const result = await bridgeManagerRef.current.withdrawToken(l2TokenAddress, amount, to);
      return result.hash;
    },
    depositETH: async (amount: string, to?: Address) => {
      if (!bridgeManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      const result = await bridgeManagerRef.current.depositETH(amount, to);
      return result.hash;
    },
    depositToken: async (
      l1TokenAddress: Address,
      l2TokenAddress: Address,
      amount: bigint,
      to?: Address
    ) => {
      if (!bridgeManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      const result = await bridgeManagerRef.current.depositToken(
        l1TokenAddress,
        l2TokenAddress,
        amount,
        to
      );
      return result.hash;
    },
    getWithdrawalStatus: async (l2TxHash: Hash) => {
      if (!bridgeManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      return bridgeManagerRef.current.getWithdrawalStatus(l2TxHash);
    },
    getTimeToProve: async (l2TxHash: Hash) => {
      if (!bridgeManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      return bridgeManagerRef.current.getTimeToProve(l2TxHash);
    },
    getTimeToFinalize: async (l2TxHash: Hash) => {
      if (!bridgeManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      return bridgeManagerRef.current.getTimeToFinalize(l2TxHash);
    },
    proveWithdrawal: async (l2TxHash: Hash) => {
      if (!bridgeManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      const result = await bridgeManagerRef.current.proveWithdrawal(l2TxHash);
      return result.hash;
    },
    finalizeWithdrawal: async (l2TxHash: Hash) => {
      if (!bridgeManagerRef.current) {
        throw new Error('SDK is still initializing');
      }
      const result = await bridgeManagerRef.current.finalizeWithdrawal(l2TxHash);
      return result.hash;
    },
  });

  // Synchronous methods
  const getPendingTransactions = useCallback((): BridgeTransaction[] => {
    return bridgeManagerRef.current?.getPendingTransactions() ?? [];
  }, []);

  const getTransaction = useCallback(
    (hash: Hash): BridgeTransaction | undefined => {
      return bridgeManagerRef.current?.getTransaction(hash);
    },
    []
  );

  const getEstimatedWithdrawalTime = useCallback((): number => {
    return bridgeManagerRef.current?.getEstimatedWithdrawalTime() ?? 0;
  }, []);

  const isL1Configured = managers?.client?.hasL1Support() ?? false;

  // Combined loading/error state
  const isLoading =
    actions.withdrawETH.isLoading ||
    actions.withdrawToken.isLoading ||
    actions.depositETH.isLoading ||
    actions.depositToken.isLoading ||
    actions.getWithdrawalStatus.isLoading ||
    actions.getTimeToProve.isLoading ||
    actions.getTimeToFinalize.isLoading ||
    actions.proveWithdrawal.isLoading ||
    actions.finalizeWithdrawal.isLoading;
  const error =
    actions.withdrawETH.error ||
    actions.withdrawToken.error ||
    actions.depositETH.error ||
    actions.depositToken.error ||
    actions.getWithdrawalStatus.error ||
    actions.getTimeToProve.error ||
    actions.getTimeToFinalize.error ||
    actions.proveWithdrawal.error ||
    actions.finalizeWithdrawal.error;

  return useMemo(() => ({
    withdrawETH: actions.withdrawETH.execute,
    withdrawToken: actions.withdrawToken.execute,
    depositETH: actions.depositETH.execute,
    depositToken: actions.depositToken.execute,
    getWithdrawalStatus: actions.getWithdrawalStatus.execute,
    getTimeToProve: actions.getTimeToProve.execute,
    getTimeToFinalize: actions.getTimeToFinalize.execute,
    proveWithdrawal: actions.proveWithdrawal.execute,
    finalizeWithdrawal: actions.finalizeWithdrawal.execute,
    getPendingTransactions,
    getTransaction,
    getEstimatedWithdrawalTime,
    isL1Configured,
    isLoading,
    isInitializing: sdkLoading,
    error,
  }), [
    actions.withdrawETH.execute,
    actions.withdrawToken.execute,
    actions.depositETH.execute,
    actions.depositToken.execute,
    actions.getWithdrawalStatus.execute,
    actions.getTimeToProve.execute,
    actions.getTimeToFinalize.execute,
    actions.proveWithdrawal.execute,
    actions.finalizeWithdrawal.execute,
    getPendingTransactions,
    getTransaction,
    getEstimatedWithdrawalTime,
    isL1Configured,
    isLoading,
    sdkLoading,
    error,
  ]);
}
