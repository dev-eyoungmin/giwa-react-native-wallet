---
sidebar_position: 7
---

# Dojang (Attestations)

This guide explains the Dojang attestation service based on EAS (Ethereum Attestation Service).

:::info Attestation Creation
Attestations can only be created by official issuers (e.g., Upbit Korea, or the testnet faucet on GIWA Sepolia). This SDK provides read-only access for verifying attestations.

See: [Dojang Documentation](https://docs.giwa.io/giwa-ecosystem/dojang/contracts)
:::

## What is Dojang?

Dojang is GIWA Chain's attestation service that connects on-chain wallet addresses with off-chain information. It enables users to establish identity without exposing personally identifiable information (PII) directly.

### Attestation Types

| Type | Description |
|------|-------------|
| `verified_address` | KYC-verified wallet address |
| `balance_root` | Merkle tree summary of balances |
| `verified_balance` | Balance attestation at specific time |
| `verified_code` | On-chain verification of off-chain codes |
| `unknown` | Any attestation whose schema UID doesn't match one of the four schemas above |

## Schemas

`DOJANG_SCHEMAS` (from `giwa-react-native-wallet`) holds the GIWA Sepolia schema UIDs. `decodeAttestationData` decodes an `Attestation`'s raw `data` bytes into a typed payload keyed by schema; it returns `null` for `'unknown'` schemas or on decode failure.

| Schema key | UID | Data fields |
|------------|-----|-------------|
| `VERIFIED_ADDRESS` | `0x072d75e18b2be4f89a13a7147240477481c4b526d5795802acba59046b426e08` | `bool isVerified` |
| `BALANCE_ROOT` | `0x369faa9c2cd261c45be3db5e230b585f5f1abecf8e12be575bb543e917e6db52` | `uint256 coinType, uint64 snapshotAt, uint192 leafCount, uint256 totalAmount, bytes32 root` |
| `VERIFIED_BALANCE` | `0x77bf88ca262cc63e1b185dccd870aacc5320b8987ef6c7169920f265fe6ab5e9` | `uint256 balance, bytes32 salt, bytes32[] proofs` |
| `VERIFIED_CODE` | `0x55ac1369dac97522d062b89ffdc4e752b48fbeba86915fdb956c7c2d0501d280` | `bytes32 codeHash, string domain` |

## Attesters

An attester is the address that issued an attestation. `DOJANG_ATTESTERS` holds the known attesters, and `getDojangAttesters(network)` returns them in priority order for a network (`testnet`: `[UPBIT_KOREA, TESTNET_FAUCET]`; `mainnet`: `[UPBIT_KOREA]`).

| Name | `id` | `address` |
|------|------|-----------|
| `UPBIT_KOREA` | `0xd99b42e778498aa3c9c1f6a012359130252780511687a35982e8e52735453034` | `0x09B170CA2A006081042992bCE7379B85a02149C6` |
| `TESTNET_FAUCET` | `0xaa92f8c143657dde575de430aecaea6ca91f2e6072339b16932d426895d8d678` | `0x63CCe2b569A7bC35895ee24306c1512fefc06121` |

`DEFAULT_DOJANG_ATTESTER_ID` is `DOJANG_ATTESTERS.UPBIT_KOREA.id`.

### Attester semantics per method

`attesterId` is optional on every method below, but "omitted" means different things depending on the call:

- **`hasVerifiedAddress(address, attesterId?)`**: if `attesterId` is given, checks only that attester. If omitted, checks **every known attester** for the current network (one multicall) and returns `true` if **any** of them verify the address.
- **`getVerifiedAddressAttestationUid(address, attesterId?)`**: if given, queries only that attester. If omitted, iterates the known attesters in priority order and returns the **first** non-null UID found.
- **`getVerifiedBalance(recipient, coinType, snapshotAt, attesterId?)`** and **`isVerifiedCode(codeHash, domain, attesterId?)`**: default to `DEFAULT_DOJANG_ATTESTER_ID` (Upbit) when `attesterId` is omitted — unlike the two methods above, this is **not** "any attester".
- **`getAttestationsForAddress(address)`**: no `attesterId` parameter — it always queries every known schema against every known attester for the current network.

Pass `DOJANG_ATTESTERS.UPBIT_KOREA.id` explicitly if you need to restrict a query to Upbit only (or `TESTNET_FAUCET.id` for the testnet faucet issuer).

## Contract Addresses (GIWA Sepolia)

| Contract | Address |
|----------|---------|
| DojangScroll | `0xd5077b67dcb56caC8b270C7788FC3E6ee03F17B9` |
| AttestationIndexer | `0x9C9Bf29880448aB39795a11b669e22A0f1d790ec` |
| EAS | `0x4200000000000000000000000000000000000021` |
| Schema Registry | `0x4200000000000000000000000000000000000020` |
| SchemaBook | `0x78cBb3413FBb6aF05EF1D21e646440e56baE3AD6` |
| DojangAttesterBook | `0xDA282E89244424E297Ce8e78089B54D043FB28B6` |

See [Dojang Contracts Documentation](https://docs.giwa.io/giwa-ecosystem/dojang/contracts) for the canonical, up-to-date list.

## useDojang Hook

```tsx
import { useDojang } from 'giwa-react-native-wallet';

function DojangScreen() {
  const {
    getAttestation,                    // (uid: Hex) => Promise<Attestation | null>
    isAttestationValid,                // (uid: Hex) => Promise<boolean>
    hasVerifiedAddress,                // (address: Address, attesterId?: Hex) => Promise<boolean>
    getVerifiedAddressAttestationUid,  // (address: Address, attesterId?: Hex) => Promise<Hex | null>
    getAttestationsForAddress,         // (address: Address) => Promise<Attestation[]>
    getVerifiedBalance,                // (recipient, coinType, snapshotAt, attesterId?) => Promise<bigint | null>
    isVerifiedCode,                    // (codeHash: Hex, domain: string, attesterId?: Hex) => Promise<boolean>
    decodeAttestationData,             // (attestation) => DojangAttestationData | null
    isLoading,
    isInitializing,
    error,
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

## Check Verified Address

Check if a wallet address has a verified-address attestation from any known attester:

```tsx
const handleCheckVerified = async () => {
  const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f...';

  const isVerified = await hasVerifiedAddress(address);

  if (isVerified) {
    console.log('Address is verified');
  } else {
    console.log('Address is not verified');
  }
};

// Restrict to a single attester
import { DOJANG_ATTESTERS } from 'giwa-react-native-wallet';

const isVerifiedByUpbit = await hasVerifiedAddress(address, DOJANG_ATTESTERS.UPBIT_KOREA.id);
```

## Get Verified Balance

`getVerifiedBalance` returns the raw `bigint` balance attested for a recipient/coin type/snapshot (or `null` if no such attestation exists):

```tsx
const handleGetBalance = async () => {
  const recipient = '0x742d35Cc6634C0532925a3b844Bc9e7595f...';
  const coinType = 60n; // SLIP-44 coin type (e.g. 60 = ETH)
  const snapshotAt = 1735689600n; // unix seconds

  const balance = await getVerifiedBalance(recipient, coinType, snapshotAt);

  if (balance !== null) {
    console.log('Verified balance:', balance);
  }
};
```

## Get All Attestations for an Address

`getAttestationsForAddress` reads every known schema against every known attester for the current network (via `AttestationIndexer` + `EAS`, batched with multicall) and returns the full `Attestation` list:

```tsx
const handleGetAll = async () => {
  const address = '0x742d35Cc6634C0532925a3b844Bc9e7595f...';

  const attestations = await getAttestationsForAddress(address);

  for (const attestation of attestations) {
    const decoded = decodeAttestationData(attestation);
    console.log(attestation.attestationType, decoded);
  }
};
```

## Complete Example

```tsx
import { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { useDojang } from 'giwa-react-native-wallet';

export function DojangScreen() {
  const {
    getAttestation,
    isAttestationValid,
    hasVerifiedAddress,
    isLoading,
    isInitializing,
    error,
  } = useDojang();
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

  if (isInitializing) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>Dojang Attestations</Text>

      {error && (
        <Text style={{ color: 'red', marginBottom: 10 }}>{error.message}</Text>
      )}

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
const checkVerifiedAddress = async (address: string) => {
  // Simple check using hasVerifiedAddress
  const isVerified = await hasVerifiedAddress(address);
  return isVerified;
};

// Or with detailed information
const checkVerifiedAddressDetailed = async (attestationUid: string) => {
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
