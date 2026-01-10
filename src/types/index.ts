/**
 * Unified type exports
 *
 * Clean architecture principles:
 * - Domain-specific type separation for improved cohesion
 * - Single entry point for ease of use
 */

// Network
export type {
  NetworkType,
  GiwaNetwork,
  FeatureName,
  FeatureStatus,
  NetworkReadiness,
  FeatureAvailability,
  NetworkWarningCode,
  NetworkWarning,
  NetworkStatus,
} from './network';

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
export type { GiwaConfig, CustomEndpoints, CustomContracts } from './config';

// Error
export type { GiwaErrorDetails } from './error';
