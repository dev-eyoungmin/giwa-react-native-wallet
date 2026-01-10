---
sidebar_position: 5
---

# Flashblocks

This guide explains the ~200ms fast transaction preconfirmation feature.

## What is Flashblocks?

Flashblocks is a unique feature of GIWA Chain that provides preconfirmation within ~200ms before a transaction is included in a block. This allows users to receive nearly instant transaction feedback.

```
Regular Transaction:    TX → Block Confirmation (2-12 seconds)
Flashblocks:           TX → Preconfirmation (200ms) → Block Confirmation (2-12 seconds)
```

## useFlashblocks Hook

```tsx
import { useFlashblocks } from '@giwa/react-native-wallet';

function FastTransactionScreen() {
  const {
    sendTransaction,     // Send Flashblocks transaction
    getAverageLatency,   // Average latency
    isAvailable,         // Flashblocks availability
    isLoading,
  } = useFlashblocks();

  // ...
}
```

## Send Flashblocks Transaction

```tsx
const handleFastSend = async () => {
  try {
    const { preconfirmation, result } = await sendTransaction({
      to: '0x...',
      value: BigInt('100000000000000000'), // 0.1 ETH (in wei)
    });

    // 1. Preconfirmation (instant, ~200ms)
    console.log('Preconfirmed!');
    console.log('Time:', preconfirmation.preconfirmedAt);
    console.log('Latency:', preconfirmation.latencyMs, 'ms');

    // UI update - instant feedback to user
    showSuccessAnimation();

    // 2. Block confirmation (wait in background)
    const receipt = await result.wait();
    console.log('Block confirmed:', receipt.blockNumber);

  } catch (error) {
    console.error('Transfer failed:', error.message);
  }
};
```

## Preconfirmation Data

```tsx
interface Preconfirmation {
  txHash: string;           // Transaction hash
  preconfirmedAt: number;   // Preconfirmation timestamp
  latencyMs: number;        // Latency in milliseconds
  sequencerSignature: string; // Sequencer signature
}
```

## Check Average Latency

```tsx
const displayLatency = () => {
  const latency = getAverageLatency();
  console.log('Average Flashblocks latency:', latency, 'ms');
};
```

## Check Flashblocks Availability

```tsx
const checkAvailability = () => {
  if (!isAvailable) {
    Alert.alert(
      'Unavailable',
      'Flashblocks is not available on the current network'
    );
    return false;
  }
  return true;
};
```

## Complete Example: Fast Send Screen

```tsx
import { useState } from 'react';
import { View, Text, TextInput, Button, Alert, Animated } from 'react-native';
import { useFlashblocks, useBalance } from '@giwa/react-native-wallet';
import { parseEther } from 'viem';

export function FlashblocksScreen() {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState<'idle' | 'preconfirmed' | 'confirmed'>('idle');
  const [latency, setLatency] = useState<number | null>(null);

  const { sendTransaction, getAverageLatency, isAvailable, isLoading } = useFlashblocks();
  const { formattedBalance } = useBalance();

  const handleSend = async () => {
    if (!to || !amount) return;

    setStatus('idle');
    setLatency(null);

    try {
      const value = parseEther(amount);

      const { preconfirmation, result } = await sendTransaction({
        to,
        value,
      });

      // Preconfirmed - instant UI update
      setStatus('preconfirmed');
      setLatency(preconfirmation.latencyMs);

      // Wait for block confirmation
      await result.wait();
      setStatus('confirmed');

      Alert.alert('Complete', `Preconfirmed in ${preconfirmation.latencyMs}ms!`);
    } catch (error) {
      Alert.alert('Error', error.message);
      setStatus('idle');
    }
  };

  if (!isAvailable) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Flashblocks is not available on this network</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>Flashblocks</Text>
      <Text style={{ color: '#666', marginBottom: 20 }}>
        ~200ms ultra-fast transaction confirmation
      </Text>

      <Text style={{ marginBottom: 10 }}>Balance: {formattedBalance} ETH</Text>
      <Text style={{ marginBottom: 20, color: '#888' }}>
        Average latency: {getAverageLatency()}ms
      </Text>

      <TextInput
        placeholder="Recipient address"
        value={to}
        onChangeText={setTo}
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
          marginBottom: 20,
          borderRadius: 8,
        }}
      />

      {/* Status display */}
      {status !== 'idle' && (
        <View
          style={{
            padding: 15,
            backgroundColor: status === 'preconfirmed' ? '#fff3cd' : '#d4edda',
            borderRadius: 8,
            marginBottom: 20,
          }}
        >
          <Text style={{ fontWeight: 'bold' }}>
            {status === 'preconfirmed' ? 'Preconfirmed!' : 'Block Confirmed!'}
          </Text>
          {latency && <Text>Latency: {latency}ms</Text>}
        </View>
      )}

      <Button
        title={isLoading ? 'Sending...' : 'Fast Send'}
        onPress={handleSend}
        disabled={isLoading || !to || !amount}
      />
    </View>
  );
}
```

## Comparison with Regular Transactions

| Item | Regular Transaction | Flashblocks |
|------|---------------------|-------------|
| Initial Feedback | 2-12 seconds (block confirmation) | ~200ms (preconfirmation) |
| Final Confirmation | 2-12 seconds | 2-12 seconds (same) |
| Security | Block confirmation | Sequencer signature + Block confirmation |
| Use Cases | General transfers | UX-critical apps |

## Use Cases

1. **Payment Apps**: Instant payment confirmation UI
2. **Games**: Fast in-game transactions
3. **DEX**: Quick swap feedback
4. **NFT Minting**: Instant minting confirmation

## Important Notes

:::warning Meaning of Preconfirmation
Preconfirmation is a promise from the sequencer that it has accepted the transaction. For critical operations requiring final confirmation (such as large amount transfers), always wait for block confirmation.
:::

## Next Steps

- [Transactions](/docs/guides/transactions) - Regular transactions
- [GIWA ID](/docs/guides/giwa-id) - ENS-based naming
