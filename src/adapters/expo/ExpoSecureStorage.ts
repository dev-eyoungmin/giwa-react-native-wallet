import type { ISecureStorage } from '../interfaces/ISecureStorage';
import type { SecureStorageOptions } from '../../types';
import { GiwaSecurityError } from '../../utils/errors';

// Key for storing the list of tracked keys
const KEYS_REGISTRY = '__keys_registry__';

/**
 * Expo SecureStore implementation of ISecureStorage
 * Uses expo-secure-store for iOS Keychain / Android Keystore access
 *
 * Note: expo-secure-store doesn't natively support key enumeration,
 * so we track stored keys in a separate registry entry.
 */
export class ExpoSecureStorage implements ISecureStorage {
  private SecureStore: typeof import('expo-secure-store') | null = null;
  private storagePrefix: string;

  constructor(prefix: string = 'giwa_') {
    this.storagePrefix = prefix;
  }

  private async getSecureStore() {
    if (!this.SecureStore) {
      try {
        this.SecureStore = await import('expo-secure-store');
      } catch (error) {
        throw new GiwaSecurityError(
          'expo-secure-store not found. Please run: npx expo install expo-secure-store',
          'SECURE_STORAGE_UNAVAILABLE'
        );
      }
    }
    return this.SecureStore;
  }

  private getKey(key: string): string {
    return `${this.storagePrefix}${key}`;
  }

  /**
   * Get tracked keys from registry
   */
  private async getTrackedKeys(): Promise<string[]> {
    const SecureStore = await this.getSecureStore();
    const registryKey = this.getKey(KEYS_REGISTRY);

    try {
      const keysJson = await SecureStore.getItemAsync(registryKey);
      if (!keysJson) {
        return [];
      }
      return JSON.parse(keysJson);
    } catch {
      return [];
    }
  }

  /**
   * Save tracked keys to registry
   */
  private async saveTrackedKeys(keys: string[]): Promise<void> {
    const SecureStore = await this.getSecureStore();
    const registryKey = this.getKey(KEYS_REGISTRY);
    await SecureStore.setItemAsync(registryKey, JSON.stringify(keys));
  }

  /**
   * Add a key to the tracking registry
   */
  private async trackKey(key: string): Promise<void> {
    const keys = await this.getTrackedKeys();
    if (!keys.includes(key)) {
      keys.push(key);
      await this.saveTrackedKeys(keys);
    }
  }

  /**
   * Remove a key from the tracking registry
   */
  private async untrackKey(key: string): Promise<void> {
    const keys = await this.getTrackedKeys();
    const filtered = keys.filter((k) => k !== key);
    await this.saveTrackedKeys(filtered);
  }

  async setItem(
    key: string,
    value: string,
    options?: SecureStorageOptions
  ): Promise<void> {
    const SecureStore = await this.getSecureStore();
    const fullKey = this.getKey(key);

    const storeOptions: import('expo-secure-store').SecureStoreOptions = {};

    if (options?.requireBiometric) {
      storeOptions.requireAuthentication = true;
    }

    if (options?.accessibleWhenUnlocked !== false) {
      storeOptions.keychainAccessible =
        SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY;
    }

    await SecureStore.setItemAsync(fullKey, value, storeOptions);

    // Track this key for getAllKeys/clear support
    await this.trackKey(key);
  }

  async getItem(
    key: string,
    options?: SecureStorageOptions
  ): Promise<string | null> {
    const SecureStore = await this.getSecureStore();
    const fullKey = this.getKey(key);

    const storeOptions: import('expo-secure-store').SecureStoreOptions = {};

    if (options?.requireBiometric) {
      storeOptions.requireAuthentication = true;
    }

    return SecureStore.getItemAsync(fullKey, storeOptions);
  }

  async removeItem(key: string): Promise<void> {
    const SecureStore = await this.getSecureStore();
    const fullKey = this.getKey(key);
    await SecureStore.deleteItemAsync(fullKey);

    // Untrack this key
    await this.untrackKey(key);
  }

  /**
   * Get all stored keys
   * Returns the list of keys that have been tracked via setItem
   */
  async getAllKeys(): Promise<string[]> {
    return this.getTrackedKeys();
  }

  async isAvailable(): Promise<boolean> {
    try {
      const SecureStore = await this.getSecureStore();
      return SecureStore.isAvailableAsync();
    } catch {
      return false;
    }
  }

  /**
   * Clear all stored items
   * Deletes all tracked keys and clears the registry
   */
  async clear(): Promise<void> {
    const SecureStore = await this.getSecureStore();
    const keys = await this.getTrackedKeys();

    // Delete all tracked keys
    await Promise.all(
      keys.map((key) => {
        const fullKey = this.getKey(key);
        return SecureStore.deleteItemAsync(fullKey);
      })
    );

    // Clear the registry
    const registryKey = this.getKey(KEYS_REGISTRY);
    await SecureStore.deleteItemAsync(registryKey);
  }
}
