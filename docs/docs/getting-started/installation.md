---
sidebar_position: 1
---

# 설치

@giwa/react-native-wallet는 Expo와 React Native CLI 프로젝트 모두를 지원합니다.

## Expo 프로젝트

```bash
npx expo install @giwa/react-native-wallet expo-secure-store
```

## React Native CLI 프로젝트

```bash
npm install @giwa/react-native-wallet react-native-keychain

# iOS 추가 설정
cd ios && pod install && cd ..
```

## 의존성 설명

### 핵심 의존성

SDK는 최소한의 의존성만 사용합니다:

| 패키지 | 용도 |
|--------|------|
| `viem` | 이더리움 클라이언트 라이브러리 |
| `@scure/bip39` | 니모닉 생성 및 검증 |

### 플랫폼별 의존성

| 플랫폼 | 패키지 | 용도 |
|--------|--------|------|
| Expo | `expo-secure-store` | iOS Keychain / Android Keystore |
| RN CLI | `react-native-keychain` | iOS Keychain / Android Keystore |

## 보안 저장소 필수

:::warning 중요
이 SDK는 보안 저장소(iOS Keychain / Android Keystore)가 필수입니다. 웹이나 테스트 환경에서의 폴백을 제공하지 않습니다. 이는 개인키의 안전한 보관을 위한 의도적인 설계입니다.
:::

## 버전 요구사항

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

## 다음 단계

- [Expo 설정](/docs/getting-started/expo-setup) - Expo 프로젝트 상세 설정
- [React Native CLI 설정](/docs/getting-started/rn-cli-setup) - RN CLI 프로젝트 상세 설정
- [빠른 시작](/docs/getting-started/quick-start) - 첫 번째 지갑 만들기
