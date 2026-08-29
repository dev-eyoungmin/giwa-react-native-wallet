---
sidebar_position: 4
---

# Types

GIWA SDK의 TypeScript 타입 정의입니다.

## Network

```tsx
type NetworkType = 'testnet' | 'mainnet';

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
  /** 이 네트워크가 정산되는 L1의 chain id (이더리움 Sepolia 11155111 / 이더리움 메인넷 1) */
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
    l1ChainId: 11155111, // 이더리움 Sepolia
  },
  mainnet: {
    id: 0, // TBD - 메인넷 출시 시 업데이트 예정
    name: 'GIWA Mainnet',
    rpcUrl: '-',
    flashblocksRpcUrl: '-', // TBD
    flashblocksWsUrl: '-', // TBD
    explorerUrl: '-',
    currency: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    l1ChainId: 1, // 이더리움 메인넷
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
 * viem의 `getWithdrawalStatus` op-stack 액션이 보고하는 L2 -> L1 출금 상태.
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

`up.id`(Upbit Web3 Names)이며, 온체인 `UpnameRegistry`를 통해 해석됩니다. 읽기 전용입니다 — 이 SDK에는 등록/프로필 쓰기 API가 없고, ENS 스타일 텍스트 레코드도 없습니다.

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

EAS 기반 증명입니다. 읽기 전용입니다 — `Attestation`은 원본 EAS 레코드를 그대로 반영하며, `decodeAttestationData`가 `data` 바이트를 스키마별 페이로드로 디코딩합니다.

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
  | 'unknown'; // 위 네 가지 스키마 UID와 일치하지 않는 경우

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

// GIWA Sepolia 스키마 UID
const DOJANG_SCHEMAS = {
  VERIFIED_ADDRESS: '0x072d75e18b2be4f89a13a7147240477481c4b526d5795802acba59046b426e08',
  BALANCE_ROOT: '0x369faa9c2cd261c45be3db5e230b585f5f1abecf8e12be575bb543e917e6db52',
  VERIFIED_BALANCE: '0x77bf88ca262cc63e1b185dccd870aacc5320b8987ef6c7169920f265fe6ab5e9',
  VERIFIED_CODE: '0x55ac1369dac97522d062b89ffdc4e752b48fbeba86915fdb956c7c2d0501d280',
} as const;

// 알려진 Dojang 발급자와 네트워크별 우선순위
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

실제 스키마 UID/발급자 주소와 메서드별 발급자 기본값 동작 방식은 [Dojang 가이드](/docs/guides/dojang)를 참고하세요.

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
  /** L1(이더리움) RPC URL. 브릿지 입금, 증명, 완료에 필요. SDK는 기본값을 제공하지 않으므로 직접 provider를 선택하세요. */
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
  customContracts?: CustomContracts; // Partial<ContractAddresses>, Core API 참고
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
