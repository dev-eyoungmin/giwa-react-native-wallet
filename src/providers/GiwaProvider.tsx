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
// Context 분리: Manager, Wallet, State로 분리하여 불필요한 리렌더링 방지
// ============================================================================

// Manager Context - 거의 변경되지 않는 매니저 인스턴스들
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

// Wallet Context - wallet 상태만 (자주 변경됨)
interface WalletContextState {
  wallet: GiwaWallet | null;
  setWallet: (wallet: GiwaWallet | null) => void;
}

// State Context - 로딩/에러 상태 (자주 변경됨)
interface StateContextState {
  isInitialized: boolean;
  isLoading: boolean;
  error: Error | null;
  environment: Environment | null;
}

// 분리된 Context 생성
const ManagerContext = createContext<ManagerContextState | undefined>(undefined);
const WalletContext = createContext<WalletContextState | undefined>(undefined);
const StateContext = createContext<StateContextState | undefined>(undefined);

// 레거시 호환을 위한 통합 Context 타입
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
 * 최적화:
 * - Context를 Manager, Wallet, State로 분리하여 불필요한 리렌더링 방지
 * - 매니저가 변경되어도 wallet 상태만 사용하는 컴포넌트는 리렌더링 안됨
 * - 로딩 상태가 변경되어도 매니저만 사용하는 컴포넌트는 리렌더링 안됨
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

  // config 값들을 안정적인 참조로 메모이제이션
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
            '보안 저장소를 찾을 수 없습니다. expo-secure-store 또는 react-native-keychain을 설치해주세요.'
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
          setError(err instanceof Error ? err : new Error('초기화 실패'));
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

  // Manager Context value (거의 변경되지 않음)
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

  // Wallet Context value (wallet 변경 시만 업데이트)
  const walletContextValue = useMemo<WalletContextState>(() => ({
    wallet,
    setWallet,
  }), [wallet, setWallet]);

  // State Context value (로딩/에러 상태 변경 시만 업데이트)
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
// 최적화된 개별 Context Hooks
// ============================================================================

/**
 * Hook to access only manager instances (거의 리렌더링 안됨)
 * wallet 상태가 필요 없을 때 사용
 */
export function useGiwaManagers(): ManagerContextState {
  const context = useContext(ManagerContext);
  if (context === undefined) {
    throw new Error('useGiwaManagers must be used within a GiwaProvider');
  }
  return context;
}

/**
 * Hook to access only wallet state (wallet 변경 시만 리렌더링)
 */
export function useGiwaWalletContext(): WalletContextState {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useGiwaWalletContext must be used within a GiwaProvider');
  }
  return context;
}

/**
 * Hook to access only loading/error state (상태 변경 시만 리렌더링)
 */
export function useGiwaState(): StateContextState {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error('useGiwaState must be used within a GiwaProvider');
  }
  return context;
}

/**
 * Hook to access full GIWA context (레거시 호환)
 * 주의: 모든 상태 변경에 리렌더링됨
 * 가능하면 useGiwaManagers, useGiwaWalletContext, useGiwaState를 개별 사용 권장
 */
export function useGiwaContext(): GiwaContextState {
  const managers = useGiwaManagers();
  const walletContext = useGiwaWalletContext();
  const state = useGiwaState();

  // 통합 객체 메모이제이션
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
