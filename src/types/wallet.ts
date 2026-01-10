/**
 * Wallet type definitions
 */
import type { Address, Hex } from 'viem';

export interface GiwaWallet {
  address: Address;
  publicKey: Hex;
}

export interface WalletCreationResult {
  wallet: GiwaWallet;
  mnemonic: string;
}

export interface SecureStorageOptions {
  requireBiometric?: boolean;
  accessibleWhenUnlocked?: boolean;
}

export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'none';

export interface BiometricCapability {
  isAvailable: boolean;
  biometricType: BiometricType;
  isEnrolled: boolean;
}
