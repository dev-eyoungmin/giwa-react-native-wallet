---
sidebar_position: 3
---

# Tokens

This guide explains how to manage ERC-20 tokens.

## useTokens Hook

```tsx
import { useTokens } from '@giwa/react-native-wallet';

function TokensScreen() {
  const {
    getBalance,     // Get token balance
    transfer,       // Transfer tokens
    approve,        // Approve
    allowance,      // Check allowance
    getTokenInfo,   // Get token information
    isLoading,
  } = useTokens();

  // ...
}
```

## Get Token Balance

```tsx
const checkBalance = async () => {
  const tokenAddress = '0x...'; // ERC-20 token address

  const result = await getBalance(tokenAddress);

  console.log('Token:', result.token.symbol);
  console.log('Balance:', result.formattedBalance);
  console.log('Decimals:', result.token.decimals);
};
```

## Get Token Information

```tsx
const checkTokenInfo = async () => {
  const tokenAddress = '0x...';

  const info = await getTokenInfo(tokenAddress);

  console.log('Name:', info.name);
  console.log('Symbol:', info.symbol);
  console.log('Decimals:', info.decimals);
  console.log('Total Supply:', info.totalSupply);
};
```

## Token Transfer

```tsx
const handleTransfer = async () => {
  const tokenAddress = '0x...'; // Token address
  const recipient = '0x...';    // Recipient address
  const amount = '100';         // Token unit (decimals handled automatically)

  try {
    const hash = await transfer(tokenAddress, recipient, amount);
    console.log('Transfer complete:', hash);
  } catch (error) {
    console.error('Transfer failed:', error.message);
  }
};
```

## Token Approval (Approve)

Token approval required for using DeFi protocols:

```tsx
const handleApprove = async () => {
  const tokenAddress = '0x...';   // Token address
  const spenderAddress = '0x...'; // Contract address to approve
  const amount = '1000';          // Approval amount

  try {
    const hash = await approve(tokenAddress, spenderAddress, amount);
    console.log('Approval complete:', hash);
  } catch (error) {
    console.error('Approval failed:', error.message);
  }
};

// Unlimited approval
const approveUnlimited = async () => {
  const hash = await approve(tokenAddress, spenderAddress, 'unlimited');
};
```

## Check Allowance

```tsx
const checkAllowance = async () => {
  const tokenAddress = '0x...';
  const spenderAddress = '0x...';

  const allowed = await allowance(tokenAddress, spenderAddress);
  console.log('Approved amount:', allowed.formattedAmount);
};
```

## Complete Example: Token Management Screen

```tsx
import { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, Alert } from 'react-native';
import { useTokens } from '@giwa/react-native-wallet';

// Known token list
const KNOWN_TOKENS = [
  { address: '0x...', symbol: 'USDT' },
  { address: '0x...', symbol: 'USDC' },
];

export function TokensScreen() {
  const { getBalance, transfer, isLoading } = useTokens();
  const [balances, setBalances] = useState([]);
  const [selectedToken, setSelectedToken] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  // Get all token balances
  const loadBalances = async () => {
    const results = await Promise.all(
      KNOWN_TOKENS.map(async (token) => {
        const balance = await getBalance(token.address);
        return {
          ...token,
          balance: balance.formattedBalance,
        };
      })
    );
    setBalances(results);
  };

  useEffect(() => {
    loadBalances();
  }, []);

  const handleTransfer = async () => {
    if (!selectedToken || !recipient || !amount) return;

    try {
      const hash = await transfer(selectedToken.address, recipient, amount);
      Alert.alert('Success', `Transfer complete: ${hash.slice(0, 20)}...`);
      loadBalances(); // Refresh balances
    } catch (error) {
      Alert.alert('Failed', error.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 18, marginBottom: 10 }}>Token Balances</Text>

      <FlatList
        data={balances}
        keyExtractor={(item) => item.address}
        renderItem={({ item }) => (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              padding: 12,
              borderBottomWidth: 1,
              borderColor: '#eee',
            }}
          >
            <Text>{item.symbol}</Text>
            <Text>{item.balance}</Text>
            <Button
              title="Send"
              onPress={() => setSelectedToken(item)}
            />
          </View>
        )}
      />

      {selectedToken && (
        <View style={{ marginTop: 20 }}>
          <Text style={{ marginBottom: 10 }}>
            Send {selectedToken.symbol}
          </Text>

          <TextInput
            placeholder="Recipient address"
            value={recipient}
            onChangeText={setRecipient}
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 10,
              marginBottom: 10,
            }}
          />

          <TextInput
            placeholder="Amount"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 10,
              marginBottom: 10,
            }}
          />

          <Button
            title="Send"
            onPress={handleTransfer}
            disabled={isLoading}
          />
        </View>
      )}

      <Button title="Refresh" onPress={loadBalances} />
    </View>
  );
}
```

## Add Custom Token

```tsx
const addCustomToken = async (tokenAddress: string) => {
  try {
    const info = await getTokenInfo(tokenAddress);

    // Verify if it's a valid ERC-20
    if (!info.symbol || !info.decimals) {
      throw new Error('Invalid token address');
    }

    // Add to local storage
    const customTokens = await AsyncStorage.getItem('customTokens');
    const tokens = customTokens ? JSON.parse(customTokens) : [];
    tokens.push({
      address: tokenAddress,
      symbol: info.symbol,
      name: info.name,
      decimals: info.decimals,
    });
    await AsyncStorage.setItem('customTokens', JSON.stringify(tokens));

    return info;
  } catch (error) {
    throw new Error('Unable to add token');
  }
};
```

## Next Steps

- [Bridge](/docs/guides/bridge) - L1↔L2 token transfers
- [Transactions](/docs/guides/transactions) - ETH transfers
