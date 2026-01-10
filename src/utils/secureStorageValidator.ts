import { GiwaSecurityError, ErrorCodes } from './errors';

/**
 * Validate that secure storage is available
 * Throws GiwaSecurityError if not available
 */
export async function validateSecureStorage(
  isAvailable: () => Promise<boolean>
): Promise<void> {
  const available = await isAvailable();
  if (!available) {
    throw new GiwaSecurityError(
      'Secure storage is not available. The wallet cannot be used on this device.'
    );
  }
}

/**
 * Check if running in Expo environment
 */
export async function isExpoEnvironment(): Promise<boolean> {
  try {
    // @ts-ignore - expo-constants is an optional peer dependency
    const expoConstants = await import('expo-constants').catch(() => null);
    if (!expoConstants) return false;
    return expoConstants?.default?.expoConfig !== undefined;
  } catch {
    return false;
  }
}

/**
 * Check if expo-secure-store is available
 * Uses dynamic import to avoid Metro bundler errors
 */
export async function isExpoSecureStoreAvailable(): Promise<boolean> {
  try {
    // @ts-ignore - expo-secure-store is an optional peer dependency
    const SecureStore = await import('expo-secure-store').catch(() => null);
    if (!SecureStore) return false;
    // Try a simple operation to verify it works
    if (typeof SecureStore.isAvailableAsync === 'function') {
      await SecureStore.isAvailableAsync();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Check if react-native-keychain is available
 * Uses dynamic import to avoid Metro bundler errors
 */
export async function isRNKeychainAvailable(): Promise<boolean> {
  // Skip keychain check if expo-secure-store is available (we're in Expo)
  // This prevents unnecessary checks in Expo projects
  const expoAvailable = await isExpoSecureStoreAvailable();
  if (expoAvailable) {
    return false;
  }

  try {
    const Keychain = await import('react-native-keychain').catch(() => null);
    if (!Keychain) return false;
    // Check if the module has the expected methods
    return typeof Keychain.setGenericPassword === 'function';
  } catch {
    return false;
  }
}

/**
 * Detect the current environment
 */
export type Environment = 'expo' | 'react-native' | 'unsupported';

export async function detectEnvironment(): Promise<Environment> {
  // Check Expo first
  if (await isExpoSecureStoreAvailable()) {
    return 'expo';
  }

  // Check React Native Keychain
  if (await isRNKeychainAvailable()) {
    return 'react-native';
  }

  return 'unsupported';
}

/**
 * Ensure secure storage is available, throw if not
 */
export async function ensureSecureStorageAvailable(): Promise<Environment> {
  const env = await detectEnvironment();

  if (env === 'unsupported') {
    throw new GiwaSecurityError(
      'Secure storage not found. Please install expo-secure-store or react-native-keychain.'
    );
  }

  return env;
}

export { ErrorCodes };
