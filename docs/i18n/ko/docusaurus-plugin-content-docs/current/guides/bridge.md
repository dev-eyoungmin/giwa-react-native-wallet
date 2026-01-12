---
sidebar_position: 4
---

# L2→L1 Bridge

이 가이드에서는 GIWA Chain(L2)에서 이더리움 메인넷(L1)으로 자산을 출금하는 방법을 설명합니다.

:::info L1→L2 Deposit
이더리움에서 GIWA Chain으로 입금하려면 공식 [GIWA Superbridge](https://superbridge.app)를 사용하세요.

참고: [GIWA Bridge 문서](https://docs.giwa.io/tools/bridges)
:::

## useBridge Hook

```tsx
import { useBridge } from '@giwa/react-native-wallet';

function BridgeScreen() {
  const {
    withdrawETH,       // L2 → L1 ETH 출금
    withdrawToken,     // L2 → L1 토큰 출금
    getPendingTransactions,
    getEstimatedWithdrawalTime,
    isLoading,
  } = useBridge();

  // ...
}
```

## ETH Withdrawal

GIWA Chain에서 이더리움 메인넷으로 ETH 전송:

```tsx
const handleWithdrawETH = async () => {
  try {
    const { hash, wait } = await withdrawETH('0.1'); // 0.1 ETH

    console.log('L2 TX Hash:', hash);

    // 확인 대기
    const receipt = await wait();
    console.log('Confirmed in block:', receipt.blockNumber);

    // 참고: Challenge Period로 인해 전체 출금에 약 7일 소요
  } catch (error) {
    console.error('Withdrawal failed:', error.message);
  }
};
```

### Withdraw to Different Address

```tsx
// 특정 L1 주소로 출금
const { hash } = await withdrawETH('0.1', '0x1234...abcd');
```

## Token Withdrawal

GIWA Chain에서 이더리움 메인넷으로 ERC-20 토큰 전송:

```tsx
const handleWithdrawToken = async () => {
  const l2TokenAddress = '0x...'; // L2 토큰 주소
  const amount = 100000000000000000000n; // 100 토큰 (wei 단위)

  try {
    const { hash, wait } = await withdrawToken(l2TokenAddress, amount);

    console.log('L2 TX Hash:', hash);

    const receipt = await wait();
    console.log('Confirmed:', receipt.status);
  } catch (error) {
    console.error('Withdrawal failed:', error.message);
  }
};
```

## Challenge Period

:::warning 7일 대기 기간
L2 → L1 출금은 보안상의 이유로 약 **7일**의 Challenge Period가 필요합니다. 이 기간 동안 검증자들이 출금 요청의 유효성을 검증합니다.

이는 OP Stack 아키텍처의 보안 기능이며, 이 SDK의 제한 사항이 아닙니다.
:::

```tsx
// 예상 출금 시간(초) 조회
const time = getEstimatedWithdrawalTime();
console.log('Estimated time:', time / 86400, 'days'); // ~7 days
```

## Pending Transactions

대기 중인 브릿지 트랜잭션 추적:

```tsx
const pendingTxs = getPendingTransactions();

pendingTxs.forEach((tx) => {
  console.log('Hash:', tx.l2TxHash);
  console.log('Amount:', tx.amount);
  console.log('Status:', tx.status);
});
```

## Complete Example

```tsx
import { useState } from 'react';
import { View, Text, TextInput, Button, Alert, Linking } from 'react-native';
import { useBridge, useBalance } from '@giwa/react-native-wallet';

export function BridgeScreen() {
  const [amount, setAmount] = useState('');
  const { withdrawETH, getEstimatedWithdrawalTime, isLoading } = useBridge();
  const { formattedBalance } = useBalance();

  const handleWithdraw = async () => {
    if (!amount) return;

    const days = Math.round(getEstimatedWithdrawalTime() / 86400);

    Alert.alert(
      'Confirm Withdrawal',
      `${amount} ETH를 L1으로 출금하시겠습니까?\n\n약 ${days}일이 소요됩니다.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const { hash } = await withdrawETH(amount);
              Alert.alert('Withdrawal Started', `TX: ${hash}`);
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const openSuperbridge = () => {
    Linking.openURL('https://superbridge.app');
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Bridge</Text>

      {/* Deposit Link */}
      <Button
        title="Deposit (L1→L2) via Superbridge"
        onPress={openSuperbridge}
      />

      <Text style={{ marginTop: 20, marginBottom: 10 }}>
        Withdraw (L2→L1)
      </Text>
      <Text style={{ color: '#666', marginBottom: 10 }}>
        Balance: {formattedBalance} ETH
      </Text>

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

      <Text style={{ color: 'orange', marginBottom: 10, fontSize: 12 }}>
        ⚠️ 출금에는 약 7일이 소요됩니다
      </Text>

      <Button
        title={isLoading ? 'Processing...' : 'Withdraw'}
        onPress={handleWithdraw}
        disabled={isLoading || !amount}
      />
    </View>
  );
}
```

## Next Steps

- [Flashblocks](/docs/guides/flashblocks) - 빠른 트랜잭션 확인
- [Transactions](/docs/guides/transactions) - 기본 트랜잭션
