---
sidebar_position: 3
---

# React Native CLI 설정

React Native CLI 프로젝트에서 GIWA SDK를 설정하는 방법입니다.

## 설치

```bash
npm install @giwa/react-native-wallet react-native-keychain

# iOS 의존성 설치
cd ios && pod install && cd ..
```

## iOS 설정

### Info.plist 설정

Face ID를 사용하려면 `ios/YourApp/Info.plist`에 추가:

```xml title="ios/YourApp/Info.plist"
<key>NSFaceIDUsageDescription</key>
<string>지갑 접근을 위해 Face ID를 사용합니다</string>
```

### Keychain 그룹 설정 (선택)

여러 앱 간 키체인 공유가 필요한 경우:

1. Xcode에서 프로젝트를 엽니다
2. Signing & Capabilities로 이동
3. Keychain Sharing capability 추가

## Android 설정

### Gradle 설정

`android/build.gradle`:

```groovy title="android/build.gradle"
buildscript {
    ext {
        minSdkVersion = 23  // 최소 SDK 버전
    }
}
```

### ProGuard 설정 (릴리스 빌드)

`android/app/proguard-rules.pro`:

```proguard title="android/app/proguard-rules.pro"
# react-native-keychain
-keep class com.oblador.keychain.** { *; }
```

## 기본 설정

### 1. GiwaProvider 설정

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

### 2. React Navigation 사용 시

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

## 설정 옵션

```tsx
<GiwaProvider
  config={{
    network: 'testnet',        // 'testnet' | 'mainnet'
    customRpcUrl: 'https://...', // 커스텀 RPC (선택)
    autoConnect: true,         // 앱 시작 시 자동 연결
    enableFlashblocks: true,   // Flashblocks 활성화
  }}
>
```

## 생체 인증 설정 (선택)

생체 인증을 사용하려면 추가 패키지를 설치합니다:

```bash
npm install react-native-biometrics
cd ios && pod install && cd ..
```

## 빌드 및 실행

```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

## 문제 해결

### Pod 설치 오류

```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Android 빌드 오류

```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Metro 캐시 문제

```bash
npx react-native start --reset-cache
```

## 다음 단계

- [빠른 시작](/docs/getting-started/quick-start)으로 첫 지갑 만들기
