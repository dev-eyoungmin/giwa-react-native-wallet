# giwa-react-native-wallet

[![npm version](https://img.shields.io/npm/v/giwa-react-native-wallet.svg)](https://www.npmjs.com/package/giwa-react-native-wallet)
[![Documentation](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://dev-eyoungmin.github.io/giwa-react-native-wallet/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

GIWA Chain SDK for React Native - Expo and React Native CLI compatible

## Features

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
| **Dojang (EAS)** | `useDojang` | Verified Address / Balance / Code attestations (read-only) |
| **Faucet** | `useFaucet` | Testnet ETH faucet |
| **Network Info** | `useNetworkInfo` | Network status and feature availability |
| **Biometric Auth** | `useBiometricAuth` | Face ID / Touch ID / Fingerprint |
| **Secure Storage** | - | iOS Keychain / Android Keystore |

> Bridge operations work on GIWA Sepolia (testnet) only — GIWA mainnet has not launched, so every L1 bridge contract address is `ZERO_ADDRESS` there and every bridge call throws. See the [Bridge guide](https://dev-eyoungmin.github.io/giwa-react-native-wallet/docs/guides/bridge).

## Installation

### Expo

```bash
# npm
npm install giwa-react-native-wallet expo-secure-store expo-local-authentication react-native-get-random-values

# yarn
yarn add giwa-react-native-wallet expo-secure-store expo-local-authentication react-native-get-random-values

# pnpm
pnpm add giwa-react-native-wallet expo-secure-store expo-local-authentication react-native-get-random-values
```

> **Tip**: You can also use `npx expo install` for automatic Expo SDK version compatibility.

### React Native CLI

```bash
# npm
npm install giwa-react-native-wallet react-native-keychain react-native-get-random-values

# yarn
yarn add giwa-react-native-wallet react-native-keychain react-native-get-random-values

# pnpm
pnpm add giwa-react-native-wallet react-native-keychain react-native-get-random-values
```

```bash
# iOS setup
cd ios && pod install
```

## Quick Start

### 1. Wrap your app with GiwaProvider

```tsx
import { GiwaProvider } from "giwa-react-native-wallet";

export default function App() {
  return (
    <GiwaProvider>
      {" "}
      {/* config is optional, defaults to testnet */}
      <YourApp />
    </GiwaProvider>
  );
}
```

### 2. Create or recover a wallet

```tsx
import { useGiwaWallet } from "giwa-react-native-wallet";

function WalletScreen() {
  const { wallet, createWallet, recoverWallet } = useGiwaWallet();

  // createWallet() - no parameters required
  const handleCreate = async () => {
    const { wallet, mnemonic } = await createWallet();
    console.log("Address:", wallet.address);
    // Save mnemonic securely!
  };

  return (
    <View>
      {wallet ? (
        <Text>Address: {wallet.address}</Text>
      ) : (
        <Button title="Create Wallet" onPress={handleCreate} />
      )}
    </View>
  );
}
```

### 3. Check balance

```tsx
import { useBalance } from "giwa-react-native-wallet";

function BalanceScreen() {
  // useBalance() - no parameters required, uses connected wallet
  const { formattedBalance, refetch } = useBalance();

  return (
    <View>
      <Text>Balance: {formattedBalance} ETH</Text>
      <Button title="Refresh" onPress={refetch} />
    </View>
  );
}
```

### 4. Send transactions

```tsx
import { useTransaction } from "giwa-react-native-wallet";

function SendScreen() {
  const { sendTransaction, waitForReceipt, isLoading } = useTransaction();

  const handleSend = async () => {
    const hash = await sendTransaction({
      to: "0x...",
      value: "0.1", // ETH
    });

    const receipt = await waitForReceipt(hash);
    console.log("Confirmed in block:", receipt.blockNumber);
  };

  return (
    <Button title="Send 0.1 ETH" onPress={handleSend} disabled={isLoading} />
  );
}
```

### 5. Use Flashblocks for fast confirmations

```tsx
import { useFlashblocks } from "giwa-react-native-wallet";

function FastTransactionScreen() {
  const { sendTransaction, getAverageLatency } = useFlashblocks();

  const handleSend = async () => {
    const { preconfirmation, result } = await sendTransaction({
      to: "0x...",
      value: BigInt("100000000000000000"), // 0.1 ETH in wei
    });

    console.log("Preconfirmed at:", preconfirmation.preconfirmedAt);

    const receipt = await result.wait();
    console.log("Confirmed at:", receipt.blockNumber);
    console.log("Average latency:", getAverageLatency(), "ms");
  };

  return <Button title="Fast Send" onPress={handleSend} />;
}
```

### 6. Resolve GIWA ID

```tsx
import { useGiwaId } from "giwa-react-native-wallet";

function GiwaIdScreen() {
  const { resolveAddress, resolveName } = useGiwaId();

  const handleResolve = async () => {
    // GIWA ID to address
    const address = await resolveAddress("alice.up.id");
    console.log("Address:", address);

    // Address to GIWA ID
    const name = await resolveName("0x...");
    console.log("Name:", name);
  };

  return <Button title="Resolve" onPress={handleResolve} />;
}
```

## API Reference

### Hooks

| Hook               | Description                                               | Status |
| ------------------ | --------------------------------------------------------- | ------ |
| `useGiwaWallet`    | Wallet management (create, recover, import, export)       | ✅ |
| `useBalance`       | ETH balance queries                                       | ✅ |
| `useTransaction`   | Send ETH transactions                                     | ✅ |
| `useTokens`        | ERC-20 token operations                                   | ✅ |
| `useBridge`        | L1↔L2 deposits/withdrawals (initiate, status, prove, finalize) | ✅ |
| `useFlashblocks`   | Fast preconfirmation transactions                         | ✅ |
| `useGiwaId`        | GIWA ID (up.id) resolution                                | ✅ |
| `useDojang`        | Attestation verification                                  | ✅ |
| `useFaucet`        | Testnet faucet                                            | ✅ |
| `useNetworkInfo`   | Network status and feature availability                   | ✅ |
| `useBiometricAuth` | Biometric authentication (Face ID, Touch ID, Fingerprint) | ✅ |

### Configuration (All Optional)

```tsx
// Minimal - all defaults
<GiwaProvider>
  <App />
</GiwaProvider>

// With options (all optional)
<GiwaProvider
  network="testnet"           // optional, default: 'testnet'
  initTimeout={10000}         // optional, default: 10000 (ms)
  onError={(e) => console.error(e)}  // optional
>
  <App />
</GiwaProvider>
```

### Custom Endpoints

You can override default network endpoints:

```tsx
<GiwaProvider
  config={{
    network: 'testnet',
    endpoints: {
      rpcUrl: 'https://my-custom-rpc.example.com',
      flashblocksRpcUrl: 'https://my-flashblocks-rpc.example.com',
      flashblocksWsUrl: 'wss://my-flashblocks-ws.example.com',
      explorerUrl: 'https://my-explorer.example.com',
      l1RpcUrl: 'https://my-ethereum-sepolia-rpc.example.com', // L1 (Ethereum) RPC - required for bridge deposits, proving and finalizing
    },
  }}
>
```

Access endpoints at runtime:

```tsx
import { useNetworkInfo } from "giwa-react-native-wallet";

function MyComponent() {
  const { rpcUrl, flashblocksRpcUrl, flashblocksWsUrl, explorerUrl } =
    useNetworkInfo();
  // Use the resolved endpoints
}
```

> `l1RpcUrl` has no network default and isn't exposed via `useNetworkInfo()` — read it back with `useBridge().isL1Configured` or `GiwaClient.getL1RpcUrl()`. See the [Bridge guide](https://dev-eyoungmin.github.io/giwa-react-native-wallet/docs/guides/bridge).

### Custom Network

`customNetwork` overrides the built-in network definition (chain id, name, currency, URLs) instead of just the endpoints — use it together with `endpoints`/`customContracts` when pointing the SDK at a non-default chain (e.g. a fork or a different GIWA deployment):

```tsx
<GiwaProvider
  config={{
    network: 'testnet',
    customNetwork: {
      id: 91342,
      rpcUrl: 'https://my-custom-rpc.example.com',
    },
  }}
>
```

On initialization, `GiwaProvider` calls `client.verifyChainId()` (fire-and-forget) to compare the RPC-reported chain id against `customNetwork.id` (or the built-in chain id). If they don't match, it logs a console warning (`Chain id mismatch: expected ... but RPC reports ...`) rather than throwing. A bare `new GiwaClient(...)` does not run this check automatically — call `verifyChainId()` yourself if you're not going through `GiwaProvider`:

```tsx
const client = new GiwaClient({ network: 'testnet' });
const { expected, actual, matches } = await client.verifyChainId();
```

## Network Selection

### Check Network Status and Feature Availability

```tsx
import { useNetworkInfo } from "giwa-react-native-wallet";

function NetworkStatus() {
  const {
    network,
    isTestnet,
    isReady,
    hasWarnings,
    warnings,
    isFeatureAvailable,
    unavailableFeatures,
  } = useNetworkInfo();

  return (
    <View>
      <Text>Network: {network}</Text>
      <Text>Testnet: {isTestnet ? "Yes" : "No"}</Text>
      <Text>Ready: {isReady ? "Yes" : "No"}</Text>

      {hasWarnings && (
        <View>
          <Text>Warnings:</Text>
          {warnings.map((w, i) => (
            <Text key={i}>- {w}</Text>
          ))}
        </View>
      )}

      {/* Check specific feature availability */}
      {!isFeatureAvailable("giwaId") && (
        <Text>GIWA ID is not available on this network</Text>
      )}
    </View>
  );
}
```

### Network Warnings

`getNetworkWarnings('testnet')` returns no warnings today — every testnet feature (`bridge`, `giwaId`, `dojang`, `faucet`, `flashblocks`, `tokens`) is `available`, and only `unavailable` features produce a warning.

On mainnet, where several contracts are still TBD, the SDK logs warnings on init:

```
[GIWA SDK] Network "mainnet" has 4 warning(s):
  1. [WARNING] Mainnet is not fully ready. 3 feature(s) unavailable due to TBD contracts.
  2. [WARNING] giwaId: up.id registry (UpnameRegistry) is TBD on this network
  3. [WARNING] dojang: Dojang contracts (DojangScroll/AttestationIndexer) are TBD on this network
  4. [WARNING] faucet: Faucet is only available on testnet
[GIWA SDK] Consider using "testnet" for development and testing.
```

## Network Information

### Testnet (GIWA Sepolia)

| Property              | Value                                     |
| --------------------- | ----------------------------------------- |
| Chain ID              | 91342                                     |
| RPC URL               | `https://sepolia-rpc.giwa.io`             |
| Flashblocks RPC       | `https://sepolia-rpc-flashblocks.giwa.io` |
| Flashblocks WebSocket | `wss://sepolia-rpc-flashblocks.giwa.io`   |
| Block Explorer        | `https://sepolia-explorer.giwa.io`        |
| Currency              | ETH                                       |

### Mainnet (🚧 Under Development)

> ⚠️ **Mainnet is currently under development.** Please use testnet.

| Property       | Value                |
| -------------- | -------------------- |
| Chain ID       | -                    |
| RPC URL        | -                    |
| Block Explorer | -                    |
| Status         | 🚧 Under Development |

## Security

- Private keys and mnemonics are stored in iOS Keychain / Android Keystore
- Biometric authentication support for sensitive operations
- Secure storage required - SDK will not work without it

## Testing

### Setup

```bash
# Install dev dependencies
npm install --save-dev jest @testing-library/react-native @testing-library/react-hooks

# For TypeScript
npm install --save-dev @types/jest ts-jest
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: "react-native",
  setupFilesAfterEnv: ["./jest.setup.js"],
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|@react-native|giwa-react-native-wallet)/)",
  ],
  moduleNameMapper: {
    "^giwa-react-native-wallet$":
      "<rootDir>/node_modules/giwa-react-native-wallet/dist/index.js",
  },
};
```

### Mock Setup

```typescript
// jest.setup.js
jest.mock("expo-secure-store", () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: "WHEN_UNLOCKED_THIS_DEVICE_ONLY",
}));

jest.mock("react-native-keychain", () => ({
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  getGenericPassword: jest.fn(() => Promise.resolve({ password: "test" })),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
  getSupportedBiometryType: jest.fn(() => Promise.resolve("FaceID")),
  ACCESS_CONTROL: { BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE: "BIOMETRY" },
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: "WHEN_UNLOCKED" },
  BIOMETRY_TYPE: { FACE_ID: "FaceID", TOUCH_ID: "TouchID" },
}));
```

### Unit Test Examples

#### Testing Wallet Creation

```typescript
// __tests__/wallet.test.ts
import { renderHook, act } from "@testing-library/react-hooks";
import { useGiwaWallet } from "giwa-react-native-wallet";
import { GiwaProvider } from "giwa-react-native-wallet";

const wrapper = ({ children }) => (
  <GiwaProvider config={{ network: "testnet" }}>{children}</GiwaProvider>
);

describe("useGiwaWallet", () => {
  it("should create a new wallet", async () => {
    const { result } = renderHook(() => useGiwaWallet(), { wrapper });

    await act(async () => {
      const { wallet, mnemonic } = await result.current.createWallet();
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(mnemonic.split(" ")).toHaveLength(12);
    });
  });

  it("should recover wallet from mnemonic", async () => {
    const { result } = renderHook(() => useGiwaWallet(), { wrapper });
    const testMnemonic =
      "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

    await act(async () => {
      const wallet = await result.current.recoverWallet(testMnemonic);
      expect(wallet.address).toBe("0x9858EfFD232B4033E47d90003D41EC34EcaEda94");
    });
  });

  it("should throw error for invalid mnemonic", async () => {
    const { result } = renderHook(() => useGiwaWallet(), { wrapper });

    await expect(
      result.current.recoverWallet("invalid mnemonic phrase")
    ).rejects.toThrow("Invalid recovery phrase.");
  });
});
```

#### Testing Balance Hook

```typescript
// __tests__/balance.test.ts
import { renderHook, waitFor } from "@testing-library/react-hooks";
import { useBalance } from "giwa-react-native-wallet";

// Mock viem client
jest.mock("viem", () => ({
  ...jest.requireActual("viem"),
  createPublicClient: () => ({
    getBalance: jest.fn(() => Promise.resolve(BigInt("1000000000000000000"))),
  }),
}));

describe("useBalance", () => {
  it("should fetch ETH balance", async () => {
    const { result } = renderHook(() => useBalance("0x1234..."), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.formattedBalance).toBe("1.0");
    expect(result.current.balance).toBe(BigInt("1000000000000000000"));
  });
});
```

#### Testing Token Transfer

```typescript
// __tests__/tokens.test.ts
import { renderHook, act } from "@testing-library/react-hooks";
import { useTokens } from "giwa-react-native-wallet";

describe("useTokens", () => {
  it("should transfer tokens", async () => {
    const { result } = renderHook(() => useTokens(), { wrapper });

    await act(async () => {
      const hash = await result.current.transfer(
        "0xTokenAddress...",
        "0xRecipient...",
        "100"
      );
      expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });
  });

  it("should get token balance", async () => {
    const { result } = renderHook(() => useTokens(), { wrapper });

    await act(async () => {
      const balance = await result.current.getBalance("0xTokenAddress...");
      expect(balance.token.symbol).toBeDefined();
      expect(balance.formattedBalance).toBeDefined();
    });
  });
});
```

#### Testing GIWA ID Resolution

```typescript
// __tests__/giwaId.test.ts
import { renderHook, act } from "@testing-library/react-hooks";
import { useGiwaId } from "giwa-react-native-wallet";

describe("useGiwaId", () => {
  it("should resolve GIWA ID to address", async () => {
    const { result } = renderHook(() => useGiwaId(), { wrapper });

    await act(async () => {
      const address = await result.current.resolveAddress("alice.up.id");
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  it("should return null for non-existent GIWA ID", async () => {
    const { result } = renderHook(() => useGiwaId(), { wrapper });

    await act(async () => {
      const address = await result.current.resolveAddress(
        "nonexistent.up.id"
      );
      expect(address).toBeNull();
    });
  });
});
```

### Integration Test Example

```typescript
// __tests__/integration/fullFlow.test.ts
import { renderHook, act } from "@testing-library/react-hooks";
import {
  useGiwaWallet,
  useBalance,
  useTransaction,
} from "giwa-react-native-wallet";

describe("Full Wallet Flow", () => {
  it("should complete full transaction flow", async () => {
    // 1. Create wallet
    const { result: walletResult } = renderHook(() => useGiwaWallet(), {
      wrapper,
    });

    let walletAddress: string;
    await act(async () => {
      const { wallet } = await walletResult.current.createWallet();
      walletAddress = wallet.address;
    });

    // 2. Check balance
    const { result: balanceResult } = renderHook(
      () => useBalance(walletAddress),
      { wrapper }
    );

    await waitFor(() => {
      expect(balanceResult.current.balance).toBeDefined();
    });

    // 3. Send transaction (if balance > 0)
    if (balanceResult.current.balance > 0n) {
      const { result: txResult } = renderHook(() => useTransaction(), {
        wrapper,
      });

      await act(async () => {
        const hash = await txResult.current.sendTransaction({
          to: "0xRecipient...",
          value: "0.001",
        });
        expect(hash).toBeDefined();
      });
    }
  });
});
```

### E2E Test with Detox (Optional)

```typescript
// e2e/wallet.e2e.ts
describe("Wallet E2E", () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it("should create wallet and show address", async () => {
    await element(by.id("create-wallet-button")).tap();
    await expect(element(by.id("wallet-address"))).toBeVisible();
  });

  it("should show balance after wallet creation", async () => {
    await expect(element(by.id("balance-display"))).toBeVisible();
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- wallet.test.ts

# Run in watch mode
npm test -- --watch
```

### Verification (Live)

`pnpm verify:live` runs `scripts/verify-live.ts` against live GIWA Sepolia — it exercises `GiwaClient`, `DojangManager`, and `GiwaIdManager` read paths (chain id, feature availability, contract addresses, op-stack chain wiring, up.id resolution, Dojang attestations) with no mocks. It does not call `depositETH`/`depositToken`/`proveWithdrawal`/`finalizeWithdrawal` — those require funded L1 and L2 accounts and are verified manually instead.

```bash
pnpm verify:live
```

## Requirements

- React >= 19.0.0
- React Native >= 0.77.0
- Expo SDK >= 53 (for Expo projects)
- expo-secure-store >= 15.0.0 (Expo)
- expo-local-authentication >= 14.0.0 (Expo, for biometrics)
- react-native-keychain >= 9.2.0 (React Native CLI)
- react-native-get-random-values >= 1.11.0

## GIWA Official Resources

| Resource                 | URL                                                       |
| ------------------------ | --------------------------------------------------------- |
| GIWA Documentation       | https://docs.giwa.io                                      |
| SDK Documentation        | https://dev-eyoungmin.github.io/giwa-react-native-wallet/ |
| Sample App (GitHub)      | https://github.com/dev-eyoungmin/giwa-react-native-samples |
| Testnet Faucet           | https://faucet.giwa.io                                    |
| Block Explorer (Testnet) | https://sepolia-explorer.giwa.io                          |
| Block Explorer (Mainnet) | -                                                         |
| Bridge (Superbridge)     | https://superbridge.app                                   |

## License

MIT
