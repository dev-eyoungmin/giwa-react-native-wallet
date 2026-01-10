/* eslint-disable no-console */
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
  getContractAddresses as getDefaultContractAddresses,
  type ContractAddresses,
} from '../constants/contracts';
import {
  getNetworkStatus,
  getFeatureAvailability,
  logNetworkWarnings,
} from '../utils/networkValidator';
import { GiwaSecurityError } from '../utils/errors';
import type {
  NetworkType,
  GiwaConfig,
  CustomContracts,
  NetworkStatus,
  FeatureName,
  FeatureAvailability,
} from '../types';

/**
 * Validate an RPC URL for security
 * @param url - The URL to validate
 * @param type - The type of endpoint ('http' or 'ws')
 * @throws GiwaSecurityError if validation fails
 */
function validateEndpointUrl(url: string, type: 'http' | 'ws' = 'http'): void {
  if (!url || typeof url !== 'string') {
    throw new GiwaSecurityError(
      'Invalid URL: URL is required',
      'INVALID_RPC_URL',
      { url }
    );
  }

  const trimmedUrl = url.trim();

  // Check protocol using string matching
  const allowedProtocols = type === 'ws' ? ['wss://'] : ['https://'];
  const hasValidProtocol = allowedProtocols.some((p) =>
    trimmedUrl.toLowerCase().startsWith(p)
  );

  if (!hasValidProtocol) {
    const expectedProtocol = type === 'ws' ? 'wss://' : 'https://';
    throw new GiwaSecurityError(
      `Invalid protocol for ${type.toUpperCase()} endpoint. Expected ${expectedProtocol}`,
      'INVALID_RPC_URL',
      { url: trimmedUrl }
    );
  }

  // Extract hostname for internal URL check
  try {
    // Use a simple regex to extract hostname
    const hostMatch = trimmedUrl.match(/:\/\/([^/:]+)/);
    if (hostMatch) {
      const hostname = hostMatch[1].toLowerCase();
      const internalPatterns = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
      const isInternal = internalPatterns.some(
        (pattern) => hostname === pattern || hostname.endsWith('.local')
      );

      // Warn about internal URLs in production
      if (isInternal) {
        console.warn(
          `[GIWA Security] Using internal endpoint "${trimmedUrl}" may be a security risk in production.`
        );
      }
    }
  } catch {
    // Ignore hostname extraction errors
  }
}

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
  private customContracts?: CustomContracts;

  constructor(config: GiwaConfig = {}) {
    this.network = config.network || 'testnet';
    this.chain = createGiwaChain(this.network);
    this.customContracts = config.customContracts;

    // Resolve endpoints with custom overrides
    const networkConfig = GIWA_NETWORKS[this.network];
    this.endpoints = {
      rpcUrl: config.endpoints?.rpcUrl || config.customRpcUrl || networkConfig.rpcUrl,
      flashblocksRpcUrl: config.endpoints?.flashblocksRpcUrl || networkConfig.flashblocksRpcUrl,
      flashblocksWsUrl: config.endpoints?.flashblocksWsUrl || networkConfig.flashblocksWsUrl,
      explorerUrl: config.endpoints?.explorerUrl || networkConfig.explorerUrl,
    };

    // Validate custom endpoints for security
    if (config.endpoints?.rpcUrl || config.customRpcUrl) {
      validateEndpointUrl(this.endpoints.rpcUrl, 'http');
    }
    if (config.endpoints?.flashblocksRpcUrl) {
      validateEndpointUrl(this.endpoints.flashblocksRpcUrl, 'http');
    }
    if (config.endpoints?.flashblocksWsUrl) {
      validateEndpointUrl(this.endpoints.flashblocksWsUrl, 'ws');
    }
    if (config.endpoints?.explorerUrl) {
      validateEndpointUrl(this.endpoints.explorerUrl, 'http');
    }

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

  /**
   * Get contract addresses with custom overrides applied
   * Custom contract addresses take precedence over network defaults
   */
  getContractAddresses(): ContractAddresses {
    const defaults = getDefaultContractAddresses(this.network);

    if (!this.customContracts) {
      return defaults;
    }

    // Merge custom contracts with defaults (custom takes precedence)
    return {
      ...defaults,
      ...(this.customContracts.eas && { eas: this.customContracts.eas }),
      ...(this.customContracts.schemaRegistry && {
        schemaRegistry: this.customContracts.schemaRegistry,
      }),
      ...(this.customContracts.ensRegistry && {
        ensRegistry: this.customContracts.ensRegistry,
      }),
      ...(this.customContracts.ensResolver && {
        ensResolver: this.customContracts.ensResolver,
      }),
      ...(this.customContracts.l2StandardBridge && {
        l2StandardBridge: this.customContracts.l2StandardBridge,
      }),
      ...(this.customContracts.l1StandardBridge && {
        l1StandardBridge: this.customContracts.l1StandardBridge,
      }),
      ...(this.customContracts.weth && { weth: this.customContracts.weth }),
    };
  }
}
