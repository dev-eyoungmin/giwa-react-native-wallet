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
  status: 'pending' | 'confirmed' | 'finalized';
}
