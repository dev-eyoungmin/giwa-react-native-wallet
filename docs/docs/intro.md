---
sidebar_position: 1
slug: /
---

# GIWA React Native SDK

React Native SDK for GIWA Chain. Works with both Expo and React Native CLI projects.

## Key Features

- **Wallet Management**: Create and recover wallets using mnemonic or private key
- **ETH and ERC-20 Token Transfers**: Simple token transfer functionality
- **L1↔L2 Bridge**: Asset movement between Ethereum mainnet and GIWA L2
- **Flashblocks**: ~200ms fast transaction pre-confirmation
- **GIWA ID**: ENS-based naming service (alice.giwa.id)
- **Dojang**: EAS-based attestation service
- **Secure Storage**: iOS Keychain / Android Keystore
- **Biometric Authentication**: Face ID, Touch ID, Fingerprint support

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
| Bridge (Superbridge) | [superbridge.app](https://superbridge.app)                   |
| Faucet               | [faucet.giwa.io](https://faucet.giwa.io)                     |
| Block Explorer       | [sepolia-explorer.giwa.io](https://sepolia-explorer.giwa.io) |

## Next Steps

- Get started with [Installation Guide](/docs/getting-started/installation)
- Learn about [Wallet Management](/docs/guides/wallet-management)
- Check all Hooks in [API Reference](/docs/api/hooks)
