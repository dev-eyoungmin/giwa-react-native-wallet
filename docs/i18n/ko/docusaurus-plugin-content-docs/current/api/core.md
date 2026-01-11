---
sidebar_position: 3
---

# Core API

GIWA SDK Core 모듈에 대한 API 레퍼런스입니다. 이 모듈들은 Hook 외부에서 직접 사용할 수 있습니다.

## GiwaClient

viem 기반 블록체인 클라이언트

```tsx
import { GiwaClient } from '@giwa/react-native-wallet';

const client = new GiwaClient({
  network: 'testnet',
  endpoints: {
    rpcUrl: 'https://...', // Custom RPC URL
    flashblocksRpcUrl: 'https://...', // Custom Flashblocks RPC
    flashblocksWsUrl: 'wss://...', // Custom Flashblocks WebSocket
    explorerUrl: 'https://...', // Custom Explorer URL
  },
  customContracts: {
    eas: '0x...', // Override EAS address
    schemaRegistry: '0x...', // Override Schema Registry
    ensRegistry: '0x...', // Override ENS Registry
    ensResolver: '0x...', // Override ENS Resolver
    l2StandardBridge: '0x...', // Override L2 Bridge
  },
});
```

### Methods

```tsx
// Public Client (read-only)
client.getPublicClient(): PublicClient

// Wallet Client (requires signing)
client.getWalletClient(privateKey: string): WalletClient

// Network information
client.getNetwork(): NetworkInfo

// Block number
client.getBlockNumber(): Promise<bigint>

// Balance query
client.getBalance(address: string): Promise<bigint>

// Transaction query
client.getTransaction(hash: string): Promise<Transaction | null>

// Transaction receipt
client.getTransactionReceipt(hash: string): Promise<TransactionReceipt | null>
```

---

## WalletManager

지갑 생성 및 관리

```tsx
import { WalletManager } from '@giwa/react-native-wallet';

const walletManager = new WalletManager(secureStorage, biometricAuth);
```

### Methods

```tsx
// Create new wallet
walletManager.createWallet(): Promise<{
  address: string;
  mnemonic: string;
}>

// Recover from mnemonic
walletManager.recoverFromMnemonic(mnemonic: string): Promise<{
  address: string;
}>

// Import from private key
walletManager.importFromPrivateKey(privateKey: string): Promise<{
  address: string;
}>

// Export private key (requires biometric authentication)
walletManager.exportPrivateKey(): Promise<string>

// Current wallet information
walletManager.getCurrentWallet(): Promise<WalletInfo | null>

// Delete wallet
walletManager.deleteWallet(): Promise<void>

// Check if wallet exists
walletManager.hasWallet(): Promise<boolean>
```

---

## TokenManager

ERC-20 토큰 관리

```tsx
import { TokenManager } from '@giwa/react-native-wallet';

const tokenManager = new TokenManager(publicClient, walletClient);
```

### Methods

```tsx
// Get token information
tokenManager.getTokenInfo(tokenAddress: string): Promise<TokenInfo>

// Get token balance
tokenManager.getBalance(
  tokenAddress: string,
  ownerAddress: string
): Promise<bigint>

// Transfer tokens
tokenManager.transfer(
  tokenAddress: string,
  to: string,
  amount: bigint
): Promise<string>

// Approve
tokenManager.approve(
  tokenAddress: string,
  spender: string,
  amount: bigint
): Promise<string>

// Get allowance
tokenManager.allowance(
  tokenAddress: string,
  owner: string,
  spender: string
): Promise<bigint>
```

---

## BridgeManager

L1↔L2 브릿지 관리

```tsx
import { BridgeManager } from '@giwa/react-native-wallet';

const bridgeManager = new BridgeManager(l1Client, l2Client, walletClient);
```

### Methods

```tsx
// L1 -> L2 deposit
bridgeManager.deposit(params: {
  amount: bigint;
  token: 'ETH' | string;
}): Promise<{
  l1TxHash: string;
  estimatedTime: number;
}>

// L2 -> L1 withdrawal
bridgeManager.withdraw(params: {
  amount: bigint;
  token: 'ETH' | string;
}): Promise<{
  l2TxHash: string;
  estimatedTime: number;
}>

// Get deposit status
bridgeManager.getDepositStatus(l1TxHash: string): Promise<DepositStatus>

// Get withdrawal status
bridgeManager.getWithdrawStatus(l2TxHash: string): Promise<WithdrawStatus>

// Estimate fees
bridgeManager.estimateFees(params: {
  direction: 'deposit' | 'withdraw';
  amount: bigint;
  token: 'ETH' | string;
}): Promise<FeeEstimate>
```

---

## FlashblocksManager

Flashblocks 관리

```tsx
import { FlashblocksManager } from '@giwa/react-native-wallet';

const flashblocksManager = new FlashblocksManager(client, walletClient);
```

### Methods

```tsx
// Send Flashblocks transaction
flashblocksManager.sendTransaction(tx: {
  to: string;
  value: bigint;
  data?: string;
}): Promise<{
  preconfirmation: Preconfirmation;
  result: TransactionResult;
}>

// Check availability
flashblocksManager.isAvailable(): boolean

// Get average latency
flashblocksManager.getAverageLatency(): number
```

---

## GiwaIdManager

GIWA ID (ENS) 관리

```tsx
import { GiwaIdManager } from '@giwa/react-native-wallet';

const giwaIdManager = new GiwaIdManager(client);
```

### Methods

```tsx
// Name -> Address
giwaIdManager.resolveAddress(name: string): Promise<string | null>

// Address -> Name
giwaIdManager.resolveName(address: string): Promise<string | null>

// Check name availability
giwaIdManager.isNameAvailable(name: string): Promise<boolean>

// Register name
giwaIdManager.register(
  name: string,
  duration: number
): Promise<{ txHash: string }>

// Get profile
giwaIdManager.getProfile(name: string): Promise<Profile>

// Set profile
giwaIdManager.setProfile(profile: Partial<Profile>): Promise<string>
```

---

## DojangManager

Dojang 증명 관리

```tsx
import { DojangManager } from '@giwa/react-native-wallet';

const dojangManager = new DojangManager(client);
```

### Methods

```tsx
// Get attestation
dojangManager.getAttestation(id: string): Promise<Attestation>

// Get attestation list
dojangManager.getAttestations(filter: {
  recipient?: string;
  attester?: string;
  schemaId?: string;
}): Promise<Attestation[]>

// Verify attestation
dojangManager.verifyAttestation(id: string): Promise<boolean>

// Create attestation (issuer only)
dojangManager.createAttestation(params: {
  schemaId: string;
  recipient: string;
  data: Record<string, any>;
  expirationTime?: number;
  revocable?: boolean;
}): Promise<{ attestationId: string; txHash: string }>

// Revoke attestation (issuer only)
dojangManager.revokeAttestation(id: string): Promise<string>
```

---

## AdapterFactory

어댑터 팩토리

```tsx
import { AdapterFactory, getAdapterFactory } from '@giwa/react-native-wallet';

// Singleton instance
const factory = getAdapterFactory();

// Or create directly
const factory = new AdapterFactory({
  forceEnvironment?: 'expo' | 'react-native',
});
```

### Methods

```tsx
// Detect environment
factory.detectEnvironment(): 'expo' | 'react-native'

// Create adapters
factory.createAdapters(): Promise<Adapters>

// Individual adapters
factory.getSecureStorage(): ISecureStorage
factory.getBiometricAuth(): IBiometricAuth
```

### Adapters Type

```tsx
interface Adapters {
  secureStorage: ISecureStorage;
  biometricAuth: IBiometricAuth;
}
```

---

## Default Contract Addresses

SDK는 기본적으로 OP Stack 표준 predeploy 주소를 사용합니다. 이 주소들은 `GiwaConfig`의 `customContracts`를 통해 오버라이드할 수 있습니다.

### OP Stack Standard Addresses

| 컨트랙트 | 주소 | 설명 |
|----------|------|------|
| EAS | `0x4200000000000000000000000000000000000021` | Ethereum Attestation Service (Dojang) |
| Schema Registry | `0x4200000000000000000000000000000000000020` | EAS Schema Registry |
| L2 Standard Bridge | `0x4200000000000000000000000000000000000010` | L2 Bridge for ETH/ERC-20 withdrawals |
| WETH | `0x4200000000000000000000000000000000000006` | Wrapped ETH |

### CustomContracts Type

```tsx
interface CustomContracts {
  eas?: Address;           // EAS contract address
  schemaRegistry?: Address; // Schema Registry address
  ensRegistry?: Address;    // ENS Registry address
  ensResolver?: Address;    // ENS Resolver address
  l2StandardBridge?: Address; // L2 Standard Bridge address
  l1StandardBridge?: Address; // L1 Standard Bridge address
  weth?: Address;           // WETH address
}
```

### Usage Example

```tsx
import { GiwaProvider } from '@giwa/react-native-wallet';

// Override specific contract addresses
<GiwaProvider
  config={{
    network: 'testnet',
    customContracts: {
      // Only override what you need
      eas: '0xYourCustomEASAddress',
      ensRegistry: '0xYourCustomENSRegistry',
    },
  }}
>
  <App />
</GiwaProvider>
```
