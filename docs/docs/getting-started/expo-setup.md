---
sidebar_position: 2
---

# Expo Setup

This guide explains how to set up the GIWA SDK in an Expo project.

## Installation

```bash
# npm
npm install giwa-react-native-wallet expo-secure-store expo-local-authentication react-native-get-random-values

# yarn
yarn add giwa-react-native-wallet expo-secure-store expo-local-authentication react-native-get-random-values

# pnpm
pnpm add giwa-react-native-wallet expo-secure-store expo-local-authentication react-native-get-random-values
```

:::tip
You can also use `npx expo install` for automatic Expo SDK version compatibility:
```bash
npx expo install giwa-react-native-wallet expo-secure-store expo-local-authentication react-native-get-random-values
```
:::

## Basic Setup

### 1. GiwaProvider Configuration

Add `GiwaProvider` to the root of your app:

```tsx title="App.tsx"
import { GiwaProvider } from 'giwa-react-native-wallet';

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
import { GiwaProvider } from 'giwa-react-native-wallet';

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

## Biometric Authentication Setup

`expo-local-authentication` is already included in the installation above. You just need to configure app.json:

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
Most features work in Expo Go, but some native features are only available in development builds.
:::

Creating a development build:

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

- Create your first wallet with [Quick Start](/docs/getting-started/quick-start)
