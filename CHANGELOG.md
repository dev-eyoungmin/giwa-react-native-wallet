# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2026-08-29

### Added

- ETH and ERC-20 deposits (`BridgeManager.depositETH`/`depositToken`, `useBridge().depositETH`/`depositToken`), submitted via viem op-stack's `depositTransaction` against the `OptimismPortal`
- Withdrawal status and time queries (`getWithdrawalStatus`, `getTimeToProve`, `getTimeToFinalize`) and prove/finalize (`proveWithdrawal`, `finalizeWithdrawal`) on `BridgeManager`/`useBridge`, via viem op-stack's `getWithdrawalStatus`/`getTimeToProve`/`getTimeToFinalize`/`waitToProve`/`proveWithdrawal`/`finalizeWithdrawal`
- L1 (Ethereum) client support: `GiwaConfig.endpoints.l1RpcUrl`, `GiwaNetwork.l1ChainId`, and `GiwaClient.hasL1Support()`/`getL1Chain()`/`getL1PublicClient()`/`getL1WalletClient()`/`getL1RpcUrl()`
- `useBridge().isL1Configured`
- `L1_RPC_NOT_CONFIGURED` and `L1_BRIDGE_CONTRACTS_NOT_CONFIGURED` error codes

### Changed

- `getFeatureAvailability('bridge')` (and `useNetworkInfo().getFeatureInfo('bridge')`) now reports `status: 'available'` on testnet (was `'partial'`)
- The GIWA viem chain now carries op-stack `chainConfig`, `sourceId` (the L1 chain id), and the L1 bridge contract addresses (`portal`, `disputeGameFactory`, `l1StandardBridge`), keyed by L1 chain id
- `BridgeTransaction` adds `direction: 'deposit'`, `l1TxHash`, and `status: 'proved' | 'finalized'`

Deposits, and every withdrawal step past initiation, require `config.endpoints.l1RpcUrl` — the SDK ships no default L1 endpoint on purpose. Withdrawal initiation (`withdrawETH`/`withdrawToken`) works without it. See the [Bridge guide](https://dev-eyoungmin.github.io/giwa-react-native-wallet/docs/guides/bridge).

## [0.2.0] - 2026-08-29

### Breaking

- `giwa.id` → `up.id`: GIWA ID names now resolve as `alice.up.id` (was `alice.giwa.id`)
- `GiwaIdManager.getTextRecord`/`setTextRecord` (and the `useGiwaId` equivalents) removed — `up.id` has no ENS-style text records
- `ContractAddresses.ensRegistry`/`ensResolver` removed
- `DojangManager.getVerifiedBalance(uid)` replaced by `getVerifiedBalance(recipient, coinType, snapshotAt, attesterId?)`
- `AttestationType` adds `'unknown'` (for attestations whose schema UID isn't one of the four known Dojang schemas)
- `GiwaId` shape changed: adds `tokenId`/`tokenUri`, removes `records`
- `getFeatureAvailability('bridge')` (and `useNetworkInfo().getFeatureInfo('bridge')`) now reports `status: 'partial'` on testnet, with a `reason` explaining that only L2→L1 withdrawal initiation is implemented

### Added

- Real Dojang schema UIDs, attesters (`DOJANG_ATTESTERS`, `getDojangAttesters`), and contract addresses (DojangScroll, AttestationIndexer, SchemaBook, DojangAttesterBook)
- `DojangManager.getAttestationsForAddress` — reads all known schemas/attesters for an address via `AttestationIndexer` + EAS, batched with multicall
- `UpnameRegistry` resolution: forward (`resolveAddress`), reverse (`resolveName`), availability (`isAvailable`)
- L1 Sepolia bridge/portal/messenger/dispute-game addresses (`l1StandardBridge`, `optimismPortal`, `l1CrossDomainMessenger`, `disputeGameFactory`)
- `GiwaConfig.customNetwork` to override the built-in network definition (chain id, name, URLs)
- `GiwaClient.getNetworkConfig()` and `GiwaClient.verifyChainId()`
- `DOJANG_ATTESTERS`, `getDojangAttesters`, `DEFAULT_DOJANG_ATTESTER_ID`, `ZERO_ADDRESS`
- `pnpm verify:live` — live verification script against GIWA Sepolia (`scripts/verify-live.ts`)

### Fixed

- `GiwaProvider` re-initializing the client on every parent render (stale `onError` dependency, stale memo dependencies)
- Chain definition now follows overridden `endpoints` instead of the network defaults
- Unknown attestation schemas are no longer misreported as `verified_address`

## [0.1.1] - 2025-01-18

### Changed

- Added feature availability status to documentation (Available / Coming Soon)
- Marked L1 Bridge and GIWA ID as "Coming Soon" due to pending contract deployment
- Added GIWA official documentation links for features under development

### Added

- Added sample app GitHub link (giwa-react-native-samples)
- Synchronized Korean documentation

## [0.1.0] - 2025-01-06

### Added

- Initial release
- Wallet creation and recovery (mnemonic/private key)
- ETH and ERC-20 token transfers
- L1↔L2 Bridge operations
- Flashblocks support (~200ms preconfirmation)
- GIWA ID (ENS-based naming) support
- Dojang (EAS-based attestation) support
- Secure storage adapters (Expo/React Native CLI)
- Biometric authentication support
- React hooks for all features
- GiwaProvider context
- TypeScript support
