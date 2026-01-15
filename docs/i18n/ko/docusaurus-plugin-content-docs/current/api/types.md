---
sidebar_position: 4
---

# Types

GIWA SDK의 TypeScript 타입 정의입니다.

## Network

```tsx
type NetworkType = 'testnet' | 'mainnet';

interface NetworkInfo {
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

// Network Constants
const GIWA_NETWORKS: Record<NetworkType, NetworkInfo> = {
  testnet: {
    name: 'GIWA Testnet',
    chainId: 91342,
    rpcUrl: 'https://sepolia-rpc.giwa.io/',
    explorerUrl: 'https://sepolia-explorer.giwa.io',
    nativeCurrency: {
      name: 'GIWA ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  mainnet: {
    name: 'GIWA Mainnet',
    chainId: -,
    rpcUrl: -,
    explorerUrl: -,
    nativeCurrency: {
      name: 'GIWA ETH',
      symbol: 'ETH',
      decimals: 18,
    },
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
interface BridgeParams {
  amount: string;
  token: "ETH" | string;
}

interface DepositResult {
  l1TxHash: string;
  estimatedTime: number;
}

interface WithdrawResult {
  l2TxHash: string;
  estimatedTime: number;
}

interface DepositStatus {
  state: "pending" | "l1_confirmed" | "completed" | "failed";
  l1TxHash: string;
  l2TxHash?: string;
  error?: string;
}

interface WithdrawStatus {
  state:
    | "pending"
    | "waiting_for_proof"
    | "ready_to_prove"
    | "in_challenge"
    | "ready_to_finalize"
    | "completed";
  l2TxHash: string;
  l1TxHash?: string;
  remainingTime?: number;
  error?: string;
}

interface FeeEstimate {
  l1GasFee: string;
  l2GasFee: string;
  totalFee: string;
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

```tsx
interface GiwaIdInfo {
  name: string;
  address: string;
  owner: string;
  resolver: string;
  expiresAt: number;
}

interface Profile {
  avatar?: string;
  description?: string;
  twitter?: string;
  email?: string;
  url?: string;
  github?: string;
  discord?: string;
}

interface RegisterOptions {
  duration: number;
}

interface RegisterResult {
  txHash: string;
  name: string;
  expiresAt: number;
}
```

## Dojang

```tsx
interface Attestation {
  id: string;
  schemaId: string;
  schema: Schema;
  attester: string;
  recipient: string;
  data: Record<string, any>;
  time: number;
  expirationTime: number;
  revoked: boolean;
  revocationTime?: number;
  txHash: string;
}

interface Schema {
  id: string;
  name: string;
  description?: string;
  schema: string;
}

interface AttestationFilter {
  recipient?: string;
  attester?: string;
  schemaId?: string;
  fromTime?: number;
  toTime?: number;
}

interface CreateAttestationParams {
  schemaId: string;
  recipient: string;
  data: Record<string, any>;
  expirationTime?: number;
  revocable?: boolean;
  refUID?: string;
}

interface AttestationResult {
  attestationId: string;
  txHash: string;
}

// Default Schemas
const DOJANG_SCHEMAS = {
  KYC: "0x...",
  MEMBERSHIP: "0x...",
  ACHIEVEMENT: "0x...",
  CREDENTIAL: "0x...",
  VERIFICATION: "0x...",
};
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
}

interface IBiometricAuth {
  isAvailable(): Promise<boolean>;
  getBiometryType(): Promise<BiometryType | null>;
  authenticate(options?: BiometricOptions): Promise<boolean>;
}

type BiometryType = "FaceID" | "TouchID" | "Fingerprint" | "Iris";

interface BiometricOptions {
  promptMessage?: string;
  cancelLabel?: string;
  fallbackLabel?: string;
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
}

interface GiwaConfig {
  /** Network type (default: 'testnet') */
  network?: NetworkType;
  /** @deprecated Use endpoints.rpcUrl instead */
  customRpcUrl?: string;
  /** Custom endpoints configuration */
  endpoints?: CustomEndpoints;
  /** Auto-connect wallet on app start */
  autoConnect?: boolean;
  /** Enable Flashblocks */
  enableFlashblocks?: boolean;
  /** Force environment type */
  forceEnvironment?: "expo" | "react-native";
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
