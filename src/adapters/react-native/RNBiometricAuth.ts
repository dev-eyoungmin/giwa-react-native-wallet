import type { IBiometricAuth } from '../interfaces/IBiometricAuth';
import type { BiometricCapability, BiometricType } from '../../types';
import { GiwaSecurityError } from '../../utils/errors';

/**
 * React Native Keychain biometric implementation of IBiometricAuth
 * Uses react-native-keychain for biometric authentication
 */
export class RNBiometricAuth implements IBiometricAuth {
  private Keychain: typeof import('react-native-keychain') | null = null;

  private async getKeychain() {
    if (!this.Keychain) {
      try {
        this.Keychain = await import('react-native-keychain');
      } catch (error) {
        throw new GiwaSecurityError(
          'react-native-keychain not found. Please run: npm install react-native-keychain && cd ios && pod install',
          'DEPENDENCY_NOT_FOUND',
          undefined,
          error instanceof Error ? error : undefined
        );
      }
    }
    return this.Keychain;
  }

  async getCapability(): Promise<BiometricCapability> {
    const Keychain = await this.getKeychain();

    const supportedType = await Keychain.getSupportedBiometryType();

    let biometricType: BiometricType = 'none';
    let isAvailable = false;
    let isEnrolled = false;

    if (supportedType) {
      isAvailable = true;
      isEnrolled = true;

      switch (supportedType) {
        case Keychain.BIOMETRY_TYPE.FACE_ID:
        case Keychain.BIOMETRY_TYPE.FACE:
          biometricType = 'face';
          break;
        case Keychain.BIOMETRY_TYPE.TOUCH_ID:
        case Keychain.BIOMETRY_TYPE.FINGERPRINT:
          biometricType = 'fingerprint';
          break;
        case Keychain.BIOMETRY_TYPE.IRIS:
          biometricType = 'iris';
          break;
        default:
          biometricType = 'fingerprint'; // Default fallback
      }
    }

    return {
      isAvailable,
      biometricType,
      isEnrolled,
    };
  }

  async isAvailable(): Promise<boolean> {
    const capability = await this.getCapability();
    return capability.isAvailable && capability.isEnrolled;
  }

  async getBiometricType(): Promise<BiometricType> {
    const capability = await this.getCapability();
    return capability.biometricType;
  }

  async authenticate(promptMessage?: string): Promise<boolean> {
    const Keychain = await this.getKeychain();

    // react-native-keychain authenticates via accessing secured data
    // We'll use a test entry to trigger authentication
    const testService = '__giwa_biometric_test__';

    try {
      // First, set a test value with biometric protection
      await Keychain.setGenericPassword('test', 'test', {
        service: testService,
        accessControl: Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET,
      });

      // Try to access it - this triggers biometric prompt
      const result = await Keychain.getGenericPassword({
        service: testService,
        authenticationPrompt: {
          title: promptMessage || 'Authentication required',
        },
      });

      // Clean up
      await Keychain.resetGenericPassword({ service: testService });

      return result !== false;
    } catch {
      // Clean up on failure
      try {
        await Keychain.resetGenericPassword({ service: testService });
      } catch {
        // Ignore cleanup errors
      }
      return false;
    }
  }

  async isEnrolled(): Promise<boolean> {
    const Keychain = await this.getKeychain();
    const supportedType = await Keychain.getSupportedBiometryType();
    return supportedType !== null;
  }
}
