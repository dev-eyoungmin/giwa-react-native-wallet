---
sidebar_position: 3
---

# 통합 테스트

여러 Hook을 조합한 전체 플로우의 통합 테스트 작성 방법입니다.

## 지갑 생성 → 잔액 조회 플로우

```typescript
// __tests__/integration/walletFlow.test.ts
import { renderHook, act, waitFor } from '@testing-library/react-hooks';
import {
  useGiwaWallet,
  useBalance,
  GiwaProvider,
} from '@giwa/react-native-wallet';
import React from 'react';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <GiwaProvider config={{ network: 'testnet' }}>
    {children}
  </GiwaProvider>
);

describe('Wallet Creation Flow', () => {
  it('should create wallet and fetch balance', async () => {
    // 1. 지갑 생성
    const { result: walletResult } = renderHook(() => useGiwaWallet(), {
      wrapper,
    });

    let walletAddress: string;

    await act(async () => {
      const { wallet } = await walletResult.current.createWallet();
      walletAddress = wallet.address;
    });

    expect(walletResult.current.wallet).not.toBeNull();

    // 2. 잔액 조회
    const { result: balanceResult } = renderHook(
      () => useBalance(walletAddress),
      { wrapper }
    );

    await waitFor(() => {
      expect(balanceResult.current.isLoading).toBe(false);
    });

    expect(balanceResult.current.balance).toBeDefined();
    expect(balanceResult.current.formattedBalance).toBeDefined();
  });
});
```

## 지갑 복구 → 트랜잭션 전송 플로우

```typescript
// __tests__/integration/transactionFlow.test.ts
import { renderHook, act, waitFor } from '@testing-library/react-hooks';
import {
  useGiwaWallet,
  useBalance,
  useTransaction,
} from '@giwa/react-native-wallet';

describe('Transaction Flow', () => {
  const testMnemonic =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

  it('should recover wallet and send transaction', async () => {
    // 1. 지갑 복구
    const { result: walletResult } = renderHook(() => useGiwaWallet(), {
      wrapper,
    });

    await act(async () => {
      await walletResult.current.recoverWallet(testMnemonic);
    });

    expect(walletResult.current.wallet).not.toBeNull();
    const senderAddress = walletResult.current.wallet!.address;

    // 2. 잔액 확인
    const { result: balanceResult } = renderHook(
      () => useBalance(senderAddress),
      { wrapper }
    );

    await waitFor(() => {
      expect(balanceResult.current.isLoading).toBe(false);
    });

    // 3. 트랜잭션 전송 (잔액이 있는 경우)
    if (balanceResult.current.balance! > BigInt(0)) {
      const { result: txResult } = renderHook(() => useTransaction(), {
        wrapper,
      });

      await act(async () => {
        const hash = await txResult.current.sendTransaction({
          to: '0x0000000000000000000000000000000000000001',
          value: '0.001',
        });

        expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      });
    }
  });
});
```

## 토큰 전송 플로우

```typescript
// __tests__/integration/tokenFlow.test.ts
import { renderHook, act, waitFor } from '@testing-library/react-hooks';
import { useGiwaWallet, useTokens } from '@giwa/react-native-wallet';

const MOCK_TOKEN = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const RECIPIENT = '0x0000000000000000000000000000000000000001';

describe('Token Flow', () => {
  it('should get token info and balance', async () => {
    // 1. 지갑 생성
    const { result: walletResult } = renderHook(() => useGiwaWallet(), {
      wrapper,
    });

    await act(async () => {
      await walletResult.current.createWallet();
    });

    // 2. 토큰 정보 조회
    const { result: tokenResult } = renderHook(() => useTokens(), { wrapper });

    await act(async () => {
      const info = await tokenResult.current.getTokenInfo(MOCK_TOKEN);

      expect(info.symbol).toBeDefined();
      expect(info.decimals).toBeGreaterThan(0);
    });

    // 3. 토큰 잔액 조회
    await act(async () => {
      const balance = await tokenResult.current.getBalance(MOCK_TOKEN);

      expect(balance.token.address.toLowerCase()).toBe(
        MOCK_TOKEN.toLowerCase()
      );
      expect(balance.formattedBalance).toBeDefined();
    });
  });

  it('should approve and transfer tokens', async () => {
    const { result: walletResult } = renderHook(() => useGiwaWallet(), {
      wrapper,
    });

    await act(async () => {
      await walletResult.current.createWallet();
    });

    const { result: tokenResult } = renderHook(() => useTokens(), { wrapper });

    // Approve
    await act(async () => {
      const approveHash = await tokenResult.current.approve(
        MOCK_TOKEN,
        RECIPIENT,
        '1000'
      );
      expect(approveHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });

    // Check allowance
    await act(async () => {
      const allowance = await tokenResult.current.allowance(
        MOCK_TOKEN,
        RECIPIENT
      );
      expect(allowance.amount).toBeDefined();
    });
  });
});
```

## GIWA ID 플로우

```typescript
// __tests__/integration/giwaIdFlow.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useGiwaWallet, useGiwaId } from '@giwa/react-native-wallet';

describe('GIWA ID Flow', () => {
  it('should resolve name and address', async () => {
    const { result: walletResult } = renderHook(() => useGiwaWallet(), {
      wrapper,
    });

    await act(async () => {
      await walletResult.current.createWallet();
    });

    const { result: giwaIdResult } = renderHook(() => useGiwaId(), { wrapper });

    // 이름 → 주소 조회
    await act(async () => {
      const address = await giwaIdResult.current.resolveAddress('test.giwa.id');
      // null이거나 주소 형식
      if (address) {
        expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      }
    });

    // 이름 사용 가능 여부
    await act(async () => {
      const available = await giwaIdResult.current.isNameAvailable(
        'random-test-name-12345'
      );
      expect(typeof available).toBe('boolean');
    });
  });
});
```

## Flashblocks 플로우

```typescript
// __tests__/integration/flashblocksFlow.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useGiwaWallet, useFlashblocks } from '@giwa/react-native-wallet';
import { parseEther } from 'viem';

describe('Flashblocks Flow', () => {
  it('should send flashblocks transaction', async () => {
    const { result: walletResult } = renderHook(() => useGiwaWallet(), {
      wrapper,
    });

    await act(async () => {
      await walletResult.current.createWallet();
    });

    const { result: flashResult } = renderHook(() => useFlashblocks(), {
      wrapper,
    });

    // Flashblocks 사용 가능 여부 확인
    if (flashResult.current.isAvailable) {
      await act(async () => {
        const { preconfirmation, result } =
          await flashResult.current.sendTransaction({
            to: '0x0000000000000000000000000000000000000001',
            value: parseEther('0.001'),
          });

        // 사전 확인 검증
        expect(preconfirmation.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
        expect(preconfirmation.latencyMs).toBeLessThan(1000);

        // 블록 확인 대기
        const receipt = await result.wait();
        expect(receipt.status).toBe('success');
      });
    }
  });

  it('should track average latency', async () => {
    const { result: flashResult } = renderHook(() => useFlashblocks(), {
      wrapper,
    });

    const latency = flashResult.current.getAverageLatency();
    expect(typeof latency).toBe('number');
    expect(latency).toBeGreaterThanOrEqual(0);
  });
});
```

## 전체 지갑 플로우 테스트

```typescript
// __tests__/integration/fullFlow.test.ts
import { renderHook, act, waitFor } from '@testing-library/react-hooks';
import {
  useGiwaWallet,
  useBalance,
  useTransaction,
  useTokens,
  useFaucet,
} from '@giwa/react-native-wallet';

describe('Full Wallet Flow', () => {
  it('should complete entire wallet lifecycle', async () => {
    // === 1. 지갑 생성 ===
    const { result: walletResult } = renderHook(() => useGiwaWallet(), {
      wrapper,
    });

    let walletAddress: string;
    let mnemonic: string;

    await act(async () => {
      const result = await walletResult.current.createWallet();
      walletAddress = result.wallet.address;
      mnemonic = result.mnemonic;
    });

    expect(walletAddress).toMatch(/^0x[a-fA-F0-9]{40}$/);
    expect(mnemonic.split(' ')).toHaveLength(12);

    // === 2. 잔액 조회 ===
    const { result: balanceResult } = renderHook(
      () => useBalance(walletAddress),
      { wrapper }
    );

    await waitFor(() => {
      expect(balanceResult.current.isLoading).toBe(false);
    });

    // === 3. Faucet 요청 (테스트넷) ===
    const { result: faucetResult } = renderHook(() => useFaucet(), { wrapper });

    await act(async () => {
      try {
        const result = await faucetResult.current.requestFaucet();
        expect(result.txHash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      } catch (error) {
        // Faucet 제한일 수 있음
        console.log('Faucet rate limited');
      }
    });

    // === 4. 지갑 연결 해제 ===
    await act(async () => {
      await walletResult.current.disconnect();
    });

    expect(walletResult.current.wallet).toBeNull();

    // === 5. 지갑 복구 ===
    await act(async () => {
      const recovered = await walletResult.current.recoverWallet(mnemonic);
      expect(recovered.address.toLowerCase()).toBe(walletAddress.toLowerCase());
    });

    // === 6. 최종 상태 확인 ===
    expect(walletResult.current.wallet?.isConnected).toBe(true);
  });
});
```

## 다음 단계

- [E2E 테스트](/docs/testing/e2e-tests) - Detox를 사용한 E2E 테스트
