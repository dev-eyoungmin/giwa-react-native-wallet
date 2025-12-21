// @giwa/react-native-wallet
// GIWA Chain SDK for React Native - Expo and React Native CLI compatible

// Types
export * from './types';

// Constants
export { GIWA_NETWORKS, getNetwork, DEFAULT_NETWORK } from './constants/networks';
export { CONTRACT_ADDRESSES, getContractAddresses, DOJANG_SCHEMAS } from './constants/contracts';

// Core
export { GiwaClient } from './core/GiwaClient';
export { WalletManager } from './core/WalletManager';
export { TokenManager } from './core/TokenManager';
export { BridgeManager } from './core/BridgeManager';
export { FlashblocksManager } from './core/FlashblocksManager';
export { GiwaIdManager } from './core/GiwaIdManager';
export { DojangManager } from './core/DojangManager';

// Providers
export {
  GiwaProvider,
  useGiwaContext,
  // 최적화된 개별 Context hooks (리렌더링 최소화)
  useGiwaManagers,
  useGiwaWalletContext,
  useGiwaState,
  // Context exports (advanced usage)
  ManagerContext,
  WalletContext,
  StateContext,
  GiwaContext,
} from './providers/GiwaProvider';
export type { GiwaProviderProps } from './providers/GiwaProvider';

// Hooks
export { useGiwaWallet } from './hooks/useGiwaWallet';
export { useBalance } from './hooks/useBalance';
export { useTransaction } from './hooks/useTransaction';
export { useTokens } from './hooks/useTokens';
export { useBridge } from './hooks/useBridge';
export { useFlashblocks } from './hooks/useFlashblocks';
export { useGiwaId } from './hooks/useGiwaId';
export { useDojang } from './hooks/useDojang';
export { useFaucet } from './hooks/useFaucet';

// Adapters (for advanced usage)
export { AdapterFactory, getAdapterFactory } from './adapters/AdapterFactory';
export type { Adapters, AdapterFactoryOptions } from './adapters/AdapterFactory';
export type { ISecureStorage } from './adapters/interfaces/ISecureStorage';
export type { IBiometricAuth } from './adapters/interfaces/IBiometricAuth';
export type { IClipboard } from './adapters/interfaces/IClipboard';
export { STORAGE_KEYS } from './adapters/interfaces/ISecureStorage';
export { BIOMETRIC_PROMPTS } from './adapters/interfaces/IBiometricAuth';

// Utils
export {
  GiwaError,
  GiwaSecurityError,
  GiwaNetworkError,
  GiwaWalletError,
  GiwaTransactionError,
  ErrorCodes,
} from './utils/errors';
export { detectEnvironment, ensureSecureStorageAvailable } from './utils/secureStorageValidator';
