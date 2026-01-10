---
sidebar_position: 4
---

# Quick Start

Create your first wallet with GIWA SDK in 5 minutes.

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

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `network` | `'testnet' \| 'mainnet'` | `'testnet'` | Network to connect to |
| `config.endpoints` | `CustomEndpoints` | - | Custom RPC and explorer URLs |
| `config.customContracts` | `CustomContracts` | - | Custom contract addresses |
| `initTimeout` | `number` | `10000` | Initialization timeout (ms) |
| `onError` | `(error: Error) => void` | - | Callback when error occurs |

### Custom Contract Addresses

The SDK uses OP Stack standard predeploy addresses by default. Override them if needed:

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

See [Core API - Contract Addresses](/docs/api/core#default-contract-addresses) for default addresses.

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

- [Wallet Management](/docs/guides/wallet-management) - Wallet recovery, export
- [Transactions](/docs/guides/transactions) - Detailed transaction handling
- [Tokens](/docs/guides/tokens) - ERC-20 token management
