---
sidebar_position: 2
---

# 유닛 테스트

GIWA SDK Hook들의 유닛 테스트 작성 방법입니다.

## useGiwaWallet 테스트

```typescript
// __tests__/hooks/useGiwaWallet.test.ts
import { renderHook, act, waitFor } from '@testing-library/react-hooks';
import { useGiwaWallet } from '@giwa/react-native-wallet';
import { hookWrapper } from '../test-utils';

describe('useGiwaWallet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createWallet', () => {
    it('should create a new wallet with valid address and mnemonic', async () => {
      const { result } = renderHook(() => useGiwaWallet(), {
        wrapper: hookWrapper,
      });

      await act(async () => {
        const { wallet, mnemonic } = await result.current.createWallet();

        // 주소 형식 검증
        expect(wallet.address).toMatch(/^0x[a-fA-F0-9]{40}$/);

        // 니모닉 12단어 검증
        expect(mnemonic.split(' ')).toHaveLength(12);
      });

      // 지갑 연결 상태 확인
      expect(result.current.wallet).not.toBeNull();
      expect(result.current.wallet?.isConnected).toBe(true);
    });

    it('should set loading state during wallet creation', async () => {
      const { result } = renderHook(() => useGiwaWallet(), {
        wrapper: hookWrapper,
      });

      expect(result.current.isLoading).toBe(false);

      const createPromise = act(async () => {
        return result.current.createWallet();
      });

      // 로딩 상태 확인
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await createPromise;

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('recoverWallet', () => {
    const validMnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';
    const expectedAddress = '0x9858EfFD232B4033E47d90003D41EC34EcaEda94';

    it('should recover wallet from valid mnemonic', async () => {
      const { result } = renderHook(() => useGiwaWallet(), {
        wrapper: hookWrapper,
      });

      await act(async () => {
        const wallet = await result.current.recoverWallet(validMnemonic);
        expect(wallet.address.toLowerCase()).toBe(expectedAddress.toLowerCase());
      });
    });

    it('should throw error for invalid mnemonic', async () => {
      const { result } = renderHook(() => useGiwaWallet(), {
        wrapper: hookWrapper,
      });

      await expect(
        result.current.recoverWallet('invalid mnemonic phrase')
      ).rejects.toThrow();
    });

    it('should throw error for mnemonic with wrong word count', async () => {
      const { result } = renderHook(() => useGiwaWallet(), {
        wrapper: hookWrapper,
      });

      await expect(
        result.current.recoverWallet('one two three four five')
      ).rejects.toThrow();
    });
  });

  describe('disconnect', () => {
    it('should clear wallet after disconnect', async () => {
      const { result } = renderHook(() => useGiwaWallet(), {
        wrapper: hookWrapper,
      });

      // 먼저 지갑 생성
      await act(async () => {
        await result.current.createWallet();
      });

      expect(result.current.wallet).not.toBeNull();

      // 연결 해제
      await act(async () => {
        await result.current.disconnect();
      });

      expect(result.current.wallet).toBeNull();
    });
  });
});
```

## useBalance 테스트

```typescript
// __tests__/hooks/useBalance.test.ts
import { renderHook, waitFor } from '@testing-library/react-hooks';
import { useBalance } from '@giwa/react-native-wallet';
import { hookWrapper } from '../test-utils';

// Mock 설정
const mockGetBalance = jest.fn();
jest.mock('viem', () => ({
  ...jest.requireActual('viem'),
  createPublicClient: () => ({
    getBalance: mockGetBalance,
  }),
}));

describe('useBalance', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetBalance.mockResolvedValue(BigInt('1000000000000000000')); // 1 ETH
  });

  it('should fetch and format balance correctly', async () => {
    const { result } = renderHook(
      () => useBalance('0x1234567890123456789012345678901234567890'),
      { wrapper: hookWrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.balance).toBe(BigInt('1000000000000000000'));
    expect(result.current.formattedBalance).toBe('1.0');
  });

  it('should handle zero balance', async () => {
    mockGetBalance.mockResolvedValue(BigInt(0));

    const { result } = renderHook(
      () => useBalance('0x1234567890123456789012345678901234567890'),
      { wrapper: hookWrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.formattedBalance).toBe('0.0');
  });

  it('should handle small balance', async () => {
    mockGetBalance.mockResolvedValue(BigInt('1000000000000000')); // 0.001 ETH

    const { result } = renderHook(
      () => useBalance('0x1234567890123456789012345678901234567890'),
      { wrapper: hookWrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.formattedBalance).toBe('0.001');
  });

  it('should refetch balance on demand', async () => {
    const { result } = renderHook(
      () => useBalance('0x1234567890123456789012345678901234567890'),
      { wrapper: hookWrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockGetBalance).toHaveBeenCalledTimes(1);

    // 잔액 변경
    mockGetBalance.mockResolvedValue(BigInt('2000000000000000000'));

    await result.current.refetch();

    await waitFor(() => {
      expect(result.current.formattedBalance).toBe('2.0');
    });

    expect(mockGetBalance).toHaveBeenCalledTimes(2);
  });

  it('should handle network errors', async () => {
    mockGetBalance.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(
      () => useBalance('0x1234567890123456789012345678901234567890'),
      { wrapper: hookWrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
  });
});
```

## useTransaction 테스트

```typescript
// __tests__/hooks/useTransaction.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useTransaction } from '@giwa/react-native-wallet';
import { hookWrapper } from '../test-utils';

describe('useTransaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('sendTransaction', () => {
    it('should send transaction and return hash', async () => {
      const { result } = renderHook(() => useTransaction(), {
        wrapper: hookWrapper,
      });

      await act(async () => {
        const hash = await result.current.sendTransaction({
          to: '0x1234567890123456789012345678901234567890',
          value: '0.1',
        });

        expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      });
    });

    it('should throw error for invalid address', async () => {
      const { result } = renderHook(() => useTransaction(), {
        wrapper: hookWrapper,
      });

      await expect(
        result.current.sendTransaction({
          to: 'invalid-address',
          value: '0.1',
        })
      ).rejects.toThrow();
    });
  });

  describe('estimateGas', () => {
    it('should estimate gas for transaction', async () => {
      const { result } = renderHook(() => useTransaction(), {
        wrapper: hookWrapper,
      });

      await act(async () => {
        const estimate = await result.current.estimateGas({
          to: '0x1234567890123456789012345678901234567890',
          value: '0.1',
        });

        expect(estimate.gasLimit).toBeDefined();
        expect(estimate.gasPrice).toBeDefined();
        expect(estimate.estimatedFee).toBeDefined();
      });
    });
  });
});
```

## useTokens 테스트

```typescript
// __tests__/hooks/useTokens.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useTokens } from '@giwa/react-native-wallet';
import { hookWrapper } from '../test-utils';

const MOCK_TOKEN_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';

describe('useTokens', () => {
  describe('getTokenInfo', () => {
    it('should return token information', async () => {
      const { result } = renderHook(() => useTokens(), {
        wrapper: hookWrapper,
      });

      await act(async () => {
        const info = await result.current.getTokenInfo(MOCK_TOKEN_ADDRESS);

        expect(info.symbol).toBeDefined();
        expect(info.decimals).toBeDefined();
        expect(info.name).toBeDefined();
      });
    });
  });

  describe('getBalance', () => {
    it('should return formatted token balance', async () => {
      const { result } = renderHook(() => useTokens(), {
        wrapper: hookWrapper,
      });

      await act(async () => {
        const balance = await result.current.getBalance(MOCK_TOKEN_ADDRESS);

        expect(balance.token).toBeDefined();
        expect(balance.formattedBalance).toBeDefined();
      });
    });
  });

  describe('transfer', () => {
    it('should transfer tokens and return tx hash', async () => {
      const { result } = renderHook(() => useTokens(), {
        wrapper: hookWrapper,
      });

      await act(async () => {
        const hash = await result.current.transfer(
          MOCK_TOKEN_ADDRESS,
          '0x1234567890123456789012345678901234567890',
          '100'
        );

        expect(hash).toMatch(/^0x[a-fA-F0-9]{64}$/);
      });
    });
  });
});
```

## 테스트 실행

```bash
# 모든 테스트 실행
npm test

# 특정 파일 테스트
npm test -- useGiwaWallet.test.ts

# 커버리지 포함
npm test -- --coverage

# Watch 모드
npm test -- --watch

# 특정 테스트만 실행
npm test -- --testNamePattern="should create a new wallet"
```

## 다음 단계

- [통합 테스트](/docs/testing/integration-tests) - 전체 플로우 테스트
- [E2E 테스트](/docs/testing/e2e-tests) - Detox 테스트
