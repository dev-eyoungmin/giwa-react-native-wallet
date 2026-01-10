/**
 * Network validation utilities
 *
 * TBD contract address detection and feature availability checking
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
 * TBD address constants
 */
const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000';
const ZERO_BYTES32 =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Check if address is TBD (placeholder)
 */
export function isTbdAddress(address: Address): boolean {
  return address === ZERO_ADDRESS;
}

/**
 * Check feature availability for a specific network
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
 * Get all feature availabilities for a network
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
 * Generate network warning list
 */
export function getNetworkWarnings(network: NetworkType): NetworkWarning[] {
  const warnings: NetworkWarning[] = [];
  const features = getAllFeatureAvailabilities(network);

  // Mainnet readiness warning
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

  // Individual feature warnings
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
 * Get overall network status
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
 * Log network warnings to console
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
