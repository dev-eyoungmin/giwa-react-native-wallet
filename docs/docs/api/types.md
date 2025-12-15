---
sidebar_position: 4
---

# Types

GIWA SDK의 TypeScript 타입 정의입니다.

## 네트워크

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

// 네트워크 상수
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
    chainId: 91341,
    rpcUrl: 'https://rpc.giwa.io/',
    explorerUrl: 'https://explorer.giwa.io',
    nativeCurrency: {
      name: 'GIWA ETH',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};
```

## 지갑

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

## 트랜잭션

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
  status: 'success' | 'reverted';
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

## 토큰

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

## 브릿지

```tsx
interface BridgeParams {
  amount: string;
  token: 'ETH' | string;
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
  state: 'pending' | 'l1_confirmed' | 'completed' | 'failed';
  l1TxHash: string;
  l2TxHash?: string;
  error?: string;
}

interface WithdrawStatus {
  state:
    | 'pending'
    | 'waiting_for_proof'
    | 'ready_to_prove'
    | 'in_challenge'
    | 'ready_to_finalize'
    | 'completed';
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

// 기본 스키마
const DOJANG_SCHEMAS = {
  KYC: '0x...',
  MEMBERSHIP: '0x...',
  ACHIEVEMENT: '0x...',
  CREDENTIAL: '0x...',
  VERIFICATION: '0x...',
};
```

## 어댑터 인터페이스

```tsx
interface ISecureStorage {
  setItem(key: string, value: string, options?: SecureStorageOptions): Promise<void>;
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

type BiometryType = 'FaceID' | 'TouchID' | 'Fingerprint' | 'Iris';

interface BiometricOptions {
  promptMessage?: string;
  cancelLabel?: string;
  fallbackLabel?: string;
}

interface IClipboard {
  setString(value: string): Promise<void>;
  getString(): Promise<string>;
  hasString(): Promise<boolean>;
}
```

## 에러

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
  // 일반
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INVALID_PARAMS: 'INVALID_PARAMS',

  // 보안
  SECURE_STORAGE_ERROR: 'SECURE_STORAGE_ERROR',
  BIOMETRIC_FAILED: 'BIOMETRIC_FAILED',
  BIOMETRIC_NOT_AVAILABLE: 'BIOMETRIC_NOT_AVAILABLE',

  // 네트워크
  NETWORK_ERROR: 'NETWORK_ERROR',
  RPC_ERROR: 'RPC_ERROR',
  TIMEOUT: 'TIMEOUT',

  // 지갑
  WALLET_NOT_FOUND: 'WALLET_NOT_FOUND',
  INVALID_MNEMONIC: 'INVALID_MNEMONIC',
  INVALID_PRIVATE_KEY: 'INVALID_PRIVATE_KEY',

  // 트랜잭션
  INVALID_ADDRESS: 'INVALID_ADDRESS',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  GAS_TOO_LOW: 'GAS_TOO_LOW',
  NONCE_TOO_LOW: 'NONCE_TOO_LOW',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  TRANSACTION_REVERTED: 'TRANSACTION_REVERTED',

  // 토큰
  INVALID_TOKEN: 'INVALID_TOKEN',
  INSUFFICIENT_ALLOWANCE: 'INSUFFICIENT_ALLOWANCE',

  // 브릿지
  BRIDGE_ERROR: 'BRIDGE_ERROR',
  BRIDGE_TIMEOUT: 'BRIDGE_TIMEOUT',

  // GIWA ID
  NAME_NOT_AVAILABLE: 'NAME_NOT_AVAILABLE',
  NAME_NOT_FOUND: 'NAME_NOT_FOUND',

  // Dojang
  ATTESTATION_NOT_FOUND: 'ATTESTATION_NOT_FOUND',
  ATTESTATION_REVOKED: 'ATTESTATION_REVOKED',
  NOT_AUTHORIZED: 'NOT_AUTHORIZED',
} as const;
```

## 설정

```tsx
interface GiwaConfig {
  network: NetworkType;
  customRpcUrl?: string;
  autoConnect?: boolean;
  enableFlashblocks?: boolean;
  forceEnvironment?: 'expo' | 'react-native';
}

interface GiwaProviderProps {
  config: GiwaConfig;
  children: React.ReactNode;
  adapterFactory?: AdapterFactory;
}
```

## 유틸리티 타입

```tsx
// Hook 반환 타입
type HookResult<T> = {
  data: T | undefined;
  isLoading: boolean;
  error: GiwaError | null;
  refetch: () => Promise<void>;
};

// 비동기 함수 결과
type AsyncResult<T> = Promise<T>;

// 선택적 필드
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
```
