/**
 * 트랜잭션 관련 타입 정의
 */
import type { Address, Hash, Hex } from 'viem';

export interface TransactionRequest {
  to: Address;
  value?: bigint;
  data?: Hex;
  gasLimit?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
}

export interface TransactionResult {
  hash: Hash;
  wait: () => Promise<TransactionReceipt>;
}

export interface TransactionReceipt {
  hash: Hash;
  blockNumber: bigint;
  status: 'success' | 'reverted';
  gasUsed: bigint;
}
