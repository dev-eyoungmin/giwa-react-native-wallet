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

L2→L1 Bridge Withdrawal Hook

:::info L1→L2 Deposit
For deposits (L1→L2), use the official [GIWA Superbridge](https://superbridge.app). This SDK only supports L2→L1 withdrawals.

See: [GIWA Bridge Documentation](https://docs.giwa.io/tools/bridges)
:::

```tsx
import { useBridge } from '@giwa/react-native-wallet';

const {
  withdrawETH,       // (amount: string, to?: Address) => Promise<Hash>
  withdrawToken,     // (l2TokenAddress: Address, amount: bigint, to?: Address) => Promise<Hash>
  getPendingTransactions, // () => BridgeTransaction[]
  getTransaction,    // (hash: Hash) => BridgeTransaction | undefined
  getEstimatedWithdrawalTime, // () => number (seconds)
  isLoading,         // boolean
  isInitializing,    // boolean
  error,             // Error | null
} = useBridge();
```

### Types

```tsx
type Hash = `0x${string}`;

interface BridgeTransaction {
  direction: 'withdraw';
  amount: bigint;
  token?: Address;
  l2TxHash: string;
  status: 'pending' | 'confirmed';
}
```

### Usage Example

```tsx
// Withdraw 0.1 ETH to L1
const hash = await withdrawETH('0.1');
console.log('L2 TX Hash:', hash);

// Track transaction status
const tx = getTransaction(hash);
console.log('Status:', tx?.status);

// Estimated withdrawal time (~7 days for OP Stack)
const time = getEstimatedWithdrawalTime(); // 604800 seconds
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

GIWA ID (ENS-based Naming) Hook

:::info Registration
GIWA ID (up.id) registration is only available through Upbit's Verified Address service. This SDK provides name resolution and text record management.

See: [GIWA ID Documentation](https://docs.giwa.io/giwa-ecosystem/giwa-id)
:::

```tsx
import { useGiwaId } from '@giwa/react-native-wallet';

const {
  resolveAddress,    // (giwaId: string) => Promise<Address | null>
  resolveName,       // (address: Address) => Promise<string | null>
  getGiwaId,         // (giwaId: string) => Promise<GiwaId | null>
  getTextRecord,     // (giwaId: string, key: string) => Promise<string | null>
  setTextRecord,     // (giwaId: string, key: string, value: string) => Promise<Hash>
  isAvailable,       // (giwaId: string) => Promise<boolean>
  isLoading,         // boolean
  isInitializing,    // boolean
  error,             // Error | null
} = useGiwaId();
```

### Types

```tsx
interface GiwaId {
  name: string;      // e.g., "alice.giwa.id"
  address: Address;
  avatar?: string;
}
```

### Usage Example

```tsx
// Resolve name to address
const address = await resolveAddress('alice'); // or 'alice.giwa.id'

// Reverse resolve address to name
const name = await resolveName('0x1234...');

// Get avatar
const avatar = await getTextRecord('alice', 'avatar');

// Set text record (requires ownership)
const hash = await setTextRecord('alice', 'description', 'My profile');
```

---

## useDojang

Dojang (EAS Attestation) Hook

:::info Attestation Creation
Attestations can only be created by official issuers (e.g., Upbit Korea). This SDK provides read-only access for verifying attestations.

See: [Dojang Documentation](https://docs.giwa.io/giwa-ecosystem/dojang)
:::

```tsx
import { useDojang } from '@giwa/react-native-wallet';

const {
  getAttestation,       // (uid: Hex) => Promise<Attestation | null>
  isAttestationValid,   // (uid: Hex) => Promise<boolean>
  hasVerifiedAddress,   // (address: Address) => Promise<boolean>
  getVerifiedBalance,   // (uid: Hex) => Promise<VerifiedBalance | null>
  isLoading,            // boolean
  isInitializing,       // boolean
  error,                // Error | null
} = useDojang();
```

### Attestation Types

| Type | Description |
|------|-------------|
| `verified_address` | KYC-verified wallet address |
| `balance_root` | Merkle tree summary of balances |
| `verified_balance` | Balance attestation at specific time |
| `verified_code` | On-chain verification of off-chain codes |

### Types

```tsx
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

interface VerifiedBalance {
  balance: bigint;
  timestamp: bigint;
}

type AttestationType = 'verified_address' | 'balance_root' | 'verified_balance' | 'verified_code';
```

### Usage Example

```tsx
// Check if attestation is valid
const isValid = await isAttestationValid('0x1234...');

// Get attestation details
const attestation = await getAttestation('0x1234...');
if (attestation && !attestation.revoked) {
  console.log('Attester:', attestation.attester);
}

// Check if address has verified attestation
const hasVerified = await hasVerifiedAddress('0xabcd...');
console.log('Is verified:', hasVerified);
```

---

## useFaucet

Testnet Faucet Hook

:::tip Testnet Only
The faucet is only available on testnet. It opens the official GIWA faucet website in the browser.

See: [GIWA Faucet](https://faucet.giwa.io)
:::

```tsx
import { useFaucet } from '@giwa/react-native-wallet';

const {
  requestFaucet,    // (address?: Address) => Promise<void>
  getFaucetUrl,     // () => string
  isInitializing,   // boolean
  isLoading,        // boolean
  error,            // Error | null
} = useFaucet();
```

### Usage Example

```tsx
function FaucetButton() {
  const { requestFaucet, isLoading } = useFaucet();

  return (
    <Button
      title="Get Testnet ETH"
      onPress={() => requestFaucet()}
      disabled={isLoading}
    />
  );
}
```

:::note
`requestFaucet()` opens the faucet website in the device's browser. The user must complete the faucet request on the website.
:::

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

## useBiometricAuth

Biometric authentication Hook

```tsx
import { useBiometricAuth } from '@giwa/react-native-wallet';

const {
  isAvailable,       // boolean - Whether biometric hardware is available
  isEnrolled,        // boolean - Whether biometrics are enrolled
  biometricType,     // BiometricType - 'fingerprint' | 'face' | 'iris' | 'none'
  capability,        // BiometricCapability | null
  isLoading,         // boolean
  error,             // Error | null
  authenticate,      // (promptMessage?: string) => Promise<boolean>
  refreshCapability, // () => Promise<void>
} = useBiometricAuth(options?: UseBiometricAuthOptions);
```

### Options

```tsx
interface UseBiometricAuthOptions {
  /** Default prompt message for authentication */
  defaultPromptMessage?: string;
}
```

### Types

```tsx
type BiometricType = 'fingerprint' | 'face' | 'iris' | 'none';

interface BiometricCapability {
  isAvailable: boolean;
  biometricType: BiometricType;
  isEnrolled: boolean;
}
```

### Usage Example

```tsx
import { useBiometricAuth } from '@giwa/react-native-wallet';
import { Alert, Button, View, Text } from 'react-native';

function SecureActionScreen() {
  const {
    isAvailable,
    isEnrolled,
    biometricType,
    authenticate,
    isLoading,
  } = useBiometricAuth({
    defaultPromptMessage: 'Authenticate to continue',
  });

  const handleSecureAction = async () => {
    if (!isAvailable) {
      Alert.alert('Error', 'Biometric authentication not available');
      return;
    }

    if (!isEnrolled) {
      Alert.alert('Error', 'No biometrics enrolled on device');
      return;
    }

    try {
      const success = await authenticate('Confirm your identity');
      if (success) {
        Alert.alert('Success', 'Authentication successful!');
        // Perform secure action
      }
    } catch (error) {
      Alert.alert('Failed', 'Authentication failed');
    }
  };

  if (isLoading) {
    return <Text>Checking biometric capability...</Text>;
  }

  return (
    <View>
      <Text>Biometric Type: {biometricType}</Text>
      <Text>Available: {isAvailable ? 'Yes' : 'No'}</Text>
      <Text>Enrolled: {isEnrolled ? 'Yes' : 'No'}</Text>
      <Button
        title={`Authenticate with ${biometricType}`}
        onPress={handleSecureAction}
        disabled={!isAvailable || !isEnrolled}
      />
    </View>
  );
}
```

### Biometric Types by Platform

| Platform | Types |
|----------|-------|
| iOS | Face ID, Touch ID |
| Android | Fingerprint, Face, Iris |

:::tip Auto-authentication
The SDK automatically requests biometric authentication for sensitive operations like `exportMnemonic` and `exportPrivateKey` when `requireBiometric: true` is set.
:::

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
