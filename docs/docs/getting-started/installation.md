---
sidebar_position: 1
---

# Installation

giwa-react-native-wallet supports both Expo and React Native CLI projects.

:::tip Crypto Polyfill
`react-native-get-random-values` is automatically handled by the SDK internally. No separate import is needed.
:::

## Expo Projects

```bash
# npm
npm install giwa-react-native-wallet expo-secure-store expo-local-authentication react-native-get-random-values

# yarn
yarn add giwa-react-native-wallet expo-secure-store expo-local-authentication react-native-get-random-values

# pnpm
pnpm add giwa-react-native-wallet expo-secure-store expo-local-authentication react-native-get-random-values
```

:::tip
You can also use `npx expo install` for automatic Expo SDK version compatibility:
```bash
npx expo install giwa-react-native-wallet expo-secure-store expo-local-authentication react-native-get-random-values
```
:::

## React Native CLI Projects

```bash
# npm
npm install giwa-react-native-wallet react-native-keychain react-native-get-random-values

# yarn
yarn add giwa-react-native-wallet react-native-keychain react-native-get-random-values

# pnpm
pnpm add giwa-react-native-wallet react-native-keychain react-native-get-random-values
```

```bash
# iOS additional setup
cd ios && pod install && cd ..
```

:::note Biometric Authentication
`react-native-keychain` provides both secure storage and biometric authentication for React Native CLI projects.
:::

## Dependency Overview

:::info Peer Dependencies
Platform-specific packages are defined as **peer dependencies**. This is the standard approach in the React Native ecosystem.
- Expo users: Install `expo-secure-store` + `expo-local-authentication`
- RN CLI users: Install `react-native-keychain`

Both platforms require `react-native-get-random-values`.
:::

### Core Dependencies (Auto-installed)

| Package | Purpose |
|---------|---------|
| `viem` | Ethereum client library |
| `@scure/bip39` | Mnemonic generation and validation |

### Platform-Specific Peer Dependencies

| Platform | Package | Required | Purpose |
|----------|---------|----------|---------|
| Expo | `expo-secure-store` | Yes | iOS Keychain / Android Keystore |
| Expo | `expo-local-authentication` | Optional* | Biometric authentication |
| RN CLI | `react-native-keychain` | Yes | Secure storage + Biometrics |
| All | `react-native-get-random-values` | Yes | Crypto polyfill |

*`expo-local-authentication`: Only required when using biometric authentication features

## Secure Storage Required

:::warning Important
This SDK requires secure storage (iOS Keychain / Android Keystore). It does not provide fallbacks for web or test environments. This is an intentional design choice for secure private key storage.
:::

## Version Requirements

```json
{
  "peerDependencies": {
    "react": ">=19.0.0",
    "react-native": ">=0.77.0",
    "expo": ">=53.0.0",
    "expo-secure-store": ">=15.0.0",
    "expo-local-authentication": ">=14.0.0",
    "react-native-keychain": ">=9.2.0",
    "react-native-get-random-values": ">=1.11.0"
  }
}
```

## Next Steps

- [Expo Setup](/docs/getting-started/expo-setup) - Detailed setup for Expo projects
- [React Native CLI Setup](/docs/getting-started/rn-cli-setup) - Detailed setup for RN CLI projects
- [Quick Start](/docs/getting-started/quick-start) - Create your first wallet
