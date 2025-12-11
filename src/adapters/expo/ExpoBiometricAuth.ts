import type { IBiometricAuth } from '../interfaces/IBiometricAuth';
import type { BiometricCapability, BiometricType } from '../../types';
import { GiwaSecurityError } from '../../utils/errors';

/**
 * Expo LocalAuthentication implementation of IBiometricAuth
 * Uses expo-local-authentication for biometric authentication
 */
export class ExpoBiometricAuth implements IBiometricAuth {
  private LocalAuth: typeof import('expo-local-authentication') | null = null;

  private async getLocalAuth() {
    if (!this.LocalAuth) {
      try {
        this.LocalAuth = require('expo-local-authentication');
      } catch (error) {
        throw new GiwaSecurityError(
          'expo-local-authentication을 찾을 수 없습니다. npx expo install expo-local-authentication을 실행해주세요.',
          error instanceof Error ? error : undefined
        );
      }
    }
    return this.LocalAuth;
  }

  async getCapability(): Promise<BiometricCapability> {
    const LocalAuth = await this.getLocalAuth();

    const isAvailable = await LocalAuth.hasHardwareAsync();
    const isEnrolled = await LocalAuth.isEnrolledAsync();
    const supportedTypes = await LocalAuth.supportedAuthenticationTypesAsync();

    let biometricType: BiometricType = 'none';

    if (supportedTypes.includes(LocalAuth.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricType = 'face';
    } else if (supportedTypes.includes(LocalAuth.AuthenticationType.FINGERPRINT)) {
      biometricType = 'fingerprint';
    } else if (supportedTypes.includes(LocalAuth.AuthenticationType.IRIS)) {
      biometricType = 'iris';
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
    const LocalAuth = await this.getLocalAuth();

    const result = await LocalAuth.authenticateAsync({
      promptMessage: promptMessage || '인증이 필요합니다',
      fallbackLabel: '비밀번호 사용',
      disableDeviceFallback: false,
    });

    return result.success;
  }

  async isEnrolled(): Promise<boolean> {
    const LocalAuth = await this.getLocalAuth();
    return LocalAuth.isEnrolledAsync();
  }
}
