---
sidebar_position: 6
---

# GIWA ID

This guide explains how to use GIWA ID, an ENS-based naming service.

## What is GIWA ID?

GIWA ID is an ENS-based naming service that allows you to use human-readable names (alice.giwa.id) instead of complex Ethereum addresses (0x...).

```
0x742d35Cc6634C0532925a3b844Bc9e7595f...  →  alice.giwa.id
```

## useGiwaId Hook

```tsx
import { useGiwaId } from '@giwa/react-native-wallet';

function GiwaIdScreen() {
  const {
    resolveAddress,     // GIWA ID → Address
    resolveName,        // Address → GIWA ID
    isNameAvailable,    // Name availability check
    register,           // Register GIWA ID
    getProfile,         // Get profile information
    setProfile,         // Set profile information
    isLoading,
  } = useGiwaId();

  // ...
}
```

## GIWA ID → Address Resolution

```tsx
const handleResolve = async () => {
  const giwaId = 'alice.giwa.id';

  try {
    const address = await resolveAddress(giwaId);

    if (address) {
      console.log('Address:', address);
    } else {
      console.log('GIWA ID not registered');
    }
  } catch (error) {
    console.error('Lookup failed:', error.message);
  }
};
```

## Address → GIWA ID Resolution (Reverse Lookup)

```tsx
const handleReverseLookup = async () => {
  const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f...';

  try {
    const name = await resolveName(address);

    if (name) {
      console.log('GIWA ID:', name);
    } else {
      console.log('No registered GIWA ID');
    }
  } catch (error) {
    console.error('Lookup failed:', error.message);
  }
};
```

## Check Name Availability

```tsx
const checkAvailability = async () => {
  const name = 'alice'; // Without .giwa.id

  const available = await isNameAvailable(name);

  if (available) {
    console.log(`${name}.giwa.id is available for registration`);
  } else {
    console.log(`${name}.giwa.id is already taken`);
  }
};
```

## Register GIWA ID

```tsx
const handleRegister = async () => {
  const name = 'alice'; // Without .giwa.id

  try {
    // First check availability
    const available = await isNameAvailable(name);
    if (!available) {
      Alert.alert('Error', 'This name is already taken');
      return;
    }

    const result = await register(name, {
      duration: 365, // Days (1 year)
    });

    console.log('Registration complete:', result.txHash);
    Alert.alert('Success', `${name}.giwa.id has been registered`);
  } catch (error) {
    Alert.alert('Registration Failed', error.message);
  }
};
```

## Get Profile Information

```tsx
const handleGetProfile = async () => {
  const giwaId = 'alice.giwa.id';

  try {
    const profile = await getProfile(giwaId);

    console.log('Avatar:', profile.avatar);
    console.log('Description:', profile.description);
    console.log('Twitter:', profile.twitter);
    console.log('Email:', profile.email);
    console.log('Website:', profile.url);
  } catch (error) {
    console.error('Profile lookup failed:', error.message);
  }
};
```

## Set Profile Information

```tsx
const handleSetProfile = async () => {
  try {
    const txHash = await setProfile({
      avatar: 'https://example.com/avatar.png',
      description: 'Hello, I am Alice!',
      twitter: '@alice',
      email: 'alice@example.com',
      url: 'https://alice.com',
    });

    console.log('Profile updated:', txHash);
  } catch (error) {
    Alert.alert('Update Failed', error.message);
  }
};
```

## Complete Example: GIWA ID Screen

```tsx
import { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Alert, Image } from 'react-native';
import { useGiwaId, useGiwaWallet } from '@giwa/react-native-wallet';

export function GiwaIdScreen() {
  const { wallet } = useGiwaWallet();
  const {
    resolveAddress,
    resolveName,
    isNameAvailable,
    register,
    getProfile,
    isLoading,
  } = useGiwaId();

  const [myGiwaId, setMyGiwaId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [nameAvailable, setNameAvailable] = useState<boolean | null>(null);

  // Look up my GIWA ID
  useEffect(() => {
    if (wallet?.address) {
      resolveName(wallet.address).then(setMyGiwaId);
    }
  }, [wallet]);

  // Search address by GIWA ID
  const handleSearch = async () => {
    if (!searchInput) return;

    const input = searchInput.endsWith('.giwa.id')
      ? searchInput
      : `${searchInput}.giwa.id`;

    const address = await resolveAddress(input);
    setSearchResult(address);
  };

  // Check name availability
  const handleCheckAvailability = async () => {
    if (!newName) return;

    const available = await isNameAvailable(newName);
    setNameAvailable(available);
  };

  // Register GIWA ID
  const handleRegister = async () => {
    if (!newName || !nameAvailable) return;

    try {
      await register(newName, { duration: 365 });
      Alert.alert('Success', `${newName}.giwa.id has been registered!`);
      setNewName('');
      setNameAvailable(null);
      // Refresh my GIWA ID
      const name = await resolveName(wallet.address);
      setMyGiwaId(name);
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>GIWA ID</Text>

      {/* My GIWA ID */}
      <View style={{ marginBottom: 30 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>My GIWA ID</Text>
        {myGiwaId ? (
          <Text style={{ fontSize: 18, color: 'blue' }}>{myGiwaId}</Text>
        ) : (
          <Text style={{ color: '#888' }}>No registered GIWA ID</Text>
        )}
      </View>

      {/* GIWA ID Search */}
      <View style={{ marginBottom: 30 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Search GIWA ID</Text>
        <View style={{ flexDirection: 'row' }}>
          <TextInput
            placeholder="alice or alice.giwa.id"
            value={searchInput}
            onChangeText={setSearchInput}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 10,
              marginRight: 10,
            }}
          />
          <Button title="Search" onPress={handleSearch} disabled={isLoading} />
        </View>
        {searchResult !== null && (
          <Text style={{ marginTop: 10 }}>
            {searchResult
              ? `Address: ${searchResult.slice(0, 20)}...`
              : 'GIWA ID not registered'}
          </Text>
        )}
      </View>

      {/* GIWA ID Registration */}
      {!myGiwaId && (
        <View>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>Register GIWA ID</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              placeholder="Desired name"
              value={newName}
              onChangeText={(text) => {
                setNewName(text);
                setNameAvailable(null);
              }}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: '#ccc',
                padding: 10,
              }}
            />
            <Text style={{ marginHorizontal: 5 }}>.giwa.id</Text>
          </View>

          <Button
            title="Check Availability"
            onPress={handleCheckAvailability}
            disabled={isLoading || !newName}
          />

          {nameAvailable !== null && (
            <Text
              style={{
                marginTop: 10,
                color: nameAvailable ? 'green' : 'red',
              }}
            >
              {nameAvailable
                ? 'Available'
                : 'Already taken'}
            </Text>
          )}

          {nameAvailable && (
            <Button
              title={`Register ${newName}.giwa.id`}
              onPress={handleRegister}
              disabled={isLoading}
            />
          )}
        </View>
      )}
    </View>
  );
}
```

## Auto-resolve GIWA ID in Address Input

Automatically convert GIWA ID to address when sending transactions:

```tsx
const sendToGiwaId = async (recipient: string, amount: string) => {
  let toAddress = recipient;

  // Convert GIWA ID to address if applicable
  if (recipient.endsWith('.giwa.id') || !recipient.startsWith('0x')) {
    const giwaId = recipient.endsWith('.giwa.id')
      ? recipient
      : `${recipient}.giwa.id`;

    const resolved = await resolveAddress(giwaId);
    if (!resolved) {
      throw new Error('Invalid GIWA ID');
    }
    toAddress = resolved;
  }

  // Send transaction
  return sendTransaction({ to: toAddress, value: amount });
};
```

## Next Steps

- [Dojang](/docs/guides/dojang) - EAS-based attestations
- [Wallet Management](/docs/guides/wallet-management) - Wallet features
