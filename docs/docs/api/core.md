---
sidebar_position: 3
---

# Core API

API reference for the GIWA SDK Core modules. These modules can be used directly outside of Hooks.

## GiwaClient

viem-based blockchain client

```tsx
import { GiwaClient } from 'giwa-react-native-wallet';

const client = new GiwaClient({
  network: 'testnet',
  endpoints: {
    rpcUrl: 'https://...', // Custom RPC URL
    flashblocksRpcUrl: 'https://...', // Custom Flashblocks RPC
    flashblocksWsUrl: 'wss://...', // Custom Flashblocks WebSocket
    explorerUrl: 'https://...', // Custom Explorer URL
    l1RpcUrl: 'https://...', // L1 (Ethereum) RPC URL - required for bridge deposits, proving and finalizing. No default is shipped.
  },
  customContracts: {
    eas: '0x...', // Override EAS address
    schemaRegistry: '0x...', // Override Schema Registry
    dojangScroll: '0x...', // Override DojangScroll
    l2StandardBridge: '0x...', // Override L2 Bridge
  },
  // Override the built-in network definition (chain id, name, URLs) itself.
  // Use with `endpoints`/`customContracts` when targeting a non-default chain.
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

// Whether L1 (Ethereum) support is configured (endpoints.l1RpcUrl)
client.hasL1Support(): boolean

// L1 (Ethereum) chain definition, or null if the L1 chain id is unknown to the SDK
client.getL1Chain(): Chain | null

// L1 public client for read operations, or null if l1RpcUrl was not configured
client.getL1PublicClient(): GiwaL1PublicClient | null

// L1 wallet client for write operations, or null if no account is set or l1RpcUrl was not configured
client.getL1WalletClient(): GiwaL1WalletClient | null

// Configured L1 RPC URL, or undefined if not set
client.getL1RpcUrl(): string | undefined

// Feature availability
client.isFeatureAvailable(feature: FeatureName): boolean
client.getFeatureInfo(feature: FeatureName): FeatureAvailability
client.getNetworkStatus(): NetworkStatus
```

`GiwaProvider` calls `verifyChainId()` once on initialization (fire-and-forget) and logs a console warning if the RPC's chain id doesn't match the configured one.

---

## WalletManager

Wallet creation and management

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

ERC-20 token management

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

L1↔L2 bridge management: ETH/ERC-20 deposits, withdrawals, and the withdrawal prove/finalize flow (viem op-stack actions under the hood). See the [Bridge guide](/docs/guides/bridge) for the full lifecycle and `endpoints.l1RpcUrl` setup.

```tsx
import { BridgeManager } from 'giwa-react-native-wallet';

const bridgeManager = new BridgeManager(client); // GiwaClient
```

### Methods

```tsx
// L1 -> L2 ETH deposit. Returns the L1 tx hash; wait() resolves once the L1 tx confirms
// (not once funds land on L2). Requires client.hasL1Support().
bridgeManager.depositETH(amount: string, to?: Address): Promise<TransactionResult>

// L1 -> L2 ERC-20 deposit. Auto-approves the L1StandardBridge allowance if insufficient.
bridgeManager.depositToken(
  l1TokenAddress: Address,
  l2TokenAddress: Address,
  amount: bigint,
  to?: Address
): Promise<TransactionResult>

// L2 -> L1 ETH withdrawal (initiation only). Works without an L1 client.
bridgeManager.withdrawETH(amount: string, to?: Address): Promise<TransactionResult>

// L2 -> L1 ERC-20 withdrawal (initiation only). Works without an L1 client.
bridgeManager.withdrawToken(
  l2TokenAddress: Address,
  amount: bigint,
  to?: Address
): Promise<TransactionResult>

// Current status of a withdrawal. Requires client.hasL1Support().
bridgeManager.getWithdrawalStatus(l2TxHash: Hash): Promise<WithdrawalStatus>

// Non-blocking: time until the withdrawal is provable.
bridgeManager.getTimeToProve(l2TxHash: Hash): Promise<GetTimeToProveReturnType>

// Non-blocking: time until a proved withdrawal is finalizable.
bridgeManager.getTimeToFinalize(l2TxHash: Hash): Promise<GetTimeToFinalizeReturnType>

// Prove a withdrawal on L1. BLOCKS until provable (can take hours) - waits for
// the L2 output/dispute game covering the withdrawal's block to land on L1.
bridgeManager.proveWithdrawal(l2TxHash: Hash): Promise<TransactionResult>

// Finalize a proved withdrawal on L1, releasing the funds. Does NOT wait for
// the ~7-day challenge period - callers must confirm readiness first.
bridgeManager.finalizeWithdrawal(l2TxHash: Hash): Promise<TransactionResult>

// Locally tracked deposits/withdrawals (in-memory, per BridgeManager instance)
bridgeManager.getPendingTransactions(): BridgeTransaction[]
bridgeManager.getTransaction(hash: Hash): BridgeTransaction | undefined
bridgeManager.clearPendingTransactions(): void

// Challenge period estimate in seconds (fixed: 7 * 24 * 60 * 60)
bridgeManager.getEstimatedWithdrawalTime(): number
```

`TransactionResult` is `{ hash: Hash; wait: () => Promise<TransactionReceipt> }`. For `depositETH`/`depositToken`/`proveWithdrawal`/`finalizeWithdrawal`, `hash` and the receipt `wait()` resolves are **L1** transactions; for `withdrawETH`/`withdrawToken` they are **L2**.

:::note L1 requirements
`depositETH`, `depositToken`, `getWithdrawalStatus`, `getTimeToProve`, `getTimeToFinalize`, `proveWithdrawal`, and `finalizeWithdrawal` all require `endpoints.l1RpcUrl` to be configured (`client.hasL1Support()`), and throw `GiwaError` (`L1_RPC_NOT_CONFIGURED`) otherwise. Each of these also requires the specific L1 bridge contracts it calls to be deployed (not `ZERO_ADDRESS`) on the selected network, throwing `GiwaError` (`L1_BRIDGE_CONTRACTS_NOT_CONFIGURED`, naming the missing contract(s)) otherwise — on GIWA mainnet (not launched), every L1 bridge contract is `ZERO_ADDRESS`, so all of these throw. `withdrawETH`/`withdrawToken` need only the L2 wallet client and work without any L1 configuration.
:::

---

## FlashblocksManager

Flashblocks management

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

GIWA ID (`up.id`, Upbit Web3 Names) management — read-only resolution via the on-chain `UpnameRegistry`. Names are minted through Upbit / the GIWA playground, not through this manager.

```tsx
import { GiwaIdManager } from 'giwa-react-native-wallet';

const giwaIdManager = new GiwaIdManager(client);
```

### Methods

```tsx
// Name -> Address
giwaIdManager.resolveAddress(name: string): Promise<Address | null>

// Address -> Name (reverse lookup)
giwaIdManager.resolveName(address: Address): Promise<string | null>

// Full GiwaId info (tokenId, tokenUri, best-effort avatar)
giwaIdManager.getGiwaId(name: string): Promise<GiwaId | null>

// Check name availability (isClaimable)
giwaIdManager.isAvailable(name: string): Promise<boolean>

// Clear the internal getGiwaId() cache
giwaIdManager.clearCache(): void
```

See the [GIWA ID guide](/docs/guides/giwa-id) for the `GiwaId` shape and details on the `tokenId`/`avatar` fields.

---

## DojangManager

Dojang (EAS-based attestation) management — read-only. See the [Dojang guide](/docs/guides/dojang) for the schema/attester tables and attester-default semantics.

```tsx
import { DojangManager } from 'giwa-react-native-wallet';

const dojangManager = new DojangManager(client);
```

### Methods

```tsx
// Raw EAS reads
dojangManager.getAttestation(uid: Hex): Promise<Attestation | null>
dojangManager.isAttestationValid(uid: Hex): Promise<boolean>
dojangManager.getSchema(schemaUid: Hex): Promise<{ uid: Hex; schema: string; revocable: boolean } | null>

// Verified address (attesterId omitted = any known attester)
dojangManager.hasVerifiedAddress(address: Address, attesterId?: Hex): Promise<boolean>
dojangManager.getVerifiedAddressAttestationUid(address: Address, attesterId?: Hex): Promise<Hex | null>

// Verified balance (attesterId omitted = DEFAULT_DOJANG_ATTESTER_ID)
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

// Verified code (attesterId omitted = DEFAULT_DOJANG_ATTESTER_ID)
dojangManager.isVerifiedCode(codeHash: Hex, domain: string, attesterId?: Hex): Promise<boolean>
dojangManager.getVerifyCodeAttestationUid(codeHash: Hex, domain: string, attesterId?: Hex): Promise<Hex | null>

// All attestations for an address, across every known schema/attester
dojangManager.getAttestationsForAddress(address: Address): Promise<Attestation[]>

// Decode raw attestation `data` bytes for its schema (null for 'unknown' or on decode failure)
dojangManager.decodeAttestationData(
  attestation: Pick<Attestation, 'attestationType' | 'data'>
): DojangAttestationData | null
```

---

## AdapterFactory

Adapter factory

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

`getContractAddresses(network)` (and `CONTRACT_ADDRESSES[network]`) returns every field below. These are the current GIWA Sepolia (`testnet`) addresses; overridable per-field via `customContracts` in `GiwaConfig`.

### Testnet (GIWA Sepolia) Addresses

| Field | Address | Description |
|-------|---------|-------------|
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

On `mainnet`, only `l2StandardBridge`, `eas`, `schemaRegistry`, and `weth` are set (the OP Stack standard predeploys); every other field is `ZERO_ADDRESS` (TBD) until GIWA mainnet launches.

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

// Any subset of ContractAddresses fields may be overridden.
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
