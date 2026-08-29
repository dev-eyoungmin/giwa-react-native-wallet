---
sidebar_position: 1
slug: /
---

# GIWA React Native SDK

GIWA Chain을 위한 React Native SDK입니다. Expo와 React Native CLI 프로젝트 모두에서 사용 가능합니다.

## 주요 기능

### ✅ 현재 사용 가능

| 기능 | Hook | 설명 |
|------|------|------|
| **지갑 관리** | `useGiwaWallet` | 지갑 생성, 복구, 가져오기, 내보내기 |
| **잔액 조회** | `useBalance` | ETH 및 토큰 잔액 조회 |
| **트랜잭션** | `useTransaction` | ETH 전송 |
| **토큰 관리** | `useTokens` | ERC-20 토큰 전송 및 조회 |
| **브릿지** | `useBridge` | L1↔L2 ETH/ERC-20 입금 및 출금(시작, 상태 확인, 증명, 완료); 입금/증명/완료는 `endpoints.l1RpcUrl`이 필요 |
| **Flashblocks** | `useFlashblocks` | ~200ms 빠른 사전확인 |
| **GIWA ID (up.id)** | `useGiwaId` | 온체인 UpnameRegistry를 통한 up.id 이름 해석 |
| **Dojang (EAS)** | `useDojang` | 온체인 증명 서비스 |
| **Faucet** | `useFaucet` | 테스트넷 ETH 수령 |
| **네트워크 정보** | `useNetworkInfo` | 네트워크 상태 및 기능 가용성 |
| **생체 인증** | `useBiometricAuth` | Face ID / Touch ID / 지문 인식 |
| **보안 저장소** | - | iOS Keychain / Android Keystore |

> 브릿지 기능은 GIWA Sepolia(테스트넷)에서만 동작합니다 — GIWA 메인넷은 아직 출시되지 않아 모든 L1 브릿지 컨트랙트 주소가 `ZERO_ADDRESS`이며, 모든 브릿지 호출이 실패합니다. [Bridge 가이드](/docs/guides/bridge)를 참고하세요.

## 네트워크 정보

| 네트워크 | Chain ID | RPC URL                      | 상태 |
| -------- | -------- | ---------------------------- | ---- |
| Testnet  | 91342    | https://sepolia-rpc.giwa.io/ | ✅ 사용 가능 |
| Mainnet  | -        | -                            | 🚧 개발중 |

:::caution 메인넷 개발중
메인넷은 현재 개발 중입니다. 개발 및 테스트에는 **테스트넷**을 사용해 주세요.
:::

## 빠른 시작

```bash
# Expo
npx expo install giwa-react-native-wallet expo-secure-store expo-local-authentication react-native-get-random-values

# React Native CLI
npm install giwa-react-native-wallet react-native-keychain react-native-get-random-values
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

## 요구 사항

- React >= 19.0.0
- React Native >= 0.77.0
- Expo SDK >= 53 (Expo 프로젝트)
- expo-secure-store >= 15.0.0 (Expo)
- expo-local-authentication >= 14.0.0 (Expo, 생체 인증용)
- react-native-keychain >= 9.2.0 (React Native CLI)
- react-native-get-random-values >= 1.11.0

## GIWA 공식 리소스

| 리소스               | URL                                                          |
| -------------------- | ------------------------------------------------------------ |
| GIWA 문서            | [docs.giwa.io](https://docs.giwa.io)                         |
| 샘플 앱 (GitHub)     | [giwa-react-native-samples](https://github.com/dev-eyoungmin/giwa-react-native-samples) |
| Bridge (Superbridge) | [superbridge.app](https://superbridge.app)                   |
| Faucet               | [faucet.giwa.io](https://faucet.giwa.io)                     |
| Block Explorer       | [sepolia-explorer.giwa.io](https://sepolia-explorer.giwa.io) |

## Next Steps

- [설치 가이드](/docs/getting-started/installation)로 시작하기
- [지갑 관리](/docs/guides/wallet-management) 알아보기
- [API 레퍼런스](/docs/api/hooks)에서 모든 Hooks 확인하기
