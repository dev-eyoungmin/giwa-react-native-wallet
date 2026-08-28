/**
 * SDK configuration type definitions
 */
import type { NetworkType } from './network';
import type { ContractAddresses } from '../constants/contracts';

/**
 * Custom endpoint configuration
 */
export interface CustomEndpoints {
  /** Custom RPC URL (overrides default network RPC) */
  rpcUrl?: string;
  /** Custom Flashblocks RPC URL */
  flashblocksRpcUrl?: string;
  /** Custom Flashblocks WebSocket URL */
  flashblocksWsUrl?: string;
  /** Custom Block Explorer URL */
  explorerUrl?: string;
}

/**
 * Custom contract addresses configuration
 * Used to override default OP Stack / GIWA contract addresses.
 * Any subset of `ContractAddresses` fields may be overridden.
 */
export type CustomContracts = Partial<ContractAddresses>;

export interface GiwaConfig {
  /** Network type: 'testnet' | 'mainnet' (default: 'testnet') */
  network?: NetworkType;
  /** @deprecated Use `endpoints.rpcUrl` instead */
  customRpcUrl?: string;
  /** Custom endpoint configuration */
  endpoints?: CustomEndpoints;
  /** Custom contract addresses (overrides network defaults) */
  customContracts?: CustomContracts;
  /** Auto-connect wallet on initialization (default: false) */
  autoConnect?: boolean;
  /** Enable Flashblocks for faster block confirmations (default: false) */
  enableFlashblocks?: boolean;
}
