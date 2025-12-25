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
import {
  getNetworkStatus,
  getFeatureAvailability,
  logNetworkWarnings,
} from '../utils/networkValidator';
import type {
  NetworkType,
  GiwaConfig,
  NetworkStatus,
  FeatureName,
  FeatureAvailability,
} from '../types';

/**
 * Resolved endpoints after applying custom overrides
 */
export interface ResolvedEndpoints {
  rpcUrl: string;
  flashblocksRpcUrl: string;
  flashblocksWsUrl: string;
  explorerUrl: string;
}

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
  private endpoints: ResolvedEndpoints;
  private networkStatus: NetworkStatus;

  constructor(config: GiwaConfig = {}) {
    this.network = config.network || 'testnet';
    this.chain = createGiwaChain(this.network);

    // Resolve endpoints with custom overrides
    const networkConfig = GIWA_NETWORKS[this.network];
    this.endpoints = {
      rpcUrl: config.endpoints?.rpcUrl || config.customRpcUrl || networkConfig.rpcUrl,
      flashblocksRpcUrl: config.endpoints?.flashblocksRpcUrl || networkConfig.flashblocksRpcUrl,
      flashblocksWsUrl: config.endpoints?.flashblocksWsUrl || networkConfig.flashblocksWsUrl,
      explorerUrl: config.endpoints?.explorerUrl || networkConfig.explorerUrl,
    };

    // Network status validation and warning output
    this.networkStatus = getNetworkStatus(this.network);
    if (this.networkStatus.hasWarnings) {
      logNetworkWarnings(this.network);
    }

    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(this.endpoints.rpcUrl),
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
      transport: http(this.endpoints.rpcUrl),
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
    return this.endpoints.rpcUrl;
  }

  /**
   * Get all resolved endpoints
   */
  getEndpoints(): ResolvedEndpoints {
    return { ...this.endpoints };
  }

  /**
   * Get Flashblocks RPC URL
   */
  getFlashblocksRpcUrl(): string {
    return this.endpoints.flashblocksRpcUrl;
  }

  /**
   * Get Flashblocks WebSocket URL
   */
  getFlashblocksWsUrl(): string {
    return this.endpoints.flashblocksWsUrl;
  }

  /**
   * Get Explorer URL
   */
  getExplorerUrl(): string {
    return this.endpoints.explorerUrl;
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

  /**
   * Get network status including feature availability
   */
  getNetworkStatus(): NetworkStatus {
    return this.networkStatus;
  }

  /**
   * Check if a specific feature is available
   */
  isFeatureAvailable(feature: FeatureName): boolean {
    return this.networkStatus.features[feature]?.status === 'available';
  }

  /**
   * Get feature availability info
   */
  getFeatureInfo(feature: FeatureName): FeatureAvailability {
    return (
      this.networkStatus.features[feature] ||
      getFeatureAvailability(this.network, feature)
    );
  }
}
