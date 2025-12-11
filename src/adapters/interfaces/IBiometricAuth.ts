import type { BiometricCapability, BiometricType } from '../../types';

/**
 * Biometric authentication interface
 * Implementations: ExpoBiometricAuth, RNBiometricAuth
 */
export interface IBiometricAuth {
  /**
   * Check biometric capability on this device
   * @returns Biometric capability information
   */
  getCapability(): Promise<BiometricCapability>;

  /**
   * Check if biometric authentication is available
   * @returns true if biometric is available and enrolled
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get the type of biometric available
   * @returns BiometricType
   */
  getBiometricType(): Promise<BiometricType>;

  /**
   * Authenticate using biometrics
   * @param promptMessage - Message to display in the biometric prompt
   * @returns true if authentication succeeded
   */
  authenticate(promptMessage?: string): Promise<boolean>;

  /**
   * Check if user has enrolled biometrics
   * @returns true if biometrics are enrolled
   */
  isEnrolled(): Promise<boolean>;
}

// Default prompt messages
export const BIOMETRIC_PROMPTS = {
  UNLOCK_WALLET: '지갑 잠금을 해제하려면 인증하세요',
  CONFIRM_TRANSACTION: '트랜잭션을 승인하려면 인증하세요',
  VIEW_MNEMONIC: '복구 구문을 보려면 인증하세요',
  EXPORT_PRIVATE_KEY: '개인키를 내보내려면 인증하세요',
} as const;
