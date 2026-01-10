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
import { safeLog } from '../utils/errors';
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
  /** Callback when initialization error occurs */
  onError?: (error: Error) => void;
  /** Initialization timeout in milliseconds (default: 10000) */
  initTimeout?: number;
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
  onError,
  initTimeout = 10000,
}: GiwaProviderProps): React.JSX.Element {
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
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    async function initialize() {
      setIsLoading(true);
      setError(null);

      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`SDK initialization timed out after ${initTimeout}ms`));
        }, initTimeout);
      });

      try {
        // Race between initialization and timeout
        await Promise.race([
          (async () => {
            if (__DEV__) console.log('[GiwaProvider] Starting initialization...');

            const factory = AdapterFactory.getInstance({
              forceEnvironment,
            });

            if (__DEV__) console.log('[GiwaProvider] Detecting environment...');
            const env = await factory.detectEnvironment();
            if (!mounted) return;

            if (__DEV__) console.log('[GiwaProvider] Environment detected:', env);
            setEnvironment(env);

            if (env === 'unsupported') {
              throw new Error(
                'Secure storage not found. Please install expo-secure-store or react-native-keychain.'
              );
            }

            if (__DEV__) console.log('[GiwaProvider] Getting adapters...');
            const adapterInstances = await factory.getAdapters();
            if (!mounted) return;

            setAdapters(adapterInstances);

            // Create wallet manager with secure storage
            if (__DEV__) console.log('[GiwaProvider] Creating wallet manager...');
            const manager = new WalletManager(adapterInstances.secureStorage);
            setWalletManager(manager);

            // Try to load existing wallet if autoConnect is enabled
            if (autoConnect !== false) {
              if (__DEV__) console.log('[GiwaProvider] Loading existing wallet...');
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
              if (__DEV__) console.log('[GiwaProvider] Initialization complete');
              setIsInitialized(true);
            }
          })(),
          timeoutPromise,
        ]);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Initialization failed');
        safeLog('GiwaProvider initialization', error);
        if (mounted) {
          setError(error);
          onError?.(error);
        }
      } finally {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    initialize();

    return () => {
      mounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [forceEnvironment, autoConnect, client, initTimeout, onError]);

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

  // Log error if any (but don't prevent rendering)
  if (error) {
    safeLog('GIWA Provider Error', error);
  }

  // Always provide StateContext so hooks can check isLoading/error
  // WalletContext is always available (wallet can be null)
  // ManagerContext is only provided when managers are ready
  return (
    <StateContext.Provider value={stateContextValue}>
      <WalletContext.Provider value={walletContextValue}>
        {managerContextValue ? (
          <ManagerContext.Provider value={managerContextValue}>
            {children}
          </ManagerContext.Provider>
        ) : (
          // During loading/error, provide children without ManagerContext
          // Hooks should check isLoading/error via useGiwaState before accessing managers
          children
        )}
      </WalletContext.Provider>
    </StateContext.Provider>
  );
}

// ============================================================================
// Optimized Individual Context Hooks
// ============================================================================

/**
 * Hook to access only manager instances (rarely re-renders)
 * Use when wallet state is not needed
 * Returns null during loading phase - callers should check isLoading via useGiwaState
 */
export function useGiwaManagers(): ManagerContextState | null {
  const context = useContext(ManagerContext);
  // Returns null during loading/initialization phase
  // Callers should check isLoading via useGiwaState() before using managers
  return context ?? null;
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
 * Returns partial context during loading (managers will be null-ish)
 */
export function useGiwaContext(): Partial<GiwaContextState> & StateContextState & WalletContextState {
  const managers = useGiwaManagers();
  const walletContext = useGiwaWalletContext();
  const state = useGiwaState();

  // Memoize combined object
  return useMemo(() => ({
    ...(managers || {}),
    ...walletContext,
    ...state,
  }), [managers, walletContext, state]);
}

// Export contexts for advanced usage
export { ManagerContext, WalletContext, StateContext };

// Legacy export (deprecated)
/** @deprecated Use ManagerContext, WalletContext, or StateContext instead */
export const GiwaContext = ManagerContext;
