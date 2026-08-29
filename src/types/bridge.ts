/**
 * Bridge type definitions
 */
import type { Address, Hash } from 'viem';

export type BridgeDirection = 'deposit' | 'withdraw';

export interface BridgeTransaction {
  direction: BridgeDirection;
  amount: bigint;
  token?: Address;
  l1TxHash?: Hash;
  l2TxHash?: Hash;
  status: 'pending' | 'confirmed' | 'proved' | 'finalized' | 'failed';
}

/**
 * Status of an L2 -> L1 withdrawal, as reported by viem's
 * `getWithdrawalStatus` op-stack action.
 */
export type WithdrawalStatus =
  | 'waiting-to-prove'
  | 'ready-to-prove'
  | 'waiting-to-finalize'
  | 'ready-to-finalize'
  | 'finalized';
