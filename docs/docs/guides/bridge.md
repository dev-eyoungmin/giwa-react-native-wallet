---
sidebar_position: 4
---

# L2→L1 Bridge

This guide explains how to withdraw assets from GIWA Chain (L2) to Ethereum mainnet (L1).

:::info L1→L2 Deposit
For deposits from Ethereum to GIWA Chain, use the official [GIWA Superbridge](https://superbridge.app).

See: [GIWA Bridge Documentation](https://docs.giwa.io/tools/bridges)
:::

:::caution Partial Feature
The SDK currently implements only L2→L1 **withdrawal initiation** — proving and finalizing a withdrawal on L1 are not implemented. `useNetworkInfo().getFeatureInfo('bridge')` reports `status: 'partial'` with a `reason` describing exactly this. Deposits (L1→L2) and the rest of the withdrawal flow go through [Superbridge](https://superbridge.app).
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

## useBridge Hook

```tsx
import { useBridge } from 'giwa-react-native-wallet';

function BridgeScreen() {
  const {
    withdrawETH,       // L2 → L1 ETH withdrawal
    withdrawToken,     // L2 → L1 token withdrawal
    getPendingTransactions,
    getTransaction,    // Track transaction by hash
    getEstimatedWithdrawalTime,
    isLoading,
    isInitializing,
    error,
  } = useBridge();

  // ...
}
```

## ETH Withdrawal

Transfer ETH from GIWA Chain to Ethereum mainnet:

```tsx
const handleWithdrawETH = async () => {
  try {
    const hash = await withdrawETH('0.1'); // 0.1 ETH

    console.log('L2 TX Hash:', hash);

    // Track transaction status
    const tx = getTransaction(hash);
    console.log('Status:', tx?.status);

    // Note: Full withdrawal takes ~7 days due to Challenge Period
  } catch (error) {
    console.error('Withdrawal failed:', error.message);
  }
};
```

### Withdraw to Different Address

```tsx
// Withdraw to a specific L1 address
const hash = await withdrawETH('0.1', '0x1234...abcd');
```

## Token Withdrawal

Transfer ERC-20 tokens from GIWA Chain to Ethereum mainnet:

```tsx
const handleWithdrawToken = async () => {
  const l2TokenAddress = '0x...'; // L2 token address
  const amount = 100000000000000000000n; // 100 tokens (in wei)

  try {
    const hash = await withdrawToken(l2TokenAddress, amount);

    console.log('L2 TX Hash:', hash);

    // Track transaction status
    const tx = getTransaction(hash);
    console.log('Status:', tx?.status);
  } catch (error) {
    console.error('Withdrawal failed:', error.message);
  }
};
```

## Challenge Period

:::warning 7-Day Waiting Period
L2 → L1 withdrawals require approximately **7 days** of Challenge Period for security reasons. During this period, validators verify the validity of the withdrawal request.

This is a security feature of the OP Stack architecture, not a limitation of this SDK.
:::

```tsx
// Get estimated withdrawal time in seconds
const time = getEstimatedWithdrawalTime();
console.log('Estimated time:', time / 86400, 'days'); // ~7 days
```

## Pending Transactions

Track pending bridge transactions:

```tsx
const pendingTxs = getPendingTransactions();

pendingTxs.forEach((tx) => {
  console.log('Hash:', tx.l2TxHash);
  console.log('Amount:', tx.amount);
  console.log('Status:', tx.status);
});
```

## Complete Example

```tsx
import { useState } from 'react';
import { View, Text, TextInput, Button, Alert, Linking } from 'react-native';
import { useBridge, useBalance } from 'giwa-react-native-wallet';

export function BridgeScreen() {
  const [amount, setAmount] = useState('');
  const {
    withdrawETH,
    getEstimatedWithdrawalTime,
    isLoading,
    isInitializing,
    error,
  } = useBridge();
  const { formattedBalance } = useBalance();

  const handleWithdraw = async () => {
    if (!amount) return;

    const days = Math.round(getEstimatedWithdrawalTime() / 86400);

    Alert.alert(
      'Confirm Withdrawal',
      `Withdraw ${amount} ETH to L1?\n\nThis will take approximately ${days} days.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const hash = await withdrawETH(amount);
              Alert.alert('Withdrawal Started', `TX: ${hash}`);
            } catch (error) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const openSuperbridge = () => {
    Linking.openURL('https://superbridge.app');
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

      {/* Deposit Link */}
      <Button
        title="Deposit (L1→L2) via Superbridge"
        onPress={openSuperbridge}
      />

      <Text style={{ marginTop: 20, marginBottom: 10 }}>
        Withdraw (L2→L1)
      </Text>
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

      <Text style={{ color: 'orange', marginBottom: 10, fontSize: 12 }}>
        Withdrawals take approximately 7 days
      </Text>

      <Button
        title={isLoading ? 'Processing...' : 'Withdraw'}
        onPress={handleWithdraw}
        disabled={isLoading || !amount}
      />
    </View>
  );
}
```

## Next Steps

- [Flashblocks](/docs/guides/flashblocks) - Fast transaction confirmation
- [Transactions](/docs/guides/transactions) - Basic transactions
