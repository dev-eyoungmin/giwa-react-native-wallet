/**
 * Flashblocks 관련 타입 정의
 */
import type { Hash } from 'viem';

export interface FlashblocksPreconfirmation {
  txHash: Hash;
  preconfirmedAt: number;
  confirmedAt?: number;
}
