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
import { GIWA_NETWORKS } from '../constants/networks';
import {
  getContractAddresses as getDefaultContractAddresses,
  ZERO_ADDRESS,
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
  GiwaNetwork,
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
 * Filter out `undefined` values from a partial object, keeping only
 * explicitly provided (defined) entries. Used to merge override configs
 * without letting `undefined` properties clobber the base values.
 */
function definedEntries<T extends object>(source?: Partial<T>): Partial<T> {
  if (!source) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(source).filter(([, value]) => value !== undefined)
  ) as Partial<T>;
}

/**
 * Custom GIWA Chain definition for viem, built from the resolved network
 * and endpoint configuration (after `customNetwork`/`endpoints` overrides).
 */
function createGiwaChain(
  network: GiwaNetwork,
  endpoints: ResolvedEndpoints,
  multicall3: `0x${string}`
): Chain {
  return {
    id: network.id,
    name: network.name,
    nativeCurrency: network.currency,
    rpcUrls: {
      default: { http: [endpoints.rpcUrl] },
      public: { http: [endpoints.rpcUrl] },
    },
    blockExplorers: {
      default: {
        name: 'GIWA Explorer',
        url: endpoints.explorerUrl,
      },
    },
    ...(multicall3 !== ZERO_ADDRESS && {
      contracts: { multicall3: { address: multicall3 } },
    }),
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
  private resolvedNetwork: GiwaNetwork;
  private endpoints: ResolvedEndpoints;
  private networkStatus: NetworkStatus;
  private customContracts?: CustomContracts;

  constructor(config: GiwaConfig = {}) {
    this.network = config.network || 'testnet';
    this.customContracts = config.customContracts;

    // Resolve the network definition: built-in defaults overridden by
    // any explicitly provided `customNetwork` fields.
    this.resolvedNetwork = {
      ...GIWA_NETWORKS[this.network],
      ...definedEntries<GiwaNetwork>(config.customNetwork),
    };

    // Resolve endpoints with custom overrides
    this.endpoints = {
      rpcUrl:
        config.endpoints?.rpcUrl || config.customRpcUrl || this.resolvedNetwork.rpcUrl,
      flashblocksRpcUrl:
        config.endpoints?.flashblocksRpcUrl || this.resolvedNetwork.flashblocksRpcUrl,
      flashblocksWsUrl:
        config.endpoints?.flashblocksWsUrl || this.resolvedNetwork.flashblocksWsUrl,
      explorerUrl: config.endpoints?.explorerUrl || this.resolvedNetwork.explorerUrl,
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

    // Build the viem chain from the resolved network + endpoints. Must run
    // after `this.customContracts` is set so `getContractAddresses()`
    // (used for the multicall3 override) reflects any custom overrides.
    this.chain = createGiwaChain(
      this.resolvedNetwork,
      this.endpoints,
      this.getContractAddresses().multicall3
    );

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
   * Get the resolved network definition (built-in defaults merged with any
   * `customNetwork` overrides supplied via config).
   */
  getNetworkConfig(): GiwaNetwork {
    return { ...this.resolvedNetwork };
  }

  /**
   * Verify that the RPC endpoint's reported chain id matches the chain id
   * configured for this client. RPC errors are propagated to the caller.
   */
  async verifyChainId(): Promise<{ expected: number; actual: number; matches: boolean }> {
    const actual = await this.publicClient.getChainId();
    const expected = this.chain.id;
    return { expected, actual, matches: expected === actual };
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

    // Merge custom contracts with defaults: only defined custom entries
    // override the corresponding default (custom takes precedence).
    const definedOverrides = Object.fromEntries(
      Object.entries(this.customContracts).filter(([, value]) => value !== undefined)
    );

    return {
      ...defaults,
      ...definedOverrides,
    } as ContractAddresses;
  }
}
