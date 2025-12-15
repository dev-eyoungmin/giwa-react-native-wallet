---
sidebar_position: 4
---

# L1↔L2 브릿지

이더리움 메인넷(L1)과 GIWA Chain(L2) 간 자산 이동 방법을 설명합니다.

## useBridge Hook

```tsx
import { useBridge } from '@giwa/react-native-wallet';

function BridgeScreen() {
  const {
    deposit,           // L1 → L2 입금
    withdraw,          // L2 → L1 출금
    getDepositStatus,  // 입금 상태 조회
    getWithdrawStatus, // 출금 상태 조회
    estimateFees,      // 수수료 추정
    isLoading,
  } = useBridge();

  // ...
}
```

## L1 → L2 입금 (Deposit)

이더리움 메인넷에서 GIWA Chain으로 자산 이동:

```tsx
const handleDeposit = async () => {
  try {
    const result = await deposit({
      amount: '0.1',     // ETH 단위
      token: 'ETH',      // 또는 토큰 주소
    });

    console.log('L1 TX:', result.l1TxHash);
    console.log('예상 완료 시간:', result.estimatedTime);

    // 입금은 약 10-15분 소요
  } catch (error) {
    console.error('입금 실패:', error.message);
  }
};
```

## L2 → L1 출금 (Withdraw)

GIWA Chain에서 이더리움 메인넷으로 자산 이동:

```tsx
const handleWithdraw = async () => {
  try {
    const result = await withdraw({
      amount: '0.1',
      token: 'ETH',
    });

    console.log('L2 TX:', result.l2TxHash);
    console.log('예상 완료 시간:', result.estimatedTime);

    // 출금은 Challenge Period로 인해 약 7일 소요
  } catch (error) {
    console.error('출금 실패:', error.message);
  }
};
```

:::info Challenge Period
L2 → L1 출금은 보안상의 이유로 약 7일의 Challenge Period가 필요합니다. 이 기간 동안 검증자들이 출금 요청의 유효성을 검증합니다.
:::

## 수수료 추정

```tsx
const checkFees = async () => {
  const fees = await estimateFees({
    direction: 'deposit', // 'deposit' | 'withdraw'
    amount: '0.1',
    token: 'ETH',
  });

  console.log('L1 가스비:', fees.l1GasFee);
  console.log('L2 가스비:', fees.l2GasFee);
  console.log('총 예상 수수료:', fees.totalFee);
};
```

## 상태 조회

### 입금 상태

```tsx
const checkDepositStatus = async (l1TxHash: string) => {
  const status = await getDepositStatus(l1TxHash);

  switch (status.state) {
    case 'pending':
      console.log('L1에서 처리 중...');
      break;
    case 'l1_confirmed':
      console.log('L1 확인됨, L2 대기 중...');
      break;
    case 'completed':
      console.log('완료! L2 TX:', status.l2TxHash);
      break;
    case 'failed':
      console.log('실패:', status.error);
      break;
  }
};
```

### 출금 상태

```tsx
const checkWithdrawStatus = async (l2TxHash: string) => {
  const status = await getWithdrawStatus(l2TxHash);

  switch (status.state) {
    case 'pending':
      console.log('L2에서 처리 중...');
      break;
    case 'waiting_for_proof':
      console.log('증명 대기 중...');
      break;
    case 'ready_to_prove':
      console.log('증명 준비 완료');
      break;
    case 'in_challenge':
      console.log('Challenge 기간 중...', status.remainingTime);
      break;
    case 'ready_to_finalize':
      console.log('최종 확정 가능');
      break;
    case 'completed':
      console.log('완료! L1 TX:', status.l1TxHash);
      break;
  }
};
```

## ERC-20 토큰 브릿지

```tsx
// L1 → L2 토큰 입금
const depositToken = async () => {
  const tokenAddress = '0x...'; // L1 토큰 주소

  // 먼저 브릿지 컨트랙트에 토큰 승인 필요
  await approveToken(tokenAddress, BRIDGE_ADDRESS, '100');

  const result = await deposit({
    amount: '100',
    token: tokenAddress,
  });
};

// L2 → L1 토큰 출금
const withdrawToken = async () => {
  const l2TokenAddress = '0x...'; // L2 토큰 주소

  const result = await withdraw({
    amount: '100',
    token: l2TokenAddress,
  });
};
```

## 전체 예제: 브릿지 화면

```tsx
import { useState } from 'react';
import { View, Text, TextInput, Button, Alert, SegmentedButtons } from 'react-native';
import { useBridge, useBalance } from '@giwa/react-native-wallet';

export function BridgeScreen() {
  const [direction, setDirection] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');

  const { deposit, withdraw, estimateFees, isLoading } = useBridge();
  const { formattedBalance: l2Balance } = useBalance();

  const handleBridge = async () => {
    if (!amount) return;

    try {
      // 수수료 확인
      const fees = await estimateFees({ direction, amount, token: 'ETH' });

      Alert.alert(
        '수수료 확인',
        `예상 수수료: ${fees.totalFee} ETH\n진행하시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          {
            text: '확인',
            onPress: async () => {
              if (direction === 'deposit') {
                const result = await deposit({ amount, token: 'ETH' });
                Alert.alert('입금 시작', `TX: ${result.l1TxHash}`);
              } else {
                const result = await withdraw({ amount, token: 'ETH' });
                Alert.alert(
                  '출금 시작',
                  `TX: ${result.l2TxHash}\n\n출금은 약 7일이 소요됩니다.`
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('오류', error.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>브릿지</Text>

      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        <Button
          title="입금 (L1→L2)"
          onPress={() => setDirection('deposit')}
          color={direction === 'deposit' ? 'blue' : 'gray'}
        />
        <Button
          title="출금 (L2→L1)"
          onPress={() => setDirection('withdraw')}
          color={direction === 'withdraw' ? 'blue' : 'gray'}
        />
      </View>

      <Text style={{ marginBottom: 5 }}>
        {direction === 'deposit'
          ? 'L1 (이더리움) → L2 (GIWA)'
          : 'L2 (GIWA) → L1 (이더리움)'}
      </Text>

      {direction === 'withdraw' && (
        <Text style={{ marginBottom: 10, color: '#666' }}>
          L2 잔액: {l2Balance} ETH
        </Text>
      )}

      <TextInput
        placeholder="금액 (ETH)"
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

      {direction === 'withdraw' && (
        <Text style={{ color: 'orange', marginBottom: 10 }}>
          ⚠️ 출금은 Challenge Period로 약 7일이 소요됩니다
        </Text>
      )}

      <Button
        title={isLoading ? '처리 중...' : direction === 'deposit' ? '입금' : '출금'}
        onPress={handleBridge}
        disabled={isLoading || !amount}
      />
    </View>
  );
}
```

## 다음 단계

- [Flashblocks](/docs/guides/flashblocks) - 빠른 트랜잭션 확인
- [트랜잭션](/docs/guides/transactions) - 기본 트랜잭션
