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
    wallet,              // Current wallet information (GiwaWallet | null)
    isLoading,           // Loading state
    isInitializing,      // Whether SDK is initializing
    hasWallet,           // Convenience: wallet !== null
    error,               // Error information
    createWallet,        // Create new wallet
    recoverWallet,       // Recover with mnemonic
    importFromPrivateKey, // Import with private key
    loadWallet,          // Load saved wallet
    deleteWallet,        // Delete wallet
    exportMnemonic,      // Export mnemonic (rate-limited)
    exportPrivateKey,    // Export private key (rate-limited)
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
    const wallet = await importFromPrivateKey(privateKey);
    console.log('Imported address:', wallet.address);
  } catch (error) {
    Alert.alert('Error', 'Invalid private key');
  }
};
```

## Export Sensitive Data

:::danger Security Warning
Exporting mnemonic or private key is a sensitive operation. These functions have **Rate Limiting** applied (3 times per minute, 5-minute cooldown when exceeded).
:::

### Export Mnemonic

```tsx
const handleExportMnemonic = async () => {
  try {
    // Rate-limited: 3 times per minute
    const mnemonic = await exportMnemonic({ requireBiometric: true });

    if (mnemonic) {
      // Display mnemonic securely
      Alert.alert(
        'Recovery Phrase',
        mnemonic,
        [{ text: 'OK' }],
        { cancelable: false }
      );
    } else {
      Alert.alert('Error', 'Mnemonic not available');
    }
  } catch (error) {
    if (error.code === 'RATE_LIMIT_EXCEEDED') {
      Alert.alert('Rate Limited', 'Please try again in 5 minutes');
    } else if (error.code === 'BIOMETRIC_FAILED') {
      Alert.alert('Authentication Failed', 'Biometric authentication failed');
    }
  }
};
```

### Export Private Key

```tsx
const handleExportPrivateKey = async () => {
  try {
    // Rate-limited: 3 times per minute
    const privateKey = await exportPrivateKey({ requireBiometric: true });

    if (privateKey) {
      // Display private key securely (consider using a modal with auto-dismiss)
      Alert.alert(
        'Private Key',
        privateKey,
        [{ text: 'OK' }],
        { cancelable: false }
      );
    }
  } catch (error) {
    if (error.code === 'BIOMETRIC_FAILED') {
      Alert.alert('Authentication Failed', 'Biometric authentication failed');
    }
  }
};
```

## Delete Wallet

```tsx
const handleDelete = async () => {
  Alert.alert(
    'Delete Wallet',
    'Are you sure you want to delete? You cannot recover the wallet without the recovery phrase.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteWallet();
        },
      },
    ]
  );
};
```

## Check Wallet Status

```tsx
function WalletStatus() {
  const { wallet, isLoading, isInitializing, hasWallet, error } = useGiwaWallet();

  // Wait for SDK initialization
  if (isInitializing) {
    return <ActivityIndicator />;
  }

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return <Text>Error: {error.message}</Text>;
  }

  if (!hasWallet) {
    return <Text>No wallet connected</Text>;
  }

  return (
    <View>
      <Text>Address: {wallet.address}</Text>
    </View>
  );
}
```

## Complete Example

```tsx
import { useState } from 'react';
import { View, Text, Button, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useGiwaWallet } from '@giwa/react-native-wallet';

export function WalletManager() {
  const {
    wallet,
    hasWallet,
    isInitializing,
    isLoading,
    createWallet,
    recoverWallet,
    importFromPrivateKey,
    exportMnemonic,
    exportPrivateKey,
    deleteWallet,
  } = useGiwaWallet();

  const [mnemonicInput, setMnemonicInput] = useState('');
  const [privateKeyInput, setPrivateKeyInput] = useState('');
  const [showRecover, setShowRecover] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // Wait for SDK initialization
  if (isInitializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Initializing SDK...</Text>
      </View>
    );
  }

  if (hasWallet) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 16, marginBottom: 10 }}>Wallet Connected</Text>
        <Text selectable style={{ fontFamily: 'monospace', marginBottom: 20 }}>
          {wallet.address}
        </Text>

        <View style={{ gap: 10 }}>
          <Button
            title="Export Mnemonic"
            onPress={async () => {
              try {
                const mnemonic = await exportMnemonic({ requireBiometric: true });
                if (mnemonic) {
                  Alert.alert('Recovery Phrase', mnemonic);
                }
              } catch (e) {
                Alert.alert('Error', e.message);
              }
            }}
            disabled={isLoading}
          />
          <Button
            title="Export Private Key"
            onPress={async () => {
              try {
                const pk = await exportPrivateKey({ requireBiometric: true });
                if (pk) {
                  Alert.alert('Private Key', pk);
                }
              } catch (e) {
                Alert.alert('Error', e.message);
              }
            }}
            disabled={isLoading}
          />
          <Button
            title="Delete Wallet"
            onPress={() => {
              Alert.alert(
                'Delete Wallet',
                'This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: deleteWallet },
                ]
              );
            }}
            color="red"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Button
        title="Create New Wallet"
        onPress={async () => {
          try {
            const { mnemonic } = await createWallet();
            Alert.alert(
              'Backup Required',
              `Please save your recovery phrase:\n\n${mnemonic}\n\nThis will not be shown again.`
            );
          } catch (e) {
            Alert.alert('Error', e.message);
          }
        }}
        disabled={isLoading}
      />

      <View style={{ marginTop: 20 }}>
        <Button
          title={showRecover ? 'Hide Recover' : 'Recover with Mnemonic'}
          onPress={() => {
            setShowRecover(!showRecover);
            setShowImport(false);
          }}
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
                borderRadius: 8,
              }}
            />
            <Button
              title="Recover"
              onPress={async () => {
                try {
                  await recoverWallet(mnemonicInput);
                  setMnemonicInput('');
                  setShowRecover(false);
                } catch (e) {
                  Alert.alert('Error', e.message);
                }
              }}
              disabled={isLoading || !mnemonicInput.trim()}
            />
          </>
        )}
      </View>

      <View style={{ marginTop: 20 }}>
        <Button
          title={showImport ? 'Hide Import' : 'Import with Private Key'}
          onPress={() => {
            setShowImport(!showImport);
            setShowRecover(false);
          }}
        />

        {showImport && (
          <>
            <TextInput
              placeholder="Enter private key (0x...)"
              value={privateKeyInput}
              onChangeText={setPrivateKeyInput}
              secureTextEntry
              style={{
                borderWidth: 1,
                borderColor: '#ccc',
                padding: 10,
                marginVertical: 10,
                borderRadius: 8,
              }}
            />
            <Button
              title="Import"
              onPress={async () => {
                try {
                  await importFromPrivateKey(privateKeyInput);
                  setPrivateKeyInput('');
                  setShowImport(false);
                } catch (e) {
                  Alert.alert('Error', e.message);
                }
              }}
              disabled={isLoading || !privateKeyInput.trim()}
            />
          </>
        )}
      </View>
    </View>
  );
}
```

## Security Best Practices

1. **Mnemonic Backup**: Always guide users to backup their mnemonic phrase securely
2. **Biometric Authentication**: Use `requireBiometric: true` for sensitive operations
3. **Rate Limiting**: Be aware of rate limits on export functions (3 times/minute)
4. **Secure Display**: Use secure UI components when displaying sensitive data
5. **Confirmation**: Always confirm before destructive actions like wallet deletion

## Next Steps

- [Transactions](/docs/guides/transactions) - Send ETH
- [Tokens](/docs/guides/tokens) - Manage ERC-20 tokens
- [Security](/docs/guides/security) - Security best practices
