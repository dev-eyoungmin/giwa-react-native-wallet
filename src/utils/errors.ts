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
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/**
 * 에러 메시지 상수 (한국어)
 * 클린 코드: 매직 스트링 제거
 */
export const ErrorMessages = {
  // Security
  SECURE_STORAGE_UNAVAILABLE: '보안 저장소를 사용할 수 없습니다.',
  BIOMETRIC_NOT_AVAILABLE: '생체 인증을 사용할 수 없습니다.',
  BIOMETRIC_NOT_ENROLLED: '생체 인증이 등록되어 있지 않습니다.',
  BIOMETRIC_FAILED: '생체 인증에 실패했습니다.',

  // Wallet
  WALLET_NOT_FOUND: '지갑을 찾을 수 없습니다.',
  WALLET_ALREADY_EXISTS: '이미 지갑이 존재합니다.',
  INVALID_MNEMONIC: '유효하지 않은 복구 구문입니다.',
  INVALID_PRIVATE_KEY: '유효하지 않은 개인키입니다.',
  WALLET_CREATION_FAILED: '지갑 생성에 실패했습니다.',
  WALLET_RECOVERY_FAILED: '지갑 복구에 실패했습니다.',
  WALLET_IMPORT_FAILED: '지갑 가져오기에 실패했습니다.',
  WALLET_LOAD_FAILED: '지갑 로드에 실패했습니다.',
  WALLET_DELETE_FAILED: '지갑 삭제에 실패했습니다.',
  MNEMONIC_EXPORT_FAILED: '복구 구문 내보내기에 실패했습니다.',
  PRIVATE_KEY_EXPORT_FAILED: '개인키 내보내기에 실패했습니다.',
  WALLET_NOT_CONNECTED: '지갑이 연결되지 않았습니다.',
  WALLET_ADDRESS_REQUIRED: '지갑 주소가 필요합니다.',

  // Transaction
  INSUFFICIENT_BALANCE: '잔액이 부족합니다.',
  TRANSACTION_FAILED: '트랜잭션에 실패했습니다.',
  TRANSACTION_SEND_FAILED: '트랜잭션 전송에 실패했습니다.',
  TRANSACTION_CONFIRM_FAILED: '트랜잭션 확인에 실패했습니다.',
  GAS_ESTIMATION_FAILED: '가스 예측에 실패했습니다.',

  // Token
  TOKEN_INFO_FAILED: '토큰 정보 조회에 실패했습니다.',
  TOKEN_BALANCE_FAILED: '토큰 잔액 조회에 실패했습니다.',
  TOKEN_TRANSFER_FAILED: '토큰 전송에 실패했습니다.',
  TOKEN_APPROVE_FAILED: '토큰 승인에 실패했습니다.',
  TOKEN_ALLOWANCE_FAILED: '허용량 조회에 실패했습니다.',
  BALANCE_QUERY_FAILED: '잔액 조회에 실패했습니다.',

  // Bridge
  BRIDGE_DEPOSIT_FAILED: '입금에 실패했습니다.',
  BRIDGE_WITHDRAW_FAILED: '출금에 실패했습니다.',
  ETH_WITHDRAW_FAILED: 'ETH 출금에 실패했습니다.',
  TOKEN_WITHDRAW_FAILED: '토큰 출금에 실패했습니다.',

  // Flashblocks
  FLASHBLOCKS_FAILED: 'Flashblocks 트랜잭션에 실패했습니다.',

  // GIWA ID
  GIWA_ID_ADDRESS_FAILED: 'GIWA ID 주소 조회에 실패했습니다.',
  GIWA_ID_NAME_FAILED: 'GIWA ID 이름 조회에 실패했습니다.',
  GIWA_ID_INFO_FAILED: 'GIWA ID 정보 조회에 실패했습니다.',
  GIWA_ID_TEXT_RECORD_GET_FAILED: '텍스트 레코드 조회에 실패했습니다.',
  GIWA_ID_TEXT_RECORD_SET_FAILED: '텍스트 레코드 설정에 실패했습니다.',
  GIWA_ID_AVAILABILITY_FAILED: 'GIWA ID 가용성 확인에 실패했습니다.',

  // Dojang
  ATTESTATION_QUERY_FAILED: '증명 조회에 실패했습니다.',
  ATTESTATION_VALIDITY_FAILED: '증명 유효성 확인에 실패했습니다.',
  VERIFIED_ADDRESS_FAILED: '인증된 주소 확인에 실패했습니다.',
  VERIFIED_BALANCE_FAILED: '인증된 잔액 조회에 실패했습니다.',

  // Faucet
  FAUCET_FAILED: 'Faucet 요청에 실패했습니다.',
  FAUCET_TESTNET_ONLY: 'Faucet은 테스트넷에서만 사용할 수 있습니다.',

  // Network
  RPC_ERROR: 'RPC 에러가 발생했습니다.',
  NETWORK_UNAVAILABLE: '네트워크를 사용할 수 없습니다.',

  // General
  INITIALIZATION_FAILED: '초기화에 실패했습니다.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
} as const;

export type ErrorMessage = (typeof ErrorMessages)[keyof typeof ErrorMessages];

/**
 * unknown 에러를 Error 객체로 변환
 * 클린 코드: 에러 처리 일관성
 */
export function toError(err: unknown, fallbackMessage?: string): Error {
  if (err instanceof Error) {
    return err;
  }
  return new Error(fallbackMessage ?? ErrorMessages.UNKNOWN_ERROR);
}

/**
 * GIWA 에러로 래핑
 */
export function wrapError(
  err: unknown,
  ErrorClass: new (message: string, cause?: Error) => GiwaError,
  message: string
): GiwaError {
  const cause = err instanceof Error ? err : undefined;
  return new ErrorClass(message, cause);
}
