/**
 * 타입 정의 통합 export
 *
 * 클린 아키텍처 원칙:
 * - 도메인별 타입 분리로 응집도 향상
 * - 단일 진입점 유지로 사용 편의성 확보
 */

// Network
export type { NetworkType, GiwaNetwork } from './network';

// Wallet
export type {
  GiwaWallet,
  WalletCreationResult,
  SecureStorageOptions,
  BiometricType,
  BiometricCapability,
} from './wallet';

// Transaction
export type {
  TransactionRequest,
  TransactionResult,
  TransactionReceipt,
} from './transaction';

// Token
export type { Token, TokenBalance } from './token';

// Bridge
export type { BridgeDirection, BridgeTransaction } from './bridge';

// Flashblocks
export type { FlashblocksPreconfirmation } from './flashblocks';

// Identity (GIWA ID, Dojang)
export type {
  GiwaId,
  AttestationType,
  Attestation,
} from './identity';

// Config
export type { GiwaConfig } from './config';

// Error
export type { GiwaErrorDetails } from './error';
