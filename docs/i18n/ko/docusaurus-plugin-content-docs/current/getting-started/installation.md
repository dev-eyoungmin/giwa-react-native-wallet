---
sidebar_position: 1
---

# Installation

@giwa/react-native-wallet은 Expo와 React Native CLI 프로젝트 모두를 지원합니다.

## Expo Projects

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

## React Native CLI Projects

```bash
# npm
npm install @giwa/react-native-wallet react-native-keychain

# yarn
yarn add @giwa/react-native-wallet react-native-keychain

# pnpm
pnpm add @giwa/react-native-wallet react-native-keychain
```

```bash
# iOS additional setup
cd ios && pod install && cd ..
```

## Dependency Overview

### Core Dependencies

SDK는 최소한의 의존성을 사용합니다:

| 패키지 | 용도 |
|--------|------|
| `viem` | Ethereum 클라이언트 라이브러리 |
| `@scure/bip39` | 니모닉 생성 및 검증 |

### Platform-Specific Dependencies

| 플랫폼 | 패키지 | 용도 |
|--------|--------|------|
| Expo | `expo-secure-store` | iOS Keychain / Android Keystore |
| RN CLI | `react-native-keychain` | iOS Keychain / Android Keystore |

## Secure Storage Required

:::warning 중요
이 SDK는 보안 저장소(iOS Keychain / Android Keystore)가 필수입니다. 웹이나 테스트 환경을 위한 대체 방법을 제공하지 않습니다. 이는 개인키의 안전한 저장을 위한 의도적인 설계입니다.
:::

## Version Requirements

```json
{
  "peerDependencies": {
    "react": ">=19.0.0",
    "react-native": ">=0.77.0",
    "expo": ">=53.0.0",
    "expo-secure-store": ">=15.0.0",
    "react-native-keychain": ">=9.2.0"
  }
}
```

## Next Steps

- [Expo 설정](/docs/getting-started/expo-setup) - Expo 프로젝트 상세 설정
- [React Native CLI 설정](/docs/getting-started/rn-cli-setup) - RN CLI 프로젝트 상세 설정
- [빠른 시작](/docs/getting-started/quick-start) - 첫 번째 지갑 생성
