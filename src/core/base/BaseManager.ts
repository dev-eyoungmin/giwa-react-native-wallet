import type { GiwaClient } from '../GiwaClient';
import type { TransactionReceipt, TransactionResult } from '../../types';
import type { Hash, PublicClient } from 'viem';

/**
 * Base manager interface
 * Clean Architecture: Dependency Inversion Principle (DIP)
 */
export interface IManager {
  readonly client: GiwaClient;
}

/**
 * Transaction manager interface
 * Implemented by all managers that create transactions
 */
export interface ITransactionManager extends IManager {
  // Marker interface - managers that return transaction results
}

/**
 * Base manager class
 * Clean Code: Template Method Pattern
 */
export abstract class BaseManager implements IManager {
  public readonly client: GiwaClient;

  constructor(client: GiwaClient) {
    this.client = client;
  }

  /**
   * Verify wallet client is connected
   * @throws Error if wallet is not connected
   */
  protected requireWalletClient() {
    const walletClient = this.client.getWalletClient();
    if (!walletClient) {
      throw new Error('Wallet is not connected.');
    }
    return walletClient;
  }

  /**
   * Get public client
   */
  protected getPublicClient() {
    return this.client.getPublicClient();
  }

  /**
   * TransactionResult creation helper
   * Clean Code: DRY principle - abstracts repeated TransactionResult creation logic
   */
  protected createTransactionResult(
    hash: Hash,
    publicClient: PublicClient
  ): TransactionResult {
    return {
      hash,
      wait: async (): Promise<TransactionReceipt> => {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        return {
          hash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          status: receipt.status === 'success' ? 'success' : 'reverted',
          gasUsed: receipt.gasUsed,
        };
      },
    };
  }
}
