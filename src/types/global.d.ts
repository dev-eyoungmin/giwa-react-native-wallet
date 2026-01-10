/**
 * React Native global type declarations
 */

/**
 * __DEV__ is a React Native global that indicates whether the app is running in development mode
 */
declare const __DEV__: boolean;

/**
 * Expo module declarations (peer dependencies)
 * These are optional dependencies, so we provide type declarations here
 */
declare module 'expo-local-authentication' {
  export enum AuthenticationType {
    FINGERPRINT = 1,
    FACIAL_RECOGNITION = 2,
    IRIS = 3,
  }

  export interface LocalAuthenticationResult {
    success: boolean;
    error?: string;
    warning?: string;
  }

  export interface AuthenticateOptions {
    promptMessage?: string;
    fallbackLabel?: string;
    disableDeviceFallback?: boolean;
    cancelLabel?: string;
  }

  export function hasHardwareAsync(): Promise<boolean>;
  export function isEnrolledAsync(): Promise<boolean>;
  export function supportedAuthenticationTypesAsync(): Promise<AuthenticationType[]>;
  export function authenticateAsync(options?: AuthenticateOptions): Promise<LocalAuthenticationResult>;
}

declare module 'expo-secure-store' {
  export interface SecureStoreOptions {
    keychainAccessible?: number;
    requireAuthentication?: boolean;
    authenticationPrompt?: string;
  }

  export const WHEN_UNLOCKED: number;
  export const WHEN_UNLOCKED_THIS_DEVICE_ONLY: number;
  export const AFTER_FIRST_UNLOCK: number;
  export const AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: number;
  export const ALWAYS: number;
  export const ALWAYS_THIS_DEVICE_ONLY: number;

  export function getItemAsync(key: string, options?: SecureStoreOptions): Promise<string | null>;
  export function setItemAsync(key: string, value: string, options?: SecureStoreOptions): Promise<void>;
  export function deleteItemAsync(key: string, options?: SecureStoreOptions): Promise<void>;
  export function isAvailableAsync(): Promise<boolean>;
}
