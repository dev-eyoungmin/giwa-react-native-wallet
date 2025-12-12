import {
  generateMnemonic,
  mnemonicToSeedSync,
  validateMnemonic,
} from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import {
  privateKeyToAccount,
  type PrivateKeyAccount,
  type Address,
  type Hex,
} from 'viem/accounts';
import { HDKey } from 'viem/accounts';
import type { ISecureStorage } from '../adapters/interfaces/ISecureStorage';
import { STORAGE_KEYS } from '../adapters/interfaces/ISecureStorage';
import type { GiwaWallet, WalletCreationResult, SecureStorageOptions } from '../types';
import { GiwaWalletError, ErrorCodes } from '../utils/errors';

// Default HD path for Ethereum
const DEFAULT_HD_PATH = "m/44'/60'/0'/0/0";

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

  constructor(secureStorage: ISecureStorage) {
    this.secureStorage = secureStorage;
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
      throw new GiwaWalletError('유효하지 않은 복구 구문입니다.');
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

      return {
        address: account.address,
        publicKey: account.publicKey,
      };
    } catch (error) {
      throw new GiwaWalletError(
        '유효하지 않은 개인키입니다.',
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
   */
  getAccount(): PrivateKeyAccount | null {
    return this.currentAccount;
  }

  /**
   * Export mnemonic (requires biometric auth ideally)
   * @param options - Storage options
   */
  async exportMnemonic(options?: SecureStorageOptions): Promise<string | null> {
    return this.secureStorage.getItem(STORAGE_KEYS.MNEMONIC, options);
  }

  /**
   * Export private key (requires biometric auth ideally)
   * @param options - Storage options
   */
  async exportPrivateKey(options?: SecureStorageOptions): Promise<Hex | null> {
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
        return `0x${Buffer.from(derivedKey.privateKey).toString('hex')}` as Hex;
      }
    }

    // Otherwise, try to get stored private key
    const privateKey = await this.secureStorage.getItem(
      STORAGE_KEYS.PRIVATE_KEY,
      options
    );

    return privateKey as Hex | null;
  }

  /**
   * Delete wallet and all associated data
   */
  async deleteWallet(): Promise<void> {
    await this.secureStorage.removeItem(STORAGE_KEYS.MNEMONIC);
    await this.secureStorage.removeItem(STORAGE_KEYS.PRIVATE_KEY);
    await this.secureStorage.removeItem(STORAGE_KEYS.WALLET_DATA);

    this.currentAccount = null;
    this.walletData = null;
  }

  /**
   * Derive account from mnemonic
   */
  private deriveAccountFromMnemonic(mnemonic: string): PrivateKeyAccount {
    const seed = mnemonicToSeedSync(mnemonic);
    const hdKey = HDKey.fromMasterSeed(seed);
    const derivedKey = hdKey.derive(DEFAULT_HD_PATH);

    if (!derivedKey.privateKey) {
      throw new GiwaWalletError('개인키를 유도할 수 없습니다.');
    }

    const privateKey = `0x${Buffer.from(derivedKey.privateKey).toString('hex')}` as Hex;
    return privateKeyToAccount(privateKey);
  }
}
