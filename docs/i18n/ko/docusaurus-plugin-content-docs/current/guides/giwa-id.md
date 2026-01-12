---
sidebar_position: 6
---

# GIWA ID

이 가이드에서는 ENS 기반 네이밍 서비스인 GIWA ID (up.id) 사용 방법을 설명합니다.

:::info Registration
GIWA ID 등록은 Upbit의 Verified Address 서비스를 통해서만 가능합니다. 이 SDK는 이름과 주소를 조회하기 위한 읽기 전용 접근을 제공합니다.

참고: [GIWA ID 문서](https://docs.giwa.io/giwa-ecosystem/giwa-id)
:::

## What is GIWA ID?

GIWA ID는 ENS 기반의 네이밍 서비스로, 복잡한 이더리움 주소(0x...) 대신 사람이 읽을 수 있는 이름(alice.up.id)을 사용할 수 있게 해줍니다.

```
0x742d35Cc6634C0532925a3b844Bc9e7595f...  →  alice.up.id
```

### Key Features

- **ENS 호환**: 모든 ENS 호환 라이브러리 및 도구와 연동
- **검증된 신원**: KYC 인증된 사용자만 사용 가능
- **Soul-Bound**: 전송 또는 판매 불가
- **Cross-Chain**: 여러 블록체인에서 사용 가능

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
  // 두 형식 모두 작동
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
// 아바타 가져오기
const avatar = await getTextRecord('alice', 'avatar');

// 다른 레코드 가져오기
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

  // 내 GIWA ID 조회
  useEffect(() => {
    if (wallet?.address) {
      resolveName(wallet.address).then(setMyGiwaId);
    }
  }, [wallet]);

  // GIWA ID로 검색
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

      {/* 내 GIWA ID */}
      <View style={{ marginBottom: 30 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>My GIWA ID</Text>
        {myGiwaId ? (
          <Text style={{ fontSize: 18, color: 'blue' }}>{myGiwaId}</Text>
        ) : (
          <Text style={{ color: '#888' }}>등록된 GIWA ID 없음</Text>
        )}
      </View>

      {/* GIWA ID 검색 */}
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
              <Text>GIWA ID를 찾을 수 없음</Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
```

## Auto-resolve GIWA ID in Address Input

트랜잭션 전송 시 GIWA ID를 자동으로 주소로 변환:

```tsx
const sendToGiwaId = async (recipient: string, amount: string) => {
  let toAddress = recipient;

  // 해당하는 경우 GIWA ID를 주소로 변환
  if (!recipient.startsWith('0x')) {
    const resolved = await resolveAddress(recipient);
    if (!resolved) {
      throw new Error('Invalid GIWA ID');
    }
    toAddress = resolved;
  }

  // 트랜잭션 전송
  return sendTransaction({ to: toAddress, value: amount });
};
```

## Next Steps

- [Dojang](/docs/guides/dojang) - EAS 기반 증명
- [Wallet Management](/docs/guides/wallet-management) - 지갑 기능
