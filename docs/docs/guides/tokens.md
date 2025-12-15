---
sidebar_position: 3
---

# 토큰

ERC-20 토큰 관리 방법을 설명합니다.

## useTokens Hook

```tsx
import { useTokens } from '@giwa/react-native-wallet';

function TokensScreen() {
  const {
    getBalance,     // 토큰 잔액 조회
    transfer,       // 토큰 전송
    approve,        // 승인
    allowance,      // 승인량 조회
    getTokenInfo,   // 토큰 정보 조회
    isLoading,
  } = useTokens();

  // ...
}
```

## 토큰 잔액 조회

```tsx
const checkBalance = async () => {
  const tokenAddress = '0x...'; // ERC-20 토큰 주소

  const result = await getBalance(tokenAddress);

  console.log('토큰:', result.token.symbol);
  console.log('잔액:', result.formattedBalance);
  console.log('소수점:', result.token.decimals);
};
```

## 토큰 정보 조회

```tsx
const checkTokenInfo = async () => {
  const tokenAddress = '0x...';

  const info = await getTokenInfo(tokenAddress);

  console.log('이름:', info.name);
  console.log('심볼:', info.symbol);
  console.log('소수점:', info.decimals);
  console.log('총 발행량:', info.totalSupply);
};
```

## 토큰 전송

```tsx
const handleTransfer = async () => {
  const tokenAddress = '0x...'; // 토큰 주소
  const recipient = '0x...';    // 받는 주소
  const amount = '100';         // 토큰 단위 (소수점 자동 처리)

  try {
    const hash = await transfer(tokenAddress, recipient, amount);
    console.log('전송 완료:', hash);
  } catch (error) {
    console.error('전송 실패:', error.message);
  }
};
```

## 토큰 승인 (Approve)

DeFi 프로토콜 사용 시 필요한 토큰 승인:

```tsx
const handleApprove = async () => {
  const tokenAddress = '0x...';   // 토큰 주소
  const spenderAddress = '0x...'; // 승인할 컨트랙트 주소
  const amount = '1000';          // 승인량

  try {
    const hash = await approve(tokenAddress, spenderAddress, amount);
    console.log('승인 완료:', hash);
  } catch (error) {
    console.error('승인 실패:', error.message);
  }
};

// 무제한 승인
const approveUnlimited = async () => {
  const hash = await approve(tokenAddress, spenderAddress, 'unlimited');
};
```

## 승인량 조회

```tsx
const checkAllowance = async () => {
  const tokenAddress = '0x...';
  const spenderAddress = '0x...';

  const allowed = await allowance(tokenAddress, spenderAddress);
  console.log('승인된 양:', allowed.formattedAmount);
};
```

## 전체 예제: 토큰 관리 화면

```tsx
import { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert } from 'react-native';
import { useTokens } from '@giwa/react-native-wallet';

// 알려진 토큰 목록
const KNOWN_TOKENS = [
  { address: '0x...', symbol: 'USDT' },
  { address: '0x...', symbol: 'USDC' },
];

export function TokensScreen() {
  const { getBalance, transfer, isLoading } = useTokens();
  const [balances, setBalances] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  // 모든 토큰 잔액 조회
  const loadBalances = async () => {
    const results = await Promise.all(
      KNOWN_TOKENS.map(async (token) => {
        const balance = await getBalance(token.address);
        return {
          ...token,
          balance: balance.formattedBalance,
        };
      })
    );
    setBalances(results);
  };

  useEffect(() => {
    loadBalances();
  }, []);

  const handleTransfer = async () => {
    if (!selectedToken || !recipient || !amount) return;

    try {
      const hash = await transfer(selectedToken.address, recipient, amount);
      Alert.alert('성공', `전송 완료: ${hash.slice(0, 20)}...`);
      loadBalances(); // 잔액 새로고침
    } catch (error) {
      Alert.alert('실패', error.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>토큰 잔액</Text>

      <FlatList
        data={balances}
        keyExtractor={(item) => item.address}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              padding: 12,
              borderBottomWidth: 1,
              borderColor: '#eee',
            }}
          >
            <Text>{item.symbol}</Text>
            <Text>{item.balance}</Text>
            <Button
              title="전송"
              onPress={() => setSelectedToken(item)}
            />
          </View>
        )}
      />

      {selectedToken && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ marginBottom: 10 }}>
            {selectedToken.symbol} 전송
          </Text>

          <TextInput
            placeholder="받는 주소"
            value={recipient}
            onChangeText={setRecipient}
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 10,
              marginBottom: 10,
            }}
          />

          <TextInput
            placeholder="수량"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 10,
              marginBottom: 10,
            }}
          />

          <Button
            title="전송"
            onPress={handleTransfer}
            disabled={isLoading}
          />
        </View>
      )}

      <Button title="새로고침" onPress={loadBalances} />
    </View>
  );
}
```

## 커스텀 토큰 추가

```tsx
const addCustomToken = async (tokenAddress: string) => {
  try {
    const info = await getTokenInfo(tokenAddress);

    // 유효한 ERC-20인지 확인
    if (!info.symbol || !info.decimals) {
      throw new Error('유효하지 않은 토큰 주소입니다');
    }

    // 로컬 저장소에 추가
    const customTokens = await AsyncStorage.getItem('customTokens');
    const tokens = customTokens ? JSON.parse(customTokens) : [];
    tokens.push({
      address: tokenAddress,
      symbol: info.symbol,
      name: info.name,
      decimals: info.decimals,
    });
    await AsyncStorage.setItem('customTokens', JSON.stringify(tokens));

    return info;
  } catch (error) {
    throw new Error('토큰을 추가할 수 없습니다');
  }
};
```

## 다음 단계

- [브릿지](/docs/guides/bridge) - L1↔L2 토큰 이동
- [트랜잭션](/docs/guides/transactions) - ETH 전송
