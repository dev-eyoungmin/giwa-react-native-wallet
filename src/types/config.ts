/**
 * SDK configuration type definitions
 */
import type { NetworkType } from './network';

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

export interface GiwaConfig {
  /** Network type: 'testnet' | 'mainnet' (default: 'testnet') */
  network?: NetworkType;
  /** @deprecated Use `endpoints.rpcUrl` instead */
  customRpcUrl?: string;
  /** Custom endpoint configuration */
  endpoints?: CustomEndpoints;
  /** Auto-connect wallet on initialization (default: false) */
  autoConnect?: boolean;
  /** Enable Flashblocks for faster block confirmations (default: false) */
  enableFlashblocks?: boolean;
}
