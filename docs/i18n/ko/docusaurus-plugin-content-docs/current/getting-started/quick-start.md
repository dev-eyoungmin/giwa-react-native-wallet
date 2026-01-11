---
sidebar_position: 4
---

# Quick Start

5분 안에 GIWA SDK로 첫 번째 지갑을 생성해보세요.

## 1. Installation

```bash
# Expo
npx expo install @giwa/react-native-wallet expo-secure-store

# React Native CLI
npm install @giwa/react-native-wallet react-native-keychain
cd ios && pod install
```

## 2. Provider Setup

```tsx title="App.tsx"
import { GiwaProvider } from '@giwa/react-native-wallet';

export default function App() {
  return (
    <GiwaProvider
      network="testnet"
      initTimeout={10000}
      onError={(error) => console.error('SDK Error:', error)}
    >
      <WalletDemo />
    </GiwaProvider>
  );
}
```

### GiwaProvider Props

| Prop | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `network` | `'testnet' \| 'mainnet'` | `'testnet'` | 연결할 네트워크 |
| `config.endpoints` | `CustomEndpoints` | - | 커스텀 RPC 및 탐색기 URL |
| `config.customContracts` | `CustomContracts` | - | 커스텀 컨트랙트 주소 |
| `initTimeout` | `number` | `10000` | 초기화 타임아웃 (ms) |
| `onError` | `(error: Error) => void` | - | 오류 발생 시 콜백 |

### Custom Contract Addresses

SDK는 기본적으로 OP Stack 표준 사전배포 주소를 사용합니다. 필요시 재정의할 수 있습니다:

```tsx
<GiwaProvider
  config={{
    network: 'testnet',
    customContracts: {
      eas: '0x...', // Custom EAS address
      schemaRegistry: '0x...', // Custom Schema Registry
      ensRegistry: '0x...', // Custom ENS Registry
    },
  }}
>
  <App />
</GiwaProvider>
```

기본 주소는 [Core API - 컨트랙트 주소](/docs/api/core#default-contract-addresses)를 참조하세요.

## 3. Create Wallet

```tsx title="WalletDemo.tsx"
import { View, Text, Button, Alert } from 'react-native';
import { useGiwaWallet } from '@giwa/react-native-wallet';

export function WalletDemo() {
  const { wallet, createWallet, isLoading } = useGiwaWallet();

  const handleCreate = async () => {
    try {
      const { wallet, mnemonic } = await createWallet();

      // Important: Guide user to safely backup their mnemonic
      Alert.alert(
        'Wallet Created',
        `Address: ${wallet.address}\n\nPlease store your recovery phrase safely:\n${mnemonic}`
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      {wallet ? (
        <>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>
            Wallet Connected
          </Text>
          <Text selectable style={{ fontFamily: 'monospace' }}>
            {wallet.address}
          </Text>
        </>
      ) : (
        <Button title="Create New Wallet" onPress={handleCreate} />
      )}
    </View>
  );
}
```

## 4. Check Balance

```tsx
import { useBalance } from '@giwa/react-native-wallet';

function BalanceDisplay() {
  const { formattedBalance, isLoading, refetch } = useBalance();

  return (
    <View>
      <Text>Balance: {formattedBalance} ETH</Text>
      <Button title="Refresh" onPress={refetch} disabled={isLoading} />
    </View>
  );
}
```

## 5. Send ETH

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
      Alert.alert('Transfer Complete', `TX: ${hash}`);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      <TextInput
        placeholder="Recipient address (0x...)"
        value={to}
        onChangeText={setTo}
      />
      <TextInput
        placeholder="Amount (ETH)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />
      <Button
        title="Send"
        onPress={handleSend}
        disabled={isLoading || !to || !amount}
      />
    </View>
  );
}
```

## 6. Get Testnet ETH

```tsx
import { useFaucet } from '@giwa/react-native-wallet';

function FaucetButton() {
  const { requestFaucet, isLoading } = useFaucet();

  const handleRequest = async () => {
    try {
      const result = await requestFaucet();
      Alert.alert('Success', `Received ${result.amount} ETH`);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <Button
      title="Get Testnet ETH"
      onPress={handleRequest}
      disabled={isLoading}
    />
  );
}
```

## Complete Example

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
          title="Create New Wallet"
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

      <Button title="Refresh Balance" onPress={refetch} />
      <Button
        title="Get Testnet ETH"
        onPress={requestFaucet}
        disabled={faucetLoading}
      />

      <TextInput
        style={styles.input}
        placeholder="Recipient address"
        value={to}
        onChangeText={setTo}
      />
      <TextInput
        style={styles.input}
        placeholder="Amount (ETH)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
      />
      <Button
        title="Send"
        onPress={() => sendTransaction({ to, value: amount })}
        disabled={txLoading}
      />
    </View>
  );
}

export default function App() {
  return (
    <GiwaProvider
      network="testnet"
      onError={(err) => console.error('SDK Error:', err)}
    >
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

## Next Steps

- [지갑 관리](/docs/guides/wallet-management) - 지갑 복구, 내보내기
- [트랜잭션](/docs/guides/transactions) - 상세 트랜잭션 처리
- [토큰](/docs/guides/tokens) - ERC-20 토큰 관리
