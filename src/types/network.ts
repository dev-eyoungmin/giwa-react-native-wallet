/**
 * Network type definitions
 */

export type NetworkType = 'mainnet' | 'testnet';

export interface GiwaNetwork {
  id: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/**
 * Feature names provided by SDK
 */
export type FeatureName =
  | 'bridge'
  | 'giwaId'
  | 'dojang'
  | 'faucet'
  | 'flashblocks'
  | 'tokens';

/**
 * Feature status
 */
export type FeatureStatus = 'available' | 'unavailable' | 'partial';

/**
 * Network readiness state
 */
export type NetworkReadiness = 'ready' | 'partial' | 'not_ready';

/**
 * Individual feature availability info
 */
export interface FeatureAvailability {
  name: FeatureName;
  status: FeatureStatus;
  reason?: string;
  contractAddress?: `0x${string}`;
}

/**
 * Network warning code
 */
export type NetworkWarningCode =
  | 'TBD_CONTRACT'
  | 'MAINNET_NOT_READY'
  | 'FEATURE_UNAVAILABLE';

/**
 * Network warning info
 */
export interface NetworkWarning {
  code: NetworkWarningCode;
  message: string;
  severity: 'info' | 'warning' | 'error';
  feature?: FeatureName;
}

/**
 * Full network status info
 */
export interface NetworkStatus {
  network: NetworkType;
  readiness: NetworkReadiness;
  isTestnet: boolean;
  hasWarnings: boolean;
  warnings: NetworkWarning[];
  features: Record<FeatureName, FeatureAvailability>;
}
