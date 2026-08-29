---
sidebar_position: 6
---

# GIWA ID

이 가이드에서는 GIWA ID(`up.id`, Upbit Web3 Names) 사용 방법을 설명합니다. `up.id`는 GIWA L2의 온체인 `UpnameRegistry` 컨트랙트를 통해 해석되는 네이밍 서비스입니다.

:::info Registration
`up.id` 이름은 Upbit / GIWA 플레이그라운드를 통해 발행되는 ERC-721 토큰(심볼 `UPNAME`)이며, 이 SDK를 통해 발행할 수는 없습니다. 이 SDK는 읽기 전용으로 이름 해석, 역방향 조회(주소 → 이름), 사용 가능 여부 확인 기능만 제공합니다.

참고: [GIWA ID 문서](https://docs.giwa.io/giwa-ecosystem/up-id)
:::

## What is GIWA ID?

GIWA ID는 복잡한 이더리움 주소(`0x...`) 대신 사람이 읽을 수 있는 이름(`alice.up.id`)을 사용할 수 있게 해줍니다.

```
0x742d35Cc6634C0532925a3b844Bc9e7595f...  →  alice.up.id
```

각 이름은 `UpnameRegistry`의 ERC-721 토큰이며, `tokenId = uint256(keccak256(bytes(label)))`로 계산됩니다(`label`은 `.up.id` 앞부분). 소유권, 역방향 조회, 사용 가능 여부는 모두 이 컨트랙트에서 직접 읽어옵니다.

### Key Features

- **온체인 레지스트리**: 이름은 GIWA L2의 `UpnameRegistry`에 저장되며 컨트랙트 읽기로 해석됩니다
- **역방향 조회**: 특정 주소가 소유한 `up.id` 이름을 조회할 수 있습니다
- **텍스트 레코드 없음**: `up.id`는 ENS 스타일의 텍스트 레코드(avatar/description/url 등)를 지원하지 않습니다 — 얻을 수 있는 추가 정보는 ERC-721 `tokenURI`와 그 메타데이터에서 best-effort로 추출한 `avatar`뿐입니다

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
  // 두 형식 모두 작동
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

`getGiwaId`는 해석된 `name`, `address`, ERC-721 `tokenId`, 원본 `tokenUri`, 그리고 토큰 메타데이터에서 best-effort로 읽은 `avatar` URL을 포함하는 전체 `GiwaId` 레코드를 반환합니다(`https://` URI와 image 필드만 추적하며, 그 외에는 `undefined`가 됩니다).

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

`isAvailable`은 레지스트리의 `isClaimable` 조회 결과를 그대로 반환합니다.

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

  if (isInitializing) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>GIWA ID</Text>

      {error && (
        <Text style={{ color: 'red', marginBottom: 10 }}>{error.message}</Text>
      )}

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
