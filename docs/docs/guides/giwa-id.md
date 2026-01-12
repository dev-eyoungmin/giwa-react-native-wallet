---
sidebar_position: 6
---

# GIWA ID

This guide explains how to use GIWA ID (up.id), an ENS-based naming service.

:::info Registration
GIWA ID registration is only available through Upbit's Verified Address service. This SDK provides read-only access for resolving names and addresses.

See: [GIWA ID Documentation](https://docs.giwa.io/giwa-ecosystem/giwa-id)
:::

## What is GIWA ID?

GIWA ID is an ENS-based naming service that allows you to use human-readable names (alice.up.id) instead of complex Ethereum addresses (0x...).

```
0x742d35Cc6634C0532925a3b844Bc9e7595f...  →  alice.up.id
```

### Key Features

- **ENS Compatible**: Works with all ENS-compatible libraries and tools
- **Verified Identity**: Only available to KYC-verified users
- **Soul-Bound**: Cannot be transferred or sold
- **Cross-Chain**: Works across multiple blockchains

## useGiwaId Hook

```tsx
import { useGiwaId } from '@giwa/react-native-wallet';

function GiwaIdScreen() {
  const {
    resolveAddress,     // GIWA ID → Address
    resolveName,        // Address → GIWA ID
    getGiwaId,          // Get full GIWA ID info
    getTextRecord,      // Get profile records (avatar, etc.)
    isAvailable,        // Check name availability
    isLoading,
  } = useGiwaId();

  // ...
}
```

## GIWA ID → Address Resolution

```tsx
const handleResolve = async () => {
  // Both formats work
  const address = await resolveAddress('alice'); // or 'alice.giwa.id'

  if (address) {
    console.log('Address:', address);
  } else {
    console.log('GIWA ID not registered');
  }
};
```

## Address → GIWA ID Resolution (Reverse Lookup)

```tsx
const handleReverseLookup = async () => {
  const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f...';

  const name = await resolveName(address);

  if (name) {
    console.log('GIWA ID:', name);
  } else {
    console.log('No registered GIWA ID');
  }
};
```

## Get GIWA ID Info

```tsx
const handleGetGiwaId = async () => {
  const giwaId = await getGiwaId('alice');

  if (giwaId) {
    console.log('Name:', giwaId.name);      // alice.giwa.id
    console.log('Address:', giwaId.address);
    console.log('Avatar:', giwaId.avatar);
  }
};
```

## Get Text Records

```tsx
// Get avatar
const avatar = await getTextRecord('alice', 'avatar');

// Get other records
const description = await getTextRecord('alice', 'description');
const url = await getTextRecord('alice', 'url');
```

## Check Name Availability

```tsx
const checkAvailability = async () => {
  const name = 'alice';

  const available = await isAvailable(name);

  if (available) {
    console.log(`${name}.giwa.id is not registered`);
  } else {
    console.log(`${name}.giwa.id is already taken`);
  }
};
```

## Complete Example: GIWA ID Search

```tsx
import { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Image } from 'react-native';
import { useGiwaId, useGiwaWallet } from '@giwa/react-native-wallet';

export function GiwaIdScreen() {
  const { wallet } = useGiwaWallet();
  const { resolveAddress, resolveName, getGiwaId, isLoading } = useGiwaId();

  const [myGiwaId, setMyGiwaId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [searchResult, setSearchResult] = useState<{
    address: string | null;
    avatar: string | null;
  } | null>(null);

  // Look up my GIWA ID
  useEffect(() => {
    if (wallet?.address) {
      resolveName(wallet.address).then(setMyGiwaId);
    }
  }, [wallet]);

  // Search by GIWA ID
  const handleSearch = async () => {
    if (!searchInput) return;

    const info = await getGiwaId(searchInput);
    setSearchResult(
      info ? { address: info.address, avatar: info.avatar || null } : null
    );
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
        <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>
          Search GIWA ID
        </Text>
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
          <View style={{ marginTop: 10 }}>
            {searchResult.address ? (
              <>
                {searchResult.avatar && (
                  <Image
                    source={{ uri: searchResult.avatar }}
                    style={{ width: 50, height: 50, borderRadius: 25 }}
                  />
                )}
                <Text>Address: {searchResult.address.slice(0, 20)}...</Text>
              </>
            ) : (
              <Text>GIWA ID not found</Text>
            )}
          </View>
        )}
      </View>
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
  if (!recipient.startsWith('0x')) {
    const resolved = await resolveAddress(recipient);
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
