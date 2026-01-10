// @giwa/react-native-wallet
// GIWA Chain SDK for React Native - Expo and React Native CLI compatible

// Crypto polyfill - MUST be first before any crypto operations
// This ensures crypto.getRandomValues is available for @scure/bip39 and viem
import 'react-native-get-random-values';

// Types
export * from './types';

// Constants
export { GIWA_NETWORKS, getNetwork, DEFAULT_NETWORK } from './constants/networks';
export { CONTRACT_ADDRESSES, getContractAddresses, DOJANG_SCHEMAS } from './constants/contracts';

// Core
export { GiwaClient } from './core/GiwaClient';
export type { ResolvedEndpoints } from './core/GiwaClient';
export { WalletManager } from './core/WalletManager';
export { TokenManager } from './core/TokenManager';
export { BridgeManager } from './core/BridgeManager';
export { FlashblocksManager } from './core/FlashblocksManager';
export { GiwaIdManager } from './core/GiwaIdManager';
export { DojangManager } from './core/DojangManager';

// Core Base (for extending managers)
export { BaseManager } from './core/base/BaseManager';
export type { IManager, ITransactionManager } from './core/base/BaseManager';

// Providers
export {
  GiwaProvider,
  useGiwaContext,
  useGiwaManagers,
  useGiwaWalletContext,
  useGiwaState,
  ManagerContext,
  WalletContext,
  StateContext,
  GiwaContext,
} from './providers/GiwaProvider';
export type { GiwaProviderProps } from './providers/GiwaProvider';

// Hooks - Core
export { useGiwaWallet } from './hooks/useGiwaWallet';
export { useBalance } from './hooks/useBalance';
export { useTransaction } from './hooks/useTransaction';
export { useTokens } from './hooks/useTokens';
export { useBridge } from './hooks/useBridge';
export { useFlashblocks } from './hooks/useFlashblocks';
export { useGiwaId } from './hooks/useGiwaId';
export { useDojang } from './hooks/useDojang';
export { useFaucet } from './hooks/useFaucet';
export { useNetworkInfo } from './hooks/useNetworkInfo';
export type { UseNetworkInfoReturn } from './hooks/useNetworkInfo';

// Hooks - Shared (for custom hook development)
export { useAsyncAction, useAsyncActions } from './hooks/shared/useAsyncAction';
export { useAsyncQuery } from './hooks/shared/useAsyncQuery';
export type {
  AsyncActionState,
  UseAsyncActionReturn,
} from './hooks/shared/useAsyncAction';
export type {
  UseAsyncQueryOptions,
  UseAsyncQueryReturn,
} from './hooks/shared/useAsyncQuery';

// Hooks - Shared (for custom hook development)
export { useAsyncAction, useAsyncActions } from './hooks/shared/useAsyncAction';
export { useAsyncQuery } from './hooks/shared/useAsyncQuery';
export type {
  AsyncActionState,
  UseAsyncActionReturn,
} from './hooks/shared/useAsyncAction';
export type {
  UseAsyncQueryOptions,
  UseAsyncQueryReturn,
} from './hooks/shared/useAsyncQuery';

// Adapters (for advanced usage)
export { AdapterFactory, getAdapterFactory } from './adapters/AdapterFactory';
export type { Adapters, AdapterFactoryOptions } from './adapters/AdapterFactory';
export type { ISecureStorage } from './adapters/interfaces/ISecureStorage';
export type { IBiometricAuth } from './adapters/interfaces/IBiometricAuth';
export { STORAGE_KEYS } from './adapters/interfaces/ISecureStorage';
export { BIOMETRIC_PROMPTS } from './adapters/interfaces/IBiometricAuth';

// Utils - Errors
export {
  GiwaError,
  GiwaSecurityError,
  GiwaNetworkError,
  GiwaWalletError,
  GiwaTransactionError,
  GiwaFeatureUnavailableError,
  ErrorCodes,
  ErrorMessages,
  toError,
  wrapError,
} from './utils/errors';
export type { ErrorCode, ErrorMessage } from './utils/errors';

// Utils - Environment
export { detectEnvironment, ensureSecureStorageAvailable } from './utils/secureStorageValidator';

// Utils - Network Validator (for advanced usage)
export {
  getNetworkStatus,
  getFeatureAvailability,
  getAllFeatureAvailabilities,
  getNetworkWarnings,
  isTbdAddress,
  logNetworkWarnings,
} from './utils/networkValidator';

// Utils - Viem re-exports (for convenience)
// These are commonly used utilities that apps can import directly from the SDK
// without needing to install viem separately
export {
  parseEther,
  formatEther,
  parseUnits,
  formatUnits,
  isAddress,
  getAddress,
} from 'viem';
