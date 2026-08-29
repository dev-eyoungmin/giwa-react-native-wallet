---
sidebar_position: 6
---

# GIWA ID

This guide explains how to use GIWA ID (`up.id`), Upbit Web3 Names — a naming service resolved via the on-chain `UpnameRegistry` contract on GIWA L2.

:::info Registration
`up.id` names are ERC-721 tokens (symbol `UPNAME`) minted through Upbit / the GIWA playground — not through this SDK. This SDK is read-only: it resolves names, resolves addresses back to names, and checks availability.

See: [GIWA ID Documentation](https://docs.giwa.io/giwa-ecosystem/up-id)
:::

## What is GIWA ID?

GIWA ID lets you use human-readable names (`alice.up.id`) instead of complex Ethereum addresses (`0x...`).

```
0x742d35Cc6634C0532925a3b844Bc9e7595f...  →  alice.up.id
```

Each name is an ERC-721 token in `UpnameRegistry`, where `tokenId = uint256(keccak256(bytes(label)))` (the label is the part before `.up.id`). Ownership, reverse lookup, and availability are all read from that contract.

### Key Features

- **On-chain registry**: names live in `UpnameRegistry` on GIWA L2, resolved with plain contract reads
- **Reverse resolution**: look up the `up.id` name owned by an address
- **No text records**: `up.id` does not support ENS-style text records (avatar/description/url/etc.) — the only extra data available is the ERC-721 `tokenURI` and a best-effort `avatar` extracted from its metadata

## useGiwaId Hook

```tsx
import { useGiwaId } from 'giwa-react-native-wallet';

function GiwaIdScreen() {
  const {
    resolveAddress,     // up.id name → Address
    resolveName,        // Address → up.id name
    getGiwaId,          // Get full GiwaId info (tokenId, tokenUri, avatar)
    isAvailable,        // Check name availability
    isLoading,
    isInitializing,
    error,
  } = useGiwaId();

  // ...
}
```

## GIWA ID → Address Resolution

```tsx
const handleResolve = async () => {
  // Both formats work
  const address = await resolveAddress('alice'); // or 'alice.up.id'

  if (address) {
    console.log('Address:', address);
  } else {
    console.log('up.id not registered');
  }
};
```

## Address → GIWA ID Resolution (Reverse Lookup)

```tsx
const handleReverseLookup = async () => {
  const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f...';

  const name = await resolveName(address);

  if (name) {
    console.log('GIWA ID:', name); // e.g. "alice.up.id"
  } else {
    console.log('No registered up.id name');
  }
};
```

## Get GIWA ID Info

`getGiwaId` returns the full `GiwaId` record: the resolved `name`, `address`, ERC-721 `tokenId`, the raw `tokenUri`, and a best-effort `avatar` URL read from the token's metadata (only `https://` URIs and image fields are followed; anything else resolves to `undefined`).

```tsx
const handleGetGiwaId = async () => {
  const giwaId = await getGiwaId('alice');

  if (giwaId) {
    console.log('Name:', giwaId.name);        // alice.up.id
    console.log('Address:', giwaId.address);
    console.log('Token ID:', giwaId.tokenId);  // bigint
    console.log('Token URI:', giwaId.tokenUri);
    console.log('Avatar:', giwaId.avatar);     // string | undefined
  }
};
```

## Check Name Availability

`isAvailable` mirrors the registry's `isClaimable` check.

```tsx
const checkAvailability = async () => {
  const name = 'alice';

  const available = await isAvailable(name);

  if (available) {
    console.log(`${name}.up.id is not registered`);
  } else {
    console.log(`${name}.up.id is already taken`);
  }
};
```

## Complete Example: GIWA ID Search

```tsx
import { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, Image } from 'react-native';
import { useGiwaId, useGiwaWallet } from 'giwa-react-native-wallet';

export function GiwaIdScreen() {
  const { wallet } = useGiwaWallet();
  const {
    resolveAddress,
    resolveName,
    getGiwaId,
    isLoading,
    isInitializing,
    error,
  } = useGiwaId();

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

  if (isInitializing) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>GIWA ID</Text>

      {error && (
        <Text style={{ color: 'red', marginBottom: 10 }}>{error.message}</Text>
      )}

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
            placeholder="alice or alice.up.id"
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
