---
sidebar_position: 7
---

# Dojang (Attestations)

이 가이드에서는 EAS(Ethereum Attestation Service) 기반의 Dojang 증명 서비스를 설명합니다.

:::info Attestation Creation
증명은 공식 발급자(예: Upbit Korea, 또는 GIWA Sepolia의 테스트넷 파우셋)만 생성할 수 있습니다. 이 SDK는 증명을 검증하기 위한 읽기 전용 접근을 제공합니다.

참고: [Dojang 문서](https://docs.giwa.io/giwa-ecosystem/dojang/contracts)
:::

## What is Dojang?

Dojang은 온체인 지갑 주소와 오프체인 정보를 연결하는 GIWA Chain의 증명 서비스입니다. 사용자가 개인 식별 정보(PII)를 직접 노출하지 않고도 신원을 확립할 수 있게 해줍니다.

### Attestation Types

| 타입 | 설명 |
|------|------|
| `verified_address` | KYC 인증된 지갑 주소 |
| `balance_root` | 잔액의 머클 트리 요약 |
| `verified_balance` | 특정 시점의 잔액 증명 |
| `verified_code` | 오프체인 코드의 온체인 검증 |
| `unknown` | 위 네 가지 스키마 UID와 일치하지 않는 증명 |

## Schemas

`DOJANG_SCHEMAS`(`giwa-react-native-wallet`에서 제공)에는 GIWA Sepolia 스키마 UID가 담겨 있습니다. `decodeAttestationData`는 `Attestation`의 원본 `data` 바이트를 스키마별로 타입이 지정된 페이로드로 디코딩하며, `'unknown'` 스키마이거나 디코딩에 실패하면 `null`을 반환합니다.

| 스키마 키 | UID | 데이터 필드 |
|------------|-----|-------------|
| `VERIFIED_ADDRESS` | `0x072d75e18b2be4f89a13a7147240477481c4b526d5795802acba59046b426e08` | `bool isVerified` |
| `BALANCE_ROOT` | `0x369faa9c2cd261c45be3db5e230b585f5f1abecf8e12be575bb543e917e6db52` | `uint256 coinType, uint64 snapshotAt, uint192 leafCount, uint256 totalAmount, bytes32 root` |
| `VERIFIED_BALANCE` | `0x77bf88ca262cc63e1b185dccd870aacc5320b8987ef6c7169920f265fe6ab5e9` | `uint256 balance, bytes32 salt, bytes32[] proofs` |
| `VERIFIED_CODE` | `0x55ac1369dac97522d062b89ffdc4e752b48fbeba86915fdb956c7c2d0501d280` | `bytes32 codeHash, string domain` |

## Attesters

발급자(attester)는 증명을 발행한 주소입니다. `DOJANG_ATTESTERS`에는 알려진 발급자 목록이 있으며, `getDojangAttesters(network)`는 네트워크별 우선순위 목록을 반환합니다(`testnet`: `[UPBIT_KOREA, TESTNET_FAUCET]`, `mainnet`: `[UPBIT_KOREA]`).

| 이름 | `id` | `address` |
|------|------|-----------|
| `UPBIT_KOREA` | `0xd99b42e778498aa3c9c1f6a012359130252780511687a35982e8e52735453034` | `0x09B170CA2A006081042992bCE7379B85a02149C6` |
| `TESTNET_FAUCET` | `0xaa92f8c143657dde575de430aecaea6ca91f2e6072339b16932d426895d8d678` | `0x63CCe2b569A7bC35895ee24306c1512fefc06121` |

`DEFAULT_DOJANG_ATTESTER_ID`는 `DOJANG_ATTESTERS.UPBIT_KOREA.id`입니다.

### 메서드별 attester 동작 방식

아래 모든 메서드에서 `attesterId`는 선택 인자이지만, "생략했을 때"의 동작은 메서드마다 다릅니다.

- **`hasVerifiedAddress(address, attesterId?)`**: `attesterId`를 넘기면 해당 발급자만 확인합니다. 생략하면 현재 네트워크의 **알려진 모든 발급자**를 한 번의 멀티콜로 확인하고, 그중 **하나라도** 해당 주소를 인증했다면 `true`를 반환합니다.
- **`getVerifiedAddressAttestationUid(address, attesterId?)`**: 지정하면 해당 발급자만 조회합니다. 생략하면 알려진 발급자를 우선순위 순서로 순회하며 **가장 먼저 찾은** non-null UID를 반환합니다.
- **`getVerifiedBalance(recipient, coinType, snapshotAt, attesterId?)`**, **`isVerifiedCode(codeHash, domain, attesterId?)`**: `attesterId`를 생략하면 `DEFAULT_DOJANG_ATTESTER_ID`(Upbit)로 기본 설정됩니다 — 위 두 메서드와 달리 "아무 발급자"가 아닙니다.
- **`getAttestationsForAddress(address)`**: `attesterId` 파라미터가 없으며, 항상 현재 네트워크의 알려진 모든 스키마 × 알려진 모든 발급자 조합을 조회합니다.

Upbit로만 제한하고 싶다면 `DOJANG_ATTESTERS.UPBIT_KOREA.id`를(테스트넷 파우셋 발급자로 제한하려면 `TESTNET_FAUCET.id`를) 명시적으로 전달하세요.

## Contract Addresses (GIWA Sepolia)

| 컨트랙트 | 주소 |
|----------|------|
| DojangScroll | `0xd5077b67dcb56caC8b270C7788FC3E6ee03F17B9` |
| AttestationIndexer | `0x9C9Bf29880448aB39795a11b669e22A0f1d790ec` |
| EAS | `0x4200000000000000000000000000000000000021` |
| Schema Registry | `0x4200000000000000000000000000000000000020` |
| SchemaBook | `0x78cBb3413FBb6aF05EF1D21e646440e56baE3AD6` |
| DojangAttesterBook | `0xDA282E89244424E297Ce8e78089B54D043FB28B6` |

최신 정보는 [Dojang Contracts 문서](https://docs.giwa.io/giwa-ecosystem/dojang/contracts)를 참고하세요.

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

## Check Verified Address

지갑 주소가 알려진 발급자 중 하나로부터 verified-address 증명을 받았는지 확인:

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

// 특정 발급자로 제한
import { DOJANG_ATTESTERS } from 'giwa-react-native-wallet';

const isVerifiedByUpbit = await hasVerifiedAddress(address, DOJANG_ATTESTERS.UPBIT_KOREA.id);
```

## Get Verified Balance

`getVerifiedBalance`는 recipient/coin type/snapshot 조합에 대해 증명된 잔액을 원시 `bigint`로 반환합니다(해당 증명이 없으면 `null`):

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

`getAttestationsForAddress`는 현재 네트워크의 알려진 모든 스키마 × 알려진 모든 발급자 조합을(`AttestationIndexer` + `EAS`를 멀티콜로 묶어서) 조회해 전체 `Attestation` 목록을 반환합니다.

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
const checkVerifiedAddress = async (address: string) => {
  // hasVerifiedAddress로 간단하게 확인
  const isVerified = await hasVerifiedAddress(address);
  return isVerified;
};

// 또는 상세 정보와 함께
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
