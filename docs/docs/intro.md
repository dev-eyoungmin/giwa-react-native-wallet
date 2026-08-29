---
sidebar_position: 1
slug: /
---

# GIWA React Native SDK

React Native SDK for GIWA Chain. Works with both Expo and React Native CLI projects.

## Key Features

### ✅ Available Now

| Feature | Hook | Description |
|---------|------|-------------|
| **Wallet Management** | `useGiwaWallet` | Create, recover, import, export wallets |
| **Balance Query** | `useBalance` | Check ETH and token balances |
| **Transactions** | `useTransaction` | Send ETH transactions |
| **Token Operations** | `useTokens` | ERC-20 token transfers and queries |
| **Bridge** | `useBridge` | L1↔L2 ETH/ERC-20 deposits and withdrawals (initiate, status, prove, finalize); deposits/prove/finalize require `endpoints.l1RpcUrl` |
| **Flashblocks** | `useFlashblocks` | ~200ms fast preconfirmation |
| **GIWA ID (up.id)** | `useGiwaId` | up.id name resolution via on-chain UpnameRegistry |
| **Dojang (EAS)** | `useDojang` | On-chain attestation service |
| **Faucet** | `useFaucet` | Testnet ETH faucet |
| **Network Info** | `useNetworkInfo` | Network status and feature availability |
| **Biometric Auth** | `useBiometricAuth` | Face ID / Touch ID / Fingerprint |
| **Secure Storage** | - | iOS Keychain / Android Keystore |

> Bridge operations work on GIWA Sepolia (testnet) only — GIWA mainnet has not launched, so every L1 bridge contract address is `ZERO_ADDRESS` there and every bridge call throws. See the [Bridge guide](/docs/guides/bridge).

## Network Information

| Network | Chain ID | RPC URL                      | Status               |
| ------- | -------- | ---------------------------- | -------------------- |
| Testnet | 91342    | https://sepolia-rpc.giwa.io/ | ✅ Available         |
| Mainnet | -        | -                            | 🚧 Under Development |

:::caution Mainnet Under Development
Mainnet is currently under development. Please use **Testnet** for development and testing.
:::

## Quick Start

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

## Requirements

- React >= 19.0.0
- React Native >= 0.77.0
- Expo SDK >= 53 (Expo projects)
- expo-secure-store >= 15.0.0 (Expo)
- expo-local-authentication >= 14.0.0 (Expo, for biometrics)
- react-native-keychain >= 9.2.0 (React Native CLI)
- react-native-get-random-values >= 1.11.0

## GIWA Official Resources

| Resource             | URL                                                          |
| -------------------- | ------------------------------------------------------------ |
| GIWA Documentation   | [docs.giwa.io](https://docs.giwa.io)                         |
| Sample App (GitHub)  | [giwa-react-native-samples](https://github.com/dev-eyoungmin/giwa-react-native-samples) |
| Bridge (Superbridge) | [superbridge.app](https://superbridge.app)                   |
| Faucet               | [faucet.giwa.io](https://faucet.giwa.io)                     |
| Block Explorer       | [sepolia-explorer.giwa.io](https://sepolia-explorer.giwa.io) |

## Next Steps

- Get started with [Installation Guide](/docs/getting-started/installation)
- Learn about [Wallet Management](/docs/guides/wallet-management)
- Check all Hooks in [API Reference](/docs/api/hooks)
