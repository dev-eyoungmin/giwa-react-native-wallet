---
sidebar_position: 2
---

# Expo Setup

이 가이드에서는 Expo 프로젝트에서 GIWA SDK를 설정하는 방법을 설명합니다.

## Installation

```bash
# npm
npm install @giwa/react-native-wallet expo-secure-store

# yarn
yarn add @giwa/react-native-wallet expo-secure-store

# pnpm
pnpm add @giwa/react-native-wallet expo-secure-store
```

:::tip
`npx expo install`을 사용하면 Expo SDK 버전 호환성을 자동으로 맞출 수 있습니다.
:::

## Basic Setup

### 1. GiwaProvider Configuration

앱의 루트에 `GiwaProvider`를 추가하세요:

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

### 2. Using Expo Router

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

## Configuration Options

```tsx
<GiwaProvider
  config={{
    network: 'testnet',        // 'testnet' | 'mainnet'
    autoConnect: true,         // Auto-connect on app start
    enableFlashblocks: true,   // Enable Flashblocks
  }}
>
```

### Custom Endpoints (Optional)

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

## Biometric Authentication Setup (Optional)

생체 인증을 사용하려면 추가 패키지를 설치하세요:

```bash
# npm
npm install expo-local-authentication

# yarn
yarn add expo-local-authentication

# pnpm
pnpm add expo-local-authentication
```

### app.json Configuration

```json title="app.json"
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSFaceIDUsageDescription": "Face ID is used for wallet access"
      }
    }
  }
}
```

## Expo Go Limitations

:::info Expo Go
대부분의 기능은 Expo Go에서 작동하지만, 일부 네이티브 기능은 개발 빌드에서만 사용 가능합니다.
:::

개발 빌드 생성:

```bash
npx expo prebuild
npx expo run:ios
# or
npx expo run:android
```

## Troubleshooting

### Metro Bundler Cache Issues

```bash
npx expo start --clear
```

### Dependency Conflicts

```bash
npx expo install --fix
```

## Next Steps

- [빠른 시작](/docs/getting-started/quick-start)으로 첫 번째 지갑 생성하기
