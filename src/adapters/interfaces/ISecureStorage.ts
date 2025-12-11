import type { SecureStorageOptions } from '../../types';

/**
 * Secure storage interface for storing sensitive data
 * Implementations: ExpoSecureStorage, RNSecureStorage
 */
export interface ISecureStorage {
  /**
   * Store a value securely
   * @param key - Storage key
   * @param value - Value to store
   * @param options - Optional storage options
   */
  setItem(key: string, value: string, options?: SecureStorageOptions): Promise<void>;

  /**
   * Retrieve a stored value
   * @param key - Storage key
   * @param options - Optional retrieval options
   * @returns The stored value or null if not found
   */
  getItem(key: string, options?: SecureStorageOptions): Promise<string | null>;

  /**
   * Remove a stored value
   * @param key - Storage key
   */
  removeItem(key: string): Promise<void>;

  /**
   * Get all storage keys
   * @returns Array of all keys
   */
  getAllKeys(): Promise<string[]>;

  /**
   * Check if secure storage is available on this device
   * @returns true if available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Clear all stored data
   */
  clear(): Promise<void>;
}

// Storage key constants
export const STORAGE_KEYS = {
  WALLET_DATA: 'giwa_wallet_data',
  MNEMONIC: 'giwa_mnemonic',
  PRIVATE_KEY: 'giwa_private_key',
  SETTINGS: 'giwa_settings',
  TOKENS: 'giwa_custom_tokens',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
