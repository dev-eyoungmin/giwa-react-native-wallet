---
sidebar_position: 2
---

# Transactions

This guide explains how to send ETH and process transactions.

## useTransaction Hook

```tsx
import { useTransaction } from '@giwa/react-native-wallet';

function TransactionScreen() {
  const {
    sendTransaction,   // Send transaction
    waitForReceipt,    // Wait for receipt
    estimateGas,       // Estimate gas
    getTransaction,    // Get transaction
    isLoading,         // Loading state
    error,             // Error information
  } = useTransaction();

  // ...
}
```

## Basic ETH Transfer

```tsx
const handleSend = async () => {
  try {
    const hash = await sendTransaction({
      to: '0x1234...5678',
      value: '0.1', // ETH unit
    });

    console.log('Transaction hash:', hash);

    // Wait for receipt (block confirmation)
    const receipt = await waitForReceipt(hash);
    console.log('Confirmed block:', receipt.blockNumber);
  } catch (error) {
    console.error('Transfer failed:', error.message);
  }
};
```

## Gas Estimation

```tsx
const handleEstimate = async () => {
  const gas = await estimateGas({
    to: '0x1234...5678',
    value: '0.1',
  });

  console.log('Estimated gas:', gas.gasLimit.toString());
  console.log('Gas price:', gas.gasPrice.toString());
  console.log('Estimated fee:', gas.estimatedFee); // ETH unit
};
```

## Advanced Transaction Options

```tsx
const hash = await sendTransaction({
  to: '0x1234...5678',
  value: '0.1',
  // Optional options
  gasLimit: 21000n,
  gasPrice: 1000000000n, // 1 Gwei
  nonce: 5,
  data: '0x...', // Contract call data
});
```

## Check Transaction Status

```tsx
const checkStatus = async (hash: string) => {
  const tx = await getTransaction(hash);

  if (!tx) {
    console.log('Transaction not found');
    return;
  }

  if (tx.blockNumber) {
    console.log('Confirmed - Block:', tx.blockNumber);
  } else {
    console.log('Pending...');
  }
};
```

## Wait for Transaction Confirmation

```tsx
// Default wait (1 confirmation)
const receipt = await waitForReceipt(hash);

// Wait for multiple confirmations
const receipt = await waitForReceipt(hash, {
  confirmations: 3, // Wait for 3 block confirmations
  timeout: 60000,   // 60 second timeout
});
```

## Error Handling

```tsx
import { GiwaTransactionError, ErrorCodes } from '@giwa/react-native-wallet';

try {
  await sendTransaction({ to, value });
} catch (error) {
  if (error instanceof GiwaTransactionError) {
    switch (error.code) {
      case ErrorCodes.INSUFFICIENT_FUNDS:
        Alert.alert('Insufficient Balance', 'Not enough balance to send');
        break;
      case ErrorCodes.INVALID_ADDRESS:
        Alert.alert('Address Error', 'Invalid address');
        break;
      case ErrorCodes.NONCE_TOO_LOW:
        Alert.alert('Error', 'Transaction nonce is too low');
        break;
      case ErrorCodes.GAS_TOO_LOW:
        Alert.alert('Insufficient Gas', 'Gas limit is too low');
        break;
      default:
        Alert.alert('Transfer Failed', error.message);
    }
  }
}
```

## Complete Example: Send Screen

```tsx
import { useState } from 'react';
import { View, Text, TextInput, Button, Alert, ActivityIndicator } from 'react-native';
import { useTransaction, useBalance } from '@giwa/react-native-wallet';

export function SendScreen() {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');

  const { sendTransaction, waitForReceipt, estimateGas, isLoading } = useTransaction();
  const { formattedBalance } = useBalance();

  const handleEstimate = async () => {
    if (!to || !amount) return;

    try {
      const gas = await estimateGas({ to, value: amount });
      Alert.alert('Estimated Fee', `${gas.estimatedFee} ETH`);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSend = async () => {
    if (!to || !amount) {
      Alert.alert('Input Required', 'Please enter address and amount');
      return;
    }

    try {
      const hash = await sendTransaction({ to, value: amount });
      setTxHash(hash);

      Alert.alert('Sending', `Hash: ${hash.slice(0, 20)}...`);

      const receipt = await waitForReceipt(hash);
      Alert.alert('Complete', `Confirmed at block ${receipt.blockNumber}`);
    } catch (error) {
      Alert.alert('Transfer Failed', error.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ marginBottom: 10 }}>Balance: {formattedBalance} ETH</Text>

      <TextInput
        placeholder="Recipient address (0x...)"
        value={to}
        onChangeText={setTo}
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 12,
          marginBottom: 10,
          borderRadius: 8,
        }}
      />

      <TextInput
        placeholder="Amount (ETH)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 12,
          marginBottom: 10,
          borderRadius: 8,
        }}
      />

      <Button title="Check Fee" onPress={handleEstimate} disabled={isLoading} />

      <View style={{ marginTop: 10 }}>
        <Button
          title={isLoading ? 'Sending...' : 'Send'}
          onPress={handleSend}
          disabled={isLoading || !to || !amount}
        />
      </View>

      {txHash && (
        <Text style={{ marginTop: 20, fontFamily: 'monospace', fontSize: 12 }}>
          Recent TX: {txHash}
        </Text>
      )}
    </View>
  );
}
```

## Next Steps

- [Tokens](/docs/guides/tokens) - ERC-20 token transfers
- [Flashblocks](/docs/guides/flashblocks) - Fast transaction confirmation
- [Bridge](/docs/guides/bridge) - L1↔L2 asset transfers
