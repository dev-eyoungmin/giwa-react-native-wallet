---
sidebar_position: 3
---

# Core API

GIWA SDK Core 모듈에 대한 API 레퍼런스입니다. 이 모듈들은 Hook 외부에서 직접 사용할 수 있습니다.

## GiwaClient

viem 기반 블록체인 클라이언트

```tsx
import { GiwaClient } from 'giwa-react-native-wallet';

const client = new GiwaClient({
  network: 'testnet',
  endpoints: {
    rpcUrl: 'https://...', // Custom RPC URL
    flashblocksRpcUrl: 'https://...', // Custom Flashblocks RPC
    flashblocksWsUrl: 'wss://...', // Custom Flashblocks WebSocket
    explorerUrl: 'https://...', // Custom Explorer URL
    l1RpcUrl: 'https://...', // L1(이더리움) RPC URL - 브릿지 입금, 증명, 완료에 필요. 기본값 없음.
  },
  customContracts: {
    eas: '0x...', // Override EAS address
    schemaRegistry: '0x...', // Override Schema Registry
    dojangScroll: '0x...', // Override DojangScroll
    l2StandardBridge: '0x...', // Override L2 Bridge
  },
  // 내장 네트워크 정의(chain id, name, URLs) 자체를 오버라이드합니다.
  // 기본과 다른 체인을 대상으로 할 때 `endpoints`/`customContracts`와 함께 사용하세요.
  customNetwork: {
    id: 91342,
  },
});
```

### Methods

```tsx
// Public Client (read-only)
client.getPublicClient(): PublicClient

// Wallet Client (requires signing, set via setAccount)
client.getWalletClient(): WalletClient | null

// Network type ('testnet' | 'mainnet')
client.getNetwork(): NetworkType

// Resolved network definition (built-in defaults merged with `customNetwork`)
client.getNetworkConfig(): GiwaNetwork

// Verify the RPC-reported chain id matches the configured chain id
client.verifyChainId(): Promise<{ expected: number; actual: number; matches: boolean }>

// Chain ID
client.getChainId(): number

// Block number
client.getBlockNumber(): Promise<bigint>

// Gas price
client.getGasPrice(): Promise<bigint>

// Whether the RPC endpoint is reachable
client.isConnected(): Promise<boolean>

// Contract addresses (network defaults merged with `customContracts`)
client.getContractAddresses(): ContractAddresses

// L1(이더리움) 지원이 설정되어 있는지 여부 (endpoints.l1RpcUrl)
client.hasL1Support(): boolean

// L1(이더리움) 체인 정의, SDK가 모르는 L1 chain id면 null
client.getL1Chain(): Chain | null

// 읽기 전용 L1 public client, l1RpcUrl이 설정되지 않았으면 null
client.getL1PublicClient(): GiwaL1PublicClient | null

// 쓰기용 L1 wallet client, 계정이 설정되지 않았거나 l1RpcUrl이 없으면 null
client.getL1WalletClient(): GiwaL1WalletClient | null

// 설정된 L1 RPC URL, 없으면 undefined
client.getL1RpcUrl(): string | undefined

// Feature availability
client.isFeatureAvailable(feature: FeatureName): boolean
client.getFeatureInfo(feature: FeatureName): FeatureAvailability
client.getNetworkStatus(): NetworkStatus
```

`GiwaProvider`는 초기화 시 `verifyChainId()`를 한 번 호출하며(fire-and-forget), RPC의 chain id가 설정된 chain id와 다르면 콘솔 경고를 출력합니다.

---

## WalletManager

지갑 생성 및 관리

```tsx
import { WalletManager } from 'giwa-react-native-wallet';

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
import { TokenManager } from 'giwa-react-native-wallet';

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

L1↔L2 브릿지 관리: ETH/ERC-20 입금, 출금, 출금 증명(prove)/완료(finalize) 흐름(내부적으로 viem op-stack 액션 사용). 전체 생명주기와 `endpoints.l1RpcUrl` 설정은 [Bridge 가이드](/docs/guides/bridge)를 참고하세요.

```tsx
import { BridgeManager } from 'giwa-react-native-wallet';

const bridgeManager = new BridgeManager(client); // GiwaClient
```

### Methods

```tsx
// L1 -> L2 ETH 입금. L1 tx 해시를 반환하며, wait()는 L1 트랜잭션이 확인될 때
// 완료됩니다(자산이 L2에 도착할 때가 아님). client.hasL1Support()가 필요합니다.
bridgeManager.depositETH(amount: string, to?: Address): Promise<TransactionResult>

// L1 -> L2 ERC-20 입금. allowance가 부족하면 L1StandardBridge allowance를 자동 승인합니다.
bridgeManager.depositToken(
  l1TokenAddress: Address,
  l2TokenAddress: Address,
  amount: bigint,
  to?: Address
): Promise<TransactionResult>

// L2 -> L1 ETH 출금(시작만). L1 클라이언트 없이도 동작합니다.
bridgeManager.withdrawETH(amount: string, to?: Address): Promise<TransactionResult>

// L2 -> L1 ERC-20 출금(시작만). L1 클라이언트 없이도 동작합니다.
bridgeManager.withdrawToken(
  l2TokenAddress: Address,
  amount: bigint,
  to?: Address
): Promise<TransactionResult>

// 출금의 현재 상태. client.hasL1Support()가 필요합니다.
bridgeManager.getWithdrawalStatus(l2TxHash: Hash): Promise<WithdrawalStatus>

// 논블로킹: 증명 가능해지기까지 남은 시간.
bridgeManager.getTimeToProve(l2TxHash: Hash): Promise<GetTimeToProveReturnType>

// 논블로킹: 증명된 출금이 완료 가능해지기까지 남은 시간.
bridgeManager.getTimeToFinalize(l2TxHash: Hash): Promise<GetTimeToFinalizeReturnType>

// L1에서 출금 증명. 증명 가능해질 때까지 **블로킹**됩니다(몇 시간 소요 가능) - 출금의
// 블록을 커버하는 L2 output/dispute game이 L1에 반영될 때까지 기다립니다.
bridgeManager.proveWithdrawal(l2TxHash: Hash): Promise<TransactionResult>

// 증명된 출금을 L1에서 완료하여 자금을 해제합니다. 약 7일의 challenge period를
// 기다리지 않으므로, 호출자가 먼저 준비 상태를 확인해야 합니다.
bridgeManager.finalizeWithdrawal(l2TxHash: Hash): Promise<TransactionResult>

// 로컬에서 추적되는 입금/출금 (BridgeManager 인스턴스별 인메모리)
bridgeManager.getPendingTransactions(): BridgeTransaction[]
bridgeManager.getTransaction(hash: Hash): BridgeTransaction | undefined
bridgeManager.clearPendingTransactions(): void

// challenge period 예상 시간(초) (고정값: 7 * 24 * 60 * 60)
bridgeManager.getEstimatedWithdrawalTime(): number
```

`TransactionResult`는 `{ hash: Hash; wait: () => Promise<TransactionReceipt> }`입니다. `depositETH`/`depositToken`/`proveWithdrawal`/`finalizeWithdrawal`의 `hash`와 `wait()`가 반환하는 영수증은 **L1** 트랜잭션이고, `withdrawETH`/`withdrawToken`은 **L2** 트랜잭션입니다.

:::note L1 요구 사항
`depositETH`, `depositToken`, `getWithdrawalStatus`, `getTimeToProve`, `getTimeToFinalize`, `proveWithdrawal`, `finalizeWithdrawal`은 모두 `endpoints.l1RpcUrl` 설정(`client.hasL1Support()`)이 필요하며, 그렇지 않으면 `GiwaError`(`L1_RPC_NOT_CONFIGURED`)를 던집니다. 각 메서드는 자신이 호출하는 L1 브릿지 컨트랙트가 해당 네트워크에 배포되어 있어야 하며(`ZERO_ADDRESS`가 아니어야 함), 그렇지 않으면 `GiwaError`(`L1_BRIDGE_CONTRACTS_NOT_CONFIGURED`, 누락된 컨트랙트를 명시)를 던집니다 — GIWA 메인넷(아직 미출시)에서는 모든 L1 브릿지 컨트랙트가 `ZERO_ADDRESS`이므로 위 메서드가 모두 실패합니다. `withdrawETH`/`withdrawToken`은 L2 지갑 클라이언트만 필요하며 L1 설정 없이도 동작합니다.
:::

---

## FlashblocksManager

Flashblocks 관리

```tsx
import { FlashblocksManager } from 'giwa-react-native-wallet';

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

GIWA ID (`up.id`, Upbit Web3 Names) 관리 — 온체인 `UpnameRegistry`를 통한 읽기 전용 해석. 이름은 Upbit / GIWA 플레이그라운드를 통해 발행되며, 이 매니저를 통해서는 발행할 수 없습니다.

```tsx
import { GiwaIdManager } from 'giwa-react-native-wallet';

const giwaIdManager = new GiwaIdManager(client);
```

### Methods

```tsx
// Name -> Address
giwaIdManager.resolveAddress(name: string): Promise<Address | null>

// Address -> Name (역방향 조회)
giwaIdManager.resolveName(address: Address): Promise<string | null>

// 전체 GiwaId 정보 (tokenId, tokenUri, best-effort avatar)
giwaIdManager.getGiwaId(name: string): Promise<GiwaId | null>

// 이름 사용 가능 여부 확인 (isClaimable)
giwaIdManager.isAvailable(name: string): Promise<boolean>

// getGiwaId() 내부 캐시 초기화
giwaIdManager.clearCache(): void
```

`GiwaId` 형태와 `tokenId`/`avatar` 필드에 대한 자세한 설명은 [GIWA ID 가이드](/docs/guides/giwa-id)를 참고하세요.

---

## DojangManager

Dojang (EAS 기반 증명) 관리 — 읽기 전용입니다. 스키마/발급자 표와 발급자 기본값 동작 방식은 [Dojang 가이드](/docs/guides/dojang)를 참고하세요.

```tsx
import { DojangManager } from 'giwa-react-native-wallet';

const dojangManager = new DojangManager(client);
```

### Methods

```tsx
// 원시 EAS 조회
dojangManager.getAttestation(uid: Hex): Promise<Attestation | null>
dojangManager.isAttestationValid(uid: Hex): Promise<boolean>
dojangManager.getSchema(schemaUid: Hex): Promise<{ uid: Hex; schema: string; revocable: boolean } | null>

// Verified address (attesterId 생략 = 알려진 모든 발급자)
dojangManager.hasVerifiedAddress(address: Address, attesterId?: Hex): Promise<boolean>
dojangManager.getVerifiedAddressAttestationUid(address: Address, attesterId?: Hex): Promise<Hex | null>

// Verified balance (attesterId 생략 = DEFAULT_DOJANG_ATTESTER_ID)
dojangManager.getVerifiedBalance(
  recipient: Address,
  coinType: bigint,
  snapshotAt: bigint,
  attesterId?: Hex
): Promise<bigint | null>
dojangManager.getVerifiedBalanceAttestationUid(
  recipient: Address,
  coinType: bigint,
  snapshotAt: bigint,
  attesterId?: Hex
): Promise<Hex | null>
dojangManager.getBalanceRootAttestationUid(
  coinType: bigint,
  snapshotAt: bigint,
  attesterId?: Hex
): Promise<Hex | null>

// Verified code (attesterId 생략 = DEFAULT_DOJANG_ATTESTER_ID)
dojangManager.isVerifiedCode(codeHash: Hex, domain: string, attesterId?: Hex): Promise<boolean>
dojangManager.getVerifyCodeAttestationUid(codeHash: Hex, domain: string, attesterId?: Hex): Promise<Hex | null>

// 알려진 모든 스키마/발급자에 대해 주소의 전체 증명 조회
dojangManager.getAttestationsForAddress(address: Address): Promise<Attestation[]>

// 원본 증명 `data` 바이트를 스키마에 맞게 디코딩 ('unknown'이거나 디코딩 실패 시 null)
dojangManager.decodeAttestationData(
  attestation: Pick<Attestation, 'attestationType' | 'data'>
): DojangAttestationData | null
```

---

## AdapterFactory

어댑터 팩토리

```tsx
import { AdapterFactory, getAdapterFactory } from 'giwa-react-native-wallet';

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

`getContractAddresses(network)`(및 `CONTRACT_ADDRESSES[network]`)는 아래 모든 필드를 반환합니다. 아래 값은 현재 GIWA Sepolia(`testnet`) 주소이며, `GiwaConfig`의 `customContracts`를 통해 필드별로 오버라이드할 수 있습니다.

### Testnet (GIWA Sepolia) Addresses

| 필드 | 주소 | 설명 |
|------|------|------|
| `l1StandardBridge` | `0x77b2ffc0F57598cAe1DB76cb398059cF5d10A7E7` | L1 (Ethereum Sepolia) Standard Bridge |
| `l2StandardBridge` | `0x4200000000000000000000000000000000000010` | L2 Standard Bridge (OP Stack predeploy) |
| `optimismPortal` | `0x956962C34687A954e611A83619ABaA37Ce6bC78A` | L1 OptimismPortal |
| `l1CrossDomainMessenger` | `0x23ce19ED800fbbC964B9350b01B9113a8508D3F1` | L1 CrossDomainMessenger |
| `disputeGameFactory` | `0x37347caB2afaa49B776372279143D71ad1f354F6` | L1 DisputeGameFactory |
| `upnameRegistry` | `0x091D00004f21eb2Fc30964A8a4995692d9b49628` | GIWA ID (`up.id`) registry |
| `eas` | `0x4200000000000000000000000000000000000021` | Ethereum Attestation Service (Dojang) |
| `schemaRegistry` | `0x4200000000000000000000000000000000000020` | EAS Schema Registry |
| `dojangScroll` | `0xd5077b67dcb56caC8b270C7788FC3E6ee03F17B9` | Dojang verified-address/balance/code reads |
| `attestationIndexer` | `0x9C9Bf29880448aB39795a11b669e22A0f1d790ec` | Dojang attestation index (schema × attester → uid) |
| `schemaBook` | `0x78cBb3413FBb6aF05EF1D21e646440e56baE3AD6` | Dojang SchemaBook |
| `dojangAttesterBook` | `0xDA282E89244424E297Ce8e78089B54D043FB28B6` | Dojang AttesterBook |
| `weth` | `0x4200000000000000000000000000000000000006` | Wrapped ETH |
| `multicall3` | `0xcA11bde05977b3631167028862bE2a173976CA11` | Multicall3 |

`mainnet`에서는 `l2StandardBridge`, `eas`, `schemaRegistry`, `weth`만 설정되어 있습니다(OP Stack 표준 predeploy). 나머지 필드는 GIWA 메인넷이 출시되기 전까지 모두 `ZERO_ADDRESS`(TBD)입니다.

### ContractAddresses / CustomContracts Types

```tsx
interface ContractAddresses {
  // Bridge – L2 predeploys + L1 (Ethereum Sepolia) OP Stack contracts
  l1StandardBridge: Address;
  l2StandardBridge: Address;
  optimismPortal: Address;
  l1CrossDomainMessenger: Address;
  disputeGameFactory: Address;
  // GIWA ID (up.id) – L2 name registry
  upnameRegistry: Address;
  // EAS (Dojang)
  eas: Address;
  schemaRegistry: Address;
  dojangScroll: Address;
  attestationIndexer: Address;
  schemaBook: Address;
  dojangAttesterBook: Address;
  // Tokens
  weth: Address;
  // Utility
  multicall3: Address;
}

// ContractAddresses의 임의 부분집합을 오버라이드할 수 있습니다.
type CustomContracts = Partial<ContractAddresses>;
```

### Usage Example

```tsx
import { GiwaProvider } from 'giwa-react-native-wallet';

// Override specific contract addresses
<GiwaProvider
  config={{
    network: 'testnet',
    customContracts: {
      // Only override what you need
      eas: '0xYourCustomEASAddress',
      dojangScroll: '0xYourCustomDojangScroll',
    },
  }}
>
  <App />
</GiwaProvider>
```
