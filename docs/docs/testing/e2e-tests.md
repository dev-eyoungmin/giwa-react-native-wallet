---
sidebar_position: 4
---

# E2E Tests

How to write End-to-End tests using Detox.

## Detox Setup

### Installation

```bash
# Detox CLI
npm install -g detox-cli

# Project dependencies
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

  it('should create new wallet', async () => {
    // Tap create wallet button
    await element(by.id('create-wallet-button')).tap();

    // Verify address display
    await expect(element(by.id('wallet-address'))).toBeVisible();

    // Verify address format
    const addressElement = element(by.id('wallet-address'));
    await expect(addressElement).toHaveText(/^0x[a-fA-F0-9]{40}$/);
  });

  it('should show mnemonic backup screen', async () => {
    await element(by.id('create-wallet-button')).tap();

    // Verify mnemonic backup screen
    await expect(element(by.id('mnemonic-backup-screen'))).toBeVisible();

    // Verify 12 words
    await expect(element(by.id('mnemonic-word-0'))).toBeVisible();
    await expect(element(by.id('mnemonic-word-11'))).toBeVisible();

    // Confirm backup button
    await element(by.id('confirm-backup-button')).tap();

    // Navigate to main screen
    await expect(element(by.id('wallet-screen'))).toBeVisible();
  });

  it('should recover wallet from mnemonic', async () => {
    // Tap recover button
    await element(by.id('recover-wallet-button')).tap();

    // Enter mnemonic
    const testMnemonic =
      'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

    await element(by.id('mnemonic-input')).typeText(testMnemonic);

    // Tap recover button
    await element(by.id('submit-recover-button')).tap();

    // Verify wallet screen
    await expect(element(by.id('wallet-screen'))).toBeVisible();

    // Verify expected address
    await expect(element(by.id('wallet-address'))).toHaveText(
      '0x9858EfFD232B4033E47d90003D41EC34EcaEda94'
    );
  });
});
```

### Balance Query Test

```typescript
// e2e/balance.test.ts
import { device, element, by, expect } from 'detox';

describe('Balance', () => {
  beforeAll(async () => {
    await device.launchApp();
    // Create wallet
    await element(by.id('create-wallet-button')).tap();
    await element(by.id('confirm-backup-button')).tap();
  });

  it('should display balance', async () => {
    await expect(element(by.id('balance-display'))).toBeVisible();
  });

  it('should refresh balance on pull', async () => {
    // Pull to refresh
    await element(by.id('balance-scroll-view')).swipe('down');

    // Verify loading indicator
    await expect(element(by.id('balance-loading'))).toBeVisible();

    // Wait for loading to complete
    await waitFor(element(by.id('balance-loading')))
      .not.toBeVisible()
      .withTimeout(5000);

    // Verify balance display
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
    // Recover test wallet (wallet with balance)
    await element(by.id('recover-wallet-button')).tap();
    await element(by.id('mnemonic-input')).typeText('test mnemonic...');
    await element(by.id('submit-recover-button')).tap();
  });

  it('should navigate to send screen', async () => {
    await element(by.id('send-button')).tap();
    await expect(element(by.id('send-screen'))).toBeVisible();
  });

  it('should validate address input', async () => {
    await element(by.id('send-button')).tap();

    // Enter invalid address
    await element(by.id('recipient-input')).typeText('invalid-address');
    await element(by.id('submit-send-button')).tap();

    // Verify error message
    await expect(element(by.id('address-error'))).toBeVisible();
  });

  it('should send transaction successfully', async () => {
    await element(by.id('send-button')).tap();

    // Enter valid address
    await element(by.id('recipient-input')).replaceText(
      '0x0000000000000000000000000000000000000001'
    );

    // Enter amount
    await element(by.id('amount-input')).typeText('0.001');

    // Tap send button
    await element(by.id('submit-send-button')).tap();

    // Confirmation dialog
    await expect(element(by.id('confirm-dialog'))).toBeVisible();
    await element(by.id('confirm-send-button')).tap();

    // Wait for success message
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

describe('Biometric Auth', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should prompt biometric for private key export', async () => {
    // Create wallet
    await element(by.id('create-wallet-button')).tap();
    await element(by.id('confirm-backup-button')).tap();

    // Settings → Export private key
    await element(by.id('settings-button')).tap();
    await element(by.id('export-private-key-button')).tap();

    // Verify warning dialog
    await expect(element(by.id('export-warning-dialog'))).toBeVisible();
    await element(by.id('confirm-export-button')).tap();

    // Biometric prompt (auto-success on simulator)
    // Real device requires biometric authentication

    // Verify private key display (on success)
    await expect(element(by.id('private-key-display'))).toBeVisible();
  });
});
```

## Running Tests

```bash
# iOS Simulator
detox build --configuration ios.sim.debug
detox test --configuration ios.sim.debug

# Android Emulator
detox build --configuration android.emu.debug
detox test --configuration android.emu.debug

# Specific test file only
detox test --configuration ios.sim.debug e2e/wallet.test.ts

# With retries
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

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Detox CLI
        run: npm install -g detox-cli

      - name: Install applesimutils
        run: brew tap wix/brew && brew install applesimutils

      - name: Build app
        run: detox build --configuration ios.sim.debug

      - name: Run E2E tests
        run: detox test --configuration ios.sim.debug --headless

  e2e-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Install dependencies
        run: npm ci

      - name: Build app
        run: detox build --configuration android.emu.debug

      - name: Run E2E tests
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
