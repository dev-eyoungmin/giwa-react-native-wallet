import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
} from 'react';
import { GiwaClient } from '../core/GiwaClient';
import { WalletManager } from '../core/WalletManager';
import { TokenManager } from '../core/TokenManager';
import { BridgeManager } from '../core/BridgeManager';
import { FlashblocksManager } from '../core/FlashblocksManager';
import { GiwaIdManager } from '../core/GiwaIdManager';
import { DojangManager } from '../core/DojangManager';
import { AdapterFactory, type Adapters } from '../adapters/AdapterFactory';
import type { GiwaConfig, GiwaWallet, NetworkType } from '../types';
import type { Environment } from '../utils/secureStorageValidator';

// ============================================================================
// Context Separation: Split into Manager, Wallet, State to prevent unnecessary re-renders
// ============================================================================

// Manager Context - rarely changing manager instances
interface ManagerContextState {
  client: GiwaClient;
  walletManager: WalletManager;
  tokenManager: TokenManager;
  bridgeManager: BridgeManager;
  flashblocksManager: FlashblocksManager;
  giwaIdManager: GiwaIdManager;
  dojangManager: DojangManager;
  adapters: Adapters | null;
  network: NetworkType;
}

// Wallet Context - wallet state only (frequently changed)
interface WalletContextState {
  wallet: GiwaWallet | null;
  setWallet: (wallet: GiwaWallet | null) => void;
}

// State Context - loading/error state (frequently changed)
interface StateContextState {
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  environment: Environment | null;
}

// Create separated Contexts
const ManagerContext = createContext<ManagerContextState | undefined>(undefined);
const WalletContext = createContext<WalletContextState | undefined>(undefined);
const StateContext = createContext<StateContextState | undefined>(undefined);

// Combined Context type for legacy compatibility
interface GiwaContextState extends ManagerContextState, WalletContextState, StateContextState {}

// Provider props
export interface GiwaProviderProps {
  children: ReactNode;
  config?: GiwaConfig;
  forceEnvironment?: Environment;
}

/**
 * GIWA Provider - wraps application with GIWA SDK context
 *
 * Optimization:
 * - Context split into Manager, Wallet, State to prevent unnecessary re-renders
 * - Components using only wallet state won't re-render when managers change
 * - Components using only managers won't re-render when loading state changes
 *
 * Usage:
 * ```tsx
 * <GiwaProvider config={{ network: 'testnet' }}>
 *   <App />
 * </GiwaProvider>
 * ```
 */
export function GiwaProvider({
  children,
  config = {},
  forceEnvironment,
}: GiwaProviderProps): JSX.Element {
  // State
  const [wallet, setWalletState] = useState<GiwaWallet | null>(null);
  const [adapters, setAdapters] = useState<Adapters | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [walletManager, setWalletManager] = useState<WalletManager | null>(null);

  // Memoize config values for stable references
  const networkConfig = config.network;
  const customRpcUrl = config.customRpcUrl;
  const enableFlashblocks = config.enableFlashblocks;
  const autoConnect = config.autoConnect;

  // Create client (memoized with stable dependencies)
  const client = useMemo(() => {
    return new GiwaClient(config);
  }, [networkConfig, customRpcUrl]);

  // Create managers (memoized, dependent on client)
  const tokenManager = useMemo(() => new TokenManager(client), [client]);
  const bridgeManager = useMemo(() => new BridgeManager(client), [client]);
  const flashblocksManager = useMemo(
    () => new FlashblocksManager(client, enableFlashblocks),
    [client, enableFlashblocks]
  );
  const giwaIdManager = useMemo(() => new GiwaIdManager(client), [client]);
  const dojangManager = useMemo(() => new DojangManager(client), [client]);

  // Initialize adapters
  useEffect(() => {
    let mounted = true;

    async function initialize() {
      setIsLoading(true);
      setError(null);

      try {
        const factory = AdapterFactory.getInstance({
          forceEnvironment,
        });

        const env = await factory.detectEnvironment();
        if (!mounted) return;

        setEnvironment(env);

        if (env === 'unsupported') {
          throw new Error(
            'Secure storage not found. Please install expo-secure-store or react-native-keychain.'
          );
        }

        const adapterInstances = await factory.getAdapters();
        if (!mounted) return;

        setAdapters(adapterInstances);

        // Create wallet manager with secure storage
        const manager = new WalletManager(adapterInstances.secureStorage);
        setWalletManager(manager);

        // Try to load existing wallet if autoConnect is enabled
        if (autoConnect !== false) {
          const existingWallet = await manager.loadWallet();
          if (existingWallet && mounted) {
            setWalletState(existingWallet);

            // Set account in client
            const account = manager.getAccount();
            if (account) {
              client.setAccount(account);
            }
          }
        }

        if (mounted) {
          setIsInitialized(true);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Initialization failed'));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
    };
  }, [forceEnvironment, autoConnect, client]);

  // Update client account when wallet changes (stable callback)
  const setWallet = useCallback(
    (newWallet: GiwaWallet | null) => {
      setWalletState(newWallet);

      if (newWallet && walletManager) {
        const account = walletManager.getAccount();
        if (account) {
          client.setAccount(account);
        }
      } else {
        client.clearAccount();
      }
    },
    [client, walletManager]
  );

  // Manager Context value (rarely changes)
  const managerContextValue = useMemo<ManagerContextState | null>(() => {
    if (!walletManager) {
      return null;
    }

    return {
      client,
      walletManager,
      tokenManager,
      bridgeManager,
      flashblocksManager,
      giwaIdManager,
      dojangManager,
      adapters,
      network: networkConfig || 'testnet',
    };
  }, [
    client,
    walletManager,
    tokenManager,
    bridgeManager,
    flashblocksManager,
    giwaIdManager,
    dojangManager,
    adapters,
    networkConfig,
  ]);

  // Wallet Context value (updates only when wallet changes)
  const walletContextValue = useMemo<WalletContextState>(() => ({
    wallet,
    setWallet,
  }), [wallet, setWallet]);

  // State Context value (updates only when loading/error state changes)
  const stateContextValue = useMemo<StateContextState>(() => ({
    isInitialized,
    isLoading,
    error,
    environment,
  }), [isInitialized, isLoading, error, environment]);

  // Show loading or error state
  if (isLoading) {
    return <>{children}</>;
  }

  if (error) {
    console.error('GIWA Provider Error:', error);
    return <>{children}</>;
  }

  if (!managerContextValue) {
    return <>{children}</>;
  }

  return (
    <ManagerContext.Provider value={managerContextValue}>
      <WalletContext.Provider value={walletContextValue}>
        <StateContext.Provider value={stateContextValue}>
          {children}
        </StateContext.Provider>
      </WalletContext.Provider>
    </ManagerContext.Provider>
  );
}

// ============================================================================
// Optimized Individual Context Hooks
// ============================================================================

/**
 * Hook to access only manager instances (rarely re-renders)
 * Use when wallet state is not needed
 */
export function useGiwaManagers(): ManagerContextState {
  const context = useContext(ManagerContext);
  if (context === undefined) {
    throw new Error('useGiwaManagers must be used within a GiwaProvider');
  }
  return context;
}

/**
 * Hook to access only wallet state (re-renders only when wallet changes)
 */
export function useGiwaWalletContext(): WalletContextState {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useGiwaWalletContext must be used within a GiwaProvider');
  }
  return context;
}

/**
 * Hook to access only loading/error state (re-renders only when state changes)
 */
export function useGiwaState(): StateContextState {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error('useGiwaState must be used within a GiwaProvider');
  }
  return context;
}

/**
 * Hook to access full GIWA context (legacy compatible)
 * Warning: Re-renders on all state changes
 * Prefer using useGiwaManagers, useGiwaWalletContext, useGiwaState individually when possible
 */
export function useGiwaContext(): GiwaContextState {
  const managers = useGiwaManagers();
  const walletContext = useGiwaWalletContext();
  const state = useGiwaState();

  // Memoize combined object
  return useMemo(() => ({
    ...managers,
    ...walletContext,
    ...state,
  }), [managers, walletContext, state]);
}

// Export contexts for advanced usage
export { ManagerContext, WalletContext, StateContext };

// Legacy export (deprecated)
/** @deprecated Use ManagerContext, WalletContext, or StateContext instead */
export const GiwaContext = ManagerContext;
