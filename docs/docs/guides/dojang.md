---
sidebar_position: 7
---

# Dojang (증명)

EAS(Ethereum Attestation Service) 기반 Dojang 증명 서비스를 설명합니다.

## Dojang이란?

Dojang(도장)은 GIWA Chain의 증명(attestation) 서비스입니다. 신원 확인, 자격 증명, 업적 인증 등을 블록체인에 기록하고 검증할 수 있습니다.

```
┌─────────────────────────────────────────┐
│           Dojang (증명)                  │
├─────────────────────────────────────────┤
│  - KYC 인증 (신원 확인)                   │
│  - 학력/자격 증명                         │
│  - 프로젝트 참여 증명                     │
│  - NFT 소유 증명                          │
│  - DAO 멤버십 증명                        │
└─────────────────────────────────────────┘
```

## useDojang Hook

```tsx
import { useDojang } from '@giwa/react-native-wallet';

function DojangScreen() {
  const {
    getAttestation,      // 증명 조회
    getAttestations,     // 증명 목록 조회
    verifyAttestation,   // 증명 검증
    createAttestation,   // 증명 생성 (인증된 발급자만)
    revokeAttestation,   // 증명 취소
    isLoading,
  } = useDojang();

  // ...
}
```

## 증명 조회

### 단일 증명 조회

```tsx
const handleGetAttestation = async () => {
  const attestationId = '0x...'; // 증명 ID

  try {
    const attestation = await getAttestation(attestationId);

    console.log('발급자:', attestation.attester);
    console.log('수신자:', attestation.recipient);
    console.log('스키마:', attestation.schema);
    console.log('데이터:', attestation.data);
    console.log('발급일:', attestation.time);
    console.log('만료일:', attestation.expirationTime);
    console.log('취소됨:', attestation.revoked);
  } catch (error) {
    console.error('조회 실패:', error.message);
  }
};
```

### 사용자의 모든 증명 조회

```tsx
const handleGetMyAttestations = async () => {
  const address = wallet.address;

  const attestations = await getAttestations({
    recipient: address,
  });

  console.log(`총 ${attestations.length}개의 증명`);

  attestations.forEach((att) => {
    console.log(`- ${att.schema.name}: ${att.data.value}`);
  });
};
```

### 스키마별 증명 조회

```tsx
import { DOJANG_SCHEMAS } from '@giwa/react-native-wallet';

const handleGetKycAttestations = async () => {
  const attestations = await getAttestations({
    recipient: wallet.address,
    schemaId: DOJANG_SCHEMAS.KYC,
  });

  const kycVerified = attestations.some(
    (att) => !att.revoked && att.data.verified === true
  );

  console.log('KYC 인증됨:', kycVerified);
};
```

## 증명 검증

```tsx
const handleVerify = async () => {
  const attestationId = '0x...';

  try {
    const isValid = await verifyAttestation(attestationId);

    if (isValid) {
      console.log('유효한 증명입니다');
    } else {
      console.log('유효하지 않거나 취소된 증명입니다');
    }
  } catch (error) {
    console.error('검증 실패:', error.message);
  }
};
```

## 증명 생성 (발급자용)

:::info 권한 필요
증명 생성은 인증된 발급자(attester)만 가능합니다. 일반 사용자는 증명을 생성할 수 없습니다.
:::

```tsx
const handleCreateAttestation = async () => {
  try {
    const result = await createAttestation({
      schemaId: DOJANG_SCHEMAS.MEMBERSHIP,
      recipient: '0x...', // 수신자 주소
      data: {
        organization: 'GIWA DAO',
        role: 'Member',
        joinedAt: Date.now(),
      },
      expirationTime: 0, // 0 = 만료 없음
      revocable: true,
    });

    console.log('증명 생성됨:', result.attestationId);
  } catch (error) {
    Alert.alert('생성 실패', error.message);
  }
};
```

## 기본 스키마 목록

```tsx
import { DOJANG_SCHEMAS } from '@giwa/react-native-wallet';

// 사용 가능한 스키마
DOJANG_SCHEMAS.KYC           // 신원 확인
DOJANG_SCHEMAS.MEMBERSHIP    // 멤버십
DOJANG_SCHEMAS.ACHIEVEMENT   // 업적
DOJANG_SCHEMAS.CREDENTIAL    // 자격증
DOJANG_SCHEMAS.VERIFICATION  // 일반 검증
```

## 전체 예제: 증명 화면

```tsx
import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useDojang, useGiwaWallet, DOJANG_SCHEMAS } from '@giwa/react-native-wallet';

export function DojangScreen() {
  const { wallet } = useGiwaWallet();
  const { getAttestations, verifyAttestation, isLoading } = useDojang();

  const [attestations, setAttestations] = useState([]);
  const [selectedAttestation, setSelectedAttestation] = useState(null);

  // 내 증명 목록 로드
  useEffect(() => {
    if (wallet?.address) {
      loadAttestations();
    }
  }, [wallet]);

  const loadAttestations = async () => {
    const atts = await getAttestations({
      recipient: wallet.address,
    });
    setAttestations(atts);
  };

  // 증명 검증
  const handleVerify = async (attestationId: string) => {
    const isValid = await verifyAttestation(attestationId);
    Alert.alert(
      '검증 결과',
      isValid ? '✓ 유효한 증명입니다' : '✗ 유효하지 않은 증명입니다'
    );
  };

  // 스키마 이름 변환
  const getSchemaName = (schemaId: string) => {
    switch (schemaId) {
      case DOJANG_SCHEMAS.KYC:
        return '🪪 신원 확인';
      case DOJANG_SCHEMAS.MEMBERSHIP:
        return '🎫 멤버십';
      case DOJANG_SCHEMAS.ACHIEVEMENT:
        return '🏆 업적';
      case DOJANG_SCHEMAS.CREDENTIAL:
        return '📜 자격증';
      default:
        return '📋 일반 증명';
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>🔏 내 Dojang 증명</Text>

      {attestations.length === 0 ? (
        <Text style={{ color: '#888' }}>등록된 증명이 없습니다</Text>
      ) : (
        <FlatList
          data={attestations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={{
                padding: 15,
                backgroundColor: item.revoked ? '#ffebee' : '#f5f5f5',
                marginBottom: 10,
                borderRadius: 8,
              }}
              onPress={() => setSelectedAttestation(item)}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: 'bold' }}>
                  {getSchemaName(item.schemaId)}
                </Text>
                {item.revoked && (
                  <Text style={{ color: 'red' }}>취소됨</Text>
                )}
              </View>

              <Text style={{ color: '#666', marginTop: 5 }}>
                발급자: {item.attester.slice(0, 10)}...
              </Text>

              <Text style={{ color: '#888', fontSize: 12, marginTop: 5 }}>
                {new Date(item.time * 1000).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* 선택된 증명 상세 */}
      {selectedAttestation && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'white',
            padding: 20,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.25,
            shadowRadius: 4,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
            증명 상세
          </Text>

          <Text>ID: {selectedAttestation.id.slice(0, 20)}...</Text>
          <Text>스키마: {getSchemaName(selectedAttestation.schemaId)}</Text>
          <Text>발급자: {selectedAttestation.attester}</Text>
          <Text>
            발급일: {new Date(selectedAttestation.time * 1000).toLocaleString()}
          </Text>

          <View style={{ flexDirection: 'row', marginTop: 15 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#007AFF',
                padding: 12,
                borderRadius: 8,
                marginRight: 10,
              }}
              onPress={() => handleVerify(selectedAttestation.id)}
            >
              <Text style={{ color: 'white', textAlign: 'center' }}>검증</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flex: 1,
                backgroundColor: '#ccc',
                padding: 12,
                borderRadius: 8,
              }}
              onPress={() => setSelectedAttestation(null)}
            >
              <Text style={{ textAlign: 'center' }}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
```

## 증명 유형별 사용 예

### KYC 인증 확인

```tsx
const isKycVerified = async (address: string) => {
  const attestations = await getAttestations({
    recipient: address,
    schemaId: DOJANG_SCHEMAS.KYC,
  });

  return attestations.some(
    (att) => !att.revoked && att.data.level >= 1
  );
};
```

### DAO 멤버십 확인

```tsx
const isDaoMember = async (address: string, daoId: string) => {
  const attestations = await getAttestations({
    recipient: address,
    schemaId: DOJANG_SCHEMAS.MEMBERSHIP,
  });

  return attestations.some(
    (att) => !att.revoked && att.data.daoId === daoId
  );
};
```

## 다음 단계

- [보안](/docs/guides/security) - 보안 모범 사례
- [GIWA ID](/docs/guides/giwa-id) - 네이밍 서비스
