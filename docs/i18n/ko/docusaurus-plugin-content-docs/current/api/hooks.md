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
  isInitializing,   // boolean - Whether SDK is initializing
  hasWallet,        // boolean - wallet !== null (convenience property)
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

L1↔L2 브릿지 Hook

```tsx
import { useBridge } from '@giwa/react-native-wallet';

const {
  deposit,           // (params: BridgeParams) => Promise<DepositResult>
  withdraw,          // (params: BridgeParams) => Promise<WithdrawResult>
  getDepositStatus,  // (l1TxHash: string) => Promise<DepositStatus>
  getWithdrawStatus, // (l2TxHash: string) => Promise<WithdrawStatus>
  estimateFees,      // (params: EstimateParams) => Promise<FeeEstimate>
  isLoading,         // boolean
} = useBridge();
```

### Types

```tsx
interface BridgeParams {
  amount: string;
  token: 'ETH' | string; // 'ETH' or token address
}

interface DepositResult {
  l1TxHash: string;
  estimatedTime: number; // in seconds
}

interface WithdrawResult {
  l2TxHash: string;
  estimatedTime: number;
}

type DepositStatus = {
  state: 'pending' | 'l1_confirmed' | 'completed' | 'failed';
  l2TxHash?: string;
  error?: string;
};

type WithdrawStatus = {
  state: 'pending' | 'waiting_for_proof' | 'ready_to_prove' |
         'in_challenge' | 'ready_to_finalize' | 'completed';
  remainingTime?: number;
  l1TxHash?: string;
};
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

GIWA ID (ENS) Hook

```tsx
import { useGiwaId } from '@giwa/react-native-wallet';

const {
  resolveAddress,    // (name: string) => Promise<string | null>
  resolveName,       // (address: string) => Promise<string | null>
  isNameAvailable,   // (name: string) => Promise<boolean>
  register,          // (name: string, options: RegisterOptions) => Promise<RegisterResult>
  getProfile,        // (name: string) => Promise<Profile>
  setProfile,        // (profile: Partial<Profile>) => Promise<string>
  isLoading,         // boolean
} = useGiwaId();
```

### Types

```tsx
interface RegisterOptions {
  duration: number; // in days
}

interface RegisterResult {
  txHash: string;
  name: string;
}

interface Profile {
  avatar?: string;
  description?: string;
  twitter?: string;
  email?: string;
  url?: string;
}
```

---

## useDojang

Dojang (증명) Hook

```tsx
import { useDojang } from '@giwa/react-native-wallet';

const {
  getAttestation,     // (id: string) => Promise<Attestation>
  getAttestations,    // (filter: AttestationFilter) => Promise<Attestation[]>
  verifyAttestation,  // (id: string) => Promise<boolean>
  createAttestation,  // (params: CreateAttestationParams) => Promise<AttestationResult>
  revokeAttestation,  // (id: string) => Promise<string>
  isLoading,          // boolean
} = useDojang();
```

### Types

```tsx
interface Attestation {
  id: string;
  schemaId: string;
  attester: string;
  recipient: string;
  data: Record<string, any>;
  time: number;
  expirationTime: number;
  revoked: boolean;
}

interface AttestationFilter {
  recipient?: string;
  attester?: string;
  schemaId?: string;
}

interface CreateAttestationParams {
  schemaId: string;
  recipient: string;
  data: Record<string, any>;
  expirationTime?: number;
  revocable?: boolean;
}
```

---

## useFaucet

테스트넷 Faucet Hook

```tsx
import { useFaucet } from '@giwa/react-native-wallet';

const {
  requestFaucet,  // () => Promise<FaucetResult>
  isLoading,      // boolean
  error,          // GiwaError | null
} = useFaucet();
```

### Types

```tsx
interface FaucetResult {
  txHash: string;
  amount: string; // ETH units
}
```

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
