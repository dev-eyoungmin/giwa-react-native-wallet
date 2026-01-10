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
  UNLOCK_WALLET: 'Authenticate to unlock wallet',
  CONFIRM_TRANSACTION: 'Authenticate to confirm transaction',
  VIEW_MNEMONIC: 'Authenticate to view recovery phrase',
  EXPORT_PRIVATE_KEY: 'Authenticate to export private key',
} as const;
