import type { Hash } from 'viem';
import type { GiwaClient } from './GiwaClient';
import type { FlashblocksPreconfirmation, TransactionRequest, TransactionResult } from '../types';
import { GiwaTransactionError } from '../utils/errors';

/**
 * Flashblocks Manager - handles ~200ms preconfirmation transactions
 *
 * GIWA Chain supports Flashblocks which provides near-instant preconfirmations
 * (~200ms) before final block confirmation (~1s).
 */
export class FlashblocksManager {
  private client: GiwaClient;
  private preconfirmations: Map<Hash, FlashblocksPreconfirmation> = new Map();
  private enabled: boolean;

  constructor(client: GiwaClient, enabled: boolean = true) {
    this.client = client;
    this.enabled = enabled;
  }

  /**
   * Check if Flashblocks is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Enable/disable Flashblocks
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Send transaction with Flashblocks preconfirmation
   * Returns immediately with preconfirmation, then waits for final confirmation
   */
  async sendTransaction(
    request: TransactionRequest
  ): Promise<{
    preconfirmation: FlashblocksPreconfirmation;
    result: TransactionResult;
  }> {
    const walletClient = this.client.getWalletClient();
    if (!walletClient) {
      throw new GiwaTransactionError('Wallet is not connected.');
    }

    const publicClient = this.client.getPublicClient();

    // Send transaction
    const hash = await walletClient.sendTransaction({
      to: request.to,
      value: request.value,
      data: request.data,
      gas: request.gasLimit,
      maxFeePerGas: request.maxFeePerGas,
      maxPriorityFeePerGas: request.maxPriorityFeePerGas,
    });

    // Record preconfirmation time
    const preconfirmedAt = Date.now();

    const preconfirmation: FlashblocksPreconfirmation = {
      txHash: hash,
      preconfirmedAt,
    };

    this.preconfirmations.set(hash, preconfirmation);

    return {
      preconfirmation,
      result: {
        hash,
        wait: async () => {
          const receipt = await publicClient.waitForTransactionReceipt({ hash });

          // Update preconfirmation with final confirmation time
          const stored = this.preconfirmations.get(hash);
          if (stored) {
            stored.confirmedAt = Date.now();
          }

          return {
            hash: receipt.transactionHash,
            blockNumber: receipt.blockNumber,
            status: receipt.status === 'success' ? 'success' : 'reverted',
            gasUsed: receipt.gasUsed,
          };
        },
      },
    };
  }

  /**
   * Get preconfirmation by transaction hash
   */
  getPreconfirmation(hash: Hash): FlashblocksPreconfirmation | undefined {
    return this.preconfirmations.get(hash);
  }

  /**
   * Get all preconfirmations
   */
  getAllPreconfirmations(): FlashblocksPreconfirmation[] {
    return Array.from(this.preconfirmations.values());
  }

  /**
   * Calculate confirmation latency
   * @param hash - Transaction hash
   * @returns Latency in milliseconds, or null if not yet confirmed
   */
  getConfirmationLatency(hash: Hash): number | null {
    const preconf = this.preconfirmations.get(hash);
    if (!preconf || !preconf.confirmedAt) {
      return null;
    }
    return preconf.confirmedAt - preconf.preconfirmedAt;
  }

  /**
   * Get average confirmation latency
   * @returns Average latency in milliseconds
   */
  getAverageLatency(): number | null {
    const confirmed = Array.from(this.preconfirmations.values()).filter(
      (p) => p.confirmedAt !== undefined
    );

    if (confirmed.length === 0) {
      return null;
    }

    const total = confirmed.reduce(
      (sum, p) => sum + (p.confirmedAt! - p.preconfirmedAt),
      0
    );

    return total / confirmed.length;
  }

  /**
   * Clear preconfirmation history
   */
  clearHistory(): void {
    this.preconfirmations.clear();
  }
}
