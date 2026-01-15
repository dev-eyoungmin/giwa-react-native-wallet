---
sidebar_position: 1
slug: /
---

# GIWA React Native SDK

GIWA Chain을 위한 React Native SDK입니다. Expo와 React Native CLI 프로젝트 모두에서 사용 가능합니다.

## Key Features

- **지갑 관리**: 니모닉 또는 개인키를 사용한 지갑 생성 및 복구
- **ETH 및 ERC-20 토큰 전송**: 간편한 토큰 전송 기능
- **L1↔L2 브릿지**: 이더리움 메인넷과 GIWA L2 간 자산 이동
- **Flashblocks**: ~200ms 빠른 트랜잭션 사전확인
- **GIWA ID**: ENS 기반 네이밍 서비스 (alice.giwa.id)
- **Dojang**: EAS 기반 인증(attestation) 서비스
- **보안 저장소**: iOS Keychain / Android Keystore
- **생체 인증**: Face ID, Touch ID, 지문 인식 지원

## Network Information

| 네트워크 | Chain ID | RPC URL                      |
| -------- | -------- | ---------------------------- |
| Testnet  | 91342    | https://sepolia-rpc.giwa.io/ |
| Mainnet  | -        | -                            |

## Quick Start

```bash
# Expo
npx expo install giwa-react-native-wallet expo-secure-store

# React Native CLI
npm install giwa-react-native-wallet react-native-keychain
cd ios && pod install
```

```tsx
import { GiwaProvider, useGiwaWallet } from "giwa-react-native-wallet";

export default function App() {
  return (
    <GiwaProvider network="testnet">
      <WalletScreen />
    </GiwaProvider>
  );
}

function WalletScreen() {
  const { wallet, createWallet } = useGiwaWallet();

  return wallet ? (
    <Text>Address: {wallet.address}</Text>
  ) : (
    <Button title="Create Wallet" onPress={createWallet} />
  );
}
```

## Requirements

- React >= 19.0.0
- React Native >= 0.77.0
- Expo SDK >= 53 (Expo 프로젝트)
- expo-secure-store >= 15.0.0 (Expo)
- react-native-keychain >= 9.2.0 (React Native CLI)

## GIWA Official Resources

| 리소스               | URL                                                          |
| -------------------- | ------------------------------------------------------------ |
| GIWA 문서            | [docs.giwa.io](https://docs.giwa.io)                         |
| Bridge (Superbridge) | [superbridge.app](https://superbridge.app)                   |
| Faucet               | [faucet.giwa.io](https://faucet.giwa.io)                     |
| Block Explorer       | [sepolia-explorer.giwa.io](https://sepolia-explorer.giwa.io) |

## Next Steps

- [설치 가이드](/docs/getting-started/installation)로 시작하기
- [지갑 관리](/docs/guides/wallet-management) 알아보기
- [API 레퍼런스](/docs/api/hooks)에서 모든 Hooks 확인하기
