---
sidebar_position: 4
---

# L1↔L2 Bridge

This guide explains how to move ETH and ERC-20 tokens between Ethereum (L1) and GIWA Chain (L2): deposits (L1→L2), withdrawals (L2→L1), and the withdrawal's prove/finalize steps on L1.

:::caution GIWA Mainnet Not Launched
GIWA mainnet has not launched. Every L1 bridge contract address (`l1StandardBridge`, `optimismPortal`, `disputeGameFactory`) is `ZERO_ADDRESS` on `network: 'mainnet'`, so every bridge operation that touches L1 throws `L1_BRIDGE_CONTRACTS_NOT_CONFIGURED`. Bridge operations work on **GIWA Sepolia** (`network: 'testnet'`) only.
:::

## Contract Addresses (GIWA Sepolia)

| Contract | Address |
|----------|---------|
| L2StandardBridge | `0x4200000000000000000000000000000000000010` |
| L1StandardBridge | `0x77b2ffc0F57598cAe1DB76cb398059cF5d10A7E7` |
| OptimismPortal | `0x956962C34687A954e611A83619ABaA37Ce6bC78A` |
| L1CrossDomainMessenger | `0x23ce19ED800fbbC964B9350b01B9113a8508D3F1` |
| DisputeGameFactory | `0x37347caB2afaa49B776372279143D71ad1f354F6` |

L1 addresses are on Ethereum Sepolia; `L2StandardBridge` is the standard OP Stack L2 predeploy.

## L1 Configuration

Deposits, and every withdrawal step past initiation (`getWithdrawalStatus`, `getTimeToProve`, `getTimeToFinalize`, `proveWithdrawal`, `finalizeWithdrawal`), read from and write to Ethereum (L1). They require an L1 RPC endpoint:

```tsx
<GiwaProvider
  config={{
    network: 'testnet',
    endpoints: {
      l1RpcUrl: 'https://your-ethereum-sepolia-rpc.example.com',
    },
  }}
>
```

The SDK ships **no default** `l1RpcUrl` — pick your own Ethereum Sepolia RPC provider. Withdrawal *initiation* (`withdrawETH`/`withdrawToken`) is the one exception: it only touches the L2 (GIWA) wallet and works without `l1RpcUrl`.

`useBridge().isL1Configured` reports whether `l1RpcUrl` was set. Calling any L1-touching method without it throws a `GiwaError` with code `L1_RPC_NOT_CONFIGURED`. Calling one whose network's L1 bridge contracts are `ZERO_ADDRESS` (i.e. `network: 'mainnet'` today) throws `L1_BRIDGE_CONTRACTS_NOT_CONFIGURED` instead, even if `l1RpcUrl` is configured. See [Error Codes](/docs/api/utilities#error-codes) for the full list.

## useBridge Hook

```tsx
import { useBridge } from 'giwa-react-native-wallet';

function BridgeScreen() {
  const {
    depositETH,             // (amount: string, to?: Address) => Promise<Hash>
    depositToken,           // (l1TokenAddress: Address, l2TokenAddress: Address, amount: bigint, to?: Address) => Promise<Hash>
    withdrawETH,            // (amount: string, to?: Address) => Promise<Hash>
    withdrawToken,          // (l2TokenAddress: Address, amount: bigint, to?: Address) => Promise<Hash>
    getWithdrawalStatus,    // (l2TxHash: Hash) => Promise<WithdrawalStatus>
    getTimeToProve,         // (l2TxHash: Hash) => Promise<GetTimeToProveReturnType>
    getTimeToFinalize,      // (l2TxHash: Hash) => Promise<GetTimeToFinalizeReturnType>
    proveWithdrawal,        // (l2TxHash: Hash) => Promise<Hash>
    finalizeWithdrawal,     // (l2TxHash: Hash) => Promise<Hash>
    getPendingTransactions, // () => BridgeTransaction[]
    getTransaction,         // (hash: Hash) => BridgeTransaction | undefined
    getEstimatedWithdrawalTime, // () => number (seconds)
    isL1Configured,         // boolean - whether endpoints.l1RpcUrl is set
    isLoading,
    isInitializing,
    error,
  } = useBridge();

  // ...
}
```

## Deposit ETH (L1 → L2)

```tsx
const handleDepositETH = async () => {
  try {
    const hash = await depositETH('0.1'); // 0.1 ETH

    console.log('L1 TX Hash:', hash);

    const tx = getTransaction(hash);
    console.log('Status:', tx?.status); // 'pending' -> 'confirmed' | 'failed'
  } catch (error) {
    console.error('Deposit failed:', error.message);
  }
};
```

:::note L1 confirmation, not L2 arrival
The hash returned by `depositETH`/`depositToken` is the **L1** transaction hash, and `getTransaction(hash)` tracks its **L1** confirmation. Deposited funds are relayed to L2 asynchronously afterwards (usually within a couple of minutes) — there is no SDK method to await that L2-side relay.
:::

### Deposit to a Different L2 Address

```tsx
const hash = await depositETH('0.1', '0x1234...abcd');
```

## Deposit ERC-20 Tokens (L1 → L2)

```tsx
const handleDepositToken = async () => {
  const l1TokenAddress = '0x...'; // L1 token address
  const l2TokenAddress = '0x...'; // Corresponding L2 token address
  const amount = 100000000000000000000n; // 100 tokens (in token units)

  try {
    const hash = await depositToken(l1TokenAddress, l2TokenAddress, amount);
    console.log('L1 TX Hash:', hash);
  } catch (error) {
    console.error('Deposit failed:', error.message);
  }
};
```

`depositToken` reads the current `L1StandardBridge` allowance for `l1TokenAddress` first, and only sends (and waits for) an `approve` transaction if that allowance is insufficient, before calling `depositERC20To`.

## Withdraw ETH (L2 → L1)

```tsx
const handleWithdrawETH = async () => {
  try {
    const hash = await withdrawETH('0.1'); // 0.1 ETH

    console.log('L2 TX Hash:', hash);

    const tx = getTransaction(hash);
    console.log('Status:', tx?.status);
  } catch (error) {
    console.error('Withdrawal failed:', error.message);
  }
};
```

### Withdraw to a Different L1 Address

```tsx
const hash = await withdrawETH('0.1', '0x1234...abcd');
```

## Withdraw ERC-20 Tokens (L2 → L1)

```tsx
const handleWithdrawToken = async () => {
  const l2TokenAddress = '0x...'; // L2 token address
  const amount = 100000000000000000000n; // 100 tokens (in wei)

  try {
    const hash = await withdrawToken(l2TokenAddress, amount);

    console.log('L2 TX Hash:', hash);

    const tx = getTransaction(hash);
    console.log('Status:', tx?.status);
  } catch (error) {
    console.error('Withdrawal failed:', error.message);
  }
};
```

## Withdrawal Lifecycle: Status → Prove → Finalize

Once a withdrawal is initiated on L2, `getWithdrawalStatus(l2TxHash)` reports one of five states:

`'waiting-to-prove'` → `'ready-to-prove'` → `'waiting-to-finalize'` → `'ready-to-finalize'` → `'finalized'`

```tsx
const status = await getWithdrawalStatus(l2TxHash);
console.log(status); // e.g. 'ready-to-prove'
```

:::caution 7-Day Challenge Period
Between proving and finalizing, a withdrawal must sit through GIWA's **~7 day** challenge period. This is a security property of the OP Stack fault-proof system, not a limitation of this SDK. `getEstimatedWithdrawalTime()` returns this estimate in seconds.
:::

### Check timing before proving/finalizing

```tsx
// Non-blocking: how long until the withdrawal is provable
const { seconds: secondsToProve } = await getTimeToProve(l2TxHash);

// Non-blocking: how long, once proved, until it's finalizable (~7 days)
const { seconds: secondsToFinalize } = await getTimeToFinalize(l2TxHash);
```

### Prove the withdrawal

```tsx
// WARNING: blocks until the withdrawal is provable, which can take hours - it
// waits for the L2 output / dispute game covering the withdrawal's block to
// land on L1. Use getWithdrawalStatus()/getTimeToProve() first for a
// non-blocking readiness check.
const proveHash = await proveWithdrawal(l2TxHash);
console.log('L1 prove TX:', proveHash);
```

### Finalize the withdrawal

```tsx
// Does NOT wait for the challenge period - confirm readiness yourself first
// (e.g. getWithdrawalStatus(l2TxHash) === 'ready-to-finalize'). Calling this
// too early reverts on L1.
const finalizeHash = await finalizeWithdrawal(l2TxHash);
console.log('L1 finalize TX:', finalizeHash);
```

:::note Wrong hash
`getTimeToFinalize`, `proveWithdrawal`, and `finalizeWithdrawal` all read the withdrawal out of the L2 transaction's receipt. Passing an `l2TxHash` that never initiated a withdrawal (e.g. a plain transfer) throws a `GiwaTransactionError` (`NO_WITHDRAWAL_IN_RECEIPT`).
:::

## Pending Transactions

Track pending bridge transactions (deposits and withdrawals, keyed by the hash returned from the call that created them):

```tsx
const pendingTxs = getPendingTransactions();

pendingTxs.forEach((tx) => {
  console.log('Direction:', tx.direction);   // 'deposit' | 'withdraw'
  console.log('L1 Hash:', tx.l1TxHash);
  console.log('L2 Hash:', tx.l2TxHash);
  console.log('Amount:', tx.amount);
  console.log('Status:', tx.status);         // 'pending' | 'confirmed' | 'proved' | 'finalized' | 'failed'
});
```

## Complete Example

```tsx
import { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { useBridge, useBalance } from 'giwa-react-native-wallet';

export function BridgeScreen() {
  const [amount, setAmount] = useState('');
  const [withdrawalHash, setWithdrawalHash] = useState('');
  const {
    depositETH,
    withdrawETH,
    getWithdrawalStatus,
    proveWithdrawal,
    finalizeWithdrawal,
    getEstimatedWithdrawalTime,
    isL1Configured,
    isLoading,
    isInitializing,
    error,
  } = useBridge();
  const { formattedBalance } = useBalance();

  const handleDeposit = async () => {
    if (!amount) return;
    try {
      const hash = await depositETH(amount);
      Alert.alert('Deposit Started', `L1 TX: ${hash}`);
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  const handleWithdraw = async () => {
    if (!amount) return;

    const days = Math.round(getEstimatedWithdrawalTime() / 86400);

    Alert.alert(
      'Confirm Withdrawal',
      `Withdraw ${amount} ETH to L1?\n\nProving and finalizing require an additional ~${days} days after this step.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const hash = await withdrawETH(amount);
              setWithdrawalHash(hash);
              Alert.alert('Withdrawal Started', `L2 TX: ${hash}`);
            } catch (err) {
              Alert.alert('Error', err.message);
            }
          },
        },
      ]
    );
  };

  const handleProveAndFinalize = async () => {
    if (!withdrawalHash) return;
    try {
      const status = await getWithdrawalStatus(withdrawalHash);

      if (status === 'ready-to-prove') {
        const proveHash = await proveWithdrawal(withdrawalHash); // may take hours
        Alert.alert('Proved', `L1 TX: ${proveHash}`);
      } else if (status === 'ready-to-finalize') {
        const finalizeHash = await finalizeWithdrawal(withdrawalHash);
        Alert.alert('Finalized', `L1 TX: ${finalizeHash}`);
      } else {
        Alert.alert('Not ready yet', `Status: ${status}`);
      }
    } catch (err) {
      Alert.alert('Error', err.message);
    }
  };

  if (isInitializing) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Bridge</Text>

      {error && (
        <Text style={{ color: 'red', marginBottom: 10 }}>{error.message}</Text>
      )}

      {!isL1Configured && (
        <Text style={{ color: 'orange', marginBottom: 10 }}>
          Set endpoints.l1RpcUrl on GiwaProvider to enable deposits, proving and finalizing.
        </Text>
      )}

      <Text style={{ color: '#666', marginBottom: 10 }}>
        Balance: {formattedBalance} ETH
      </Text>

      <TextInput
        placeholder="Amount (ETH)"
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        style={{
          borderWidth: 1,
          borderColor: '#ccc',
          padding: 12,
          marginBottom: 10,
          borderRadius: 8,
        }}
      />

      <Button
        title={isLoading ? 'Processing...' : 'Deposit (L1 → L2)'}
        onPress={handleDeposit}
        disabled={isLoading || !amount || !isL1Configured}
      />

      <View style={{ marginTop: 10 }}>
        <Button
          title={isLoading ? 'Processing...' : 'Withdraw (L2 → L1)'}
          onPress={handleWithdraw}
          disabled={isLoading || !amount}
        />
      </View>

      {withdrawalHash !== '' && (
        <View style={{ marginTop: 10 }}>
          <Button
            title="Check / Prove / Finalize Withdrawal"
            onPress={handleProveAndFinalize}
            disabled={isLoading || !isL1Configured}
          />
        </View>
      )}
    </View>
  );
}
```

## Live Verification Coverage

`pnpm verify:live` exercises `GiwaClient`'s read paths against live GIWA Sepolia — chain id, feature availability, contract addresses, and the op-stack chain wiring (`sourceId`, L1 contract map, `hasL1Support()`). It does **not** call `depositETH`, `depositToken`, `proveWithdrawal`, or `finalizeWithdrawal` — those require funded L1 and L2 accounts and are exercised manually instead.

## Next Steps

- [Flashblocks](/docs/guides/flashblocks) - Fast transaction confirmation
- [Transactions](/docs/guides/transactions) - Basic transactions
