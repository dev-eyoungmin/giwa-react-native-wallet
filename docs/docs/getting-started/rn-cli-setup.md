---
sidebar_position: 3
---

# React Native CLI Setup

This guide explains how to set up the GIWA SDK in a React Native CLI project.

## Installation

```bash
# npm
npm install giwa-react-native-wallet react-native-keychain react-native-get-random-values

# yarn
yarn add giwa-react-native-wallet react-native-keychain react-native-get-random-values

# pnpm
pnpm add giwa-react-native-wallet react-native-keychain react-native-get-random-values
```

```bash
# Install iOS dependencies
cd ios && pod install && cd ..
```

## iOS Setup

### Info.plist Configuration

To use Face ID, add to `ios/YourApp/Info.plist`:

```xml title="ios/YourApp/Info.plist"
<key>NSFaceIDUsageDescription</key>
<string>Face ID is used for wallet access</string>
```

### Keychain Group Configuration (Optional)

If you need to share keychain between multiple apps:

1. Open the project in Xcode
2. Navigate to Signing & Capabilities
3. Add Keychain Sharing capability

## Android Setup

### Gradle Configuration

`android/build.gradle`:

```groovy title="android/build.gradle"
buildscript {
    ext {
        minSdkVersion = 23  // Minimum SDK version
    }
}
```

### ProGuard Configuration (Release Builds)

`android/app/proguard-rules.pro`:

```proguard title="android/app/proguard-rules.pro"
# react-native-keychain
-keep class com.oblador.keychain.** { *; }
```

## Basic Setup

### 1. GiwaProvider Configuration

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

### 2. Using React Navigation

```tsx title="App.tsx"
import { NavigationContainer } from '@react-navigation/native';
import { GiwaProvider } from 'giwa-react-native-wallet';

export default function App() {
  return (
    <GiwaProvider config={{ network: 'testnet' }}>
      <NavigationContainer>
        <YourNavigator />
      </NavigationContainer>
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

## Biometric Authentication

`react-native-keychain` (already included in the installation) provides both secure storage and biometric authentication.

## Build and Run

```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

## Troubleshooting

### Pod Installation Errors

```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Android Build Errors

```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Metro Cache Issues

```bash
npx react-native start --reset-cache
```

## Next Steps

- Create your first wallet with [Quick Start](/docs/getting-started/quick-start)
