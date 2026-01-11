---
sidebar_position: 3
---

# React Native CLI Setup

이 가이드에서는 React Native CLI 프로젝트에서 GIWA SDK를 설정하는 방법을 설명합니다.

## Installation

```bash
npm install @giwa/react-native-wallet react-native-keychain

# Install iOS dependencies
cd ios && pod install && cd ..
```

## iOS Setup

### Info.plist Configuration

Face ID를 사용하려면 `ios/YourApp/Info.plist`에 추가하세요:

```xml title="ios/YourApp/Info.plist"
<key>NSFaceIDUsageDescription</key>
<string>Face ID is used for wallet access</string>
```

### Keychain Group Configuration (Optional)

여러 앱 간에 키체인을 공유해야 하는 경우:

1. Xcode에서 프로젝트 열기
2. Signing & Capabilities로 이동
3. Keychain Sharing 기능 추가

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
import { GiwaProvider } from '@giwa/react-native-wallet';

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
import { GiwaProvider } from '@giwa/react-native-wallet';

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

## Biometric Authentication Setup (Optional)

생체 인증을 사용하려면 추가 패키지를 설치하세요:

```bash
npm install react-native-biometrics
cd ios && pod install && cd ..
```

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

- [빠른 시작](/docs/getting-started/quick-start)으로 첫 번째 지갑 생성하기
