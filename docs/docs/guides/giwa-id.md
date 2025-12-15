---
sidebar_position: 6
---

# GIWA ID

ENS 기반 네이밍 서비스 GIWA ID 사용 방법을 설명합니다.

## GIWA ID란?

GIWA ID는 복잡한 이더리움 주소(0x...) 대신 읽기 쉬운 이름(alice.giwa.id)을 사용할 수 있게 해주는 ENS 기반 네이밍 서비스입니다.

```
0x742d35Cc6634C0532925a3b844Bc9e7595f...  →  alice.giwa.id
```

## useGiwaId Hook

```tsx
import { useGiwaId } from '@giwa/react-native-wallet';

function GiwaIdScreen() {
  const {
    resolveAddress,     // GIWA ID → 주소
    resolveName,        // 주소 → GIWA ID
    isNameAvailable,    // 이름 사용 가능 여부
    register,           // GIWA ID 등록
    getProfile,         // 프로필 정보 조회
    setProfile,         // 프로필 정보 설정
    isLoading,
  } = useGiwaId();

  // ...
}
```

## GIWA ID → 주소 변환

```tsx
const handleResolve = async () => {
  const giwaId = 'alice.giwa.id';

  try {
    const address = await resolveAddress(giwaId);

    if (address) {
      console.log('주소:', address);
    } else {
      console.log('등록되지 않은 GIWA ID입니다');
    }
  } catch (error) {
    console.error('조회 실패:', error.message);
  }
};
```

## 주소 → GIWA ID 변환 (역방향 조회)

```tsx
const handleReverseLookup = async () => {
  const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f...';

  try {
    const name = await resolveName(address);

    if (name) {
      console.log('GIWA ID:', name);
    } else {
      console.log('등록된 GIWA ID가 없습니다');
    }
  } catch (error) {
    console.error('조회 실패:', error.message);
  }
};
```

## 이름 사용 가능 여부 확인

```tsx
const checkAvailability = async () => {
  const name = 'alice'; // .giwa.id 제외

  const available = await isNameAvailable(name);

  if (available) {
    console.log(`${name}.giwa.id는 등록 가능합니다`);
  } else {
    console.log(`${name}.giwa.id는 이미 사용 중입니다`);
  }
};
```

## GIWA ID 등록

```tsx
const handleRegister = async () => {
  const name = 'alice'; // .giwa.id 제외

  try {
    // 먼저 사용 가능 여부 확인
    const available = await isNameAvailable(name);
    if (!available) {
      Alert.alert('오류', '이미 사용 중인 이름입니다');
      return;
    }

    const result = await register(name, {
      duration: 365, // 일 단위 (1년)
    });

    console.log('등록 완료:', result.txHash);
    Alert.alert('성공', `${name}.giwa.id가 등록되었습니다`);
  } catch (error) {
    Alert.alert('등록 실패', error.message);
  }
};
```

## 프로필 정보 조회

```tsx
const handleGetProfile = async () => {
  const giwaId = 'alice.giwa.id';

  try {
    const profile = await getProfile(giwaId);

    console.log('아바타:', profile.avatar);
    console.log('소개:', profile.description);
    console.log('트위터:', profile.twitter);
    console.log('이메일:', profile.email);
    console.log('웹사이트:', profile.url);
  } catch (error) {
    console.error('프로필 조회 실패:', error.message);
  }
};
```

## 프로필 정보 설정

```tsx
const handleSetProfile = async () => {
  try {
    const txHash = await setProfile({
      avatar: 'https://example.com/avatar.png',
      description: '안녕하세요, Alice입니다!',
      twitter: '@alice',
      email: 'alice@example.com',
      url: 'https://alice.com',
    });

    console.log('프로필 업데이트:', txHash);
  } catch (error) {
    Alert.alert('업데이트 실패', error.message);
  }
};
```

## 전체 예제: GIWA ID 화면

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

  // 내 GIWA ID 조회
  useEffect(() => {
    if (wallet?.address) {
      resolveName(wallet.address).then(setMyGiwaId);
    }
  }, [wallet]);

  // GIWA ID로 주소 검색
  const handleSearch = async () => {
    if (!searchInput) return;

    const input = searchInput.endsWith('.giwa.id')
      ? searchInput
      : `${searchInput}.giwa.id`;

    const address = await resolveAddress(input);
    setSearchResult(address);
  };

  // 이름 사용 가능 여부 확인
  const handleCheckAvailability = async () => {
    if (!newName) return;

    const available = await isNameAvailable(newName);
    setNameAvailable(available);
  };

  // GIWA ID 등록
  const handleRegister = async () => {
    if (!newName || !nameAvailable) return;

    try {
      await register(newName, { duration: 365 });
      Alert.alert('성공', `${newName}.giwa.id가 등록되었습니다!`);
      setNewName('');
      setNameAvailable(null);
      // 내 GIWA ID 새로고침
      const name = await resolveName(wallet.address);
      setMyGiwaId(name);
    } catch (error) {
      Alert.alert('오류', error.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>GIWA ID</Text>

      {/* 내 GIWA ID */}
      <View style={{ marginBottom: 30 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>내 GIWA ID</Text>
        {myGiwaId ? (
          <Text style={{ fontSize: 18, color: 'blue' }}>{myGiwaId}</Text>
        ) : (
          <Text style={{ color: '#888' }}>등록된 GIWA ID가 없습니다</Text>
        )}
      </View>

      {/* GIWA ID 검색 */}
      <View style={{ marginBottom: 30 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>GIWA ID 검색</Text>
        <View style={{ flexDirection: 'row' }}>
          <TextInput
            placeholder="alice 또는 alice.giwa.id"
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
          <Button title="검색" onPress={handleSearch} disabled={isLoading} />
        </View>
        {searchResult !== null && (
          <Text style={{ marginTop: 10 }}>
            {searchResult
              ? `주소: ${searchResult.slice(0, 20)}...`
              : '등록되지 않은 GIWA ID입니다'}
          </Text>
        )}
      </View>

      {/* GIWA ID 등록 */}
      {!myGiwaId && (
        <View>
          <Text style={{ fontWeight: 'bold', marginBottom: 5 }}>GIWA ID 등록</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              placeholder="원하는 이름"
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
            title="사용 가능 확인"
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
                ? '✓ 사용 가능합니다'
                : '✗ 이미 사용 중입니다'}
            </Text>
          )}

          {nameAvailable && (
            <Button
              title={`${newName}.giwa.id 등록`}
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

## 주소 입력 시 GIWA ID 자동 해석

트랜잭션 전송 시 GIWA ID를 자동으로 주소로 변환:

```tsx
const sendToGiwaId = async (recipient: string, amount: string) => {
  let toAddress = recipient;

  // GIWA ID인 경우 주소로 변환
  if (recipient.endsWith('.giwa.id') || !recipient.startsWith('0x')) {
    const giwaId = recipient.endsWith('.giwa.id')
      ? recipient
      : `${recipient}.giwa.id`;

    const resolved = await resolveAddress(giwaId);
    if (!resolved) {
      throw new Error('유효하지 않은 GIWA ID입니다');
    }
    toAddress = resolved;
  }

  // 트랜잭션 전송
  return sendTransaction({ to: toAddress, value: amount });
};
```

## 다음 단계

- [Dojang](/docs/guides/dojang) - EAS 기반 증명
- [지갑 관리](/docs/guides/wallet-management) - 지갑 기능
