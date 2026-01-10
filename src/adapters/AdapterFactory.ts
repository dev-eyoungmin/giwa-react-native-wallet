import type { ISecureStorage } from './interfaces/ISecureStorage';
import type { IBiometricAuth } from './interfaces/IBiometricAuth';
import { GiwaSecurityError } from '../utils/errors';
import {
  detectEnvironment,
  type Environment,
} from '../utils/secureStorageValidator';

export interface Adapters {
  secureStorage: ISecureStorage;
  biometricAuth: IBiometricAuth;
}

export interface AdapterFactoryOptions {
  forceEnvironment?: Environment;
  storagePrefix?: string;
}

/**
 * Factory for creating platform-specific adapters
 * Automatically detects Expo vs React Native CLI environment
 */
export class AdapterFactory {
  private static instance: AdapterFactory | null = null;
  private adapters: Adapters | null = null;
  private environment: Environment | null = null;
  private options: AdapterFactoryOptions;

  private constructor(options: AdapterFactoryOptions = {}) {
    this.options = options;
  }

  /**
   * Get singleton instance
   */
  static getInstance(options?: AdapterFactoryOptions): AdapterFactory {
    if (!AdapterFactory.instance) {
      AdapterFactory.instance = new AdapterFactory(options);
    }
    return AdapterFactory.instance;
  }

  /**
   * Reset instance (for testing)
   */
  static resetInstance(): void {
    AdapterFactory.instance = null;
  }

  /**
   * Detect current environment
   */
  async detectEnvironment(): Promise<Environment> {
    if (this.options.forceEnvironment) {
      return this.options.forceEnvironment;
    }

    if (this.environment) {
      return this.environment;
    }

    this.environment = await detectEnvironment();
    return this.environment;
  }

  /**
   * Get adapters for current environment
   */
  async getAdapters(): Promise<Adapters> {
    if (this.adapters) {
      return this.adapters;
    }

    const env = await this.detectEnvironment();

    if (env === 'unsupported') {
      throw new GiwaSecurityError(
        'Secure storage not found. Please install expo-secure-store or react-native-keychain.'
      );
    }

    if (env === 'expo') {
      this.adapters = await this.createExpoAdapters();
    } else {
      this.adapters = await this.createRNAdapters();
    }

    return this.adapters;
  }

  /**
   * Create Expo adapters
   */
  private async createExpoAdapters(): Promise<Adapters> {
    const { ExpoSecureStorage } = await import('./expo/ExpoSecureStorage');
    const { ExpoBiometricAuth } = await import('./expo/ExpoBiometricAuth');

    return {
      secureStorage: new ExpoSecureStorage(this.options.storagePrefix),
      biometricAuth: new ExpoBiometricAuth(),
    };
  }

  /**
   * Create React Native CLI adapters
   */
  private async createRNAdapters(): Promise<Adapters> {
    const { RNSecureStorage } = await import('./react-native/RNSecureStorage');
    const { RNBiometricAuth } = await import('./react-native/RNBiometricAuth');

    return {
      secureStorage: new RNSecureStorage(this.options.storagePrefix),
      biometricAuth: new RNBiometricAuth(),
    };
  }

  /**
   * Get secure storage adapter
   */
  async getSecureStorage(): Promise<ISecureStorage> {
    const adapters = await this.getAdapters();
    return adapters.secureStorage;
  }

  /**
   * Get biometric auth adapter
   */
  async getBiometricAuth(): Promise<IBiometricAuth> {
    const adapters = await this.getAdapters();
    return adapters.biometricAuth;
  }

  /**
   * Check if secure storage is available
   */
  async isSecureStorageAvailable(): Promise<boolean> {
    try {
      const storage = await this.getSecureStorage();
      return storage.isAvailable();
    } catch {
      return false;
    }
  }

  /**
   * Check if biometric auth is available
   */
  async isBiometricAvailable(): Promise<boolean> {
    try {
      const biometric = await this.getBiometricAuth();
      return biometric.isAvailable();
    } catch {
      return false;
    }
  }
}

// Export singleton getter
export function getAdapterFactory(
  options?: AdapterFactoryOptions
): AdapterFactory {
  return AdapterFactory.getInstance(options);
}
