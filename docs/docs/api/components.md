---
sidebar_position: 2
---

# Components API

GIWA SDK에서 제공하는 React 컴포넌트의 API 레퍼런스입니다.

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
| `config` | `GiwaConfig` | ✓ | SDK 설정 |
| `children` | `ReactNode` | ✓ | 하위 컴포넌트 |

### GiwaConfig

```tsx
interface CustomEndpoints {
  /** 커스텀 RPC URL */
  rpcUrl?: string;
  /** Flashblocks RPC URL */
  flashblocksRpcUrl?: string;
  /** Flashblocks WebSocket URL */
  flashblocksWsUrl?: string;
  /** 블록 탐색기 URL */
  explorerUrl?: string;
}

interface GiwaConfig {
  /** 네트워크 선택 (기본값: 'testnet') */
  network?: 'testnet' | 'mainnet';

  /** 커스텀 엔드포인트 설정 */
  endpoints?: CustomEndpoints;

  /** @deprecated endpoints.rpcUrl 사용 권장 */
  customRpcUrl?: string;

  /** 앱 시작 시 저장된 지갑 자동 로드 */
  autoConnect?: boolean;

  /** Flashblocks 기능 활성화 */
  enableFlashblocks?: boolean;

  /** 환경 강제 설정 (선택) */
  forceEnvironment?: 'expo' | 'react-native';
}
```

### 사용 예시

```tsx
// 기본 설정 (testnet)
<GiwaProvider config={{ network: 'testnet' }}>
  <App />
</GiwaProvider>

// 전체 설정
<GiwaProvider
  config={{
    network: 'testnet',
    autoConnect: true,
    enableFlashblocks: true,
  }}
>
  <App />
</GiwaProvider>

// 커스텀 엔드포인트
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

GiwaProvider의 Context에 직접 접근하는 Hook입니다.

```tsx
import { useGiwaContext } from '@giwa/react-native-wallet';

const context = useGiwaContext();
```

### 반환값

```tsx
interface GiwaContextValue {
  /** SDK 설정 */
  config: GiwaConfig;

  /** 현재 네트워크 정보 */
  network: NetworkInfo;

  /** viem Public Client */
  publicClient: PublicClient;

  /** viem Wallet Client (지갑 연결 시) */
  walletClient: WalletClient | null;

  /** 어댑터 인스턴스 */
  adapters: Adapters;

  /** 초기화 완료 여부 */
  isInitialized: boolean;
}
```

### 사용 예시

```tsx
function AdvancedComponent() {
  const { publicClient, config, isInitialized } = useGiwaContext();

  if (!isInitialized) {
    return <Loading />;
  }

  // publicClient로 직접 viem 호출
  const getBlockNumber = async () => {
    const blockNumber = await publicClient.getBlockNumber();
    console.log('현재 블록:', blockNumber);
  };

  return (
    <View>
      <Text>네트워크: {config.network}</Text>
      <Button title="블록 번호 조회" onPress={getBlockNumber} />
    </View>
  );
}
```

---

## Provider 중첩

GiwaProvider는 앱의 루트에 한 번만 사용해야 합니다.

### 올바른 사용

```tsx
// ✅ 올바른 사용
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

### 잘못된 사용

```tsx
// ❌ 잘못된 사용 - 중첩 Provider
export default function App() {
  return (
    <GiwaProvider config={{ network: 'testnet' }}>
      <HomeScreen />
      <GiwaProvider config={{ network: 'mainnet' }}> {/* 중첩 금지 */}
        <WalletScreen />
      </GiwaProvider>
    </GiwaProvider>
  );
}
```

---

## 네트워크 전환

런타임에 네트워크를 전환하려면 앱을 다시 마운트해야 합니다.

```tsx
function App() {
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet');
  const [key, setKey] = useState(0);

  const switchNetwork = (newNetwork: 'testnet' | 'mainnet') => {
    setNetwork(newNetwork);
    setKey((prev) => prev + 1); // Provider 재마운트
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

## 커스텀 어댑터 주입

고급 사용 사례를 위해 커스텀 어댑터를 주입할 수 있습니다.

```tsx
import {
  GiwaProvider,
  AdapterFactory,
  type ISecureStorage,
} from '@giwa/react-native-wallet';

// 커스텀 보안 저장소 구현
class CustomSecureStorage implements ISecureStorage {
  async setItem(key: string, value: string): Promise<void> {
    // 커스텀 구현
  }
  async getItem(key: string): Promise<string | null> {
    // 커스텀 구현
  }
  async removeItem(key: string): Promise<void> {
    // 커스텀 구현
  }
  async getAllKeys(): Promise<string[]> {
    // 커스텀 구현
  }
}

// 커스텀 어댑터 팩토리
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
