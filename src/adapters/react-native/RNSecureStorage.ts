import type { ISecureStorage } from '../interfaces/ISecureStorage';
import type { SecureStorageOptions } from '../../types';
import { GiwaSecurityError } from '../../utils/errors';

/**
 * React Native Keychain implementation of ISecureStorage
 * Uses react-native-keychain for iOS Keychain / Android Keystore access
 */
export class RNSecureStorage implements ISecureStorage {
  private Keychain: typeof import('react-native-keychain') | null = null;
  private storagePrefix: string;

  constructor(prefix: string = 'giwa_') {
    this.storagePrefix = prefix;
  }

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

  private getKey(key: string): string {
    return `${this.storagePrefix}${key}`;
  }

  async setItem(
    key: string,
    value: string,
    options?: SecureStorageOptions
  ): Promise<void> {
    const Keychain = await this.getKeychain();
    const fullKey = this.getKey(key);

    const keychainOptions: import('react-native-keychain').SetOptions = {
      service: fullKey,
    };

    if (options?.requireBiometric) {
      keychainOptions.accessControl =
        Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE;
    }

    if (options?.accessibleWhenUnlocked !== false) {
      keychainOptions.accessible =
        Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY;
    }

    await Keychain.setGenericPassword(fullKey, value, keychainOptions);
  }

  async getItem(
    key: string,
    options?: SecureStorageOptions
  ): Promise<string | null> {
    const Keychain = await this.getKeychain();
    const fullKey = this.getKey(key);

    const keychainOptions: import('react-native-keychain').GetOptions = {
      service: fullKey,
    };

    if (options?.requireBiometric) {
      keychainOptions.accessControl =
        Keychain.ACCESS_CONTROL.BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE;
    }

    const result = await Keychain.getGenericPassword(keychainOptions);

    if (result === false) {
      return null;
    }

    return result.password;
  }

  async removeItem(key: string): Promise<void> {
    const Keychain = await this.getKeychain();
    const fullKey = this.getKey(key);

    await Keychain.resetGenericPassword({ service: fullKey });
  }

  async getAllKeys(): Promise<string[]> {
    const Keychain = await this.getKeychain();

    try {
      const services = await Keychain.getAllGenericPasswordServices();
      return services
        .filter((service) => service.startsWith(this.storagePrefix))
        .map((service) => service.replace(this.storagePrefix, ''));
    } catch {
      // Some versions may not support this
      throw new GiwaSecurityError(
        'This version of react-native-keychain does not support getAllKeys.'
      );
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const Keychain = await this.getKeychain();
      const supportedTypes = await Keychain.getSupportedBiometryType();
      return supportedTypes !== null || true; // Keychain is always available even without biometrics
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    const keys = await this.getAllKeys();
    await Promise.all(keys.map((key) => this.removeItem(key)));
  }
}
