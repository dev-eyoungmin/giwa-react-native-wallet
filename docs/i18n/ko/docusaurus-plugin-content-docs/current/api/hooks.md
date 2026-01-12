---
sidebar_position: 1
---

# Hooks API

GIWA SDK에서 제공하는 모든 React Hook에 대한 API 레퍼런스입니다.

## useGiwaWallet

지갑 관리 Hook

```tsx
import { useGiwaWallet } from '@giwa/react-native-wallet';

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
import { useBalance } from '@giwa/react-native-wallet';

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
import { useTransaction } from '@giwa/react-native-wallet';

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
import { useTokens } from '@giwa/react-native-wallet';

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

L2→L1 Bridge 출금 Hook

:::info L1→L2 Deposit
입금(L1→L2)은 공식 [GIWA Superbridge](https://superbridge.app)를 사용하세요. 이 SDK는 L2→L1 출금만 지원합니다.

참고: [GIWA Bridge 문서](https://docs.giwa.io/tools/bridges)
:::

```tsx
import { useBridge } from '@giwa/react-native-wallet';

const {
  withdrawETH,       // (amount: string, to?: Address) => Promise<TransactionResult>
  withdrawToken,     // (tokenAddress: Address, amount: bigint, to?: Address) => Promise<TransactionResult>
  getPendingTransactions, // () => BridgeTransaction[]
  getEstimatedWithdrawalTime, // () => number (seconds)
  isLoading,         // boolean
} = useBridge();
```

### Types

```tsx
interface TransactionResult {
  hash: string;
  wait: () => Promise<TransactionReceipt>;
}

interface BridgeTransaction {
  direction: 'withdraw';
  amount: bigint;
  token?: Address;
  l2TxHash: string;
  status: 'pending' | 'confirmed';
}
```

### Usage Example

```tsx
// L1으로 0.1 ETH 출금
const { hash, wait } = await withdrawETH('0.1');
const receipt = await wait();

// 예상 출금 시간 (~OP Stack의 경우 7일)
const time = getEstimatedWithdrawalTime(); // 604800 seconds
```

---

## useFlashblocks

Flashblocks (빠른 확인) Hook

```tsx
import { useFlashblocks } from '@giwa/react-native-wallet';

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

GIWA ID (ENS 기반 네이밍) Hook

:::info Registration
GIWA ID (up.id) 등록은 Upbit의 Verified Address 서비스를 통해서만 가능합니다. 이 SDK는 이름과 주소를 조회하기 위한 읽기 전용 접근을 제공합니다.

참고: [GIWA ID 문서](https://docs.giwa.io/giwa-ecosystem/giwa-id)
:::

```tsx
import { useGiwaId } from '@giwa/react-native-wallet';

const {
  resolveAddress,    // (name: string) => Promise<Address | null>
  resolveName,       // (address: Address) => Promise<string | null>
  getGiwaId,         // (name: string) => Promise<GiwaId | null>
  getTextRecord,     // (name: string, key: string) => Promise<string | null>
  isAvailable,       // (name: string) => Promise<boolean>
  isLoading,         // boolean
} = useGiwaId();
```

### Types

```tsx
interface GiwaId {
  name: string;      // e.g., "alice.giwa.id"
  address: Address;
  avatar?: string;
}
```

### Usage Example

```tsx
// 이름을 주소로 변환
const address = await resolveAddress('alice'); // or 'alice.giwa.id'

// 주소를 이름으로 역변환
const name = await resolveName('0x1234...');

// 아바타 가져오기
const avatar = await getTextRecord('alice', 'avatar');
```

---

## useDojang

Dojang (EAS 증명) Hook

:::info Attestation Creation
증명은 공식 발급자(예: Upbit Korea)만 생성할 수 있습니다. 이 SDK는 증명을 검증하기 위한 읽기 전용 접근을 제공합니다.

참고: [Dojang 문서](https://docs.giwa.io/giwa-ecosystem/dojang)
:::

```tsx
import { useDojang } from '@giwa/react-native-wallet';

const {
  getAttestation,       // (uid: Hex) => Promise<Attestation | null>
  isAttestationValid,   // (uid: Hex) => Promise<boolean>
  getVerifiedBalance,   // (uid: Hex) => Promise<VerifiedBalance | null>
  getSchema,            // (schemaUid: Hex) => Promise<Schema | null>
  isLoading,            // boolean
} = useDojang();
```

### Attestation Types

| 타입 | 설명 |
|------|------|
| `verified_address` | KYC 인증된 지갑 주소 |
| `balance_root` | 잔액의 머클 트리 요약 |
| `verified_balance` | 특정 시점의 잔액 증명 |
| `verified_code` | 오프체인 코드의 온체인 검증 |

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

interface VerifiedBalance {
  balance: bigint;
  timestamp: bigint;
}

type AttestationType = 'verified_address' | 'balance_root' | 'verified_balance' | 'verified_code';
```

### Usage Example

```tsx
// 증명이 유효한지 확인
const isValid = await isAttestationValid('0x1234...');

// 증명 상세 정보 조회
const attestation = await getAttestation('0x1234...');
if (attestation && !attestation.revoked) {
  console.log('Attester:', attestation.attester);
}
```

---

## useFaucet

테스트넷 Faucet Hook

:::tip Testnet Only
Faucet은 테스트넷에서만 사용 가능합니다. 브라우저에서 공식 GIWA faucet 웹사이트를 엽니다.

참고: [GIWA Faucet](https://faucet.giwa.io)
:::

```tsx
import { useFaucet } from '@giwa/react-native-wallet';

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
import { useNetworkInfo } from '@giwa/react-native-wallet';

const {
  network,              // 'testnet' | 'mainnet'
  networkConfig,        // GiwaNetwork
  status,               // NetworkStatus
  isTestnet,            // boolean
  isReady,              // boolean
  hasWarnings,          // boolean
  warnings,             // string[]
  isFeatureAvailable,   // (feature: FeatureName) => boolean
  getFeatureInfo,       // (feature: FeatureName) => FeatureAvailability
  unavailableFeatures,  // FeatureName[]
  chainId,              // number
  rpcUrl,               // string
  flashblocksRpcUrl,    // string - Flashblocks RPC endpoint
  flashblocksWsUrl,     // string - Flashblocks WebSocket endpoint
  explorerUrl,          // string
} = useNetworkInfo();
```

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
