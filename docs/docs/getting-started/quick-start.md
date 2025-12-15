---
sidebar_position: 4
---

# 빠른 시작

5분 안에 GIWA SDK로 첫 번째 지갑을 만들어 봅니다.

## 1. 설치

```bash
# Expo
npx expo install @giwa/react-native-wallet expo-secure-store

# React Native CLI
npm install @giwa/react-native-wallet react-native-keychain
cd ios && pod install
```

## 2. Provider 설정

```tsx title="App.tsx"
import { GiwaProvider } from '@giwa/react-native-wallet';

export default function App() {
  return (
    <GiwaProvider config={{ network: 'testnet' }}>
      <WalletDemo />
    </GiwaProvider>
  );
}
```

## 3. 지갑 생성

```tsx title="WalletDemo.tsx"
import { View, Text, Button, Alert } from 'react-native';
import { useGiwaWallet } from '@giwa/react-native-wallet';

export function WalletDemo() {
  const { wallet, createWallet, isLoading } = useGiwaWallet();

  const handleCreate = async () => {
    try {
      const { wallet, mnemonic } = await createWallet();

      // 중요: 니모닉을 사용자에게 안전하게 백업하도록 안내
      Alert.alert(
        '지갑 생성 완료',
        `주소: ${wallet.address}\n\n복구 구문을 안전한 곳에 보관하세요:\n${mnemonic}`
      );
    } catch (error) {
      Alert.alert('오류', error.message);
    }
  };

  if (isLoading) {
    return <Text>로딩 중...</Text>;
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      {wallet ? (
        <>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>
            지갑 연결됨
          </Text>
          <Text selectable style={{ fontFamily: 'monospace' }}>
            {wallet.address}
          </Text>
        </>
      ) : (
        <Button title="새 지갑 생성" onPress={handleCreate} />
      )}
    </View>
  );
}
```

## 4. 잔액 조회

```tsx
import { useBalance } from '@giwa/react-native-wallet';

function BalanceDisplay() {
  const { formattedBalance, isLoading, refetch } = useBalance();

  return (
    <View>
      <Text>잔액: {formattedBalance} ETH</Text>
      <Button title="새로고침" onPress={refetch} disabled={isLoading} />
    </View>
  );
}
```

## 5. ETH 전송

```tsx
import { useState } from 'react';
import { useTransaction } from '@giwa/react-native-wallet';

function SendETH() {
  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');
  const { sendTransaction, isLoading } = useTransaction();

  const handleSend = async () => {
    try {
      const hash = await sendTransaction({ to, value: amount });
      Alert.alert('전송 완료', `TX: ${hash}`);
    } catch (error) {
      Alert.alert('오류', error.message);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="받는 주소 (0x...)"
        value={to}
        onChangeText={setTo}
      />
      <TextInput
        placeholder="금액 (ETH)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />
      <Button
        title="전송"
        onPress={handleSend}
        disabled={isLoading || !to || !amount}
      />
    </View>
  );
}
```

## 6. 테스트넷 ETH 받기

```tsx
import { useFaucet } from '@giwa/react-native-wallet';

function FaucetButton() {
  const { requestFaucet, isLoading } = useFaucet();

  const handleRequest = async () => {
    try {
      const result = await requestFaucet();
      Alert.alert('성공', `${result.amount} ETH를 받았습니다`);
    } catch (error) {
      Alert.alert('오류', error.message);
    }
  };

  return (
    <Button
      title="테스트넷 ETH 받기"
      onPress={handleRequest}
      disabled={isLoading}
    />
  );
}
```

## 전체 예제

```tsx title="App.tsx"
import { useState } from 'react';
import { View, Text, Button, TextInput, Alert, StyleSheet } from 'react-native';
import {
  GiwaProvider,
  useGiwaWallet,
  useBalance,
  useTransaction,
  useFaucet,
} from '@giwa/react-native-wallet';

function WalletApp() {
  const { wallet, createWallet, isLoading: walletLoading } = useGiwaWallet();
  const { formattedBalance, refetch } = useBalance();
  const { sendTransaction, isLoading: txLoading } = useTransaction();
  const { requestFaucet, isLoading: faucetLoading } = useFaucet();

  const [to, setTo] = useState('');
  const [amount, setAmount] = useState('');

  if (!wallet) {
    return (
      <View style={styles.container}>
        <Button
          title="새 지갑 생성"
          onPress={createWallet}
          disabled={walletLoading}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.address}>{wallet.address}</Text>
      <Text style={styles.balance}>{formattedBalance} ETH</Text>

      <Button title="잔액 새로고침" onPress={refetch} />
      <Button
        title="테스트넷 ETH 받기"
        onPress={requestFaucet}
        disabled={faucetLoading}
      />

      <TextInput
        style={styles.input}
        placeholder="받는 주소"
        value={to}
        onChangeText={setTo}
      />
      <TextInput
        style={styles.input}
        placeholder="금액 (ETH)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />
      <Button
        title="전송"
        onPress={() => sendTransaction({ to, value: amount })}
        disabled={txLoading}
      />
    </View>
  );
}

export default function App() {
  return (
    <GiwaProvider config={{ network: 'testnet' }}>
      <WalletApp />
    </GiwaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  address: { fontFamily: 'monospace', fontSize: 12, marginBottom: 10 },
  balance: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginVertical: 5 },
});
```

## 다음 단계

- [지갑 관리](/docs/guides/wallet-management) - 지갑 복구, 내보내기
- [트랜잭션](/docs/guides/transactions) - 상세 트랜잭션 처리
- [토큰](/docs/guides/tokens) - ERC-20 토큰 관리
