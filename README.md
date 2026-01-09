# @giwa/react-native-wallet

GIWA Chain SDK for React Native - Expo and React Native CLI compatible

## Features

- Wallet creation and recovery (mnemonic/private key)
- ETH and ERC-20 token transfers
- L1↔L2 Bridge operations
- Flashblocks (~200ms preconfirmation)
- GIWA ID (ENS-based naming)
- Dojang (EAS-based attestation)
- Secure storage (iOS Keychain / Android Keystore)
- Biometric authentication support

## Installation

### Expo

```bash
npx expo install @giwa/react-native-wallet expo-secure-store
```

### React Native CLI

```bash
npm install @giwa/react-native-wallet react-native-keychain
cd ios && pod install
```

## Quick Start

### 1. Wrap your app with GiwaProvider

```tsx
import { GiwaProvider } from '@giwa/react-native-wallet';

export default function App() {
  return (
    <GiwaProvider config={{ network: 'testnet' }}>
      <YourApp />
    </GiwaProvider>
  );
}
```

### 2. Create or recover a wallet

```tsx
import { useGiwaWallet } from '@giwa/react-native-wallet';

function WalletScreen() {
  const { wallet, createWallet, recoverWallet, isLoading } = useGiwaWallet();

  const handleCreate = async () => {
    const { wallet, mnemonic } = await createWallet();
    console.log('Address:', wallet.address);
    console.log('Mnemonic:', mnemonic); // Save this securely!
  };

  const handleRecover = async () => {
    const mnemonic = 'your twelve word mnemonic phrase here...';
    const recoveredWallet = await recoverWallet(mnemonic);
    console.log('Recovered:', recoveredWallet.address);
  };

  return (
    <View>
      {wallet ? (
        <Text>Address: {wallet.address}</Text>
      ) : (
        <>
          <Button title="Create Wallet" onPress={handleCreate} />
          <Button title="Recover Wallet" onPress={handleRecover} />
        </>
      )}
    </View>
  );
}
```

### 3. Check balance

```tsx
import { useBalance } from '@giwa/react-native-wallet';

function BalanceScreen() {
  const { balance, formattedBalance, isLoading, refetch } = useBalance();

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
import { useTransaction } from '@giwa/react-native-wallet';

function SendScreen() {
  const { sendTransaction, waitForReceipt, isLoading } = useTransaction();

  const handleSend = async () => {
    const hash = await sendTransaction({
      to: '0x...',
      value: '0.1', // ETH
    });

    const receipt = await waitForReceipt(hash);
    console.log('Confirmed in block:', receipt.blockNumber);
  };

  return <Button title="Send 0.1 ETH" onPress={handleSend} disabled={isLoading} />;
}
```

### 5. Use Flashblocks for fast confirmations

```tsx
import { useFlashblocks } from '@giwa/react-native-wallet';

function FastTransactionScreen() {
  const { sendTransaction, getAverageLatency } = useFlashblocks();

  const handleSend = async () => {
    const { preconfirmation, result } = await sendTransaction({
      to: '0x...',
      value: BigInt('100000000000000000'), // 0.1 ETH in wei
    });

    console.log('Preconfirmed at:', preconfirmation.preconfirmedAt);

    const receipt = await result.wait();
    console.log('Confirmed at:', receipt.blockNumber);
    console.log('Average latency:', getAverageLatency(), 'ms');
  };

  return <Button title="Fast Send" onPress={handleSend} />;
}
```

### 6. Resolve GIWA ID

```tsx
import { useGiwaId } from '@giwa/react-native-wallet';

function GiwaIdScreen() {
  const { resolveAddress, resolveName } = useGiwaId();

  const handleResolve = async () => {
    // GIWA ID to address
    const address = await resolveAddress('alice.giwa.id');
    console.log('Address:', address);

    // Address to GIWA ID
    const name = await resolveName('0x...');
    console.log('Name:', name);
  };

  return <Button title="Resolve" onPress={handleResolve} />;
}
```

## API Reference

### Hooks

| Hook | Description |
|------|-------------|
| `useGiwaWallet` | Wallet management (create, recover, import, export) |
| `useBalance` | ETH balance queries |
| `useTransaction` | Send ETH transactions |
| `useTokens` | ERC-20 token operations |
| `useBridge` | L1↔L2 bridge operations |
| `useFlashblocks` | Fast preconfirmation transactions |
| `useGiwaId` | GIWA ID (ENS) resolution |
| `useDojang` | Attestation verification |
| `useFaucet` | Testnet faucet |
| `useNetworkInfo` | Network status and feature availability |

### Configuration

```tsx
<GiwaProvider
  config={{
    network: 'testnet', // 'testnet' | 'mainnet'
    autoConnect: true, // Auto-load wallet on startup
    enableFlashblocks: true, // Enable fast confirmations
  }}
>
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
    },
  }}
>
```

Access endpoints at runtime:

```tsx
import { useNetworkInfo } from '@giwa/react-native-wallet';

function MyComponent() {
  const { rpcUrl, flashblocksRpcUrl, flashblocksWsUrl, explorerUrl } = useNetworkInfo();
  // Use the resolved endpoints
}
```

## Network Selection

### Check Network Status and Feature Availability

```tsx
import { useNetworkInfo } from '@giwa/react-native-wallet';

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
      <Text>Testnet: {isTestnet ? 'Yes' : 'No'}</Text>
      <Text>Ready: {isReady ? 'Yes' : 'No'}</Text>

      {hasWarnings && (
        <View>
          <Text>Warnings:</Text>
          {warnings.map((w, i) => <Text key={i}>- {w}</Text>)}
        </View>
      )}

      {/* Check specific feature availability */}
      {!isFeatureAvailable('giwaId') && (
        <Text>GIWA ID is not available on this network</Text>
      )}
    </View>
  );
}
```

### Network Warnings

When using mainnet with TBD (not yet deployed) contracts, the SDK will log warnings:

```
[GIWA SDK] Network "mainnet" has 4 warning(s):
  1. [WARNING] Mainnet is not fully ready. 4 feature(s) unavailable.
  2. [WARNING] bridge: L1 Bridge contract is TBD
  3. [WARNING] giwaId: ENS Registry/Resolver contracts are TBD
  4. [WARNING] dojang: EAS/Schema Registry contracts are TBD
[GIWA SDK] Consider using "testnet" for development and testing.
```

## Network Information

### Testnet (GIWA Sepolia)

| Property | Value |
|----------|-------|
| Chain ID | 91342 |
| RPC URL | `https://sepolia-rpc.giwa.io` |
| Flashblocks RPC | `https://sepolia-rpc-flashblocks.giwa.io` |
| Flashblocks WebSocket | `wss://sepolia-rpc-flashblocks.giwa.io` |
| Block Explorer | `https://sepolia-explorer.giwa.io` |
| Currency | ETH |

### Mainnet (Coming Soon)

| Property | Value |
|----------|-------|
| Chain ID | 91341 (TBD) |
| RPC URL | `https://rpc.giwa.io` |
| Flashblocks RPC | `https://rpc-flashblocks.giwa.io` |
| Flashblocks WebSocket | `wss://rpc-flashblocks.giwa.io` |
| Block Explorer | `https://explorer.giwa.io` |
| Currency | ETH |

> **Note**: Mainnet contracts are not yet deployed. Use `testnet` for development.

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
  preset: 'react-native',
  setupFilesAfterEnv: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@giwa/react-native-wallet)/)',
  ],
  moduleNameMapper: {
    '^@giwa/react-native-wallet$': '<rootDir>/node_modules/@giwa/react-native-wallet/dist/index.js',
  },
};
```

### Mock Setup

```typescript
// jest.setup.js
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
}));

jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  getGenericPassword: jest.fn(() => Promise.resolve({ password: 'test' })),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
  getSupportedBiometryType: jest.fn(() => Promise.resolve('FaceID')),
  ACCESS_CONTROL: { BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE: 'BIOMETRY' },
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED' },
  BIOMETRY_TYPE: { FACE_ID: 'FaceID', TOUCH_ID: 'TouchID' },
}));
```

### Unit Test Examples

#### Testing Wallet Creation

```typescript
// __tests__/wallet.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useGiwaWallet } from '@giwa/react-native-wallet';
import { GiwaProvider } from '@giwa/react-native-wallet';

const wrapper = ({ children }) => (
  <GiwaProvider config={{ network: 'testnet' }}>
    {children}
  </GiwaProvider>
);

describe('useGiwaWallet', () => {
  it('should create a new wallet', async () => {
    const { result } = renderHook(() => useGiwaWallet(), { wrapper });

    await act(async () => {
      const { wallet, mnemonic } = await result.current.createWallet();
      expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      expect(mnemonic.split(' ')).toHaveLength(12);
    });
  });

  it('should recover wallet from mnemonic', async () => {
    const { result } = renderHook(() => useGiwaWallet(), { wrapper });
    const testMnemonic = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

    await act(async () => {
      const wallet = await result.current.recoverWallet(testMnemonic);
      expect(wallet.address).toBe('0x9858EfFD232B4033E47d90003D41EC34EcaEda94');
    });
  });

  it('should throw error for invalid mnemonic', async () => {
    const { result } = renderHook(() => useGiwaWallet(), { wrapper });

    await expect(
      result.current.recoverWallet('invalid mnemonic phrase')
    ).rejects.toThrow('Invalid recovery phrase.');
  });
});
```

#### Testing Balance Hook

```typescript
// __tests__/balance.test.ts
import { renderHook, waitFor } from '@testing-library/react-hooks';
import { useBalance } from '@giwa/react-native-wallet';

// Mock viem client
jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  createPublicClient: () => ({
    getBalance: jest.fn(() => Promise.resolve(BigInt('1000000000000000000'))),
  }),
}));

describe('useBalance', () => {
  it('should fetch ETH balance', async () => {
    const { result } = renderHook(() => useBalance('0x1234...'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.formattedBalance).toBe('1.0');
    expect(result.current.balance).toBe(BigInt('1000000000000000000'));
  });
});
```

#### Testing Token Transfer

```typescript
// __tests__/tokens.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useTokens } from '@giwa/react-native-wallet';

describe('useTokens', () => {
  it('should transfer tokens', async () => {
    const { result } = renderHook(() => useTokens(), { wrapper });

    await act(async () => {
      const hash = await result.current.transfer(
        '0xTokenAddress...',
        '0xRecipient...',
        '100'
      );
      expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });
  });

  it('should get token balance', async () => {
    const { result } = renderHook(() => useTokens(), { wrapper });

    await act(async () => {
      const balance = await result.current.getBalance('0xTokenAddress...');
      expect(balance.token.symbol).toBeDefined();
      expect(balance.formattedBalance).toBeDefined();
    });
  });
});
```

#### Testing GIWA ID Resolution

```typescript
// __tests__/giwaId.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useGiwaId } from '@giwa/react-native-wallet';

describe('useGiwaId', () => {
  it('should resolve GIWA ID to address', async () => {
    const { result } = renderHook(() => useGiwaId(), { wrapper });

    await act(async () => {
      const address = await result.current.resolveAddress('alice.giwa.id');
      expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
    });
  });

  it('should return null for non-existent GIWA ID', async () => {
    const { result } = renderHook(() => useGiwaId(), { wrapper });

    await act(async () => {
      const address = await result.current.resolveAddress('nonexistent.giwa.id');
      expect(address).toBeNull();
    });
  });
});
```

### Integration Test Example

```typescript
// __tests__/integration/fullFlow.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import {
  useGiwaWallet,
  useBalance,
  useTransaction,
} from '@giwa/react-native-wallet';

describe('Full Wallet Flow', () => {
  it('should complete full transaction flow', async () => {
    // 1. Create wallet
    const { result: walletResult } = renderHook(() => useGiwaWallet(), { wrapper });

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
      const { result: txResult } = renderHook(() => useTransaction(), { wrapper });

      await act(async () => {
        const hash = await txResult.current.sendTransaction({
          to: '0xRecipient...',
          value: '0.001',
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
describe('Wallet E2E', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should create wallet and show address', async () => {
    await element(by.id('create-wallet-button')).tap();
    await expect(element(by.id('wallet-address'))).toBeVisible();
  });

  it('should show balance after wallet creation', async () => {
    await expect(element(by.id('balance-display'))).toBeVisible();
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

## Requirements

- React >= 19.0.0
- React Native >= 0.77.0
- Expo SDK >= 53 (for Expo projects)
- expo-secure-store >= 15.0.0 (Expo)
- react-native-keychain >= 9.2.0 (React Native CLI)

## License

MIT
