import { useMemo } from 'react';
import { useGiwaManagers, useGiwaState } from '../providers/GiwaProvider';
import { GIWA_NETWORKS } from '../constants/networks';
import type {
  NetworkType,
  GiwaNetwork,
  NetworkStatus,
  FeatureName,
  FeatureAvailability,
} from '../types';

export interface UseNetworkInfoReturn {
  /** Current network type ('testnet' | 'mainnet') */
  network: NetworkType;
  /** Full network configuration */
  networkConfig: GiwaNetwork | null;
  /** Overall network status including readiness and warnings */
  status: NetworkStatus | null;
  /** Whether this is testnet */
  isTestnet: boolean;
  /** Whether the network is fully ready (all features available) */
  isReady: boolean;
  /** Whether there are any warnings */
  hasWarnings: boolean;
  /** List of warning messages */
  warnings: string[];
  /** Check if a specific feature is available */
  isFeatureAvailable: (feature: FeatureName) => boolean;
  /** Get detailed feature info */
  getFeatureInfo: (feature: FeatureName) => FeatureAvailability | null;
  /** Get all unavailable features */
  unavailableFeatures: FeatureName[];
  /** Chain ID */
  chainId: number;
  /** RPC URL */
  rpcUrl: string;
  /** Flashblocks RPC URL for faster confirmations */
  flashblocksRpcUrl: string;
  /** Flashblocks WebSocket URL for real-time subscriptions */
  flashblocksWsUrl: string;
  /** Explorer URL */
  explorerUrl: string;
  /** Whether SDK is still initializing */
  isInitializing: boolean;
}

/**
 * Hook to access network information and feature availability
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {
 *     network,
 *     isTestnet,
 *     isReady,
 *     hasWarnings,
 *     warnings,
 *     isFeatureAvailable,
 *   } = useNetworkInfo();
 *
 *   // Check if GIWA ID feature is available
 *   const canUseGiwaId = isFeatureAvailable('giwaId');
 *
 *   // Show warning banner if network has issues
 *   if (hasWarnings) {
 *     console.warn('Network warnings:', warnings);
 *   }
 *
 *   return (
 *     <View>
 *       <Text>Network: {network}</Text>
 *       <Text>Ready: {isReady ? 'Yes' : 'No'}</Text>
 *       {!canUseGiwaId && (
 *         <Text>GIWA ID is not available on this network</Text>
 *       )}
 *     </View>
 *   );
 * }
 * ```
 */
export function useNetworkInfo(): UseNetworkInfoReturn {
  const managers = useGiwaManagers();
  const { isLoading } = useGiwaState();

  return useMemo(() => {
    // Return loading state if managers not ready
    // Use isLoading from GiwaState to determine initialization status
    if (!managers) {
      return {
        network: 'testnet' as NetworkType,
        networkConfig: null,
        status: null,
        isTestnet: true,
        isReady: false,
        hasWarnings: false,
        warnings: [],
        isFeatureAvailable: () => false,
        getFeatureInfo: () => null,
        unavailableFeatures: [],
        chainId: 0,
        rpcUrl: '',
        flashblocksRpcUrl: '',
        flashblocksWsUrl: '',
        explorerUrl: '',
        isInitializing: isLoading,
      };
    }

    const { client, network } = managers;
    const networkConfig = GIWA_NETWORKS[network];
    const status = client.getNetworkStatus();

    const unavailableFeatures = Object.entries(status.features)
      .filter(([, info]) => info.status === 'unavailable')
      .map(([name]) => name as FeatureName);

    return {
      network,
      networkConfig,
      status,
      isTestnet: network === 'testnet',
      isReady: status.readiness === 'ready',
      hasWarnings: status.hasWarnings,
      warnings: status.warnings.map((w) => w.message),
      isFeatureAvailable: (feature: FeatureName) =>
        client.isFeatureAvailable(feature),
      getFeatureInfo: (feature: FeatureName) => client.getFeatureInfo(feature),
      unavailableFeatures,
      chainId: networkConfig.id,
      rpcUrl: networkConfig.rpcUrl,
      flashblocksRpcUrl: networkConfig.flashblocksRpcUrl,
      flashblocksWsUrl: networkConfig.flashblocksWsUrl,
      explorerUrl: networkConfig.explorerUrl,
      isInitializing: false,
    };
  }, [managers, isLoading]);
}
