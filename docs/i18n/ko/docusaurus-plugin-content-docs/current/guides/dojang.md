---
sidebar_position: 7
---

# Dojang (Attestations)

이 가이드에서는 EAS(Ethereum Attestation Service) 기반의 Dojang 증명 서비스를 설명합니다.

:::info Attestation Creation
증명은 공식 발급자(예: Upbit Korea)만 생성할 수 있습니다. 이 SDK는 증명을 검증하기 위한 읽기 전용 접근을 제공합니다.

참고: [Dojang 문서](https://docs.giwa.io/giwa-ecosystem/dojang)
:::

## What is Dojang?

Dojang은 온체인 지갑 주소와 오프체인 정보를 연결하는 GIWA Chain의 증명 서비스입니다. 사용자가 개인 식별 정보(PII)를 직접 노출하지 않고도 신원을 확립할 수 있게 해줍니다.

### Attestation Types

| 타입 | 설명 |
|------|------|
| **Verified Address** | KYC 인증된 지갑 주소 |
| **Balance Root** | 잔액의 머클 트리 요약 |
| **Verified Balance** | 특정 시점의 잔액 증명 |
| **Verified Code** | 오프체인 코드의 온체인 검증 |

## useDojang Hook

```tsx
import { useDojang } from '@giwa/react-native-wallet';

function DojangScreen() {
  const {
    getAttestation,       // UID로 증명 조회
    isAttestationValid,   // 증명 유효성 확인
    getVerifiedBalance,   // 검증된 잔액 데이터 조회
    getSchema,            // 스키마 정보 조회
    isLoading,
  } = useDojang();

  // ...
}
```

## Get Attestation

```tsx
const handleGetAttestation = async () => {
  const attestationUid = '0x...'; // Attestation UID

  try {
    const attestation = await getAttestation(attestationUid);

    if (attestation) {
      console.log('Attester:', attestation.attester);
      console.log('Recipient:', attestation.recipient);
      console.log('Type:', attestation.attestationType);
      console.log('Issued:', attestation.time);
      console.log('Revoked:', attestation.revoked);
    } else {
      console.log('Attestation not found');
    }
  } catch (error) {
    console.error('Lookup failed:', error.message);
  }
};
```

## Verify Attestation

증명이 유효한지(존재하고 취소되지 않았는지) 확인:

```tsx
const handleVerify = async () => {
  const attestationUid = '0x...';

  const isValid = await isAttestationValid(attestationUid);

  if (isValid) {
    console.log('Attestation is valid');
  } else {
    console.log('Attestation is invalid or revoked');
  }
};
```

## Get Verified Balance

`verified_balance` 타입 증명의 경우:

```tsx
const handleGetBalance = async () => {
  const attestationUid = '0x...';

  const result = await getVerifiedBalance(attestationUid);

  if (result) {
    console.log('Balance:', result.balance);
    console.log('Timestamp:', result.timestamp);
  }
};
```

## Get Schema Information

```tsx
const handleGetSchema = async () => {
  const schemaUid = '0x...';

  const schema = await getSchema(schemaUid);

  if (schema) {
    console.log('Schema UID:', schema.uid);
    console.log('Schema:', schema.schema);
    console.log('Revocable:', schema.revocable);
  }
};
```

## Complete Example

```tsx
import { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { useDojang } from '@giwa/react-native-wallet';

export function DojangScreen() {
  const { getAttestation, isAttestationValid, isLoading } = useDojang();
  const [uid, setUid] = useState('');
  const [attestation, setAttestation] = useState(null);

  const handleLookup = async () => {
    if (!uid) return;

    const att = await getAttestation(uid);
    setAttestation(att);
  };

  const handleVerify = async () => {
    if (!uid) return;

    const isValid = await isAttestationValid(uid);
    Alert.alert(
      'Verification Result',
      isValid ? '유효한 증명' : '유효하지 않거나 취소된 증명'
    );
  };

  const getTypeName = (type: string) => {
    switch (type) {
      case 'verified_address':
        return 'Verified Address';
      case 'balance_root':
        return 'Balance Root';
      case 'verified_balance':
        return 'Verified Balance';
      case 'verified_code':
        return 'Verified Code';
      default:
        return type;
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Dojang Attestations</Text>

      <Text style={{ marginBottom: 5 }}>Attestation UID</Text>
      <TextInput
        placeholder="0x..."
        value={uid}
        onChangeText={setUid}
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 10,
          marginBottom: 10,
          fontFamily: 'monospace',
        }}
      />

      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        <Button title="Lookup" onPress={handleLookup} disabled={isLoading} />
        <View style={{ width: 10 }} />
        <Button title="Verify" onPress={handleVerify} disabled={isLoading} />
      </View>

      {attestation && (
        <View
          style={{
            backgroundColor: attestation.revoked ? '#ffebee' : '#e8f5e9',
            padding: 15,
            borderRadius: 8,
          }}
        >
          <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
            {getTypeName(attestation.attestationType)}
          </Text>

          <Text>Attester: {attestation.attester.slice(0, 20)}...</Text>
          <Text>Recipient: {attestation.recipient.slice(0, 20)}...</Text>
          <Text>
            Issued: {new Date(Number(attestation.time) * 1000).toLocaleString()}
          </Text>

          {attestation.revoked && (
            <Text style={{ color: 'red', marginTop: 10 }}>
              이 증명은 취소되었습니다
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
```

## Use Cases

### Check if Address is Verified

```tsx
const checkVerifiedAddress = async (attestationUid: string) => {
  const attestation = await getAttestation(attestationUid);

  if (!attestation) {
    return { verified: false, reason: 'Attestation not found' };
  }

  if (attestation.revoked) {
    return { verified: false, reason: 'Attestation revoked' };
  }

  if (attestation.attestationType !== 'verified_address') {
    return { verified: false, reason: 'Wrong attestation type' };
  }

  return { verified: true, address: attestation.recipient };
};
```

### Verify Before Transaction

```tsx
const sendToVerifiedAddress = async (attestationUid: string, amount: string) => {
  // 먼저 증명 검증
  const isValid = await isAttestationValid(attestationUid);
  if (!isValid) {
    throw new Error('Invalid or revoked attestation');
  }

  // 수신자 주소 조회
  const attestation = await getAttestation(attestationUid);
  if (!attestation) {
    throw new Error('Attestation not found');
  }

  // 트랜잭션 전송
  return sendTransaction({
    to: attestation.recipient,
    value: amount,
  });
};
```

## Next Steps

- [Security](/docs/guides/security) - 보안 모범 사례
- [GIWA ID](/docs/guides/giwa-id) - 네이밍 서비스
