---
sidebar_position: 7
---

# Dojang (Attestations)

이 가이드에서는 EAS(Ethereum Attestation Service) 기반의 Dojang 증명 서비스를 설명합니다.

## What is Dojang?

Dojang은 GIWA Chain의 증명 서비스입니다. 신원 확인, 자격 증명, 업적 인증 등을 블록체인에 기록하고 검증할 수 있습니다.

```
┌─────────────────────────────────────────┐
│           Dojang (Attestations)         │
├─────────────────────────────────────────┤
│  - KYC Verification (Identity)          │
│  - Education/Credential Proofs          │
│  - Project Participation Proofs         │
│  - NFT Ownership Proofs                 │
│  - DAO Membership Proofs                │
└─────────────────────────────────────────┘
```

## useDojang Hook

```tsx
import { useDojang } from '@giwa/react-native-wallet';

function DojangScreen() {
  const {
    getAttestation,      // Get attestation
    getAttestations,     // Get attestation list
    verifyAttestation,   // Verify attestation
    createAttestation,   // Create attestation (authorized issuers only)
    revokeAttestation,   // Revoke attestation
    isLoading,
  } = useDojang();

  // ...
}
```

## Get Attestation

### Get Single Attestation

```tsx
const handleGetAttestation = async () => {
  const attestationId = '0x...'; // Attestation ID

  try {
    const attestation = await getAttestation(attestationId);

    console.log('Issuer:', attestation.attester);
    console.log('Recipient:', attestation.recipient);
    console.log('Schema:', attestation.schema);
    console.log('Data:', attestation.data);
    console.log('Issued:', attestation.time);
    console.log('Expiration:', attestation.expirationTime);
    console.log('Revoked:', attestation.revoked);
  } catch (error) {
    console.error('Lookup failed:', error.message);
  }
};
```

### Get All User Attestations

```tsx
const handleGetMyAttestations = async () => {
  const address = wallet.address;

  const attestations = await getAttestations({
    recipient: address,
  });

  console.log(`Total ${attestations.length} attestations`);

  attestations.forEach((att) => {
    console.log(`- ${att.schema.name}: ${att.data.value}`);
  });
};
```

### Get Attestations by Schema

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

  console.log('KYC Verified:', kycVerified);
};
```

## Verify Attestation

```tsx
const handleVerify = async () => {
  const attestationId = '0x...';

  try {
    const isValid = await verifyAttestation(attestationId);

    if (isValid) {
      console.log('Valid attestation');
    } else {
      console.log('Invalid or revoked attestation');
    }
  } catch (error) {
    console.error('Verification failed:', error.message);
  }
};
```

## Create Attestation (For Issuers)

:::info Permission Required
증명 생성은 인증된 증명자(attester)만 가능합니다. 일반 사용자는 증명을 생성할 수 없습니다.
:::

```tsx
const handleCreateAttestation = async () => {
  try {
    const result = await createAttestation({
      schemaId: DOJANG_SCHEMAS.MEMBERSHIP,
      recipient: '0x...', // Recipient address
      data: {
        organization: 'GIWA DAO',
        role: 'Member',
        joinedAt: Date.now(),
      },
      expirationTime: 0, // 0 = No expiration
      revocable: true,
    });

    console.log('Attestation created:', result.attestationId);
  } catch (error) {
    Alert.alert('Creation Failed', error.message);
  }
};
```

## Available Schemas

```tsx
import { DOJANG_SCHEMAS } from '@giwa/react-native-wallet';

// Available schemas
DOJANG_SCHEMAS.KYC           // Identity Verification
DOJANG_SCHEMAS.MEMBERSHIP    // Membership
DOJANG_SCHEMAS.ACHIEVEMENT   // Achievement
DOJANG_SCHEMAS.CREDENTIAL    // Credential
DOJANG_SCHEMAS.VERIFICATION  // General Verification
```

## Complete Example: Attestation Screen

```tsx
import { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useDojang, useGiwaWallet, DOJANG_SCHEMAS } from '@giwa/react-native-wallet';

export function DojangScreen() {
  const { wallet } = useGiwaWallet();
  const { getAttestations, verifyAttestation, isLoading } = useDojang();

  const [attestations, setAttestations] = useState([]);
  const [selectedAttestation, setSelectedAttestation] = useState(null);

  // Load my attestations
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

  // Verify attestation
  const handleVerify = async (attestationId: string) => {
    const isValid = await verifyAttestation(attestationId);
    Alert.alert(
      'Verification Result',
      isValid ? 'Valid attestation' : 'Invalid attestation'
    );
  };

  // Convert schema name
  const getSchemaName = (schemaId: string) => {
    switch (schemaId) {
      case DOJANG_SCHEMAS.KYC:
        return 'Identity Verification';
      case DOJANG_SCHEMAS.MEMBERSHIP:
        return 'Membership';
      case DOJANG_SCHEMAS.ACHIEVEMENT:
        return 'Achievement';
      case DOJANG_SCHEMAS.CREDENTIAL:
        return 'Credential';
      default:
        return 'General Attestation';
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>My Dojang Attestations</Text>

      {attestations.length === 0 ? (
        <Text style={{ color: '#888' }}>No registered attestations</Text>
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
                  <Text style={{ color: 'red' }}>Revoked</Text>
                )}
              </View>

              <Text style={{ color: '#666', marginTop: 5 }}>
                Issuer: {item.attester.slice(0, 10)}...
              </Text>

              <Text style={{ color: '#888', fontSize: 12, marginTop: 5 }}>
                {new Date(item.time * 1000).toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Selected attestation details */}
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
            Attestation Details
          </Text>

          <Text>ID: {selectedAttestation.id.slice(0, 20)}...</Text>
          <Text>Schema: {getSchemaName(selectedAttestation.schemaId)}</Text>
          <Text>Issuer: {selectedAttestation.attester}</Text>
          <Text>
            Issued: {new Date(selectedAttestation.time * 1000).toLocaleString()}
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
              <Text style={{ color: 'white', textAlign: 'center' }}>Verify</Text>
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
              <Text style={{ textAlign: 'center' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}
```

## Usage Examples by Attestation Type

### KYC Verification Check

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

### DAO Membership Check

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

## Next Steps

- [Security](/docs/guides/security) - 보안 모범 사례
- [GIWA ID](/docs/guides/giwa-id) - 네이밍 서비스
