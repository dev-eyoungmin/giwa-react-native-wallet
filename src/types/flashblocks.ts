/**
 * Flashblocks type definitions
 */
import type { Hash } from 'viem';

export interface FlashblocksPreconfirmation {
  txHash: Hash;
  preconfirmedAt: number;
  confirmedAt?: number;
}
