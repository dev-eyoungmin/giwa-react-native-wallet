---
sidebar_position: 1
---

# Test Setup

GIWA SDK를 사용하는 앱의 테스트 환경 설정 방법입니다.

## Installing Dependencies

```bash
# Jest and React Native Testing Library
npm install --save-dev jest @testing-library/react-native @testing-library/react-hooks

# TypeScript support
npm install --save-dev @types/jest ts-jest

# React Test Renderer (optional)
npm install --save-dev react-test-renderer
```

## Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: [
    '@testing-library/jest-native/extend-expect',
    './jest.setup.js',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@giwa/react-native-wallet)/)',
  ],
  moduleNameMapper: {
    '^@giwa/react-native-wallet$': '<rootDir>/node_modules/@giwa/react-native-wallet/dist/index.js',
  },
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts?(x)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
};
```

## Mock Setup

### expo-secure-store Mock

```typescript
// jest.setup.js
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  WHEN_UNLOCKED: 'WHEN_UNLOCKED',
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
  AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
  AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY',
  ALWAYS: 'ALWAYS',
  ALWAYS_THIS_DEVICE_ONLY: 'ALWAYS_THIS_DEVICE_ONLY',
}));
```

### react-native-keychain Mock

```typescript
// jest.setup.js
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  getGenericPassword: jest.fn(() =>
    Promise.resolve({ username: 'wallet', password: 'encrypted_data' })
  ),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
  getSupportedBiometryType: jest.fn(() => Promise.resolve('FaceID')),
  canImplyAuthentication: jest.fn(() => Promise.resolve(true)),
  ACCESS_CONTROL: {
    USER_PRESENCE: 'USER_PRESENCE',
    BIOMETRY_ANY: 'BIOMETRY_ANY',
    BIOMETRY_CURRENT_SET: 'BIOMETRY_CURRENT_SET',
    DEVICE_PASSCODE: 'DEVICE_PASSCODE',
    BIOMETRY_ANY_OR_DEVICE_PASSCODE: 'BIOMETRY_ANY_OR_DEVICE_PASSCODE',
    BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE: 'BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE',
  },
  ACCESSIBLE: {
    WHEN_UNLOCKED: 'WHEN_UNLOCKED',
    AFTER_FIRST_UNLOCK: 'AFTER_FIRST_UNLOCK',
    ALWAYS: 'ALWAYS',
    WHEN_PASSCODE_SET_THIS_DEVICE_ONLY: 'WHEN_PASSCODE_SET_THIS_DEVICE_ONLY',
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
    AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY: 'AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY',
  },
  BIOMETRY_TYPE: {
    TOUCH_ID: 'TouchID',
    FACE_ID: 'FaceID',
    FINGERPRINT: 'Fingerprint',
    FACE: 'Face',
    IRIS: 'Iris',
  },
}));
```

### viem Mock

```typescript
// jest.setup.js
jest.mock('viem', () => {
  const actual = jest.requireActual('viem');
  return {
    ...actual,
    createPublicClient: jest.fn(() => ({
      getBalance: jest.fn(() => Promise.resolve(BigInt('1000000000000000000'))),
      getBlockNumber: jest.fn(() => Promise.resolve(BigInt(12345))),
      getTransaction: jest.fn(() => Promise.resolve(null)),
      getTransactionReceipt: jest.fn(() => Promise.resolve(null)),
      estimateGas: jest.fn(() => Promise.resolve(BigInt(21000))),
      call: jest.fn(() => Promise.resolve({ data: '0x' })),
      readContract: jest.fn(() => Promise.resolve(BigInt(0))),
    })),
    createWalletClient: jest.fn(() => ({
      sendTransaction: jest.fn(() =>
        Promise.resolve('0x' + '1'.repeat(64))
      ),
      signMessage: jest.fn(() => Promise.resolve('0x' + '2'.repeat(130))),
    })),
  };
});
```

## Test Wrapper

```typescript
// test-utils.tsx
import React from 'react';
import { render, RenderOptions } from '@testing-library/react-native';
import { GiwaProvider } from '@giwa/react-native-wallet';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <GiwaProvider config={{ network: 'testnet' }}>
    {children}
  </GiwaProvider>
);

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: TestWrapper, ...options });

// Hook test wrapper
const hookWrapper = ({ children }: { children: React.ReactNode }) => (
  <GiwaProvider config={{ network: 'testnet' }}>
    {children}
  </GiwaProvider>
);

export * from '@testing-library/react-native';
export { customRender as render, hookWrapper };
```

## Complete jest.setup.js

```typescript
// jest.setup.js
import '@testing-library/jest-native/extend-expect';

// expo-secure-store mock
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY',
}));

// react-native-keychain mock
jest.mock('react-native-keychain', () => ({
  setGenericPassword: jest.fn(() => Promise.resolve(true)),
  getGenericPassword: jest.fn(() => Promise.resolve({ password: 'test' })),
  resetGenericPassword: jest.fn(() => Promise.resolve(true)),
  getSupportedBiometryType: jest.fn(() => Promise.resolve('FaceID')),
  ACCESS_CONTROL: { BIOMETRY_CURRENT_SET_OR_DEVICE_PASSCODE: 'BIOMETRY' },
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED' },
  BIOMETRY_TYPE: { FACE_ID: 'FaceID', TOUCH_ID: 'TouchID' },
}));

// Global configuration
global.fetch = jest.fn();

// Ignore console warnings (optional)
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes('deprecated')) return;
  originalWarn(...args);
};

// Timer mock
jest.useFakeTimers();
```

## Next Steps

- [Unit Tests](/docs/testing/unit-tests) - Hook 테스트 작성법
- [Integration Tests](/docs/testing/integration-tests) - 전체 흐름 테스트
