---
sidebar_position: 8
---

# Security

Best practices for security when using GIWA SDK.

## Security Architecture

```
┌─────────────────────────────────────────┐
│              App Layer                  │
│  - Discard mnemonic immediately after   │
│    displaying                           │
│  - Minimize private key time in memory  │
│  - Never log sensitive data             │
├─────────────────────────────────────────┤
│           GIWA SDK Layer                │
│  - Input validation                     │
│  - Exclude sensitive info from errors   │
├─────────────────────────────────────────┤
│       Native Secure Storage             │
│  iOS: Keychain (Secure Enclave)         │
│  Android: Keystore (Hardware-backed)    │
├─────────────────────────────────────────┤
│          OS-Level Encryption            │
└─────────────────────────────────────────┘
```

## Private Key Management

### Safe Wallet Creation

```tsx
const handleCreateWallet = async () => {
  try {
    const { wallet, mnemonic } = await createWallet();

    // Show mnemonic to user and confirm backup
    const confirmed = await showMnemonicBackupScreen(mnemonic);

    if (!confirmed) {
      // Warn user if backup not confirmed
      Alert.alert(
        'Warning',
        'You cannot recover your wallet without backing up your recovery phrase'
      );
    }

    // Mnemonic is no longer accessible in the app after this
    // SDK does not store the mnemonic

  } catch (error) {
    // Do not include sensitive information in error messages
    Alert.alert('Error', 'Failed to create wallet');
  }
};
```

### Private Key Export Precautions

```tsx
const handleExportPrivateKey = async () => {
  // 1. Warn user about risks
  const confirmed = await new Promise((resolve) => {
    Alert.alert(
      'Warning',
      'Exposing your private key can result in loss of assets.\n\n' +
      'Never:\n' +
      '- Take screenshots of your private key\n' +
      '- Share it with anyone\n' +
      '- Store it in the cloud',
      [
        { text: 'Cancel', onPress: () => resolve(false) },
        { text: 'I Understand', onPress: () => resolve(true) },
      ]
    );
  });

  if (!confirmed) return;

  try {
    // 2. Biometric authentication (automatically requested)
    const privateKey = await exportPrivateKey();

    // 3. Auto-hide after a set time
    showPrivateKeyModal(privateKey, {
      autoHideAfter: 60000, // Auto-hide after 60 seconds
      disableScreenshot: true, // Prevent screenshots (Android)
    });

  } catch (error) {
    if (error.code === 'BIOMETRIC_FAILED') {
      Alert.alert('Authentication Failed', 'Biometric authentication failed');
    }
  }
};
```

## Biometric Authentication

```tsx
import { useBiometricAuth } from '@giwa/react-native-wallet';

function SecureAction() {
  const { authenticate, isAvailable, biometryType } = useBiometricAuth();

  const handleSensitiveAction = async () => {
    if (!isAvailable) {
      // Use alternative authentication like PIN when biometrics unavailable
      const pinValid = await verifyPin();
      if (!pinValid) return;
    } else {
      // Biometric authentication
      const success = await authenticate({
        promptMessage: 'Authenticate to approve transaction',
      });
      if (!success) return;
    }

    // Execute sensitive action
    await performSensitiveAction();
  };
}
```

## Transaction Security

### Address Validation

```tsx
import { GiwaError, ErrorCodes } from '@giwa/react-native-wallet';

const validateAndSend = async (to: string, amount: string) => {
  // 1. Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(to)) {
    throw new GiwaError('Invalid address format', ErrorCodes.INVALID_ADDRESS);
  }

  // 2. Prevent sending to self
  if (to.toLowerCase() === wallet.address.toLowerCase()) {
    Alert.alert('Warning', 'Are you sure you want to send to yourself?');
  }

  // 3. Validate amount
  const amountWei = parseEther(amount);
  if (amountWei <= 0n) {
    throw new GiwaError('Amount must be greater than 0');
  }

  // 4. Check balance
  if (amountWei > balance) {
    throw new GiwaError('Insufficient balance', ErrorCodes.INSUFFICIENT_FUNDS);
  }

  // 5. Additional confirmation for large amounts
  const threshold = parseEther('1'); // 1 ETH
  if (amountWei >= threshold) {
    const confirmed = await confirmLargeTransaction(amount);
    if (!confirmed) return;
  }

  await sendTransaction({ to, value: amount });
};
```

### Transaction Simulation

```tsx
const safeSendTransaction = async (tx) => {
  // Simulate before sending
  try {
    await estimateGas(tx);
  } catch (error) {
    Alert.alert(
      'Transaction Expected to Fail',
      'This transaction is expected to fail. Do you want to continue?'
    );
    return;
  }

  await sendTransaction(tx);
};
```

## Phishing Prevention

### RPC URL Validation

```tsx
// Automatically validated internally by SDK
const ALLOWED_RPC_DOMAINS = [
  'giwa.io',
  'sepolia-rpc.giwa.io',
  'rpc.giwa.io',
];

// Warning displayed when using custom RPC
<GiwaProvider
  config={{
    network: 'mainnet',
    customRpcUrl: 'https://custom-rpc.example.com', // Warning shown
  }}
>
```

### Contract Interaction Validation

```tsx
// Verify known contract addresses
import { CONTRACT_ADDRESSES, getContractAddresses } from '@giwa/react-native-wallet';

const isOfficialContract = (address: string) => {
  const contracts = getContractAddresses('mainnet');
  return Object.values(contracts).includes(address.toLowerCase());
};

// Confirm before token approval
const safeApprove = async (tokenAddress: string, spender: string, amount: string) => {
  if (!isOfficialContract(spender)) {
    const confirmed = await Alert.alert(
      'Unknown Contract',
      `${spender} is not an official GIWA contract.\nDo you want to continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', style: 'destructive' },
      ]
    );
    if (!confirmed) return;
  }

  await approve(tokenAddress, spender, amount);
};
```

## Built-in SDK Security Features

### Rate Limiting

Prevents brute force attacks on sensitive operations.

```tsx
// Mnemonic/private key export limits
const { exportMnemonic, exportPrivateKey } = useGiwaWallet();

// Limited to 3 calls per minute
// 5-minute cooldown when exceeded
try {
  const mnemonic = await exportMnemonic();
} catch (error) {
  if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // "Rate limit exceeded. Please wait 300 seconds."
    Alert.alert('Please try again later', error.message);
  }
}
```

| Operation | Limit | Cooldown |
|-----------|-------|----------|
| `exportMnemonic` | 3/min | 5 min |
| `exportPrivateKey` | 3/min | 5 min |

### Memory Security

Sensitive account data is automatically cleared from memory after 5 minutes of inactivity.

```tsx
// SDK internal behavior:
// 1. Wallet loaded -> Account data loaded to memory
// 2. No getAccount() calls for 5 minutes
// 3. Automatically calls clearSensitiveMemory()
// 4. Auto-reloads on next operation

// No special handling required in user code
```

### Security Audit Logging

SDK automatically logs security-related events.

```tsx
// Event types logged:
// - WALLET_CREATED, WALLET_RECOVERED, WALLET_DELETED
// - MNEMONIC_EXPORT_ATTEMPT, PRIVATE_KEY_EXPORT_ATTEMPT
// - RATE_LIMIT_TRIGGERED, SECURITY_VIOLATION
// - BIOMETRIC_AUTH_ATTEMPT/SUCCESS/FAILED

// Sensitive data is automatically masked
// Example: 0x1234...5678 (address), [REDACTED] (private key)
```

:::note Development Environment
In `__DEV__` mode, Security Audit logs are output to the console.
In production, you can integrate with external logging systems.
:::

---

## Logging and Debugging

### Safe Logging

```tsx
// Bad example
console.log('Private key:', privateKey);
console.log('Mnemonic:', mnemonic);

// Good example
console.log('Wallet creation complete');
console.log('Address:', wallet.address); // Address is public information

// Log only in development environment
if (__DEV__) {
  console.log('Debug info:', safeData);
}
```

### Error Reporting

```tsx
// Bad example - includes sensitive information
Sentry.captureException(error, {
  extra: { privateKey, mnemonic },
});

// Good example - excludes sensitive information
Sentry.captureException(error, {
  extra: {
    walletAddress: wallet.address,
    network: config.network,
    errorCode: error.code,
  },
});
```

## App Security Settings

### Android Security

```java
// android/app/src/main/java/.../MainActivity.java
@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // Prevent screenshots
    getWindow().setFlags(
        WindowManager.LayoutParams.FLAG_SECURE,
        WindowManager.LayoutParams.FLAG_SECURE
    );
}
```

### iOS Security

```swift
// ios/YourApp/AppDelegate.swift
func applicationWillResignActive(_ application: UIApplication) {
    // Cover screen when app switches
    let blurEffect = UIBlurEffect(style: .light)
    let blurView = UIVisualEffectView(effect: blurEffect)
    blurView.frame = window?.frame ?? CGRect.zero
    blurView.tag = 999
    window?.addSubview(blurView)
}

func applicationDidBecomeActive(_ application: UIApplication) {
    // Remove blur
    window?.viewWithTag(999)?.removeFromSuperview()
}
```

## Security Checklist

### During Development

- [ ] No logging of private keys/mnemonics
- [ ] No hardcoded keys
- [ ] No sensitive information in error messages
- [ ] Validate all input values

### Before Release

- [ ] Remove debug logs
- [ ] Apply ProGuard/R8 obfuscation
- [ ] Configure SSL Pinning
- [ ] Enable screenshot prevention

### User Education

- [ ] Emphasize mnemonic backup
- [ ] Warn about private key sharing
- [ ] Alert about phishing sites
- [ ] Verify address for large transfers

## Next Steps

- [API Reference](/docs/api/hooks) - All Hook APIs
- [Wallet Management](/docs/guides/wallet-management) - Wallet features
