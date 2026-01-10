---
sidebar_position: 1
---

# Hooks API

API reference for all React Hooks provided by GIWA SDK.

## useGiwaWallet

Wallet management Hook

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
`isInitializing` is `true` while the SDK is initializing. Check this value before performing wallet operations.
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

- `exportMnemonic` and `exportPrivateKey` have **Rate Limiting** applied (3 times per minute, 5-minute cooldown when exceeded)
- Sensitive data is automatically cleared from memory after 5 minutes of inactivity

---

## useBalance

ETH balance query Hook

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
`balance` is always of type `bigint` (previously: `bigint | null`).
The initial value is `0n`, and null checks are not required.
:::

### Parameters

| Name | Type | Description |
|------|------|-------------|
| `address` | `string` (optional) | Address to query. Uses connected wallet address if not specified |

---

## useTransaction

Transaction sending Hook

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

ERC-20 token management Hook

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

L1↔L2 Bridge Hook

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

Flashblocks (fast confirmation) Hook

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

Dojang (attestation) Hook

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

Testnet Faucet Hook

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

Network status and feature availability Hook

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
