import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Chain,
  type Account,
  type Transport,
} from 'viem';
import { getNetwork, GIWA_NETWORKS } from '../constants/networks';
import type { NetworkType, GiwaConfig } from '../types';

/**
 * Custom GIWA Chain definition for viem
 */
function createGiwaChain(network: NetworkType): Chain {
  const networkConfig = getNetwork(network);

  return {
    id: networkConfig.id,
    name: networkConfig.name,
    nativeCurrency: networkConfig.currency,
    rpcUrls: {
      default: { http: [networkConfig.rpcUrl] },
      public: { http: [networkConfig.rpcUrl] },
    },
    blockExplorers: {
      default: {
        name: 'GIWA Explorer',
        url: networkConfig.explorerUrl,
      },
    },
  };
}

/**
 * GIWA Client - viem based blockchain client
 */
export class GiwaClient {
  private publicClient: PublicClient<Transport, Chain>;
  private walletClient: WalletClient<Transport, Chain, Account> | null = null;
  private chain: Chain;
  private network: NetworkType;
  private rpcUrl: string;

  constructor(config: GiwaConfig = {}) {
    this.network = config.network || 'testnet';
    this.chain = createGiwaChain(this.network);
    this.rpcUrl = config.customRpcUrl || GIWA_NETWORKS[this.network].rpcUrl;

    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(this.rpcUrl),
    });
  }

  /**
   * Get the public client for read operations
   */
  getPublicClient(): PublicClient<Transport, Chain> {
    return this.publicClient;
  }

  /**
   * Get the wallet client for write operations
   * Must be set via setAccount first
   */
  getWalletClient(): WalletClient<Transport, Chain, Account> | null {
    return this.walletClient;
  }

  /**
   * Set account for wallet operations
   */
  setAccount(account: Account): void {
    this.walletClient = createWalletClient({
      account,
      chain: this.chain,
      transport: http(this.rpcUrl),
    });
  }

  /**
   * Clear the current account
   */
  clearAccount(): void {
    this.walletClient = null;
  }

  /**
   * Get current chain ID
   */
  getChainId(): number {
    return this.chain.id;
  }

  /**
   * Get current network type
   */
  getNetwork(): NetworkType {
    return this.network;
  }

  /**
   * Get RPC URL
   */
  getRpcUrl(): string {
    return this.rpcUrl;
  }

  /**
   * Get block number
   */
  async getBlockNumber(): Promise<bigint> {
    return this.publicClient.getBlockNumber();
  }

  /**
   * Get gas price
   */
  async getGasPrice(): Promise<bigint> {
    return this.publicClient.getGasPrice();
  }

  /**
   * Check if connected to the network
   */
  async isConnected(): Promise<boolean> {
    try {
      await this.publicClient.getChainId();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get chain configuration
   */
  getChain(): Chain {
    return this.chain;
  }
}
