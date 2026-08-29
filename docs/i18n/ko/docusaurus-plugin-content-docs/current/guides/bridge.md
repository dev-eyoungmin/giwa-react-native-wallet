---
sidebar_position: 4
---

# L1↔L2 Bridge

이 가이드에서는 이더리움(L1)과 GIWA Chain(L2) 사이에서 ETH와 ERC-20 토큰을 이동하는 방법을 설명합니다: 입금(L1→L2), 출금(L2→L1), 그리고 출금의 증명(prove)/완료(finalize) 단계까지 다룹니다.

:::caution GIWA 메인넷 미출시
GIWA 메인넷은 아직 출시되지 않았습니다. `network: 'mainnet'`에서는 모든 L1 브릿지 컨트랙트 주소(`l1StandardBridge`, `optimismPortal`, `disputeGameFactory`)가 `ZERO_ADDRESS`이므로, L1을 사용하는 모든 브릿지 작업은 `L1_BRIDGE_CONTRACTS_NOT_CONFIGURED`를 던집니다. 브릿지 기능은 **GIWA Sepolia**(`network: 'testnet'`)에서만 동작합니다.
:::

## Contract Addresses (GIWA Sepolia)

| 컨트랙트 | 주소 |
|----------|------|
| L2StandardBridge | `0x4200000000000000000000000000000000000010` |
| L1StandardBridge | `0x77b2ffc0F57598cAe1DB76cb398059cF5d10A7E7` |
| OptimismPortal | `0x956962C34687A954e611A83619ABaA37Ce6bC78A` |
| L1CrossDomainMessenger | `0x23ce19ED800fbbC964B9350b01B9113a8508D3F1` |
| DisputeGameFactory | `0x37347caB2afaa49B776372279143D71ad1f354F6` |

L1 주소는 이더리움 Sepolia 기준이며, `L2StandardBridge`는 표준 OP Stack L2 프리디플로이 주소입니다.

## L1 설정

입금과, 출금 시작 이후의 모든 단계(`getWithdrawalStatus`, `getTimeToProve`, `getTimeToFinalize`, `proveWithdrawal`, `finalizeWithdrawal`)는 이더리움(L1)을 읽고 씁니다. 이를 위해서는 L1 RPC 엔드포인트가 필요합니다.

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

이 SDK는 `l1RpcUrl`의 **기본값을 제공하지 않습니다** — 원하는 이더리움 Sepolia RPC 제공자를 직접 선택하세요. 예외적으로 출금 *시작*(`withdrawETH`/`withdrawToken`)은 L2(GIWA) 지갑만 사용하므로 `l1RpcUrl` 없이도 동작합니다.

`useBridge().isL1Configured`는 `l1RpcUrl`이 설정되었는지 여부를 나타냅니다. `l1RpcUrl` 없이 L1을 사용하는 메서드를 호출하면 코드 `L1_RPC_NOT_CONFIGURED`와 함께 `GiwaError`가 발생합니다. 해당 네트워크의 L1 브릿지 컨트랙트가 `ZERO_ADDRESS`인 경우(현재 `network: 'mainnet'`)에는 `l1RpcUrl`이 설정되어 있어도 대신 `L1_BRIDGE_CONTRACTS_NOT_CONFIGURED`가 발생합니다. 전체 목록은 [에러 코드](/docs/api/utilities#error-codes)를 참고하세요.

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
    isL1Configured,         // boolean - endpoints.l1RpcUrl 설정 여부
    isLoading,
    isInitializing,
    error,
  } = useBridge();

  // ...
}
```

## ETH 입금 (L1 → L2)

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

:::note L1 확인, L2 도착 아님
`depositETH`/`depositToken`이 반환하는 해시는 **L1** 트랜잭션 해시이며, `getTransaction(hash)`도 **L1** 확인 상태를 추적합니다. 입금된 자산은 이후 비동기적으로 L2에 릴레이됩니다(보통 몇 분 이내) — 이 L2 측 릴레이를 기다리는 SDK 메서드는 없습니다.
:::

### 다른 L2 주소로 입금

```tsx
const hash = await depositETH('0.1', '0x1234...abcd');
```

## ERC-20 토큰 입금 (L1 → L2)

```tsx
const handleDepositToken = async () => {
  const l1TokenAddress = '0x...'; // L1 토큰 주소
  const l2TokenAddress = '0x...'; // 대응하는 L2 토큰 주소
  const amount = 100000000000000000000n; // 100 토큰 (토큰 단위)

  try {
    const hash = await depositToken(l1TokenAddress, l2TokenAddress, amount);
    console.log('L1 TX Hash:', hash);
  } catch (error) {
    console.error('Deposit failed:', error.message);
  }
};
```

`depositToken`은 먼저 `l1TokenAddress`에 대한 `L1StandardBridge`의 현재 allowance를 읽고, 부족한 경우에만 `approve` 트랜잭션을 보내고 확인을 기다린 뒤 `depositERC20To`를 호출합니다.

## ETH 출금 (L2 → L1)

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

### 다른 L1 주소로 출금

```tsx
const hash = await withdrawETH('0.1', '0x1234...abcd');
```

## ERC-20 토큰 출금 (L2 → L1)

```tsx
const handleWithdrawToken = async () => {
  const l2TokenAddress = '0x...'; // L2 토큰 주소
  const amount = 100000000000000000000n; // 100 토큰 (wei 단위)

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

## 출금 생명주기: 상태 확인 → 증명(Prove) → 완료(Finalize)

L2에서 출금이 시작되면, `getWithdrawalStatus(l2TxHash)`는 다음 다섯 가지 상태 중 하나를 반환합니다.

`'waiting-to-prove'` → `'ready-to-prove'` → `'waiting-to-finalize'` → `'ready-to-finalize'` → `'finalized'`

```tsx
const status = await getWithdrawalStatus(l2TxHash);
console.log(status); // 예: 'ready-to-prove'
```

:::caution 7일 대기 기간
증명과 완료 사이에는 GIWA의 **약 7일**의 challenge period를 거쳐야 합니다. 이는 OP Stack fault-proof 시스템의 보안 속성이며, 이 SDK의 제한 사항이 아닙니다. `getEstimatedWithdrawalTime()`은 이 예상 시간을 초 단위로 반환합니다.
:::

### 증명/완료 전 시간 확인

```tsx
// 논블로킹: 증명 가능해지기까지 남은 시간
const { seconds: secondsToProve } = await getTimeToProve(l2TxHash);

// 논블로킹: 증명 후 완료 가능해지기까지 남은 시간 (~7일)
const { seconds: secondsToFinalize } = await getTimeToFinalize(l2TxHash);
```

### 출금 증명하기

```tsx
// 경고: 증명 가능해질 때까지 블로킹되며, 몇 시간이 걸릴 수 있습니다 - 출금의 블록을
// 커버하는 L2 output / dispute game이 L1에 반영될 때까지 기다립니다. 논블로킹으로
// 준비 상태를 먼저 확인하려면 getWithdrawalStatus()/getTimeToProve()를 사용하세요.
const proveHash = await proveWithdrawal(l2TxHash);
console.log('L1 prove TX:', proveHash);
```

### 출금 완료하기

```tsx
// challenge period가 끝날 때까지 기다리지 않습니다 - 준비 상태를 직접 확인하세요
// (예: getWithdrawalStatus(l2TxHash) === 'ready-to-finalize'). 너무 일찍 호출하면
// L1에서 revert됩니다.
const finalizeHash = await finalizeWithdrawal(l2TxHash);
console.log('L1 finalize TX:', finalizeHash);
```

:::note 잘못된 해시
`getTimeToFinalize`, `proveWithdrawal`, `finalizeWithdrawal`은 모두 L2 트랜잭션의 영수증에서 출금 정보를 읽습니다. 출금을 시작하지 않은 `l2TxHash`(예: 단순 전송)를 전달하면 `GiwaTransactionError`(`NO_WITHDRAWAL_IN_RECEIPT`)가 발생합니다.
:::

## Pending Transactions

대기 중인 브릿지 트랜잭션(입금과 출금, 각각을 생성한 호출이 반환한 해시로 구분)을 추적합니다.

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
      `${amount} ETH를 L1으로 출금하시겠습니까?\n\n증명과 완료에는 이 단계 이후 약 ${days}일이 추가로 필요합니다.`,
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
        const proveHash = await proveWithdrawal(withdrawalHash); // 몇 시간이 걸릴 수 있음
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
          입금, 증명, 완료를 사용하려면 GiwaProvider에 endpoints.l1RpcUrl을 설정하세요.
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

## 라이브 검증 커버리지

`pnpm verify:live`는 실제 GIWA Sepolia에 대해 `GiwaClient`의 읽기 경로 — chain id, 기능 가용성, 컨트랙트 주소, op-stack 체인 연결(`sourceId`, L1 컨트랙트 맵, `hasL1Support()`) — 를 검증합니다. `depositETH`, `depositToken`, `proveWithdrawal`, `finalizeWithdrawal`은 자금이 있는 L1/L2 계정이 필요하므로 이 스크립트에서 호출하지 않으며, 대신 수동으로 검증합니다.

## Next Steps

- [Flashblocks](/docs/guides/flashblocks) - 빠른 트랜잭션 확인
- [Transactions](/docs/guides/transactions) - 기본 트랜잭션
