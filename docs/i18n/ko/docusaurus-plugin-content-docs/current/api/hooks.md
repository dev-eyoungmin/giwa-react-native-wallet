---
sidebar_position: 1
---

# Hooks API

GIWA SDK에서 제공하는 모든 React Hook에 대한 API 레퍼런스입니다.

## useGiwaWallet

지갑 관리 Hook

```tsx
import { useGiwaWallet } from 'giwa-react-native-wallet';

const {
  wallet,           // GiwaWallet | null
  isLoading,        // boolean
  isInitializing,   // boolean - SDK 초기화 중 여부
  hasWallet,        // boolean - wallet !== null (편의 속성)
  error,            // Error | null
  createWallet,     // (options?: SecureStorageOptions) => Promise<WalletCreationResult>
  recoverWallet,    // (mnemonic: string, options?: SecureStorageOptions) => Promise<GiwaWallet>
  importFromPrivateKey, // (privateKey: Hex, options?: SecureStorageOptions) => Promise<GiwaWallet>
  loadWallet,       // (options?: SecureStorageOptions) => Promise<GiwaWallet | null>
  deleteWallet,     // () => Promise<void>
  exportMnemonic,   // (options?: SecureStorageOptions) => Promise<string | null>
  exportPrivateKey, // (options?: SecureStorageOptions) => Promise<Hex | null>
} = useGiwaWallet();
```

:::tip Checking Initialization State
`isInitializing`은 SDK가 초기화되는 동안 `true`입니다. 지갑 작업을 수행하기 전에 이 값을 확인하세요.
```tsx
if (isInitializing) {
  return <LoadingSpinner />;
}
```
:::

### Types

```tsx
interface GiwaWallet {
  address: `0x${string}`;
}

interface WalletCreationResult {
  wallet: GiwaWallet;
  mnemonic: string;
}

interface SecureStorageOptions {
  requireBiometric?: boolean;
}
```

### Security Notes

- `exportMnemonic`과 `exportPrivateKey`는 **Rate Limiting**이 적용됩니다 (분당 3회, 초과 시 5분간 대기)
- 민감한 데이터는 5분간 비활성 상태 후 자동으로 메모리에서 삭제됩니다

---

## useBalance

ETH 잔액 조회 Hook

```tsx
import { useBalance } from 'giwa-react-native-wallet';

const {
  balance,           // bigint (default 0n)
  formattedBalance,  // string (default '0')
  isLoading,         // boolean
  error,             // Error | null
  refetch,           // () => Promise<void>
} = useBalance(address?: string);
```

:::note Type Change
`balance`는 항상 `bigint` 타입입니다 (이전: `bigint | null`).
초기값은 `0n`이며, null 체크가 필요하지 않습니다.
:::

### Parameters

| 이름 | 타입 | 설명 |
|------|------|------|
| `address` | `string` (선택) | 조회할 주소. 지정하지 않으면 연결된 지갑 주소를 사용 |

---

## useTransaction

트랜잭션 전송 Hook

```tsx
import { useTransaction } from 'giwa-react-native-wallet';

const {
  sendTransaction,  // (tx: TransactionRequest) => Promise<string>
  waitForReceipt,   // (hash: string, options?: WaitOptions) => Promise<Receipt>
  estimateGas,      // (tx: TransactionRequest) => Promise<GasEstimate>
  getTransaction,   // (hash: string) => Promise<Transaction | null>
  isLoading,        // boolean
  error,            // GiwaError | null
} = useTransaction();
```

### Types

```tsx
interface TransactionRequest {
  to: string;
  value?: string;       // ETH units
  data?: string;        // Contract call data
  gasLimit?: bigint;
  gasPrice?: bigint;
  nonce?: number;
}

interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  estimatedFee: string; // ETH units
}

interface WaitOptions {
  confirmations?: number;
  timeout?: number;
}
```

---

## useTokens

ERC-20 토큰 관리 Hook

```tsx
import { useTokens } from 'giwa-react-native-wallet';

const {
  getBalance,    // (tokenAddress: string) => Promise<TokenBalance>
  transfer,      // (tokenAddress: string, to: string, amount: string) => Promise<string>
  approve,       // (tokenAddress: string, spender: string, amount: string) => Promise<string>
  allowance,     // (tokenAddress: string, spender: string) => Promise<AllowanceResult>
  getTokenInfo,  // (tokenAddress: string) => Promise<TokenInfo>
  isLoading,     // boolean
} = useTokens();
```

### Types

```tsx
interface TokenBalance {
  token: TokenInfo;
  balance: bigint;
  formattedBalance: string;
}

interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: bigint;
}

interface AllowanceResult {
  amount: bigint;
  formattedAmount: string;
}
```

---

## useBridge

L1↔L2 Bridge Hook — 입금, 출금, 그리고 출금 증명(prove)/완료(finalize) 흐름

:::info L1 설정 필요
입금(`depositETH`/`depositToken`)과 출금 시작 이후의 모든 단계(`getWithdrawalStatus`, `getTimeToProve`, `getTimeToFinalize`, `proveWithdrawal`, `finalizeWithdrawal`)는 `GiwaProvider`/`GiwaConfig`에 `endpoints.l1RpcUrl`이 설정되어 있어야 합니다 — SDK는 기본값을 제공하지 않습니다. `withdrawETH`/`withdrawToken`은 이것 없이도 동작합니다. 설정 방법과 전체 출금 생명주기는 [Bridge 가이드](/docs/guides/bridge)를 참고하세요.
:::

```tsx
import { useBridge } from 'giwa-react-native-wallet';

const {
  depositETH,             // (amount: string, to?: Address) => Promise<Hash>
  depositToken,           // (l1TokenAddress: Address, l2TokenAddress: Address, amount: bigint, to?: Address) => Promise<Hash>
  withdrawETH,            // (amount: string, to?: Address) => Promise<Hash>
  withdrawToken,          // (l2TokenAddress: Address, amount: bigint, to?: Address) => Promise<Hash>
  getWithdrawalStatus,    // (l2TxHash: Hash) => Promise<WithdrawalStatus>
  getTimeToProve,         // (l2TxHash: Hash) => Promise<GetTimeToProveReturnType>
  getTimeToFinalize,      // (l2TxHash: Hash) => Promise<GetTimeToFinalizeReturnType>
  proveWithdrawal,        // (l2TxHash: Hash) => Promise<Hash>
  finalizeWithdrawal,     // (l2TxHash: Hash) => Promise<Hash>
  getPendingTransactions, // () => BridgeTransaction[]
  getTransaction,         // (hash: Hash) => BridgeTransaction | undefined
  getEstimatedWithdrawalTime, // () => number (seconds)
  isL1Configured,         // boolean
  isLoading,              // boolean
  isInitializing,         // boolean
  error,                  // Error | null
} = useBridge();
```

### Types

```tsx
type Hash = `0x${string}`;

type WithdrawalStatus =
  | 'waiting-to-prove'
  | 'ready-to-prove'
  | 'waiting-to-finalize'
  | 'ready-to-finalize'
  | 'finalized';

interface BridgeTransaction {
  direction: 'deposit' | 'withdraw';
  amount: bigint;
  token?: Address;
  l1TxHash?: Hash;
  l2TxHash?: Hash;
  status: 'pending' | 'confirmed' | 'proved' | 'finalized' | 'failed';
}
```

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `depositETH` | `(amount, to?) => Promise<Hash>` | ETH를 L1에서 L2로 입금. **L1** tx 해시 반환 |
| `depositToken` | `(l1TokenAddress, l2TokenAddress, amount, to?) => Promise<Hash>` | ERC-20을 L1에서 L2로 입금(필요 시 자동 approve). **L1** tx 해시 반환 |
| `withdrawETH` | `(amount, to?) => Promise<Hash>` | L1로의 ETH 출금 시작 |
| `withdrawToken` | `(l2TokenAddress, amount, to?) => Promise<Hash>` | L1로의 ERC-20 출금 시작 |
| `getWithdrawalStatus` | `(l2TxHash) => Promise<WithdrawalStatus>` | 출금의 현재 상태 |
| `getTimeToProve` | `(l2TxHash) => Promise<GetTimeToProveReturnType>` | 논블로킹: 증명 가능해지기까지 남은 시간 |
| `getTimeToFinalize` | `(l2TxHash) => Promise<GetTimeToFinalizeReturnType>` | 논블로킹: 완료 가능해지기까지 남은 시간 |
| `proveWithdrawal` | `(l2TxHash) => Promise<Hash>` | L1에서 출금 증명. **증명 가능해질 때까지 블로킹**(몇 시간 소요 가능) |
| `finalizeWithdrawal` | `(l2TxHash) => Promise<Hash>` | 증명된 출금을 L1에서 완료하여 자금 해제 |
| `getPendingTransactions` | `() => BridgeTransaction[]` | 대기 중인 입금/출금 조회 |
| `getTransaction` | `(hash) => BridgeTransaction \| undefined` | 해시로 트랜잭션 조회 |
| `getEstimatedWithdrawalTime` | `() => number` | Challenge period 예상 시간(초) |
| `isL1Configured` | `boolean` | `endpoints.l1RpcUrl` 설정 여부 |
| `isLoading` | `boolean` | 로딩 상태 |
| `isInitializing` | `boolean` | 브릿지 초기화 여부 |
| `error` | `Error \| null` | 작업 실패 시 에러 |

### Usage Example

```tsx
// 0.1 ETH를 L2로 입금 (endpoints.l1RpcUrl 필요)
const depositHash = await depositETH('0.1');
console.log('L1 TX Hash:', depositHash);

// L1으로 0.1 ETH 출금
const withdrawHash = await withdrawETH('0.1');
console.log('L2 TX Hash:', withdrawHash);

// 트랜잭션 상태 추적
const tx = getTransaction(withdrawHash);
console.log('Status:', tx?.status);

// 상태를 폴링한 뒤 준비되면 증명하고 완료 (endpoints.l1RpcUrl 필요)
const status = await getWithdrawalStatus(withdrawHash);
if (status === 'ready-to-prove') {
  await proveWithdrawal(withdrawHash); // 증명 가능해질 때까지 블로킹, 몇 시간 소요 가능
} else if (status === 'ready-to-finalize') {
  await finalizeWithdrawal(withdrawHash);
}

// 예상 challenge period (~OP Stack의 경우 7일)
const time = getEstimatedWithdrawalTime(); // 604800 seconds
```

---

## useFlashblocks

Flashblocks (빠른 확인) Hook

```tsx
import { useFlashblocks } from 'giwa-react-native-wallet';

const {
  sendTransaction,    // (tx: FlashblocksTx) => Promise<FlashblocksResult>
  getAverageLatency,  // () => number
  isAvailable,        // boolean
  isLoading,          // boolean
} = useFlashblocks();
```

### Types

```tsx
interface FlashblocksTx {
  to: string;
  value: bigint;  // in wei
  data?: string;
}

interface FlashblocksResult {
  preconfirmation: Preconfirmation;
  result: {
    wait: () => Promise<TransactionReceipt>;
  };
}

interface Preconfirmation {
  txHash: string;
  preconfirmedAt: number;
  latencyMs: number;
  sequencerSignature: string;
}
```

---

## useGiwaId

GIWA ID (`up.id`, Upbit Web3 Names) Hook — 온체인 `UpnameRegistry`를 통한 읽기 전용 해석

:::info Registration
`up.id` 이름은 Upbit / GIWA 플레이그라운드를 통해 발행되며, 이 SDK로는 발행할 수 없습니다. 이 훅은 이름 해석, 주소 역방향 해석, 사용 가능 여부 확인만 제공합니다 — `up.id`는 ENS 스타일의 텍스트 레코드를 지원하지 않습니다.

참고: [GIWA ID 문서](https://docs.giwa.io/giwa-ecosystem/up-id)
:::

```tsx
import { useGiwaId } from 'giwa-react-native-wallet';

const {
  resolveAddress,    // (name: string) => Promise<Address | null>
  resolveName,       // (address: Address) => Promise<string | null>
  getGiwaId,         // (name: string) => Promise<GiwaId | null>
  isAvailable,       // (name: string) => Promise<boolean>
  isLoading,         // boolean
  isInitializing,    // boolean
  error,             // Error | null
} = useGiwaId();
```

### Types

```tsx
interface GiwaId {
  /** Full name, e.g. "alice.up.id" */
  name: string;
  address: Address;
  /** ERC-721 token id in UpnameRegistry (= keccak256(label)) */
  tokenId: bigint;
  tokenUri?: string;
  /** Best-effort image URL from token metadata */
  avatar?: string;
}
```

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `resolveAddress` | `(name) => Promise<Address \| null>` | `up.id` 이름을 주소로 해석 |
| `resolveName` | `(address) => Promise<string \| null>` | 주소를 `up.id` 이름으로 역방향 해석 |
| `getGiwaId` | `(name) => Promise<GiwaId \| null>` | 전체 GIWA ID 정보 조회 |
| `isAvailable` | `(name) => Promise<boolean>` | 이름 사용 가능 여부 확인 (`isClaimable`) |
| `isLoading` | `boolean` | 로딩 상태 |
| `isInitializing` | `boolean` | 서비스 초기화 여부 |
| `error` | `Error \| null` | 작업 실패 시 에러 |

### Usage Example

```tsx
// 이름을 주소로 변환
const address = await resolveAddress('alice'); // or 'alice.up.id'

// 주소를 이름으로 역변환
const name = await resolveName('0x1234...');

// 전체 정보 조회 (best-effort 아바타 포함)
const giwaId = await getGiwaId('alice');
console.log(giwaId?.avatar);
```

---

## useDojang

Dojang (EAS 증명) Hook

:::info Attestation Creation
증명은 공식 발급자(예: Upbit Korea, 또는 GIWA Sepolia의 테스트넷 파우셋)만 생성할 수 있습니다. 이 SDK는 증명을 검증하기 위한 읽기 전용 접근을 제공합니다.

참고: [Dojang 문서](https://docs.giwa.io/giwa-ecosystem/dojang/contracts)
:::

```tsx
import { useDojang } from 'giwa-react-native-wallet';

const {
  getAttestation,                    // (uid: Hex) => Promise<Attestation | null>
  isAttestationValid,                // (uid: Hex) => Promise<boolean>
  hasVerifiedAddress,                // (address: Address, attesterId?: Hex) => Promise<boolean>
  getVerifiedAddressAttestationUid,  // (address: Address, attesterId?: Hex) => Promise<Hex | null>
  getAttestationsForAddress,         // (address: Address) => Promise<Attestation[]>
  getVerifiedBalance,                // (recipient: Address, coinType: bigint, snapshotAt: bigint, attesterId?: Hex) => Promise<bigint | null>
  isVerifiedCode,                    // (codeHash: Hex, domain: string, attesterId?: Hex) => Promise<boolean>
  decodeAttestationData,             // (attestation: Pick<Attestation, 'attestationType' | 'data'>) => DojangAttestationData | null
  isLoading,                         // boolean
  isInitializing,                    // boolean
  error,                             // Error | null
} = useDojang();
```

:::note Attester defaults
`attesterId`를 생략하면 `hasVerifiedAddress`와 `getVerifiedAddressAttestationUid`는 현재 네트워크의 **알려진 모든 발급자**를 확인합니다. 반면 `getVerifiedBalance`와 `isVerifiedCode`는 단일 발급자인 `DEFAULT_DOJANG_ATTESTER_ID`(Upbit)로 기본 설정됩니다. 전체 설명과 스키마/발급자 표는 [Dojang 가이드](/docs/guides/dojang)를 참고하세요.
:::

### Attestation Types

| 타입 | 설명 |
|------|------|
| `verified_address` | KYC 인증된 지갑 주소 |
| `balance_root` | 잔액의 머클 트리 요약 |
| `verified_balance` | 특정 시점의 잔액 증명 |
| `verified_code` | 오프체인 코드의 온체인 검증 |
| `unknown` | 위 네 가지 스키마 UID와 일치하지 않는 증명 |

### Types

```tsx
interface Attestation {
  uid: Hex;
  schema: Hex;
  attester: Address;
  recipient: Address;
  attestationType: AttestationType;
  data: Hex;
  time: bigint;
  expirationTime: bigint;
  revocable: boolean;
  revoked: boolean;
}

type AttestationType =
  | 'verified_address'
  | 'balance_root'
  | 'verified_balance'
  | 'verified_code'
  | 'unknown';

// decodeAttestationData(attestation)의 반환 타입 - 'unknown'이거나 디코딩 실패 시 null
type DojangAttestationData =
  | { type: 'verified_address'; isVerified: boolean }
  | {
      type: 'balance_root';
      coinType: bigint;
      snapshotAt: bigint;
      leafCount: bigint;
      totalAmount: bigint;
      root: Hex;
    }
  | { type: 'verified_balance'; balance: bigint; salt: Hex; proofs: readonly Hex[] }
  | { type: 'verified_code'; codeHash: Hex; domain: string };
```

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `getAttestation` | `(uid) => Promise<Attestation \| null>` | UID로 증명 조회 |
| `isAttestationValid` | `(uid) => Promise<boolean>` | 증명 유효성 확인 |
| `hasVerifiedAddress` | `(address, attesterId?) => Promise<boolean>` | 알려진 발급자 중 하나(또는 지정한 하나)가 주소를 인증했는지 확인 |
| `getVerifiedAddressAttestationUid` | `(address, attesterId?) => Promise<Hex \| null>` | verified-address 증명 UID 조회 |
| `getAttestationsForAddress` | `(address) => Promise<Attestation[]>` | 알려진 모든 스키마/발급자에 대한 증명 전체 조회 |
| `getVerifiedBalance` | `(recipient, coinType, snapshotAt, attesterId?) => Promise<bigint \| null>` | 검증된 잔액 조회 |
| `isVerifiedCode` | `(codeHash, domain, attesterId?) => Promise<boolean>` | 오프체인 코드 검증 확인 |
| `decodeAttestationData` | `(attestation) => DojangAttestationData \| null` | 원본 증명 `data` 바이트 디코딩 |
| `isLoading` | `boolean` | 로딩 상태 |
| `isInitializing` | `boolean` | 서비스 초기화 여부 |
| `error` | `Error \| null` | 작업 실패 시 에러 |

### Usage Example

```tsx
// 증명이 유효한지 확인
const isValid = await isAttestationValid('0x1234...');

// 증명 상세 정보 조회
const attestation = await getAttestation('0x1234...');
if (attestation && !attestation.revoked) {
  console.log('Attester:', attestation.attester);
}

// 알려진 발급자 중 하나로부터 verified-address 증명이 있는지 확인
const hasVerified = await hasVerifiedAddress('0xabcd...');
console.log('인증됨:', hasVerified);

// 스키마별 페이로드 디코딩
const decoded = decodeAttestationData(attestation);
```

---

## useFaucet

테스트넷 Faucet Hook

:::tip Testnet Only
Faucet은 테스트넷에서만 사용 가능합니다. 브라우저에서 공식 GIWA faucet 웹사이트를 엽니다.

참고: [GIWA Faucet](https://faucet.giwa.io)
:::

```tsx
import { useFaucet } from 'giwa-react-native-wallet';

const {
  requestFaucet,    // (address?: Address) => Promise<void>
  getFaucetUrl,     // () => string
  isInitializing,   // boolean
  isLoading,        // boolean
  error,            // Error | null
} = useFaucet();
```

### Usage Example

```tsx
function FaucetButton() {
  const { requestFaucet, isLoading } = useFaucet();

  return (
    <Button
      title="Get Testnet ETH"
      onPress={() => requestFaucet()}
      disabled={isLoading}
    />
  );
}
```

:::note
`requestFaucet()`은 기기의 브라우저에서 faucet 웹사이트를 엽니다. 사용자는 웹사이트에서 faucet 요청을 완료해야 합니다.
:::

---

## useNetworkInfo

네트워크 상태 및 기능 가용성 Hook

```tsx
import { useNetworkInfo } from 'giwa-react-native-wallet';

const {
  network,              // 'testnet' | 'mainnet'
  networkConfig,        // GiwaNetwork
  status,               // NetworkStatus
  isTestnet,            // boolean
  isReady,              // boolean
  hasWarnings,          // boolean
  warnings,             // string[]
  isFeatureAvailable,   // (feature: FeatureName) => boolean
  getFeatureInfo,       // (feature: FeatureName) => FeatureAvailability | null
  unavailableFeatures,  // FeatureName[]
  chainId,              // number
  rpcUrl,               // string
  flashblocksRpcUrl,    // string - Flashblocks RPC endpoint
  flashblocksWsUrl,     // string - Flashblocks WebSocket endpoint
  explorerUrl,          // string
  isInitializing,       // boolean
} = useNetworkInfo();
```

### Returns

| Property | Type | Description |
|----------|------|-------------|
| `network` | `'testnet' \| 'mainnet'` | 현재 네트워크 (mainnet: 🚧 개발중) |
| `networkConfig` | `GiwaNetwork` | 네트워크 설정 |
| `status` | `NetworkStatus` | 전체 네트워크 상태 |
| `isTestnet` | `boolean` | 현재 네트워크가 testnet인지 여부 |
| `isReady` | `boolean` | 네트워크가 사용 준비되었는지 여부 |
| `hasWarnings` | `boolean` | 경고가 있는지 여부 |
| `warnings` | `string[]` | 경고 메시지 목록 |
| `isFeatureAvailable` | `(feature) => boolean` | 기능 가용성 확인 |
| `getFeatureInfo` | `(feature) => FeatureAvailability \| null` | 기능 상세 정보 조회 (SDK 초기화 중에는 `null`) |
| `unavailableFeatures` | `FeatureName[]` | 사용 불가능한 기능 목록 |
| `chainId` | `number` | 네트워크 체인 ID |
| `rpcUrl` | `string` | RPC 엔드포인트 URL |
| `flashblocksRpcUrl` | `string` | Flashblocks RPC URL |
| `flashblocksWsUrl` | `string` | Flashblocks WebSocket URL |
| `explorerUrl` | `string` | 블록 탐색기 URL |
| `isInitializing` | `boolean` | SDK 초기화 중인지 여부 |

### Usage Example

```tsx
function NetworkStatus() {
  const { network, isReady, hasWarnings, warnings, isFeatureAvailable } = useNetworkInfo();

  return (
    <View>
      <Text>Network: {network}</Text>
      <Text>Ready: {isReady ? 'Yes' : 'No'}</Text>

      {hasWarnings && (
        <View>
          <Text>Warnings:</Text>
          {warnings.map((w, i) => <Text key={i}>- {w}</Text>)}
        </View>
      )}

      {!isFeatureAvailable('giwaId') && (
        <Text>GIWA ID is not available</Text>
      )}
    </View>
  );
}
```

### Types

```tsx
type FeatureName = 'bridge' | 'giwaId' | 'dojang' | 'faucet' | 'flashblocks' | 'tokens';

type FeatureStatus = 'available' | 'unavailable' | 'partial';

interface FeatureAvailability {
  name: FeatureName;
  status: FeatureStatus;
  reason?: string;
  contractAddress?: string;
}

interface NetworkStatus {
  network: 'testnet' | 'mainnet';
  readiness: 'ready' | 'partial' | 'not_ready';
  isTestnet: boolean;
  hasWarnings: boolean;
  warnings: NetworkWarning[];
  features: Record<FeatureName, FeatureAvailability>;
}
```

---

## Common Types

### GiwaError

```tsx
class GiwaError extends Error {
  code: string;
  details?: Record<string, any>;
}

// Error Codes
const ErrorCodes = {
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INVALID_MNEMONIC: 'INVALID_MNEMONIC',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  BIOMETRIC_FAILED: 'BIOMETRIC_FAILED',
  SECURE_STORAGE_ERROR: 'SECURE_STORAGE_ERROR',
  // ...
};
```
