---
sidebar_position: 2
---

# 트랜잭션

ETH 전송 및 트랜잭션 처리 방법을 설명합니다.

## useTransaction Hook

```tsx
import { useTransaction } from '@giwa/react-native-wallet';

function TransactionScreen() {
  const {
    sendTransaction,   // 트랜잭션 전송
    waitForReceipt,    // 영수증 대기
    estimateGas,       // 가스 추정
    getTransaction,    // 트랜잭션 조회
    isLoading,         // 로딩 상태
    error,             // 에러 정보
  } = useTransaction();

  // ...
}
```

## 기본 ETH 전송

```tsx
const handleSend = async () => {
  try {
    const hash = await sendTransaction({
      to: '0x1234...5678',
      value: '0.1', // ETH 단위
    });

    console.log('트랜잭션 해시:', hash);

    // 영수증 대기 (블록 확인)
    const receipt = await waitForReceipt(hash);
    console.log('확인된 블록:', receipt.blockNumber);
  } catch (error) {
    console.error('전송 실패:', error.message);
  }
};
```

## 가스 추정

```tsx
const handleEstimate = async () => {
  const gas = await estimateGas({
    to: '0x1234...5678',
    value: '0.1',
  });

  console.log('예상 가스:', gas.gasLimit.toString());
  console.log('가스 가격:', gas.gasPrice.toString());
  console.log('예상 수수료:', gas.estimatedFee); // ETH 단위
};
```

## 고급 트랜잭션 옵션

```tsx
const hash = await sendTransaction({
  to: '0x1234...5678',
  value: '0.1',
  // 선택적 옵션
  gasLimit: 21000n,
  gasPrice: 1000000000n, // 1 Gwei
  nonce: 5,
  data: '0x...', // 컨트랙트 호출 데이터
});
```

## 트랜잭션 상태 조회

```tsx
const checkStatus = async (hash: string) => {
  const tx = await getTransaction(hash);

  if (!tx) {
    console.log('트랜잭션을 찾을 수 없습니다');
    return;
  }

  if (tx.blockNumber) {
    console.log('확인됨 - 블록:', tx.blockNumber);
  } else {
    console.log('대기 중...');
  }
};
```

## 트랜잭션 확인 대기

```tsx
// 기본 대기 (1 확인)
const receipt = await waitForReceipt(hash);

// 여러 확인 대기
const receipt = await waitForReceipt(hash, {
  confirmations: 3, // 3블록 확인 대기
  timeout: 60000,   // 60초 타임아웃
});
```

## 에러 처리

```tsx
import { GiwaTransactionError, ErrorCodes } from '@giwa/react-native-wallet';

try {
  await sendTransaction({ to, value });
} catch (error) {
  if (error instanceof GiwaTransactionError) {
    switch (error.code) {
      case ErrorCodes.INSUFFICIENT_FUNDS:
        Alert.alert('잔액 부족', '전송할 잔액이 부족합니다');
        break;
      case ErrorCodes.INVALID_ADDRESS:
        Alert.alert('주소 오류', '유효하지 않은 주소입니다');
        break;
      case ErrorCodes.NONCE_TOO_LOW:
        Alert.alert('오류', '트랜잭션 nonce가 너무 낮습니다');
        break;
      case ErrorCodes.GAS_TOO_LOW:
        Alert.alert('가스 부족', '가스 한도가 너무 낮습니다');
        break;
      default:
        Alert.alert('전송 실패', error.message);
    }
  }
}
```

## 전체 예제: 전송 화면

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
      Alert.alert('예상 수수료', `${gas.estimatedFee} ETH`);
    } catch (error) {
      Alert.alert('오류', error.message);
    }
  };

  const handleSend = async () => {
    if (!to || !amount) {
      Alert.alert('입력 필요', '주소와 금액을 입력하세요');
      return;
    }

    try {
      const hash = await sendTransaction({ to, value: amount });
      setTxHash(hash);

      Alert.alert('전송 중', `해시: ${hash.slice(0, 20)}...`);

      const receipt = await waitForReceipt(hash);
      Alert.alert('완료', `블록 ${receipt.blockNumber}에서 확인됨`);
    } catch (error) {
      Alert.alert('전송 실패', error.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ marginBottom: 10 }}>잔액: {formattedBalance} ETH</Text>

      <TextInput
        placeholder="받는 주소 (0x...)"
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

      <Button title="수수료 확인" onPress={handleEstimate} disabled={isLoading} />

      <View style={{ marginTop: 10 }}>
        <Button
          title={isLoading ? '전송 중...' : '전송'}
          onPress={handleSend}
          disabled={isLoading || !to || !amount}
        />
      </View>

      {txHash && (
        <Text style={{ marginTop: 20, fontFamily: 'monospace', fontSize: 12 }}>
          최근 TX: {txHash}
        </Text>
      )}
    </View>
  );
}
```

## 다음 단계

- [토큰](/docs/guides/tokens) - ERC-20 토큰 전송
- [Flashblocks](/docs/guides/flashblocks) - 빠른 트랜잭션 확인
- [브릿지](/docs/guides/bridge) - L1↔L2 자산 이동
