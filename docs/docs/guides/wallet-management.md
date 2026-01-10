---
sidebar_position: 1
---

# Wallet Management

This guide explains wallet creation, recovery, and management features of the GIWA SDK.

## useGiwaWallet Hook

```tsx
import { useGiwaWallet } from '@giwa/react-native-wallet';

function WalletScreen() {
  const {
    wallet,           // Current wallet information
    isLoading,        // Loading state
    error,            // Error information
    createWallet,     // Create new wallet
    recoverWallet,    // Recover with mnemonic
    importPrivateKey, // Import with private key
    exportPrivateKey, // Export private key
    disconnect,       // Disconnect wallet
  } = useGiwaWallet();

  // ...
}
```

## Create New Wallet

```tsx
const handleCreate = async () => {
  try {
    const { wallet, mnemonic } = await createWallet();

    console.log('Address:', wallet.address);
    console.log('Mnemonic:', mnemonic); // 12-word recovery phrase

    // Important: Show the mnemonic to the user and guide them to back it up safely
    // The mnemonic is displayed only once and is not stored within the SDK
  } catch (error) {
    console.error('Wallet creation failed:', error.message);
  }
};
```

:::warning Mnemonic Security
The mnemonic (recovery phrase) is returned only once during wallet creation. Since the SDK does not store the mnemonic, you must guide users to back it up in a safe place.
:::

## Wallet Recovery

### Recover with Mnemonic

```tsx
const handleRecover = async () => {
  const mnemonic = 'apple banana cherry ...'; // 12 words

  try {
    const wallet = await recoverWallet(mnemonic);
    console.log('Recovered address:', wallet.address);
  } catch (error) {
    if (error.code === 'INVALID_MNEMONIC') {
      Alert.alert('Error', 'Invalid recovery phrase');
    }
  }
};
```

### Import with Private Key

```tsx
const handleImport = async () => {
  const privateKey = '0x...'; // 64-character hex string

  try {
    const wallet = await importPrivateKey(privateKey);
    console.log('Imported address:', wallet.address);
  } catch (error) {
    Alert.alert('Error', 'Invalid private key');
  }
};
```

## Export Private Key

:::danger Warning
Exporting a private key is a sensitive operation. Always require biometric authentication or additional confirmation before proceeding.
:::

```tsx
const handleExport = async () => {
  try {
    // Biometric authentication is automatically requested if configured
    const privateKey = await exportPrivateKey();

    // Display private key securely (consider using a modal with auto-dismiss)
    Alert.alert(
      'Private Key',
      privateKey,
      [{ text: 'OK' }],
      { cancelable: false }
    );
  } catch (error) {
    if (error.code === 'BIOMETRIC_FAILED') {
      Alert.alert('Authentication Failed', 'Biometric authentication failed');
    }
  }
};
```

## Disconnect Wallet

```tsx
const handleDisconnect = async () => {
  Alert.alert(
    'Disconnect Wallet',
    'Are you sure you want to disconnect? You cannot recover the wallet without the recovery phrase.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Disconnect',
        style: 'destructive',
        onPress: async () => {
          await disconnect();
        },
      },
    ]
  );
};
```

## Check Wallet Status

```tsx
function WalletStatus() {
  const { wallet, isLoading, error } = useGiwaWallet();

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return <Text>Error: {error.message}</Text>;
  }

  if (!wallet) {
    return <Text>No wallet connected</Text>;
  }

  return (
    <View>
      <Text>Address: {wallet.address}</Text>
      <Text>Connected: {wallet.isConnected ? 'Yes' : 'No'}</Text>
    </View>
  );
}
```

## Complete Example

```tsx
import { useState } from 'react';
import { View, Text, Button, TextInput, Alert } from 'react-native';
import { useGiwaWallet } from '@giwa/react-native-wallet';

export function WalletManager() {
  const {
    wallet,
    createWallet,
    recoverWallet,
    exportPrivateKey,
    disconnect,
    isLoading,
  } = useGiwaWallet();

  const [mnemonicInput, setMnemonicInput] = useState('');
  const [showRecover, setShowRecover] = useState(false);

  if (wallet) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 16, marginBottom: 10 }}>Wallet Connected</Text>
        <Text selectable style={{ fontFamily: 'monospace', marginBottom: 20 }}>
          {wallet.address}
        </Text>

        <Button title="Export Private Key" onPress={exportPrivateKey} />
        <Button title="Disconnect" onPress={disconnect} color="red" />
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Button
        title="Create New Wallet"
        onPress={async () => {
          const { mnemonic } = await createWallet();
          Alert.alert('Backup Required', `Recovery phrase:\n\n${mnemonic}`);
        }}
        disabled={isLoading}
      />

      <Button
        title="Recover Existing Wallet"
        onPress={() => setShowRecover(!showRecover)}
      />

      {showRecover && (
        <>
          <TextInput
            placeholder="Enter 12-word recovery phrase"
            value={mnemonicInput}
            onChangeText={setMnemonicInput}
            multiline
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 10,
              marginVertical: 10,
            }}
          />
          <Button
            title="Recover"
            onPress={() => recoverWallet(mnemonicInput)}
            disabled={isLoading || !mnemonicInput}
          />
        </>
      )}
    </View>
  );
}
```

## Next Steps

- [Transactions](/docs/guides/transactions) - Send ETH
- [Tokens](/docs/guides/tokens) - Manage ERC-20 tokens
- [Security](/docs/guides/security) - Security best practices
