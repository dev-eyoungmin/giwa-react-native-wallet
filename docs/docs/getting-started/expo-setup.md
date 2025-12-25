---
sidebar_position: 2
---

# Expo 설정

Expo 프로젝트에서 GIWA SDK를 설정하는 방법입니다.

## 설치

```bash
npx expo install @giwa/react-native-wallet expo-secure-store
```

## 기본 설정

### 1. GiwaProvider 설정

앱의 루트에 `GiwaProvider`를 추가합니다:

```tsx title="App.tsx"
import { GiwaProvider } from '@giwa/react-native-wallet';

export default function App() {
  return (
    <GiwaProvider config={{ network: 'testnet' }}>
      <YourApp />
    </GiwaProvider>
  );
}
```

### 2. Expo Router 사용 시

```tsx title="app/_layout.tsx"
import { Stack } from 'expo-router';
import { GiwaProvider } from '@giwa/react-native-wallet';

export default function RootLayout() {
  return (
    <GiwaProvider config={{ network: 'testnet' }}>
      <Stack />
    </GiwaProvider>
  );
}
```

## 설정 옵션

```tsx
<GiwaProvider
  config={{
    network: 'testnet',        // 'testnet' | 'mainnet'
    autoConnect: true,         // 앱 시작 시 자동 연결
    enableFlashblocks: true,   // Flashblocks 활성화
  }}
>
```

### 커스텀 엔드포인트 (선택)

```tsx
<GiwaProvider
  config={{
    network: 'testnet',
    endpoints: {
      rpcUrl: 'https://my-custom-rpc.example.com',
      flashblocksRpcUrl: 'https://my-flashblocks-rpc.example.com',
      flashblocksWsUrl: 'wss://my-flashblocks-ws.example.com',
      explorerUrl: 'https://my-explorer.example.com',
    },
  }}
>
```

## 생체 인증 설정 (선택)

생체 인증을 사용하려면 추가 패키지를 설치합니다:

```bash
npx expo install expo-local-authentication
```

### app.json 설정

```json title="app.json"
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSFaceIDUsageDescription": "지갑 접근을 위해 Face ID를 사용합니다"
      }
    }
  }
}
```

## Expo Go 제한사항

:::info Expo Go
Expo Go에서는 대부분의 기능이 작동하지만, 일부 네이티브 기능은 개발 빌드에서만 사용할 수 있습니다.
:::

개발 빌드 생성:

```bash
npx expo prebuild
npx expo run:ios
# 또는
npx expo run:android
```

## 문제 해결

### Metro 번들러 캐시 문제

```bash
npx expo start --clear
```

### 의존성 충돌

```bash
npx expo install --fix
```

## 다음 단계

- [빠른 시작](/docs/getting-started/quick-start)으로 첫 지갑 만들기
