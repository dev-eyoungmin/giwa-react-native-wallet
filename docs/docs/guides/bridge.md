---
sidebar_position: 4
---

# L2→L1 Bridge

This guide explains how to withdraw assets from GIWA Chain (L2) to Ethereum mainnet (L1).

:::info L1→L2 Deposit
For deposits from Ethereum to GIWA Chain, use the official [GIWA Superbridge](https://superbridge.app).

See: [GIWA Bridge Documentation](https://docs.giwa.io/tools/bridges)
:::

## useBridge Hook

```tsx
import { useBridge } from '@giwa/react-native-wallet';

function BridgeScreen() {
  const {
    withdrawETH,       // L2 → L1 ETH withdrawal
    withdrawToken,     // L2 → L1 token withdrawal
    getPendingTransactions,
    getEstimatedWithdrawalTime,
    isLoading,
  } = useBridge();

  // ...
}
```

## ETH Withdrawal

Transfer ETH from GIWA Chain to Ethereum mainnet:

```tsx
const handleWithdrawETH = async () => {
  try {
    const { hash, wait } = await withdrawETH('0.1'); // 0.1 ETH

    console.log('L2 TX Hash:', hash);

    // Wait for confirmation
    const receipt = await wait();
    console.log('Confirmed in block:', receipt.blockNumber);

    // Note: Full withdrawal takes ~7 days due to Challenge Period
  } catch (error) {
    console.error('Withdrawal failed:', error.message);
  }
};
```

### Withdraw to Different Address

```tsx
// Withdraw to a specific L1 address
const { hash } = await withdrawETH('0.1', '0x1234...abcd');
```

## Token Withdrawal

Transfer ERC-20 tokens from GIWA Chain to Ethereum mainnet:

```tsx
const handleWithdrawToken = async () => {
  const l2TokenAddress = '0x...'; // L2 token address
  const amount = 100000000000000000000n; // 100 tokens (in wei)

  try {
    const { hash, wait } = await withdrawToken(l2TokenAddress, amount);

    console.log('L2 TX Hash:', hash);

    const receipt = await wait();
    console.log('Confirmed:', receipt.status);
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
import { useBridge, useBalance } from '@giwa/react-native-wallet';

export function BridgeScreen() {
  const [amount, setAmount] = useState('');
  const { withdrawETH, getEstimatedWithdrawalTime, isLoading } = useBridge();
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
              const { hash } = await withdrawETH(amount);
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

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Bridge</Text>

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
        ⚠️ Withdrawals take approximately 7 days
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
