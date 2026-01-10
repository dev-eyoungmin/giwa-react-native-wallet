/**
 * SDK configuration type definitions
 */
import type { Address } from 'viem';
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

/**
 * Custom contract addresses configuration
 * Used to override default OP Stack standard addresses
 */
export interface CustomContracts {
  /** Custom EAS contract address */
  eas?: Address;
  /** Custom Schema Registry contract address */
  schemaRegistry?: Address;
  /** Custom ENS Registry contract address */
  ensRegistry?: Address;
  /** Custom ENS Resolver contract address */
  ensResolver?: Address;
  /** Custom L2 Standard Bridge contract address */
  l2StandardBridge?: Address;
  /** Custom L1 Standard Bridge contract address */
  l1StandardBridge?: Address;
  /** Custom WETH contract address */
  weth?: Address;
}

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
