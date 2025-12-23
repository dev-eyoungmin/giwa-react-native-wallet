/**
 * 네트워크 관련 타입 정의
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
 * SDK에서 제공하는 기능 이름
 */
export type FeatureName =
  | 'bridge'
  | 'giwaId'
  | 'dojang'
  | 'faucet'
  | 'flashblocks'
  | 'tokens';

/**
 * 기능 상태
 */
export type FeatureStatus = 'available' | 'unavailable' | 'partial';

/**
 * 네트워크 준비 상태
 */
export type NetworkReadiness = 'ready' | 'partial' | 'not_ready';

/**
 * 개별 기능 가용성 정보
 */
export interface FeatureAvailability {
  name: FeatureName;
  status: FeatureStatus;
  reason?: string;
  contractAddress?: `0x${string}`;
}

/**
 * 네트워크 경고 코드
 */
export type NetworkWarningCode =
  | 'TBD_CONTRACT'
  | 'MAINNET_NOT_READY'
  | 'FEATURE_UNAVAILABLE';

/**
 * 네트워크 경고 정보
 */
export interface NetworkWarning {
  code: NetworkWarningCode;
  message: string;
  severity: 'info' | 'warning' | 'error';
  feature?: FeatureName;
}

/**
 * 전체 네트워크 상태 정보
 */
export interface NetworkStatus {
  network: NetworkType;
  readiness: NetworkReadiness;
  isTestnet: boolean;
  hasWarnings: boolean;
  warnings: NetworkWarning[];
  features: Record<FeatureName, FeatureAvailability>;
}
