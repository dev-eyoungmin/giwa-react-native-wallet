---
sidebar_position: 4
---

# L1↔L2 Bridge

This guide explains how to transfer assets between Ethereum mainnet (L1) and GIWA Chain (L2).

## useBridge Hook

```tsx
import { useBridge } from '@giwa/react-native-wallet';

function BridgeScreen() {
  const {
    deposit,           // L1 → L2 deposit
    withdraw,          // L2 → L1 withdrawal
    getDepositStatus,  // Get deposit status
    getWithdrawStatus, // Get withdrawal status
    estimateFees,      // Estimate fees
    isLoading,
  } = useBridge();

  // ...
}
```

## L1 → L2 Deposit

Transfer assets from Ethereum mainnet to GIWA Chain:

```tsx
const handleDeposit = async () => {
  try {
    const result = await deposit({
      amount: '0.1',     // ETH unit
      token: 'ETH',      // Or token address
    });

    console.log('L1 TX:', result.l1TxHash);
    console.log('Estimated completion time:', result.estimatedTime);

    // Deposits take approximately 10-15 minutes
  } catch (error) {
    console.error('Deposit failed:', error.message);
  }
};
```

## L2 → L1 Withdrawal

Transfer assets from GIWA Chain to Ethereum mainnet:

```tsx
const handleWithdraw = async () => {
  try {
    const result = await withdraw({
      amount: '0.1',
      token: 'ETH',
    });

    console.log('L2 TX:', result.l2TxHash);
    console.log('Estimated completion time:', result.estimatedTime);

    // Withdrawals take approximately 7 days due to Challenge Period
  } catch (error) {
    console.error('Withdrawal failed:', error.message);
  }
};
```

:::info Challenge Period
L2 → L1 withdrawals require approximately 7 days of Challenge Period for security reasons. During this period, validators verify the validity of the withdrawal request.
:::

## Fee Estimation

```tsx
const checkFees = async () => {
  const fees = await estimateFees({
    direction: 'deposit', // 'deposit' | 'withdraw'
    amount: '0.1',
    token: 'ETH',
  });

  console.log('L1 gas fee:', fees.l1GasFee);
  console.log('L2 gas fee:', fees.l2GasFee);
  console.log('Total estimated fee:', fees.totalFee);
};
```

## Status Check

### Deposit Status

```tsx
const checkDepositStatus = async (l1TxHash: string) => {
  const status = await getDepositStatus(l1TxHash);

  switch (status.state) {
    case 'pending':
      console.log('Processing on L1...');
      break;
    case 'l1_confirmed':
      console.log('L1 confirmed, waiting for L2...');
      break;
    case 'completed':
      console.log('Complete! L2 TX:', status.l2TxHash);
      break;
    case 'failed':
      console.log('Failed:', status.error);
      break;
  }
};
```

### Withdrawal Status

```tsx
const checkWithdrawStatus = async (l2TxHash: string) => {
  const status = await getWithdrawStatus(l2TxHash);

  switch (status.state) {
    case 'pending':
      console.log('Processing on L2...');
      break;
    case 'waiting_for_proof':
      console.log('Waiting for proof...');
      break;
    case 'ready_to_prove':
      console.log('Ready to prove');
      break;
    case 'in_challenge':
      console.log('In Challenge period...', status.remainingTime);
      break;
    case 'ready_to_finalize':
      console.log('Ready to finalize');
      break;
    case 'completed':
      console.log('Complete! L1 TX:', status.l1TxHash);
      break;
  }
};
```

## ERC-20 Token Bridge

```tsx
// L1 → L2 token deposit
const depositToken = async () => {
  const tokenAddress = '0x...'; // L1 token address

  // First, approve tokens to bridge contract
  await approveToken(tokenAddress, BRIDGE_ADDRESS, '100');

  const result = await deposit({
    amount: '100',
    token: tokenAddress,
  });
};

// L2 → L1 token withdrawal
const withdrawToken = async () => {
  const l2TokenAddress = '0x...'; // L2 token address

  const result = await withdraw({
    amount: '100',
    token: l2TokenAddress,
  });
};
```

## Complete Example: Bridge Screen

```tsx
import { useState } from 'react';
import { View, Text, TextInput, Button, Alert, SegmentedButtons } from 'react-native';
import { useBridge, useBalance } from '@giwa/react-native-wallet';

export function BridgeScreen() {
  const [direction, setDirection] = useState<'deposit' | 'withdraw'>('deposit');
  const [amount, setAmount] = useState('');

  const { deposit, withdraw, estimateFees, isLoading } = useBridge();
  const { formattedBalance: l2Balance } = useBalance();

  const handleBridge = async () => {
    if (!amount) return;

    try {
      // Check fees
      const fees = await estimateFees({ direction, amount, token: 'ETH' });

      Alert.alert(
        'Fee Confirmation',
        `Estimated fee: ${fees.totalFee} ETH\nDo you want to proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Confirm',
            onPress: async () => {
              if (direction === 'deposit') {
                const result = await deposit({ amount, token: 'ETH' });
                Alert.alert('Deposit Started', `TX: ${result.l1TxHash}`);
              } else {
                const result = await withdraw({ amount, token: 'ETH' });
                Alert.alert(
                  'Withdrawal Started',
                  `TX: ${result.l2TxHash}\n\nWithdrawals take approximately 7 days.`
                );
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>Bridge</Text>

      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        <Button
          title="Deposit (L1→L2)"
          onPress={() => setDirection('deposit')}
          color={direction === 'deposit' ? 'blue' : 'gray'}
        />
        <Button
          title="Withdraw (L2→L1)"
          onPress={() => setDirection('withdraw')}
          color={direction === 'withdraw' ? 'blue' : 'gray'}
        />
      </View>

      <Text style={{ marginBottom: 5 }}>
        {direction === 'deposit'
          ? 'L1 (Ethereum) → L2 (GIWA)'
          : 'L2 (GIWA) → L1 (Ethereum)'}
      </Text>

      {direction === 'withdraw' && (
        <Text style={{ marginBottom: 10, color: '#666' }}>
          L2 Balance: {l2Balance} ETH
        </Text>
      )}

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

      {direction === 'withdraw' && (
        <Text style={{ color: 'orange', marginBottom: 10 }}>
          Warning: Withdrawals take approximately 7 days due to Challenge Period
        </Text>
      )}

      <Button
        title={isLoading ? 'Processing...' : direction === 'deposit' ? 'Deposit' : 'Withdraw'}
        onPress={handleBridge}
        disabled={isLoading || !amount}
      />
    </View>
  );
}
```

## Next Steps

- [Flashblocks](/docs/guides/flashblocks) - Fast transaction confirmation
- [Transactions](/docs/guides/transactions) - Basic transactions
