---
sidebar_position: 1
slug: /
---

# GIWA React Native SDK

GIWA Chain을 위한 React Native SDK입니다. Expo와 React Native CLI 프로젝트 모두에서 사용할 수 있습니다.

## 주요 기능

- **지갑 관리**: 니모닉/개인키를 통한 지갑 생성 및 복구
- **ETH 및 ERC-20 토큰 전송**: 간편한 토큰 전송 기능
- **L1↔L2 브릿지**: 이더리움 메인넷과 GIWA L2 간 자산 이동
- **Flashblocks**: ~200ms 빠른 트랜잭션 사전 확인
- **GIWA ID**: ENS 기반 네이밍 서비스 (alice.giwa.id)
- **Dojang**: EAS 기반 증명(attestation) 서비스
- **보안 저장소**: iOS Keychain / Android Keystore
- **생체 인증**: Face ID, Touch ID, 지문 인식 지원

## 네트워크 정보

| 네트워크 | Chain ID | RPC URL |
|---------|----------|---------|
| Testnet | 91342 | https://sepolia-rpc.giwa.io/ |
| Mainnet | 91341 | https://rpc.giwa.io/ |

## 빠른 시작

```bash
# Expo
npx expo install @giwa/react-native-wallet expo-secure-store

# React Native CLI
npm install @giwa/react-native-wallet react-native-keychain
cd ios && pod install
```

```tsx
import { GiwaProvider, useGiwaWallet } from '@giwa/react-native-wallet';

export default function App() {
  return (
    <GiwaProvider config={{ network: 'testnet' }}>
      <WalletScreen />
    </GiwaProvider>
  );
}

function WalletScreen() {
  const { wallet, createWallet } = useGiwaWallet();

  return wallet ? (
    <Text>주소: {wallet.address}</Text>
  ) : (
    <Button title="지갑 생성" onPress={createWallet} />
  );
}
```

## 요구 사항

- React >= 19.0.0
- React Native >= 0.77.0
- Expo SDK >= 53 (Expo 프로젝트)
- expo-secure-store >= 15.0.0 (Expo)
- react-native-keychain >= 9.2.0 (React Native CLI)

## 다음 단계

- [설치 가이드](/docs/getting-started/installation)로 시작하기
- [지갑 관리](/docs/guides/wallet-management) 방법 알아보기
- [API 레퍼런스](/docs/api/hooks)에서 모든 Hook 확인하기
