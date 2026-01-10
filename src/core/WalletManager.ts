import {
  generateMnemonic,
  mnemonicToSeedSync,
  validateMnemonic,
} from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import {
  privateKeyToAccount,
  type PrivateKeyAccount,
  HDKey,
} from 'viem/accounts';
import { type Address, type Hex, bytesToHex } from 'viem';
import type { ISecureStorage } from '../adapters/interfaces/ISecureStorage';
import { STORAGE_KEYS } from '../adapters/interfaces/ISecureStorage';
import type { GiwaWallet, WalletCreationResult, SecureStorageOptions } from '../types';
import { GiwaWalletError } from '../utils/errors';
import {
  globalRateLimiter,
  EXPORT_RATE_LIMIT,
} from '../utils/rateLimiter';
import { logSecurityEvent } from '../utils/securityAudit';

// Default HD path for Ethereum
const DEFAULT_HD_PATH = "m/44'/60'/0'/0/0";

// Account timeout for memory cleanup (5 minutes)
const ACCOUNT_TIMEOUT_MS = 5 * 60 * 1000;

// Rate limit keys
const RATE_LIMIT_KEYS = {
  EXPORT_MNEMONIC: 'wallet:export:mnemonic',
  EXPORT_PRIVATE_KEY: 'wallet:export:privateKey',
} as const;

interface StoredWalletData {
  address: Address;
  publicKey: Hex;
  hdPath: string;
}

/**
 * Wallet Manager - handles wallet creation, recovery, and secure storage
 */
export class WalletManager {
  private secureStorage: ISecureStorage;
  private currentAccount: PrivateKeyAccount | null = null;
  private walletData: StoredWalletData | null = null;
  private accountTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(secureStorage: ISecureStorage) {
    this.secureStorage = secureStorage;
  }

  /**
   * Schedule automatic cleanup of account from memory
   * This is a security measure to limit the time sensitive data stays in memory
   */
  private scheduleAccountCleanup(): void {
    // Clear any existing timeout
    if (this.accountTimeoutId) {
      clearTimeout(this.accountTimeoutId);
    }

    // Schedule new cleanup
    this.accountTimeoutId = setTimeout(() => {
      this.clearSensitiveMemory();
    }, ACCOUNT_TIMEOUT_MS);
  }

  /**
   * Clear sensitive data from memory
   * Note: In JavaScript, we cannot guarantee memory is zeroed,
   * but we can remove references to allow garbage collection
   */
  private clearSensitiveMemory(): void {
    this.currentAccount = null;
    this.accountTimeoutId = null;
    logSecurityEvent('WALLET_DISCONNECTED', {
      reason: 'account_timeout',
    });
  }

  /**
   * Reset the account timeout (call after each account usage)
   */
  private resetAccountTimeout(): void {
    if (this.currentAccount) {
      this.scheduleAccountCleanup();
    }
  }

  /**
   * Cleanup when manager is destroyed
   */
  destroy(): void {
    if (this.accountTimeoutId) {
      clearTimeout(this.accountTimeoutId);
      this.accountTimeoutId = null;
    }
    this.clearSensitiveMemory();
  }

  /**
   * Create a new wallet with mnemonic
   * @param options - Storage options (e.g., requireBiometric)
   * @returns Wallet creation result with address and mnemonic
   */
  async createWallet(
    options?: SecureStorageOptions
  ): Promise<WalletCreationResult> {
    // Generate 12-word mnemonic
    const mnemonic = generateMnemonic(wordlist, 128);

    // Derive account from mnemonic
    const account = this.deriveAccountFromMnemonic(mnemonic);

    // Store mnemonic securely
    await this.secureStorage.setItem(STORAGE_KEYS.MNEMONIC, mnemonic, options);

    // Store wallet data
    const walletData: StoredWalletData = {
      address: account.address,
      publicKey: account.publicKey,
      hdPath: DEFAULT_HD_PATH,
    };
    await this.secureStorage.setItem(
      STORAGE_KEYS.WALLET_DATA,
      JSON.stringify(walletData),
      options
    );

    this.currentAccount = account;
    this.walletData = walletData;

    // Schedule memory cleanup and log event
    this.scheduleAccountCleanup();
    logSecurityEvent('WALLET_CREATED', undefined, account.address);

    return {
      wallet: {
        address: account.address,
        publicKey: account.publicKey,
      },
      mnemonic,
    };
  }

  /**
   * Recover wallet from mnemonic
   * @param mnemonic - Recovery phrase
   * @param options - Storage options
   */
  async recoverWallet(
    mnemonic: string,
    options?: SecureStorageOptions
  ): Promise<GiwaWallet> {
    // Validate mnemonic
    if (!validateMnemonic(mnemonic, wordlist)) {
      throw new GiwaWalletError('Invalid recovery phrase.');
    }

    // Derive account
    const account = this.deriveAccountFromMnemonic(mnemonic);

    // Store mnemonic
    await this.secureStorage.setItem(STORAGE_KEYS.MNEMONIC, mnemonic, options);

    // Store wallet data
    const walletData: StoredWalletData = {
      address: account.address,
      publicKey: account.publicKey,
      hdPath: DEFAULT_HD_PATH,
    };
    await this.secureStorage.setItem(
      STORAGE_KEYS.WALLET_DATA,
      JSON.stringify(walletData),
      options
    );

    this.currentAccount = account;
    this.walletData = walletData;

    // Schedule memory cleanup and log event
    this.scheduleAccountCleanup();
    logSecurityEvent('WALLET_RECOVERED', undefined, account.address);

    return {
      address: account.address,
      publicKey: account.publicKey,
    };
  }

  /**
   * Import wallet from private key
   * @param privateKey - Private key in hex format
   * @param options - Storage options
   */
  async importFromPrivateKey(
    privateKey: Hex,
    options?: SecureStorageOptions
  ): Promise<GiwaWallet> {
    try {
      const account = privateKeyToAccount(privateKey);

      // Store private key
      await this.secureStorage.setItem(
        STORAGE_KEYS.PRIVATE_KEY,
        privateKey,
        options
      );

      // Store wallet data
      const walletData: StoredWalletData = {
        address: account.address,
        publicKey: account.publicKey,
        hdPath: '', // No HD path for imported keys
      };
      await this.secureStorage.setItem(
        STORAGE_KEYS.WALLET_DATA,
        JSON.stringify(walletData),
        options
      );

      this.currentAccount = account;
      this.walletData = walletData;

      // Schedule memory cleanup and log event
      this.scheduleAccountCleanup();
      logSecurityEvent('WALLET_IMPORTED', undefined, account.address);

      return {
        address: account.address,
        publicKey: account.publicKey,
      };
    } catch (error) {
      throw new GiwaWalletError(
        'Invalid private key.',
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Load existing wallet from secure storage
   * @param options - Storage options
   */
  async loadWallet(options?: SecureStorageOptions): Promise<GiwaWallet | null> {
    // Check if wallet data exists
    const walletDataStr = await this.secureStorage.getItem(
      STORAGE_KEYS.WALLET_DATA,
      options
    );

    if (!walletDataStr) {
      return null;
    }

    try {
      const walletData: StoredWalletData = JSON.parse(walletDataStr);
      this.walletData = walletData;

      // Try to load from mnemonic first
      const mnemonic = await this.secureStorage.getItem(
        STORAGE_KEYS.MNEMONIC,
        options
      );

      if (mnemonic) {
        this.currentAccount = this.deriveAccountFromMnemonic(mnemonic);
      } else {
        // Try to load from private key
        const privateKey = await this.secureStorage.getItem(
          STORAGE_KEYS.PRIVATE_KEY,
          options
        );

        if (privateKey) {
          this.currentAccount = privateKeyToAccount(privateKey as Hex);
        }
      }

      // Schedule memory cleanup and log event
      if (this.currentAccount) {
        this.scheduleAccountCleanup();
        logSecurityEvent('WALLET_CONNECTED', undefined, walletData.address);
      }

      return {
        address: walletData.address,
        publicKey: walletData.publicKey,
      };
    } catch {
      return null;
    }
  }

  /**
   * Check if wallet exists
   */
  async hasWallet(): Promise<boolean> {
    const walletData = await this.secureStorage.getItem(STORAGE_KEYS.WALLET_DATA);
    return walletData !== null;
  }

  /**
   * Get current wallet
   */
  getCurrentWallet(): GiwaWallet | null {
    if (!this.walletData) {
      return null;
    }

    return {
      address: this.walletData.address,
      publicKey: this.walletData.publicKey,
    };
  }

  /**
   * Get current account (for signing)
   * Resets the account timeout on each access
   */
  getAccount(): PrivateKeyAccount | null {
    // Reset timeout on each access to keep account active during use
    this.resetAccountTimeout();
    return this.currentAccount;
  }

  /**
   * Export mnemonic (requires biometric auth ideally)
   * Rate limited to prevent brute force attacks
   * @param options - Storage options
   */
  async exportMnemonic(options?: SecureStorageOptions): Promise<string | null> {
    // Check rate limit before allowing export
    await globalRateLimiter.checkLimit(
      RATE_LIMIT_KEYS.EXPORT_MNEMONIC,
      EXPORT_RATE_LIMIT
    );

    // Log export attempt
    logSecurityEvent('MNEMONIC_EXPORT_ATTEMPT', {
      biometricRequested: options?.requireBiometric ?? false,
      remainingAttempts: globalRateLimiter.getRemainingAttempts(
        RATE_LIMIT_KEYS.EXPORT_MNEMONIC,
        EXPORT_RATE_LIMIT
      ),
    });

    try {
      const mnemonic = await this.secureStorage.getItem(
        STORAGE_KEYS.MNEMONIC,
        options
      );

      if (mnemonic) {
        logSecurityEvent(
          'MNEMONIC_EXPORT_SUCCESS',
          undefined,
          this.walletData?.address
        );
      }

      return mnemonic;
    } catch (error) {
      logSecurityEvent('MNEMONIC_EXPORT_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Export private key (requires biometric auth ideally)
   * Rate limited to prevent brute force attacks
   * @param options - Storage options
   */
  async exportPrivateKey(options?: SecureStorageOptions): Promise<Hex | null> {
    // Check rate limit before allowing export
    await globalRateLimiter.checkLimit(
      RATE_LIMIT_KEYS.EXPORT_PRIVATE_KEY,
      EXPORT_RATE_LIMIT
    );

    // Log export attempt
    logSecurityEvent('PRIVATE_KEY_EXPORT_ATTEMPT', {
      biometricRequested: options?.requireBiometric ?? false,
      remainingAttempts: globalRateLimiter.getRemainingAttempts(
        RATE_LIMIT_KEYS.EXPORT_PRIVATE_KEY,
        EXPORT_RATE_LIMIT
      ),
    });

    try {
      // If we have a mnemonic, derive the private key
      const mnemonic = await this.secureStorage.getItem(
        STORAGE_KEYS.MNEMONIC,
        options
      );

      if (mnemonic) {
        const seed = mnemonicToSeedSync(mnemonic);
        const hdKey = HDKey.fromMasterSeed(seed);
        const derivedKey = hdKey.derive(DEFAULT_HD_PATH);
        if (derivedKey.privateKey) {
          logSecurityEvent(
            'PRIVATE_KEY_EXPORT_SUCCESS',
            undefined,
            this.walletData?.address
          );
          return bytesToHex(derivedKey.privateKey) as Hex;
        }
      }

      // Otherwise, try to get stored private key
      const privateKey = await this.secureStorage.getItem(
        STORAGE_KEYS.PRIVATE_KEY,
        options
      );

      if (privateKey) {
        logSecurityEvent(
          'PRIVATE_KEY_EXPORT_SUCCESS',
          undefined,
          this.walletData?.address
        );
      }

      return privateKey as Hex | null;
    } catch (error) {
      logSecurityEvent('PRIVATE_KEY_EXPORT_FAILED', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  /**
   * Delete wallet and all associated data
   */
  async deleteWallet(): Promise<void> {
    const address = this.walletData?.address;

    await this.secureStorage.removeItem(STORAGE_KEYS.MNEMONIC);
    await this.secureStorage.removeItem(STORAGE_KEYS.PRIVATE_KEY);
    await this.secureStorage.removeItem(STORAGE_KEYS.WALLET_DATA);

    // Clear account timeout
    if (this.accountTimeoutId) {
      clearTimeout(this.accountTimeoutId);
      this.accountTimeoutId = null;
    }

    this.currentAccount = null;
    this.walletData = null;

    // Log wallet deletion
    logSecurityEvent('WALLET_DELETED', undefined, address);
  }

  /**
   * Derive account from mnemonic
   */
  private deriveAccountFromMnemonic(mnemonic: string): PrivateKeyAccount {
    const seed = mnemonicToSeedSync(mnemonic);
    const hdKey = HDKey.fromMasterSeed(seed);
    const derivedKey = hdKey.derive(DEFAULT_HD_PATH);

    if (!derivedKey.privateKey) {
      throw new GiwaWalletError('Cannot derive private key.');
    }

    const privateKey = bytesToHex(derivedKey.privateKey) as Hex;
    return privateKeyToAccount(privateKey);
  }
}
