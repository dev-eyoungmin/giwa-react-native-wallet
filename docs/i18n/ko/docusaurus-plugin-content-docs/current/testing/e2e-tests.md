---
sidebar_position: 4
---

# E2E Tests

Detox를 사용한 End-to-End 테스트 작성법입니다.

## Detox Setup

### Installation

```bash
# Detox CLI
npm install -g detox-cli

# 프로젝트 의존성
npm install --save-dev detox jest-circus

# iOS
brew tap wix/brew
brew install applesimutils
```

### Configuration File

```javascript
// .detoxrc.js
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/YourApp.app',
      build:
        'xcodebuild -workspace ios/YourApp.xcworkspace -scheme YourApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build:
        'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: { type: 'iPhone 15' },
    },
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'Pixel_4_API_30' },
    },
  },
  configurations: {
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
  },
};
```

### Jest Configuration

```javascript
// e2e/jest.config.js
module.exports = {
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.test.ts'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: ['detox/runners/jest/reporter'],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
};
```

## Writing E2E Tests

### Wallet Creation Test

```typescript
// e2e/wallet.test.ts
import { device, element, by, expect } from 'detox';

describe('Wallet', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('새 지갑을 생성해야 함', async () => {
    // 지갑 생성 버튼 탭
    await element(by.id('create-wallet-button')).tap();

    // 주소 표시 확인
    await expect(element(by.id('wallet-address'))).toBeVisible();

    // 주소 형식 확인
    const addressElement = element(by.id('wallet-address'));
    await expect(addressElement).toHaveText(/^0x[a-fA-F0-9]{40}$/);
  });

  it('니모닉 백업 화면을 표시해야 함', async () => {
    await element(by.id('create-wallet-button')).tap();

    // 니모닉 백업 화면 확인
    await expect(element(by.id('mnemonic-backup-screen'))).toBeVisible();

    // 12단어 확인
    await expect(element(by.id('mnemonic-word-0'))).toBeVisible();
    await expect(element(by.id('mnemonic-word-11'))).toBeVisible();

    // 백업 확인 버튼
    await element(by.id('confirm-backup-button')).tap();

    // 메인 화면으로 이동
    await expect(element(by.id('wallet-screen'))).toBeVisible();
  });

  it('니모닉으로 지갑을 복구해야 함', async () => {
    // 복구 버튼 탭
    await element(by.id('recover-wallet-button')).tap();

    // 니모닉 입력
    const testMnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

    await element(by.id('mnemonic-input')).typeText(testMnemonic);

    // 복구 버튼 탭
    await element(by.id('submit-recover-button')).tap();

    // 지갑 화면 확인
    await expect(element(by.id('wallet-screen'))).toBeVisible();

    // 예상 주소 확인
    await expect(element(by.id('wallet-address'))).toHaveText(
      '0x9858EfFD232B4033E47d90003D41EC34EcaEda94'
    );
  });
});
```

### Balance Check Test

```typescript
// e2e/balance.test.ts
import { device, element, by, expect } from 'detox';

describe('Balance', () => {
  beforeAll(async () => {
    await device.launchApp();
    // 지갑 생성
    await element(by.id('create-wallet-button')).tap();
    await element(by.id('confirm-backup-button')).tap();
  });

  it('잔액을 표시해야 함', async () => {
    await expect(element(by.id('balance-display'))).toBeVisible();
  });

  it('당겨서 잔액을 새로고침해야 함', async () => {
    // 당겨서 새로고침
    await element(by.id('balance-scroll-view')).swipe('down');

    // 로딩 인디케이터 확인
    await expect(element(by.id('balance-loading'))).toBeVisible();

    // 로딩 완료 대기
    await waitFor(element(by.id('balance-loading')))
      .not.toBeVisible()
      .withTimeout(5000);

    // 잔액 표시 확인
    await expect(element(by.id('balance-display'))).toBeVisible();
  });
});
```

### Transaction Send Test

```typescript
// e2e/transaction.test.ts
import { device, element, by, expect, waitFor } from 'detox';

describe('Transaction', () => {
  beforeAll(async () => {
    await device.launchApp();
    // 테스트 지갑 복구 (잔액이 있는 지갑)
    await element(by.id('recover-wallet-button')).tap();
    await element(by.id('mnemonic-input')).typeText('test mnemonic...');
    await element(by.id('submit-recover-button')).tap();
  });

  it('전송 화면으로 이동해야 함', async () => {
    await element(by.id('send-button')).tap();
    await expect(element(by.id('send-screen'))).toBeVisible();
  });

  it('주소 입력을 검증해야 함', async () => {
    await element(by.id('send-button')).tap();

    // 잘못된 주소 입력
    await element(by.id('recipient-input')).typeText('invalid-address');
    await element(by.id('submit-send-button')).tap();

    // 에러 메시지 확인
    await expect(element(by.id('address-error'))).toBeVisible();
  });

  it('트랜잭션을 성공적으로 전송해야 함', async () => {
    await element(by.id('send-button')).tap();

    // 유효한 주소 입력
    await element(by.id('recipient-input')).replaceText(
      '0x0000000000000000000000000000000000000001'
    );

    // 금액 입력
    await element(by.id('amount-input')).typeText('0.001');

    // 전송 버튼 탭
    await element(by.id('submit-send-button')).tap();

    // 확인 다이얼로그
    await expect(element(by.id('confirm-dialog'))).toBeVisible();
    await element(by.id('confirm-send-button')).tap();

    // 성공 메시지 대기
    await waitFor(element(by.id('success-message')))
      .toBeVisible()
      .withTimeout(30000);
  });
});
```

### Biometric Authentication Test

```typescript
// e2e/biometric.test.ts
import { device, element, by, expect } from 'detox';

describe('Biometric Authentication', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('개인키 내보내기 시 생체 인증을 요청해야 함', async () => {
    // 지갑 생성
    await element(by.id('create-wallet-button')).tap();
    await element(by.id('confirm-backup-button')).tap();

    // 설정 → 개인키 내보내기
    await element(by.id('settings-button')).tap();
    await element(by.id('export-private-key-button')).tap();

    // 경고 다이얼로그 확인
    await expect(element(by.id('export-warning-dialog'))).toBeVisible();
    await element(by.id('confirm-export-button')).tap();

    // 생체 인증 프롬프트 (시뮬레이터에서는 자동 성공)
    // 실제 디바이스에서는 생체 인증 필요

    // 개인키 표시 확인 (성공 시)
    await expect(element(by.id('private-key-display'))).toBeVisible();
  });
});
```

## Running Tests

```bash
# iOS 시뮬레이터
detox build --configuration ios.sim.debug
detox test --configuration ios.sim.debug

# Android 에뮬레이터
detox build --configuration android.emu.debug
detox test --configuration android.emu.debug

# 특정 테스트 파일만
detox test --configuration ios.sim.debug e2e/wallet.test.ts

# 재시도 포함
detox test --configuration ios.sim.debug --retries 3
```

## CI/CD Integration

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4

      - name: Node.js 설정
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: 의존성 설치
        run: npm ci

      - name: Detox CLI 설치
        run: npm install -g detox-cli

      - name: applesimutils 설치
        run: brew tap wix/brew && brew install applesimutils

      - name: 앱 빌드
        run: detox build --configuration ios.sim.debug

      - name: E2E 테스트 실행
        run: detox test --configuration ios.sim.debug --headless

  e2e-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Node.js 설정
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Java 설정
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: 의존성 설치
        run: npm ci

      - name: 앱 빌드
        run: detox build --configuration android.emu.debug

      - name: E2E 테스트 실행
        uses: reactivecircus/android-emulator-runner@v2
        with:
          api-level: 30
          script: detox test --configuration android.emu.debug --headless
```

## Test Utilities

```typescript
// e2e/utils.ts
import { element, by, waitFor } from 'detox';

export const waitForElement = async (testId: string, timeout = 5000) => {
  await waitFor(element(by.id(testId))).toBeVisible().withTimeout(timeout);
};

export const typeText = async (testId: string, text: string) => {
  await element(by.id(testId)).tap();
  await element(by.id(testId)).typeText(text);
};

export const createWallet = async () => {
  await element(by.id('create-wallet-button')).tap();
  await waitForElement('mnemonic-backup-screen');
  await element(by.id('confirm-backup-button')).tap();
  await waitForElement('wallet-screen');
};

export const recoverWallet = async (mnemonic: string) => {
  await element(by.id('recover-wallet-button')).tap();
  await typeText('mnemonic-input', mnemonic);
  await element(by.id('submit-recover-button')).tap();
  await waitForElement('wallet-screen');
};
```
