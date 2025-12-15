---
sidebar_position: 5
---

# Flashblocks

~200ms 빠른 트랜잭션 사전 확인(preconfirmation) 기능을 설명합니다.

## Flashblocks란?

Flashblocks는 GIWA Chain의 고유 기능으로, 트랜잭션이 블록에 포함되기 전에 ~200ms 내에 사전 확인을 제공합니다. 이를 통해 사용자는 거의 즉각적인 트랜잭션 피드백을 받을 수 있습니다.

```
일반 트랜잭션:    TX → 블록 확인 (2-12초)
Flashblocks:     TX → 사전 확인 (200ms) → 블록 확인 (2-12초)
```

## useFlashblocks Hook

```tsx
import { useFlashblocks } from '@giwa/react-native-wallet';

function FastTransactionScreen() {
  const {
    sendTransaction,     // Flashblocks 트랜잭션 전송
    getAverageLatency,   // 평균 지연 시간
    isAvailable,         // Flashblocks 사용 가능 여부
    isLoading,
  } = useFlashblocks();

  // ...
}
```

## Flashblocks 트랜잭션 전송

```tsx
const handleFastSend = async () => {
  try {
    const { preconfirmation, result } = await sendTransaction({
      to: '0x...',
      value: BigInt('100000000000000000'), // 0.1 ETH (wei 단위)
    });

    // 1. 사전 확인 (즉시, ~200ms)
    console.log('사전 확인됨!');
    console.log('시간:', preconfirmation.preconfirmedAt);
    console.log('지연:', preconfirmation.latencyMs, 'ms');

    // UI 업데이트 - 사용자에게 즉시 피드백
    showSuccessAnimation();

    // 2. 블록 확인 (배경에서 대기)
    const receipt = await result.wait();
    console.log('블록 확인됨:', receipt.blockNumber);

  } catch (error) {
    console.error('전송 실패:', error.message);
  }
};
```

## 사전 확인 데이터

```tsx
interface Preconfirmation {
  txHash: string;           // 트랜잭션 해시
  preconfirmedAt: number;   // 사전 확인 타임스탬프
  latencyMs: number;        // 지연 시간 (밀리초)
  sequencerSignature: string; // 시퀀서 서명
}
```

## 평균 지연 시간 확인

```tsx
const displayLatency = () => {
  const latency = getAverageLatency();
  console.log('평균 Flashblocks 지연:', latency, 'ms');
};
```

## Flashblocks 사용 가능 여부 확인

```tsx
const checkAvailability = () => {
  if (!isAvailable) {
    Alert.alert(
      '사용 불가',
      'Flashblocks는 현재 네트워크에서 사용할 수 없습니다'
    );
    return false;
  }
  return true;
};
```

## 전체 예제: 빠른 전송 화면

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

      // 사전 확인됨 - 즉시 UI 업데이트
      setStatus('preconfirmed');
      setLatency(preconfirmation.latencyMs);

      // 블록 확인 대기
      await result.wait();
      setStatus('confirmed');

      Alert.alert('완료', `${preconfirmation.latencyMs}ms 만에 사전 확인됨!`);
    } catch (error) {
      Alert.alert('오류', error.message);
      setStatus('idle');
    }
  };

  if (!isAvailable) {
    return (
      <View style={{ padding: 20 }}>
        <Text>Flashblocks는 이 네트워크에서 사용할 수 없습니다</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 10 }}>⚡ Flashblocks</Text>
      <Text style={{ color: '#666', marginBottom: 20 }}>
        ~200ms 초고속 트랜잭션 확인
      </Text>

      <Text style={{ marginBottom: 10 }}>잔액: {formattedBalance} ETH</Text>
      <Text style={{ marginBottom: 20, color: '#888' }}>
        평균 지연: {getAverageLatency()}ms
      </Text>

      <TextInput
        placeholder="받는 주소"
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
        placeholder="금액 (ETH)"
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

      {/* 상태 표시 */}
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
            {status === 'preconfirmed' ? '⚡ 사전 확인됨!' : '✅ 블록 확인됨!'}
          </Text>
          {latency && <Text>지연: {latency}ms</Text>}
        </View>
      )}

      <Button
        title={isLoading ? '전송 중...' : '⚡ 빠른 전송'}
        onPress={handleSend}
        disabled={isLoading || !to || !amount}
      />
    </View>
  );
}
```

## 일반 트랜잭션과 비교

| 항목 | 일반 트랜잭션 | Flashblocks |
|------|--------------|-------------|
| 초기 피드백 | 2-12초 (블록 확인) | ~200ms (사전 확인) |
| 최종 확인 | 2-12초 | 2-12초 (동일) |
| 보안 | 블록 확인 | 시퀀서 서명 + 블록 확인 |
| 사용 사례 | 일반 전송 | UX가 중요한 앱 |

## 사용 사례

1. **결제 앱**: 즉각적인 결제 확인 UI
2. **게임**: 빠른 인게임 트랜잭션
3. **DEX**: 빠른 스왑 피드백
4. **NFT 민팅**: 즉각적인 민팅 확인

## 주의사항

:::warning 사전 확인의 의미
사전 확인(preconfirmation)은 시퀀서가 트랜잭션을 수락했다는 약속입니다. 최종적인 블록 확인이 필요한 중요한 작업(큰 금액 전송 등)에서는 반드시 블록 확인을 기다리세요.
:::

## 다음 단계

- [트랜잭션](/docs/guides/transactions) - 일반 트랜잭션
- [GIWA ID](/docs/guides/giwa-id) - ENS 기반 네이밍
