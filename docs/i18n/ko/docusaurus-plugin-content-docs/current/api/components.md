---
sidebar_position: 2
---

# Components API

GIWA SDK에서 제공하는 React 컴포넌트에 대한 API 레퍼런스입니다.

## GiwaProvider

GIWA SDK의 루트 Provider 컴포넌트입니다.

```tsx
import { GiwaProvider } from '@giwa/react-native-wallet';

<GiwaProvider config={config}>
  {children}
</GiwaProvider>
```

### Props

| Prop | 타입 | 필수 | 설명 |
|------|------|------|------|
| `config` | `GiwaConfig` | 예 | SDK 설정 |
| `children` | `ReactNode` | 예 | 자식 컴포넌트 |

### GiwaConfig

```tsx
interface CustomEndpoints {
  /** Custom RPC URL */
  rpcUrl?: string;
  /** Flashblocks RPC URL */
  flashblocksRpcUrl?: string;
  /** Flashblocks WebSocket URL */
  flashblocksWsUrl?: string;
  /** Block explorer URL */
  explorerUrl?: string;
}

interface GiwaConfig {
  /** Network selection (default: 'testnet') */
  network?: 'testnet' | 'mainnet';

  /** Custom endpoint configuration */
  endpoints?: CustomEndpoints;

  /** @deprecated Use endpoints.rpcUrl instead */
  customRpcUrl?: string;

  /** Auto-load saved wallet on app start */
  autoConnect?: boolean;

  /** Enable Flashblocks feature */
  enableFlashblocks?: boolean;

  /** Force environment setting (optional) */
  forceEnvironment?: 'expo' | 'react-native';
}
```

### Usage Examples

```tsx
// Basic configuration (testnet)
<GiwaProvider config={{ network: 'testnet' }}>
  <App />
</GiwaProvider>

// Full configuration
<GiwaProvider
  config={{
    network: 'testnet',
    autoConnect: true,
    enableFlashblocks: true,
  }}
>
  <App />
</GiwaProvider>

// Custom endpoints
<GiwaProvider
  config={{
    network: 'testnet',
    endpoints: {
      rpcUrl: 'https://my-rpc.example.com',
      flashblocksRpcUrl: 'https://my-flashblocks.example.com',
      flashblocksWsUrl: 'wss://my-flashblocks.example.com',
      explorerUrl: 'https://my-explorer.example.com',
    },
  }}
>
  <App />
</GiwaProvider>
```

---

## useGiwaContext

GiwaProvider Context에 직접 접근하기 위한 Hook입니다.

```tsx
import { useGiwaContext } from '@giwa/react-native-wallet';

const context = useGiwaContext();
```

### Return Value

```tsx
interface GiwaContextValue {
  /** SDK configuration */
  config: GiwaConfig;

  /** Current network information */
  network: NetworkInfo;

  /** viem Public Client */
  publicClient: PublicClient;

  /** viem Wallet Client (when wallet is connected) */
  walletClient: WalletClient | null;

  /** Adapter instances */
  adapters: Adapters;

  /** Initialization complete status */
  isInitialized: boolean;
}
```

### Usage Example

```tsx
function AdvancedComponent() {
  const { publicClient, config, isInitialized } = useGiwaContext();

  if (!isInitialized) {
    return <Loading />;
  }

  // Call viem directly with publicClient
  const getBlockNumber = async () => {
    const blockNumber = await publicClient.getBlockNumber();
    console.log('Current block:', blockNumber);
  };

  return (
    <View>
      <Text>Network: {config.network}</Text>
      <Button title="Get Block Number" onPress={getBlockNumber} />
    </View>
  );
}
```

---

## Provider Nesting

GiwaProvider는 앱의 루트에서 한 번만 사용해야 합니다.

### Correct Usage

```tsx
// Correct usage
export default function App() {
  return (
    <GiwaProvider config={{ network: 'testnet' }}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Wallet" component={WalletScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </GiwaProvider>
  );
}
```

### Incorrect Usage

```tsx
// Incorrect usage - nested Provider
export default function App() {
  return (
    <GiwaProvider config={{ network: 'testnet' }}>
      <HomeScreen />
      <GiwaProvider config={{ network: 'mainnet' }}> {/* Nesting not allowed */}
        <WalletScreen />
      </GiwaProvider>
    </GiwaProvider>
  );
}
```

---

## Network Switching

런타임에 네트워크를 전환하려면 앱을 다시 마운트해야 합니다.

```tsx
function App() {
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet');
  const [key, setKey] = useState(0);

  const switchNetwork = (newNetwork: 'testnet' | 'mainnet') => {
    setNetwork(newNetwork);
    setKey((prev) => prev + 1); // Remount Provider
  };

  return (
    <GiwaProvider key={key} config={{ network }}>
      <NetworkSwitcher onSwitch={switchNetwork} />
      <App />
    </GiwaProvider>
  );
}
```

---

## Custom Adapter Injection

고급 사용 사례를 위해 커스텀 어댑터를 주입할 수 있습니다.

```tsx
import {
  GiwaProvider,
  AdapterFactory,
  type ISecureStorage,
} from '@giwa/react-native-wallet';

// Custom secure storage implementation
class CustomSecureStorage implements ISecureStorage {
  async setItem(key: string, value: string): Promise<void> {
    // Custom implementation
  }
  async getItem(key: string): Promise<string | null> {
    // Custom implementation
  }
  async removeItem(key: string): Promise<void> {
    // Custom implementation
  }
  async getAllKeys(): Promise<string[]> {
    // Custom implementation
  }
}

// Custom adapter factory
const customAdapterFactory = new AdapterFactory({
  forceEnvironment: 'expo',
  customStorage: new CustomSecureStorage(),
});

<GiwaProvider
  config={{ network: 'testnet' }}
  adapterFactory={customAdapterFactory}
>
  <App />
</GiwaProvider>
```
