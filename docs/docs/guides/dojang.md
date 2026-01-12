---
sidebar_position: 7
---

# Dojang (Attestations)

This guide explains the Dojang attestation service based on EAS (Ethereum Attestation Service).

:::info Attestation Creation
Attestations can only be created by official issuers (e.g., Upbit Korea). This SDK provides read-only access for verifying attestations.

See: [Dojang Documentation](https://docs.giwa.io/giwa-ecosystem/dojang)
:::

## What is Dojang?

Dojang is GIWA Chain's attestation service that connects on-chain wallet addresses with off-chain information. It enables users to establish identity without exposing personally identifiable information (PII) directly.

### Attestation Types

| Type | Description |
|------|-------------|
| **Verified Address** | KYC-verified wallet address |
| **Balance Root** | Merkle tree summary of balances |
| **Verified Balance** | Balance attestation at specific time |
| **Verified Code** | On-chain verification of off-chain codes |

## useDojang Hook

```tsx
import { useDojang } from '@giwa/react-native-wallet';

function DojangScreen() {
  const {
    getAttestation,       // Get attestation by UID
    isAttestationValid,   // Check if attestation is valid
    getVerifiedBalance,   // Get verified balance data
    getSchema,            // Get schema information
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

Check if an attestation is valid (exists and not revoked):

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

For `verified_balance` type attestations:

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
      isValid ? 'Valid attestation' : 'Invalid or revoked attestation'
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
              This attestation has been revoked
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
  // Verify attestation first
  const isValid = await isAttestationValid(attestationUid);
  if (!isValid) {
    throw new Error('Invalid or revoked attestation');
  }

  // Get recipient address
  const attestation = await getAttestation(attestationUid);
  if (!attestation) {
    throw new Error('Attestation not found');
  }

  // Send transaction
  return sendTransaction({
    to: attestation.recipient,
    value: amount,
  });
};
```

## Next Steps

- [Security](/docs/guides/security) - Security best practices
- [GIWA ID](/docs/guides/giwa-id) - Naming service
