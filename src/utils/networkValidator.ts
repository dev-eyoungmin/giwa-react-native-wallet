/**
 * 네트워크 검증 유틸리티
 *
 * TBD 컨트랙트 주소 감지 및 기능 가용성 확인
 */
import type { Address } from 'viem';
import { CONTRACT_ADDRESSES, DOJANG_SCHEMAS } from '../constants/contracts';
import type {
  NetworkType,
  FeatureName,
  FeatureAvailability,
  NetworkStatus,
  NetworkWarning,
  NetworkReadiness,
} from '../types';

/**
 * TBD 주소 상수
 */
const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000';
const ZERO_BYTES32 =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

/**
 * 주소가 TBD(placeholder)인지 확인
 */
export function isTbdAddress(address: Address): boolean {
  return address === ZERO_ADDRESS;
}

/**
 * 특정 네트워크의 특정 기능 가용성 확인
 */
export function getFeatureAvailability(
  network: NetworkType,
  feature: FeatureName
): FeatureAvailability {
  const contracts = CONTRACT_ADDRESSES[network];

  switch (feature) {
    case 'bridge': {
      const l1Available = !isTbdAddress(contracts.l1StandardBridge);
      const l2Available = !isTbdAddress(contracts.l2StandardBridge);
      return {
        name: 'bridge',
        status:
          l1Available && l2Available
            ? 'available'
            : l2Available
              ? 'partial'
              : 'unavailable',
        reason:
          !l1Available && !l2Available
            ? 'Bridge contracts are TBD'
            : !l1Available
              ? 'L1 Bridge contract is TBD (L2 withdrawal only)'
              : undefined,
        contractAddress: contracts.l2StandardBridge,
      };
    }

    case 'giwaId': {
      const registryAvailable = !isTbdAddress(contracts.ensRegistry);
      const resolverAvailable = !isTbdAddress(contracts.ensResolver);
      const available = registryAvailable && resolverAvailable;
      return {
        name: 'giwaId',
        status: available ? 'available' : 'unavailable',
        reason: available
          ? undefined
          : 'ENS Registry/Resolver contracts are TBD',
        contractAddress: contracts.ensRegistry,
      };
    }

    case 'dojang': {
      const easAvailable = !isTbdAddress(contracts.eas);
      const schemaAvailable = !isTbdAddress(contracts.schemaRegistry);
      const schemasConfigured = DOJANG_SCHEMAS.VERIFIED_ADDRESS !== ZERO_BYTES32;
      const available = easAvailable && schemaAvailable && schemasConfigured;
      return {
        name: 'dojang',
        status: available ? 'available' : 'unavailable',
        reason: available
          ? undefined
          : 'EAS/Schema Registry contracts are TBD',
        contractAddress: contracts.eas,
      };
    }

    case 'faucet':
      return {
        name: 'faucet',
        status: network === 'testnet' ? 'available' : 'unavailable',
        reason:
          network === 'testnet'
            ? undefined
            : 'Faucet is only available on testnet',
      };

    case 'flashblocks':
      return {
        name: 'flashblocks',
        status: 'available',
      };

    case 'tokens': {
      const wethAvailable = !isTbdAddress(contracts.weth);
      return {
        name: 'tokens',
        status: wethAvailable ? 'available' : 'partial',
        reason: wethAvailable ? undefined : 'WETH contract is TBD',
        contractAddress: contracts.weth,
      };
    }

    default:
      return {
        name: feature,
        status: 'unavailable',
        reason: 'Unknown feature',
      };
  }
}

/**
 * 네트워크의 모든 기능 가용성 조회
 */
export function getAllFeatureAvailabilities(
  network: NetworkType
): Record<FeatureName, FeatureAvailability> {
  const features: FeatureName[] = [
    'bridge',
    'giwaId',
    'dojang',
    'faucet',
    'flashblocks',
    'tokens',
  ];

  return features.reduce(
    (acc, feature) => {
      acc[feature] = getFeatureAvailability(network, feature);
      return acc;
    },
    {} as Record<FeatureName, FeatureAvailability>
  );
}

/**
 * 네트워크 경고 목록 생성
 */
export function getNetworkWarnings(network: NetworkType): NetworkWarning[] {
  const warnings: NetworkWarning[] = [];
  const features = getAllFeatureAvailabilities(network);

  // mainnet 준비 상태 경고
  if (network === 'mainnet') {
    const unavailableCount = Object.values(features).filter(
      (f) => f.status === 'unavailable'
    ).length;

    if (unavailableCount > 0) {
      warnings.push({
        code: 'MAINNET_NOT_READY',
        message: `Mainnet is not fully ready. ${unavailableCount} feature(s) unavailable due to TBD contracts.`,
        severity: 'warning',
      });
    }
  }

  // 개별 기능 경고
  Object.values(features).forEach((feature) => {
    if (feature.status === 'unavailable' && feature.reason) {
      warnings.push({
        code: 'TBD_CONTRACT',
        message: `${feature.name}: ${feature.reason}`,
        severity: 'warning',
        feature: feature.name,
      });
    }
  });

  return warnings;
}

/**
 * 전체 네트워크 상태 조회
 */
export function getNetworkStatus(network: NetworkType): NetworkStatus {
  const features = getAllFeatureAvailabilities(network);
  const warnings = getNetworkWarnings(network);

  const availableCount = Object.values(features).filter(
    (f) => f.status === 'available'
  ).length;
  const totalCount = Object.keys(features).length;

  let readiness: NetworkReadiness;
  if (availableCount === totalCount) {
    readiness = 'ready';
  } else if (availableCount > 0) {
    readiness = 'partial';
  } else {
    readiness = 'not_ready';
  }

  return {
    network,
    readiness,
    isTestnet: network === 'testnet',
    hasWarnings: warnings.length > 0,
    warnings,
    features,
  };
}

/**
 * 콘솔에 네트워크 경고 출력
 */
export function logNetworkWarnings(network: NetworkType): void {
  const warnings = getNetworkWarnings(network);

  if (warnings.length === 0) return;

  console.warn(
    `[GIWA SDK] Network "${network}" has ${warnings.length} warning(s):`
  );
  warnings.forEach((warning, index) => {
    const prefix = warning.severity === 'error' ? 'ERROR' : 'WARNING';
    console.warn(`  ${index + 1}. [${prefix}] ${warning.message}`);
  });

  if (network === 'mainnet') {
    console.warn(
      '[GIWA SDK] Consider using "testnet" for development and testing.'
    );
  }
}
