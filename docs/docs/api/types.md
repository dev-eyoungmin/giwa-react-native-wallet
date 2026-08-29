---
sidebar_position: 4
---

# Types

TypeScript type definitions for GIWA SDK.

## Network

:::caution Mainnet Under Development
`mainnet` is currently under development. Please use `testnet` for development.
:::

```tsx
type NetworkType = 'testnet' | 'mainnet';  // mainnet: 🚧 Under Development

interface GiwaNetwork {
  id: number;
  name: string;
  rpcUrl: string;
  flashblocksRpcUrl: string;
  flashblocksWsUrl: string;
  explorerUrl: string;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  /** Chain id of the L1 this network settles to (Ethereum Sepolia 11155111 / Ethereum mainnet 1) */
  l1ChainId: number;
}

// Network Constants
const GIWA_NETWORKS: Record<NetworkType, GiwaNetwork> = {
  testnet: {
    id: 91342,
    name: 'GIWA Sepolia',
    rpcUrl: 'https://sepolia-rpc.giwa.io',
    flashblocksRpcUrl: 'https://sepolia-rpc-flashblocks.giwa.io',
    flashblocksWsUrl: 'wss://sepolia-rpc-flashblocks.giwa.io',
    explorerUrl: 'https://sepolia-explorer.giwa.io',
    currency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    l1ChainId: 11155111, // Ethereum Sepolia
  },
  mainnet: {
    id: 0, // TBD - will be updated when mainnet launches
    name: 'GIWA Mainnet',
    rpcUrl: '-',
    flashblocksRpcUrl: '-', // TBD
    flashblocksWsUrl: '-', // TBD
    explorerUrl: '-',
    currency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    l1ChainId: 1, // Ethereum mainnet
  },
};
```

## Wallet

```tsx
interface WalletInfo {
  address: string;
  isConnected: boolean;
}

interface CreateWalletResult {
  wallet: WalletInfo;
  mnemonic: string;
}
```

## Transaction

```tsx
interface TransactionRequest {
  to: string;
  value?: string;
  data?: string;
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
}

interface TransactionReceipt {
  transactionHash: string;
  blockNumber: bigint;
  blockHash: string;
  from: string;
  to: string;
  status: "success" | "reverted";
  gasUsed: bigint;
  effectiveGasPrice: bigint;
  logs: Log[];
}

interface GasEstimate {
  gasLimit: bigint;
  gasPrice: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  estimatedFee: string;
}
```

## Token

```tsx
interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply?: bigint;
}

interface TokenBalance {
  token: TokenInfo;
  balance: bigint;
  formattedBalance: string;
}

interface AllowanceResult {
  amount: bigint;
  formattedAmount: string;
  isUnlimited: boolean;
}
```

## Bridge

```tsx
type BridgeDirection = "deposit" | "withdraw";

interface BridgeTransaction {
  direction: BridgeDirection;
  amount: bigint;
  token?: Address;
  l1TxHash?: Hash;
  l2TxHash?: Hash;
  status: "pending" | "confirmed" | "proved" | "finalized" | "failed";
}

/**
 * Status of an L2 -> L1 withdrawal, as reported by viem's
 * `getWithdrawalStatus` op-stack action.
 */
type WithdrawalStatus =
  | "waiting-to-prove"
  | "ready-to-prove"
  | "waiting-to-finalize"
  | "ready-to-finalize"
  | "finalized";

interface TransactionResult {
  hash: Hash;
  wait: () => Promise<TransactionReceipt>;
}
```

## Flashblocks

```tsx
interface FlashblocksTx {
  to: string;
  value: bigint;
  data?: string;
}

interface Preconfirmation {
  txHash: string;
  preconfirmedAt: number;
  latencyMs: number;
  sequencerSignature: string;
}

interface FlashblocksResult {
  preconfirmation: Preconfirmation;
  result: {
    hash: string;
    wait: () => Promise<TransactionReceipt>;
  };
}
```

## GIWA ID

`up.id` (Upbit Web3 Names), resolved via the on-chain `UpnameRegistry`. Read-only: there is no registration/profile-write API in this SDK, and no ENS-style text records.

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

## Dojang

EAS-based attestations. Read-only: `Attestation` mirrors the raw EAS record, and `decodeAttestationData` decodes its `data` bytes into a schema-specific payload.

```tsx
type Hex = `0x${string}`;

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
  | 'unknown'; // schema UID that doesn't match any of the four schemas above

// decodeAttestationData(attestation) return type - null for 'unknown' or on decode failure
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

// GIWA Sepolia schema UIDs
const DOJANG_SCHEMAS = {
  VERIFIED_ADDRESS: '0x072d75e18b2be4f89a13a7147240477481c4b526d5795802acba59046b426e08',
  BALANCE_ROOT: '0x369faa9c2cd261c45be3db5e230b585f5f1abecf8e12be575bb543e917e6db52',
  VERIFIED_BALANCE: '0x77bf88ca262cc63e1b185dccd870aacc5320b8987ef6c7169920f265fe6ab5e9',
  VERIFIED_CODE: '0x55ac1369dac97522d062b89ffdc4e752b48fbeba86915fdb956c7c2d0501d280',
} as const;

// Known Dojang attesters, and the per-network priority order
interface DojangAttester {
  name: string;
  id: Hex;
  address: Address;
}

const DOJANG_ATTESTERS: {
  UPBIT_KOREA: DojangAttester;
  TESTNET_FAUCET: DojangAttester;
};

// testnet: [UPBIT_KOREA, TESTNET_FAUCET]; mainnet: [UPBIT_KOREA]
function getDojangAttesters(network?: NetworkType): DojangAttester[];

// = DOJANG_ATTESTERS.UPBIT_KOREA.id
const DEFAULT_DOJANG_ATTESTER_ID: Hex;
```

See the [Dojang guide](/docs/guides/dojang) for the real schema UIDs/attester addresses and the attester-default semantics per method.

## Biometric Types

```tsx
type BiometricType = "fingerprint" | "face" | "iris" | "none";

interface BiometricCapability {
  isAvailable: boolean;
  biometricType: BiometricType;
  isEnrolled: boolean;
}

interface UseBiometricAuthOptions {
  /** Default prompt message for authentication */
  defaultPromptMessage?: string;
}

interface UseBiometricAuthReturn {
  /** Whether biometric hardware is available */
  isAvailable: boolean;
  /** Whether biometrics are enrolled on the device */
  isEnrolled: boolean;
  /** Type of biometric available */
  biometricType: BiometricType;
  /** Full capability information */
  capability: BiometricCapability | null;
  /** Whether capability check is in progress */
  isLoading: boolean;
  /** Error if capability check failed */
  error: Error | null;
  /** Authenticate using biometrics */
  authenticate: (promptMessage?: string) => Promise<boolean>;
  /** Refresh capability information */
  refreshCapability: () => Promise<void>;
}
```

## Adapter Interfaces

```tsx
interface ISecureStorage {
  setItem(
    key: string,
    value: string,
    options?: SecureStorageOptions
  ): Promise<void>;
  getItem(key: string, options?: SecureStorageOptions): Promise<string | null>;
  removeItem(key: string): Promise<void>;
  getAllKeys(): Promise<string[]>;
}

interface SecureStorageOptions {
  requireBiometric?: boolean;
  accessibleWhenUnlocked?: boolean;
}

interface IBiometricAuth {
  getCapability(): Promise<BiometricCapability>;
  authenticate(promptMessage: string): Promise<boolean>;
}
```

## Errors

```tsx
class GiwaError extends Error {
  code: string;
  details?: Record<string, any>;

  constructor(message: string, code?: string, details?: Record<string, any>);
}

class GiwaSecurityError extends GiwaError {}
class GiwaNetworkError extends GiwaError {}
class GiwaWalletError extends GiwaError {}
class GiwaTransactionError extends GiwaError {}

const ErrorCodes = {
  // General
  UNKNOWN_ERROR: "UNKNOWN_ERROR",
  INVALID_PARAMS: "INVALID_PARAMS",

  // Security
  SECURE_STORAGE_ERROR: "SECURE_STORAGE_ERROR",
  BIOMETRIC_FAILED: "BIOMETRIC_FAILED",
  BIOMETRIC_NOT_AVAILABLE: "BIOMETRIC_NOT_AVAILABLE",

  // Network
  NETWORK_ERROR: "NETWORK_ERROR",
  RPC_ERROR: "RPC_ERROR",
  TIMEOUT: "TIMEOUT",

  // Wallet
  WALLET_NOT_FOUND: "WALLET_NOT_FOUND",
  INVALID_MNEMONIC: "INVALID_MNEMONIC",
  INVALID_PRIVATE_KEY: "INVALID_PRIVATE_KEY",

  // Transaction
  INVALID_ADDRESS: "INVALID_ADDRESS",
  INSUFFICIENT_FUNDS: "INSUFFICIENT_FUNDS",
  GAS_TOO_LOW: "GAS_TOO_LOW",
  NONCE_TOO_LOW: "NONCE_TOO_LOW",
  TRANSACTION_FAILED: "TRANSACTION_FAILED",
  TRANSACTION_REVERTED: "TRANSACTION_REVERTED",

  // Token
  INVALID_TOKEN: "INVALID_TOKEN",
  INSUFFICIENT_ALLOWANCE: "INSUFFICIENT_ALLOWANCE",

  // Bridge
  BRIDGE_ERROR: "BRIDGE_ERROR",
  BRIDGE_TIMEOUT: "BRIDGE_TIMEOUT",

  // GIWA ID
  NAME_NOT_AVAILABLE: "NAME_NOT_AVAILABLE",
  NAME_NOT_FOUND: "NAME_NOT_FOUND",

  // Dojang
  ATTESTATION_NOT_FOUND: "ATTESTATION_NOT_FOUND",
  ATTESTATION_REVOKED: "ATTESTATION_REVOKED",
  NOT_AUTHORIZED: "NOT_AUTHORIZED",
} as const;
```

## Configuration

```tsx
// Custom Endpoints Configuration
interface CustomEndpoints {
  /** Custom RPC URL */
  rpcUrl?: string;
  /** Flashblocks RPC URL */
  flashblocksRpcUrl?: string;
  /** Flashblocks WebSocket URL */
  flashblocksWsUrl?: string;
  /** Block Explorer URL */
  explorerUrl?: string;
  /** L1 (Ethereum) RPC URL. Required for bridge deposits, proving and finalizing withdrawals. The SDK ships no default: pick your own provider. */
  l1RpcUrl?: string;
}

interface GiwaConfig {
  /** Network type (default: 'testnet') */
  network?: NetworkType;
  /** @deprecated Use endpoints.rpcUrl instead */
  customRpcUrl?: string;
  /** Custom endpoints configuration */
  endpoints?: CustomEndpoints;
  /** Custom contract addresses (overrides network defaults) */
  customContracts?: CustomContracts; // Partial<ContractAddresses>, see Core API
  /** Override the built-in network definition (chain id, name, URLs). Use with `endpoints` when pointing the SDK at a non-default chain. */
  customNetwork?: Partial<GiwaNetwork>;
  /** Auto-connect wallet on app start */
  autoConnect?: boolean;
  /** Enable Flashblocks */
  enableFlashblocks?: boolean;
}

// GiwaProvider Props (Recommended)
interface GiwaProviderProps {
  /** Network type */
  network?: "testnet" | "mainnet";
  /** Initialization timeout (ms, default: 10000) */
  initTimeout?: number;
  /** Callback when error occurs */
  onError?: (error: Error) => void;
  /** Child components */
  children: React.ReactNode;
  /** @deprecated Use direct props instead of config */
  config?: GiwaConfig;
  /** Custom adapter factory */
  adapterFactory?: AdapterFactory;
}
```

### GiwaProvider Usage Example

```tsx
// Recommended (direct props)
<GiwaProvider
  network="testnet"
  initTimeout={10000}
  onError={(error) => console.error('SDK Error:', error)}
>
  <App />
</GiwaProvider>

// With custom endpoints
<GiwaProvider
  config={{
    network: 'testnet',
    endpoints: {
      rpcUrl: 'https://my-custom-rpc.example.com',
      flashblocksRpcUrl: 'https://my-flashblocks-rpc.example.com',
      flashblocksWsUrl: 'wss://my-flashblocks-ws.example.com',
    },
  }}
>
  <App />
</GiwaProvider>
```

## Hook Return Types

```tsx
// useGiwaWallet return type
interface UseGiwaWalletReturn {
  /** Connected wallet info */
  wallet: GiwaWallet | null;
  /** Wallet operation loading */
  isLoading: boolean;
  /** Whether SDK is initializing */
  isInitializing: boolean;
  /** Whether wallet exists (wallet !== null) */
  hasWallet: boolean;
  /** Error object */
  error: Error | null;
  /** Create new wallet */
  createWallet: (
    options?: SecureStorageOptions
  ) => Promise<WalletCreationResult>;
  /** Recover wallet from mnemonic */
  recoverWallet: (
    mnemonic: string,
    options?: SecureStorageOptions
  ) => Promise<GiwaWallet>;
  /** Import wallet from private key */
  importFromPrivateKey: (
    privateKey: Hex,
    options?: SecureStorageOptions
  ) => Promise<GiwaWallet>;
  /** Load saved wallet */
  loadWallet: (options?: SecureStorageOptions) => Promise<GiwaWallet | null>;
  /** Delete wallet */
  deleteWallet: () => Promise<void>;
  /** Export mnemonic (Rate Limiting applied) */
  exportMnemonic: (options?: SecureStorageOptions) => Promise<string | null>;
  /** Export private key (Rate Limiting applied) */
  exportPrivateKey: (options?: SecureStorageOptions) => Promise<Hex | null>;
}

// useBalance return type
interface UseBalanceReturn {
  /** Balance (bigint, default 0n) */
  balance: bigint;
  /** Formatted balance string (default '0') */
  formattedBalance: string;
  /** Loading state */
  isLoading: boolean;
  /** Error object */
  error: Error | null;
  /** Refresh balance */
  refetch: () => Promise<void>;
}

// useNetworkInfo return type
interface UseNetworkInfoReturn {
  /** Current network */
  network: "testnet" | "mainnet";
  /** Network configuration */
  networkConfig: GiwaNetwork;
  /** Network status */
  status: NetworkStatus;
  /** Whether testnet */
  isTestnet: boolean;
  /** Whether ready */
  isReady: boolean;
  /** Whether has warnings */
  hasWarnings: boolean;
  /** Warning list */
  warnings: string[];
  /** Check feature availability */
  isFeatureAvailable: (feature: FeatureName) => boolean;
  /** Get feature details */
  getFeatureInfo: (feature: FeatureName) => FeatureAvailability;
  /** List of unavailable features */
  unavailableFeatures: FeatureName[];
  /** Chain ID */
  chainId: number;
  /** RPC URL */
  rpcUrl: string;
  /** Flashblocks RPC URL */
  flashblocksRpcUrl: string;
  /** Flashblocks WebSocket URL */
  flashblocksWsUrl: string;
  /** Block Explorer URL */
  explorerUrl: string;
}
```

## Security

```tsx
// Rate Limiting Configuration
interface RateLimitConfig {
  /** Maximum attempts allowed */
  maxAttempts: number;
  /** Time window (ms) */
  windowMs: number;
  /** Cooldown time (ms) */
  cooldownMs: number;
}

// Default Rate Limit Settings
const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  exportMnemonic: { maxAttempts: 3, windowMs: 60000, cooldownMs: 300000 },
  exportPrivateKey: { maxAttempts: 3, windowMs: 60000, cooldownMs: 300000 },
};

// Security Event Types
type SecurityEventType =
  | "WALLET_CREATED"
  | "WALLET_RECOVERED"
  | "WALLET_DELETED"
  | "WALLET_CONNECTED"
  | "WALLET_DISCONNECTED"
  | "MNEMONIC_EXPORT_ATTEMPT"
  | "PRIVATE_KEY_EXPORT_ATTEMPT"
  | "RATE_LIMIT_TRIGGERED"
  | "SECURITY_VIOLATION"
  | "BIOMETRIC_AUTH_ATTEMPT"
  | "BIOMETRIC_AUTH_SUCCESS"
  | "BIOMETRIC_AUTH_FAILED";

// Security Event Log
interface SecurityEvent {
  /** Event type */
  type: SecurityEventType;
  /** Timestamp */
  timestamp: string;
  /** Wallet address hint (masked, e.g., 0x1234...5678) */
  walletAddressHint?: string;
  /** Additional details */
  details?: Record<string, any>;
}

// Memory Security Configuration
interface MemorySecurityConfig {
  /** Sensitive data auto-cleanup time (ms) */
  accountCleanupDelay: number; // Default: 300000 (5 minutes)
}
```

## Helper Hooks Types

Types for shared async hooks used internally and available for custom hook development.

```tsx
// useAsyncAction types
interface AsyncActionState {
  isLoading: boolean;
  error: Error | null;
}

interface UseAsyncActionReturn<TResult, TArgs extends unknown[]>
  extends AsyncActionState {
  execute: (...args: TArgs) => Promise<TResult>;
  reset: () => void;
}

// useAsyncQuery types
interface UseAsyncQueryOptions<T> {
  /** Whether query is enabled (default: true) */
  enabled?: boolean;
  /** Initial data */
  initialData?: T;
  /** Auto refetch interval (ms) */
  refetchInterval?: number;
  /** Success callback */
  onSuccess?: (data: T) => void;
  /** Error callback */
  onError?: (error: Error) => void;
}

interface UseAsyncQueryReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  reset: () => void;
}
```

## Utility Types

```tsx
// Generic Hook Return Type
type HookResult<T> = {
  data: T | undefined;
  isLoading: boolean;
  error: GiwaError | null;
  refetch: () => Promise<void>;
};

// Async Function Result
type AsyncResult<T> = Promise<T>;

// Optional Fields
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Hex String Type
type Hex = `0x${string}`;
```
