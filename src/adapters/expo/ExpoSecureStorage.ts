import type { ISecureStorage } from '../interfaces/ISecureStorage';
import type { SecureStorageOptions } from '../../types';
import { GiwaSecurityError } from '../../utils/errors';

/**
 * Expo SecureStore implementation of ISecureStorage
 * Uses expo-secure-store for iOS Keychain / Android Keystore access
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
        this.SecureStore = require('expo-secure-store');
      } catch (error) {
        throw new GiwaSecurityError(
          'expo-secure-store를 찾을 수 없습니다. npx expo install expo-secure-store를 실행해주세요.',
          error instanceof Error ? error : undefined
        );
      }
    }
    return this.SecureStore;
  }

  private getKey(key: string): string {
    return `${this.storagePrefix}${key}`;
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
  }

  async getAllKeys(): Promise<string[]> {
    // expo-secure-store doesn't support getAllKeys natively
    // We need to track keys separately or return empty
    // For simplicity, we'll throw an error indicating this limitation
    throw new GiwaSecurityError(
      'expo-secure-store는 getAllKeys를 지원하지 않습니다.'
    );
  }

  async isAvailable(): Promise<boolean> {
    try {
      const SecureStore = await this.getSecureStore();
      return SecureStore.isAvailableAsync();
    } catch {
      return false;
    }
  }

  async clear(): Promise<void> {
    // expo-secure-store doesn't support clear all
    // Individual keys need to be deleted
    throw new GiwaSecurityError(
      'expo-secure-store는 전체 삭제를 지원하지 않습니다. 개별 키를 삭제해주세요.'
    );
  }
}
