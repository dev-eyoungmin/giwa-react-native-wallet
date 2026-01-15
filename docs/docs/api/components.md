---
sidebar_position: 2
---

# Components API

API reference for React components provided by the GIWA SDK.

## GiwaProvider

Root Provider component for the GIWA SDK.

```tsx
import { GiwaProvider } from 'giwa-react-native-wallet';

// Minimal usage - no props required (uses defaults)
<GiwaProvider>
  <App />
</GiwaProvider>

// With options
<GiwaProvider network="testnet" onError={(e) => console.error(e)}>
  <App />
</GiwaProvider>
```

### Props (All Optional except children)

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `children` | `ReactNode` | Yes | - | Child components |
| `config` | `GiwaConfig` | No | `{}` | SDK configuration |
| `network` | `'testnet' \| 'mainnet'` | No | `'testnet'` | Network type (mainnet: 🚧 Under Development) |
| `initTimeout` | `number` | No | `10000` | Initialization timeout in milliseconds |
| `onError` | `(error: Error) => void` | No | - | Error callback for initialization failures |
| `adapterFactory` | `AdapterFactory` | No | auto-detect | Custom adapter factory for advanced use cases |

:::tip Direct Props vs Config
You can use direct props instead of the config object for cleaner syntax:
```tsx
// Using direct props (recommended)
<GiwaProvider network="testnet" initTimeout={10000}>
  <App />
</GiwaProvider>

// Using config object
<GiwaProvider config={{ network: 'testnet' }}>
  <App />
</GiwaProvider>
```
:::

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

### forceEnvironment Usage

The SDK auto-detects the environment (Expo or React Native CLI) based on available secure storage packages. Use `forceEnvironment` only when:

| Scenario | Setting | Description |
|----------|---------|-------------|
| Testing | `'expo'` or `'react-native'` | Force specific adapter in test environment |
| Auto-detection failure | `'expo'` or `'react-native'` | Manual override when detection fails |
| Custom adapter | - | Use `adapterFactory` prop instead |

:::warning
Setting `forceEnvironment` incorrectly will cause secure storage errors:
- Setting `'expo'` without `expo-secure-store` installed
- Setting `'react-native'` without `react-native-keychain` installed
:::

```tsx
// Force Expo environment (for testing)
<GiwaProvider config={{ forceEnvironment: 'expo' }}>
  <App />
</GiwaProvider>

// Force React Native CLI environment
<GiwaProvider config={{ forceEnvironment: 'react-native' }}>
  <App />
</GiwaProvider>
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

Hook for direct access to the GiwaProvider Context.

```tsx
import { useGiwaContext } from 'giwa-react-native-wallet';

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

GiwaProvider should only be used once at the root of your app.

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

To switch networks at runtime, you need to remount the app.

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

You can inject custom adapters for advanced use cases.

```tsx
import {
  GiwaProvider,
  AdapterFactory,
  type ISecureStorage,
} from 'giwa-react-native-wallet';

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
