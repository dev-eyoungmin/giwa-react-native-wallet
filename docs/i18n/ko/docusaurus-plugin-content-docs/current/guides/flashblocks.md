---
sidebar_position: 5
---

# Flashblocks

이 가이드에서는 ~200ms의 빠른 트랜잭션 사전확인 기능을 설명합니다.

## What is Flashblocks?

Flashblocks는 GIWA Chain의 고유 기능으로, 트랜잭션이 블록에 포함되기 전에 ~200ms 내에 사전확인(preconfirmation)을 제공합니다. 이를 통해 사용자에게 거의 즉각적인 트랜잭션 피드백을 제공할 수 있습니다.

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

| 항목 | 일반 트랜잭션 | Flashblocks |
|------|---------------|-------------|
| 초기 피드백 | 2-12초 (블록 확인) | ~200ms (사전확인) |
| 최종 확인 | 2-12초 | 2-12초 (동일) |
| 보안 | 블록 확인 | 시퀀서 서명 + 블록 확인 |
| 사용 사례 | 일반 전송 | UX 중요 앱 |

## Use Cases

1. **결제 앱**: 즉각적인 결제 확인 UI
2. **게임**: 빠른 인게임 트랜잭션
3. **DEX**: 신속한 스왑 피드백
4. **NFT 민팅**: 즉시 민팅 확인

## Important Notes

:::warning Meaning of Preconfirmation
사전확인은 시퀀서가 트랜잭션을 수락했다는 약속입니다. 최종 확인이 필요한 중요한 작업(큰 금액 전송 등)의 경우 항상 블록 확인을 기다리세요.
:::

## Next Steps

- [Transactions](/docs/guides/transactions) - 일반 트랜잭션
- [GIWA ID](/docs/guides/giwa-id) - ENS 기반 네이밍
