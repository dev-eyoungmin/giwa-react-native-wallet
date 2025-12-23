export class GiwaError extends Error {
  public readonly code: string;
  public readonly cause?: Error;

  constructor(message: string, code: string, cause?: Error) {
    super(message);
    this.name = 'GiwaError';
    this.code = code;
    this.cause = cause;
    Object.setPrototypeOf(this, GiwaError.prototype);
  }
}

export class GiwaSecurityError extends GiwaError {
  constructor(message: string, cause?: Error) {
    super(message, 'SECURITY_ERROR', cause);
    this.name = 'GiwaSecurityError';
    Object.setPrototypeOf(this, GiwaSecurityError.prototype);
  }
}

export class GiwaNetworkError extends GiwaError {
  constructor(message: string, cause?: Error) {
    super(message, 'NETWORK_ERROR', cause);
    this.name = 'GiwaNetworkError';
    Object.setPrototypeOf(this, GiwaNetworkError.prototype);
  }
}

export class GiwaWalletError extends GiwaError {
  constructor(message: string, cause?: Error) {
    super(message, 'WALLET_ERROR', cause);
    this.name = 'GiwaWalletError';
    Object.setPrototypeOf(this, GiwaWalletError.prototype);
  }
}

export class GiwaTransactionError extends GiwaError {
  constructor(message: string, cause?: Error) {
    super(message, 'TRANSACTION_ERROR', cause);
    this.name = 'GiwaTransactionError';
    Object.setPrototypeOf(this, GiwaTransactionError.prototype);
  }
}

export class GiwaFeatureUnavailableError extends GiwaError {
  public readonly feature: string;
  public readonly network: string;

  constructor(feature: string, network: string, reason?: string) {
    const message = reason
      ? `Feature "${feature}" is not available on ${network}: ${reason}`
      : `Feature "${feature}" is not available on ${network}`;
    super(message, 'FEATURE_UNAVAILABLE');
    this.name = 'GiwaFeatureUnavailableError';
    this.feature = feature;
    this.network = network;
    Object.setPrototypeOf(this, GiwaFeatureUnavailableError.prototype);
  }
}

// Error codes
export const ErrorCodes = {
  // Security
  SECURE_STORAGE_UNAVAILABLE: 'SECURE_STORAGE_UNAVAILABLE',
  BIOMETRIC_NOT_AVAILABLE: 'BIOMETRIC_NOT_AVAILABLE',
  BIOMETRIC_NOT_ENROLLED: 'BIOMETRIC_NOT_ENROLLED',
  BIOMETRIC_FAILED: 'BIOMETRIC_FAILED',

  // Wallet
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  WALLET_ALREADY_EXISTS: 'WALLET_ALREADY_EXISTS',
  INVALID_MNEMONIC: 'INVALID_MNEMONIC',
  INVALID_PRIVATE_KEY: 'INVALID_PRIVATE_KEY',

  // Transaction
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  GAS_ESTIMATION_FAILED: 'GAS_ESTIMATION_FAILED',

  // Network
  RPC_ERROR: 'RPC_ERROR',
  NETWORK_UNAVAILABLE: 'NETWORK_UNAVAILABLE',

  // Bridge
  BRIDGE_DEPOSIT_FAILED: 'BRIDGE_DEPOSIT_FAILED',
  BRIDGE_WITHDRAW_FAILED: 'BRIDGE_WITHDRAW_FAILED',

  // Network
  FEATURE_UNAVAILABLE: 'FEATURE_UNAVAILABLE',
  NETWORK_NOT_READY: 'NETWORK_NOT_READY',
  TBD_CONTRACT: 'TBD_CONTRACT',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export const ErrorMessages = {
  // Security
  SECURE_STORAGE_UNAVAILABLE: 'Secure storage is unavailable.',
  BIOMETRIC_NOT_AVAILABLE: 'Biometric authentication is unavailable.',
  BIOMETRIC_NOT_ENROLLED: 'Biometric authentication is not enrolled.',
  BIOMETRIC_FAILED: 'Biometric authentication failed.',

  // Wallet
  WALLET_NOT_FOUND: 'Wallet not found.',
  WALLET_ALREADY_EXISTS: 'Wallet already exists.',
  INVALID_MNEMONIC: 'Invalid recovery phrase.',
  INVALID_PRIVATE_KEY: 'Invalid private key.',
  WALLET_CREATION_FAILED: 'Failed to create wallet.',
  WALLET_RECOVERY_FAILED: 'Failed to recover wallet.',
  WALLET_IMPORT_FAILED: 'Failed to import wallet.',
  WALLET_LOAD_FAILED: 'Failed to load wallet.',
  WALLET_DELETE_FAILED: 'Failed to delete wallet.',
  MNEMONIC_EXPORT_FAILED: 'Failed to export recovery phrase.',
  PRIVATE_KEY_EXPORT_FAILED: 'Failed to export private key.',
  WALLET_NOT_CONNECTED: 'Wallet is not connected.',
  WALLET_ADDRESS_REQUIRED: 'Wallet address is required.',

  // Transaction
  INSUFFICIENT_BALANCE: 'Insufficient balance.',
  TRANSACTION_FAILED: 'Transaction failed.',
  TRANSACTION_SEND_FAILED: 'Failed to send transaction.',
  TRANSACTION_CONFIRM_FAILED: 'Failed to confirm transaction.',
  GAS_ESTIMATION_FAILED: 'Failed to estimate gas.',

  // Token
  TOKEN_INFO_FAILED: 'Failed to get token info.',
  TOKEN_BALANCE_FAILED: 'Failed to get token balance.',
  TOKEN_TRANSFER_FAILED: 'Failed to transfer token.',
  TOKEN_APPROVE_FAILED: 'Failed to approve token.',
  TOKEN_ALLOWANCE_FAILED: 'Failed to get allowance.',
  BALANCE_QUERY_FAILED: 'Failed to query balance.',

  // Bridge
  BRIDGE_DEPOSIT_FAILED: 'Deposit failed.',
  BRIDGE_WITHDRAW_FAILED: 'Withdrawal failed.',
  ETH_WITHDRAW_FAILED: 'ETH withdrawal failed.',
  TOKEN_WITHDRAW_FAILED: 'Token withdrawal failed.',

  // Flashblocks
  FLASHBLOCKS_FAILED: 'Flashblocks transaction failed.',

  // GIWA ID
  GIWA_ID_ADDRESS_FAILED: 'Failed to get GIWA ID address.',
  GIWA_ID_NAME_FAILED: 'Failed to get GIWA ID name.',
  GIWA_ID_INFO_FAILED: 'Failed to get GIWA ID info.',
  GIWA_ID_TEXT_RECORD_GET_FAILED: 'Failed to get text record.',
  GIWA_ID_TEXT_RECORD_SET_FAILED: 'Failed to set text record.',
  GIWA_ID_AVAILABILITY_FAILED: 'Failed to check GIWA ID availability.',

  // Dojang
  ATTESTATION_QUERY_FAILED: 'Failed to query attestation.',
  ATTESTATION_VALIDITY_FAILED: 'Failed to check attestation validity.',
  VERIFIED_ADDRESS_FAILED: 'Failed to check verified address.',
  VERIFIED_BALANCE_FAILED: 'Failed to query verified balance.',

  // Faucet
  FAUCET_FAILED: 'Faucet request failed.',
  FAUCET_TESTNET_ONLY: 'Faucet is available on testnet only.',

  // Network
  RPC_ERROR: 'RPC error occurred.',
  NETWORK_UNAVAILABLE: 'Network is unavailable.',

  // General
  INITIALIZATION_FAILED: 'Initialization failed.',
  UNKNOWN_ERROR: 'Unknown error occurred.',

  // Network/Feature
  FEATURE_UNAVAILABLE: 'This feature is not available on the current network.',
  NETWORK_NOT_READY: 'The selected network is not ready for use.',
  TBD_CONTRACT: 'Contract address is not yet deployed (TBD).',
} as const;

export type ErrorMessage = (typeof ErrorMessages)[keyof typeof ErrorMessages];

/**
 * Convert unknown error to Error object
 * Clean code: Consistency in error handling
 */
export function toError(err: unknown, fallbackMessage?: string): Error {
  if (err instanceof Error) {
    return err;
  }
  return new Error(fallbackMessage ?? ErrorMessages.UNKNOWN_ERROR);
}

/**
 * Wrap with GIWA Error
 */
export function wrapError(
  err: unknown,
  ErrorClass: new (message: string, cause?: Error) => GiwaError,
  message: string
): GiwaError {
  const cause = err instanceof Error ? err : undefined;
  return new ErrorClass(message, cause);
}
