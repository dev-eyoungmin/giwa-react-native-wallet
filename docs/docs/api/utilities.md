---
sidebar_position: 5
---

# Utilities

Utility functions and helper hooks provided by GIWA SDK.

## Viem Re-exports

The SDK re-exports commonly used `viem` utilities for convenience. You don't need to install `viem` separately.

```tsx
import {
  parseEther,
  formatEther,
  parseUnits,
  formatUnits,
  isAddress,
  getAddress,
} from 'giwa-react-native-wallet';
```

### parseEther

Converts ETH string to wei (bigint).

```tsx
const wei = parseEther('1.5'); // 1500000000000000000n
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | `string` | ETH amount as string |
| **Returns** | `bigint` | Amount in wei |

### formatEther

Converts wei (bigint) to ETH string.

```tsx
const eth = formatEther(1500000000000000000n); // '1.5'
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | `bigint` | Amount in wei |
| **Returns** | `string` | ETH amount as string |

### parseUnits

Converts token amount string to smallest unit.

```tsx
// USDC has 6 decimals
const amount = parseUnits('100', 6); // 100000000n
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | `string` | Token amount as string |
| `decimals` | `number` | Token decimals |
| **Returns** | `bigint` | Amount in smallest unit |

### formatUnits

Converts smallest unit to token amount string.

```tsx
const amount = formatUnits(100000000n, 6); // '100'
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | `bigint` | Amount in smallest unit |
| `decimals` | `number` | Token decimals |
| **Returns** | `string` | Token amount as string |

### isAddress

Validates if string is a valid Ethereum address.

```tsx
isAddress('0x1234567890123456789012345678901234567890'); // true
isAddress('invalid'); // false
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `address` | `string` | Address to validate |
| **Returns** | `boolean` | Whether address is valid |

### getAddress

Returns checksummed address.

```tsx
const checksummed = getAddress('0x1234...'); // '0x1234...' (with correct checksum)
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `address` | `string` | Address to checksum |
| **Returns** | `` `0x${string}` `` | Checksummed address |

---

## Helper Hooks

Shared hooks for building custom async operations.

### useAsyncAction

Manages loading and error state for a single async action.

```tsx
import { useAsyncAction } from 'giwa-react-native-wallet';

function MyComponent() {
  const { execute, isLoading, error, reset } = useAsyncAction(
    async (amount: string) => {
      // Your async operation
      return await myAsyncFunction(amount);
    },
    {
      onSuccess: (result) => console.log('Success:', result),
      onError: (error) => console.error('Error:', error),
    }
  );

  return (
    <Button
      title={isLoading ? 'Processing...' : 'Execute'}
      onPress={() => execute('1.0')}
      disabled={isLoading}
    />
  );
}
```

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `action` | `(...args: TArgs) => Promise<TResult>` | Yes | Async function to execute |
| `options.onSuccess` | `(result: TResult) => void` | No | Success callback |
| `options.onError` | `(error: Error) => void` | No | Error callback |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `execute` | `(...args: TArgs) => Promise<TResult>` | Execute the action |
| `isLoading` | `boolean` | Loading state |
| `error` | `Error \| null` | Error if failed |
| `reset` | `() => void` | Reset loading and error state |

---

### useAsyncActions

Manages multiple async actions as a group.

```tsx
import { useAsyncActions } from 'giwa-react-native-wallet';

function BridgeComponent() {
  const actions = useAsyncActions({
    withdraw: async (amount: string) => await bridgeManager.withdraw(amount),
    deposit: async (amount: string) => await bridgeManager.deposit(amount),
  });

  return (
    <>
      <Button
        title={actions.withdraw.isLoading ? 'Withdrawing...' : 'Withdraw'}
        onPress={() => actions.withdraw.execute('1.0')}
        disabled={actions.withdraw.isLoading}
      />
      <Button
        title={actions.deposit.isLoading ? 'Depositing...' : 'Deposit'}
        onPress={() => actions.deposit.execute('1.0')}
        disabled={actions.deposit.isLoading}
      />
    </>
  );
}
```

#### Parameters

| Name | Type | Required | Description |
|------|------|----------|-------------|
| `actions` | `Record<string, (...args) => Promise<unknown>>` | Yes | Object of async functions |

#### Returns

Object with same keys as input, each containing:

| Property | Type | Description |
|----------|------|-------------|
| `execute` | `(...args) => Promise<TResult>` | Execute this action |
| `isLoading` | `boolean` | Loading state for this action |
| `error` | `Error \| null` | Error if this action failed |
| `reset` | `() => void` | Reset this action's state |

---

### useAsyncQuery

Manages data fetching with auto-fetch and refetch support.

```tsx
import { useAsyncQuery } from 'giwa-react-native-wallet';

function BalanceDisplay({ address }: { address: string }) {
  const { data, isLoading, error, refetch } = useAsyncQuery(
    () => tokenManager.getBalance(address),
    {
      enabled: !!address,
      refetchInterval: 30000, // Refetch every 30 seconds
      onSuccess: (balance) => console.log('Balance updated:', balance),
    }
  );

  if (isLoading) return <Text>Loading...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <View>
      <Text>Balance: {data}</Text>
      <Button title="Refresh" onPress={refetch} />
    </View>
  );
}
```

#### Parameters

| Name | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `queryFn` | `() => Promise<T>` | Yes | - | Async function to fetch data |
| `options.enabled` | `boolean` | No | `true` | Whether query is enabled |
| `options.initialData` | `T` | No | `null` | Initial data value |
| `options.refetchInterval` | `number` | No | - | Auto refetch interval (ms) |
| `options.onSuccess` | `(data: T) => void` | No | - | Success callback |
| `options.onError` | `(error: Error) => void` | No | - | Error callback |

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `data` | `T \| null` | Fetched data |
| `isLoading` | `boolean` | Loading state |
| `error` | `Error \| null` | Error if failed |
| `refetch` | `() => Promise<void>` | Manually trigger refetch |
| `reset` | `() => void` | Reset to initial state |

---

## Error Classes

GIWA SDK provides specialized error classes for different error types.

```tsx
import {
  GiwaError,
  GiwaSecurityError,
  GiwaNetworkError,
  GiwaWalletError,
  GiwaTransactionError,
  GiwaFeatureUnavailableError,
} from 'giwa-react-native-wallet';
```

### Error Class Hierarchy

| Class | Code | Description |
|-------|------|-------------|
| `GiwaError` | Various | Base error class |
| `GiwaSecurityError` | `SECURITY_ERROR` | Security-related errors (biometric, storage) |
| `GiwaNetworkError` | `NETWORK_ERROR` | Network/RPC errors |
| `GiwaWalletError` | `WALLET_ERROR` | Wallet operation errors |
| `GiwaTransactionError` | `TRANSACTION_ERROR` | Transaction errors |
| `GiwaFeatureUnavailableError` | `FEATURE_UNAVAILABLE` | Feature not available on network |

### Error Handling Example

```tsx
import {
  GiwaSecurityError,
  GiwaWalletError,
  GiwaTransactionError,
  ErrorCodes,
} from 'giwa-react-native-wallet';

try {
  await sendTransaction({ to: '0x...', value: '1.0' });
} catch (error) {
  if (error instanceof GiwaSecurityError) {
    if (error.code === ErrorCodes.BIOMETRIC_FAILED) {
      Alert.alert('Authentication Failed', 'Please try again');
    } else if (error.code === ErrorCodes.RATE_LIMIT_EXCEEDED) {
      Alert.alert('Rate Limited', 'Please wait before trying again');
    }
  } else if (error instanceof GiwaWalletError) {
    Alert.alert('Wallet Error', error.message);
  } else if (error instanceof GiwaTransactionError) {
    if (error.code === ErrorCodes.INSUFFICIENT_BALANCE) {
      Alert.alert('Insufficient Balance', 'Not enough ETH to send');
    }
  }
}
```

---

## Error Codes

All available error codes:

```tsx
import { ErrorCodes } from 'giwa-react-native-wallet';
```

### Security Errors

| Code | Description |
|------|-------------|
| `SECURE_STORAGE_UNAVAILABLE` | Secure storage not available |
| `BIOMETRIC_NOT_AVAILABLE` | Biometric hardware not available |
| `BIOMETRIC_NOT_ENROLLED` | No biometrics enrolled on device |
| `BIOMETRIC_FAILED` | Biometric authentication failed |
| `RATE_LIMIT_EXCEEDED` | Too many attempts, rate limited |
| `INVALID_RPC_URL` | Invalid RPC URL format |
| `INVALID_ADDRESS` | Invalid Ethereum address |
| `INVALID_AMOUNT` | Invalid amount format |

### Wallet Errors

| Code | Description |
|------|-------------|
| `WALLET_NOT_FOUND` | No wallet found in storage |
| `WALLET_ALREADY_EXISTS` | Wallet already exists |
| `INVALID_MNEMONIC` | Invalid recovery phrase |
| `INVALID_PRIVATE_KEY` | Invalid private key format |

### Transaction Errors

| Code | Description |
|------|-------------|
| `INSUFFICIENT_BALANCE` | Not enough balance |
| `TRANSACTION_FAILED` | Transaction failed |
| `GAS_ESTIMATION_FAILED` | Failed to estimate gas |

### Network Errors

| Code | Description |
|------|-------------|
| `RPC_ERROR` | RPC call failed |
| `NETWORK_UNAVAILABLE` | Network not reachable |
| `FEATURE_UNAVAILABLE` | Feature not available on network |
| `NETWORK_NOT_READY` | Network not ready for use |
| `TBD_CONTRACT` | Contract not yet deployed |

### Bridge Errors

| Code | Description |
|------|-------------|
| `BRIDGE_DEPOSIT_FAILED` | Bridge deposit failed |
| `BRIDGE_WITHDRAW_FAILED` | Bridge withdrawal failed |

---

## Network Validator Utils

Utilities for checking network status and feature availability.

```tsx
import {
  getNetworkStatus,
  getFeatureAvailability,
  isTbdAddress,
} from 'giwa-react-native-wallet';
```

### getNetworkStatus

Get comprehensive network status.

```tsx
const status = getNetworkStatus('testnet');
// {
//   network: 'testnet',
//   readiness: 'ready',
//   isTestnet: true,
//   hasWarnings: false,
//   warnings: [],
//   features: { bridge: {...}, giwaId: {...}, ... }
// }
```

### getFeatureAvailability

Check if a specific feature is available.

```tsx
const bridgeStatus = getFeatureAvailability('bridge', 'mainnet');
// {
//   name: 'bridge',
//   status: 'unavailable',
//   reason: 'L1 Bridge contract is TBD'
// }
```

### isTbdAddress

Check if an address is a TBD placeholder.

```tsx
isTbdAddress('0xTBD'); // true
isTbdAddress('0x1234...'); // false
```

---

## Environment Detection

```tsx
import { detectEnvironment } from 'giwa-react-native-wallet';

const env = await detectEnvironment();
// 'expo' | 'react-native' | 'unsupported'
```

| Return Value | Description |
|--------------|-------------|
| `'expo'` | Running in Expo with expo-secure-store |
| `'react-native'` | Running in React Native CLI with react-native-keychain |
| `'unsupported'` | No secure storage available |
