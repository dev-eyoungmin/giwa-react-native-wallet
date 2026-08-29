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
import { mainnet, sepolia } from 'viem/chains';
import {
  chainConfig,
  publicActionsL1,
  publicActionsL2,
  walletActionsL1,
  walletActionsL2,
  type PublicActionsL1,
  type PublicActionsL2,
  type WalletActionsL1,
  type WalletActionsL2,
} from 'viem/op-stack';
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
  /** L1 (Ethereum) RPC URL. No network default; stays `undefined` when unset. */
  l1RpcUrl?: string;
}

/**
 * L2 (GIWA) public client, extended with viem's op-stack L2 public actions.
 */
export type GiwaL2PublicClient = PublicClient<Transport, Chain> &
  PublicActionsL2<Chain, undefined>;

/**
 * L2 (GIWA) wallet client, extended with viem's op-stack L2 wallet actions.
 */
export type GiwaL2WalletClient = WalletClient<Transport, Chain, Account> &
  WalletActionsL2<Chain, Account>;

/**
 * L1 (Ethereum) public client, extended with viem's op-stack L1 public actions.
 * Used to read L2 output/dispute-game state and withdrawal status from L1.
 */
export type GiwaL1PublicClient = PublicClient<Transport, Chain> &
  PublicActionsL1<Chain, undefined>;

/**
 * L1 (Ethereum) wallet client, extended with viem's op-stack L1 wallet actions.
 * Used to deposit, prove and finalize withdrawals from L1.
 */
export type GiwaL1WalletClient = WalletClient<Transport, Chain, Account> &
  WalletActionsL1<Chain, Account>;

/**
 * Resolve the L1 (Ethereum) chain definition for a given L1 chain id.
 * Returns `null` for L1 chain ids the SDK doesn't ship a definition for.
 */
function resolveL1Chain(l1ChainId: number): Chain | null {
  if (l1ChainId === sepolia.id) return sepolia;
  if (l1ChainId === mainnet.id) return mainnet;
  return null;
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
 *
 * Spreads viem's op-stack `chainConfig` (formatters, serializers and L2
 * predeploy contracts) and adds the L1 contract map — keyed by the L1 chain
 * id — so viem's op-stack actions (`publicActionsL1`/`walletActionsL1`,
 * `publicActionsL2`/`walletActionsL2`) can resolve L1 addresses from this
 * chain object.
 */
function createGiwaChain(
  network: GiwaNetwork,
  endpoints: ResolvedEndpoints,
  contracts: Pick<
    ContractAddresses,
    'optimismPortal' | 'disputeGameFactory' | 'l1StandardBridge' | 'multicall3'
  >
): Chain {
  const { optimismPortal, disputeGameFactory, l1StandardBridge, multicall3 } = contracts;
  const l1ChainId = network.l1ChainId;

  // L1 (OP Stack) contract addresses, keyed by the L1 chain id. This is the
  // shape viem's op-stack actions expect on `targetChain.contracts.<name>`.
  const opContracts: NonNullable<Chain['contracts']> = {
    ...(optimismPortal !== ZERO_ADDRESS && {
      portal: { [l1ChainId]: { address: optimismPortal } },
    }),
    ...(disputeGameFactory !== ZERO_ADDRESS && {
      disputeGameFactory: { [l1ChainId]: { address: disputeGameFactory } },
    }),
    ...(l1StandardBridge !== ZERO_ADDRESS && {
      l1StandardBridge: { [l1ChainId]: { address: l1StandardBridge } },
    }),
  };

  return {
    ...chainConfig, // formatters + serializers + L2 predeploy contracts
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
    sourceId: l1ChainId,
    contracts: {
      ...chainConfig.contracts,
      ...(multicall3 !== ZERO_ADDRESS && { multicall3: { address: multicall3 } }),
      ...opContracts,
    },
  };
}

/**
 * GIWA Client - viem based blockchain client
 */
export class GiwaClient {
  private publicClient: GiwaL2PublicClient;
  private walletClient: GiwaL2WalletClient | null = null;
  private chain: Chain;
  private network: NetworkType;
  private resolvedNetwork: GiwaNetwork;
  private endpoints: ResolvedEndpoints;
  private networkStatus: NetworkStatus;
  private customContracts?: CustomContracts;
  private l1Chain: Chain | null;
  private l1PublicClient: GiwaL1PublicClient | null = null;
  private l1WalletClient: GiwaL1WalletClient | null = null;

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
      // L1 (Ethereum) RPC URL. No network default: stays `undefined` when unset.
      l1RpcUrl: config.endpoints?.l1RpcUrl,
    };

    // Validate custom endpoints for security. A custom URL can originate
    // from `config.endpoints`, the deprecated `config.customRpcUrl`, or
    // `config.customNetwork` (which feeds into `resolvedNetwork` above) —
    // any of these paths must go through the same validation.
    if (config.endpoints?.rpcUrl || config.customRpcUrl || config.customNetwork?.rpcUrl) {
      validateEndpointUrl(this.endpoints.rpcUrl, 'http');
    }
    if (config.endpoints?.flashblocksRpcUrl || config.customNetwork?.flashblocksRpcUrl) {
      validateEndpointUrl(this.endpoints.flashblocksRpcUrl, 'http');
    }
    if (config.endpoints?.flashblocksWsUrl || config.customNetwork?.flashblocksWsUrl) {
      validateEndpointUrl(this.endpoints.flashblocksWsUrl, 'ws');
    }
    if (config.endpoints?.explorerUrl || config.customNetwork?.explorerUrl) {
      validateEndpointUrl(this.endpoints.explorerUrl, 'http');
    }
    if (this.endpoints.l1RpcUrl) {
      validateEndpointUrl(this.endpoints.l1RpcUrl, 'http');
    }

    // Network status validation and warning output
    this.networkStatus = getNetworkStatus(this.network);
    if (this.networkStatus.hasWarnings) {
      logNetworkWarnings(this.network);
    }

    // Build the viem chain from the resolved network + endpoints. Must run
    // after `this.customContracts` is set so `getContractAddresses()`
    // (used for the multicall3/portal/disputeGameFactory/l1StandardBridge
    // overrides) reflects any custom overrides.
    this.chain = createGiwaChain(
      this.resolvedNetwork,
      this.endpoints,
      this.getContractAddresses()
    );

    this.publicClient = createPublicClient({
      chain: this.chain,
      transport: http(this.endpoints.rpcUrl),
    }).extend(publicActionsL2());

    // Resolve the L1 (Ethereum) chain and build the L1 public client when an
    // `l1RpcUrl` was configured. There is no network default for `l1RpcUrl`,
    // so this stays unset unless the caller opts in.
    const l1Chain = resolveL1Chain(this.resolvedNetwork.l1ChainId);
    this.l1Chain = l1Chain;
    if (this.endpoints.l1RpcUrl && l1Chain) {
      this.l1PublicClient = createPublicClient({
        chain: l1Chain,
        transport: http(this.endpoints.l1RpcUrl),
      }).extend(publicActionsL1());
    }
  }

  /**
   * Get the public client for read operations
   */
  getPublicClient(): GiwaL2PublicClient {
    return this.publicClient;
  }

  /**
   * Get the wallet client for write operations
   * Must be set via setAccount first
   */
  getWalletClient(): GiwaL2WalletClient | null {
    return this.walletClient;
  }

  /**
   * Set account for wallet operations. Also builds the L1 wallet client
   * when L1 support (`l1RpcUrl`) is configured.
   */
  setAccount(account: Account): void {
    this.walletClient = createWalletClient({
      account,
      chain: this.chain,
      transport: http(this.endpoints.rpcUrl),
    }).extend(walletActionsL2());

    if (this.endpoints.l1RpcUrl && this.l1Chain) {
      this.l1WalletClient = createWalletClient({
        account,
        chain: this.l1Chain,
        transport: http(this.endpoints.l1RpcUrl),
      }).extend(walletActionsL1());
    }
  }

  /**
   * Clear the current account
   */
  clearAccount(): void {
    this.walletClient = null;
    this.l1WalletClient = null;
  }

  /**
   * Whether this client has L1 (Ethereum) support configured — i.e.
   * `getL1PublicClient()` (and, once an account is set, `getL1WalletClient()`)
   * will return a non-null client. Derived from the actual L1 public client
   * rather than re-checking the raw config, so this can never disagree with
   * what the L1 accessors return (e.g. a falsy `endpoints.l1RpcUrl` like `''`
   * won't report support that doesn't exist).
   */
  hasL1Support(): boolean {
    return this.l1PublicClient !== null;
  }

  /**
   * Get the L1 (Ethereum) chain definition, or `null` if the L1 chain id is
   * unknown to the SDK.
   */
  getL1Chain(): Chain | null {
    return this.l1Chain;
  }

  /**
   * Get the L1 public client for read operations, or `null` if `l1RpcUrl`
   * was not configured.
   */
  getL1PublicClient(): GiwaL1PublicClient | null {
    return this.l1PublicClient;
  }

  /**
   * Get the L1 wallet client for write operations, or `null` if no account
   * has been set via `setAccount` or `l1RpcUrl` was not configured.
   */
  getL1WalletClient(): GiwaL1WalletClient | null {
    return this.l1WalletClient;
  }

  /**
   * Get the configured L1 RPC URL, or `undefined` if not set.
   */
  getL1RpcUrl(): string | undefined {
    return this.endpoints.l1RpcUrl;
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
