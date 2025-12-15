---
sidebar_position: 8
---

# 보안

GIWA SDK 사용 시 보안 모범 사례를 설명합니다.

## 보안 아키텍처

```
┌─────────────────────────────────────────┐
│              앱 레이어                   │
│  - 니모닉 표시 후 즉시 폐기               │
│  - 개인키 메모리 최소 시간 유지            │
│  - 민감 데이터 로깅 금지                  │
├─────────────────────────────────────────┤
│         GIWA SDK 레이어                  │
│  - 입력 검증                             │
│  - 에러 메시지 민감 정보 제외              │
├─────────────────────────────────────────┤
│       네이티브 보안 저장소                 │
│  iOS: Keychain (Secure Enclave)         │
│  Android: Keystore (Hardware-backed)    │
├─────────────────────────────────────────┤
│            OS 레벨 암호화                 │
└─────────────────────────────────────────┘
```

## 개인키 관리

### 안전한 지갑 생성

```tsx
const handleCreateWallet = async () => {
  try {
    const { wallet, mnemonic } = await createWallet();

    // ✅ 니모닉을 사용자에게 보여주고 백업 확인
    const confirmed = await showMnemonicBackupScreen(mnemonic);

    if (!confirmed) {
      // 사용자가 백업을 확인하지 않으면 경고
      Alert.alert(
        '경고',
        '복구 구문을 백업하지 않으면 지갑을 복구할 수 없습니다'
      );
    }

    // ✅ 니모닉은 이후 앱에서 접근 불가
    // SDK는 니모닉을 저장하지 않음

  } catch (error) {
    // ❌ 에러 메시지에 민감 정보 포함하지 않기
    Alert.alert('오류', '지갑 생성에 실패했습니다');
  }
};
```

### 개인키 내보내기 시 주의사항

```tsx
const handleExportPrivateKey = async () => {
  // ✅ 1. 사용자에게 위험성 경고
  const confirmed = await new Promise((resolve) => {
    Alert.alert(
      '⚠️ 경고',
      '개인키를 노출하면 자산을 잃을 수 있습니다.\n\n' +
      '개인키를 절대로:\n' +
      '- 스크린샷으로 저장하지 마세요\n' +
      '- 다른 사람과 공유하지 마세요\n' +
      '- 클라우드에 저장하지 마세요',
      [
        { text: '취소', onPress: () => resolve(false) },
        { text: '이해했습니다', onPress: () => resolve(true) },
      ]
    );
  });

  if (!confirmed) return;

  try {
    // ✅ 2. 생체 인증 (자동으로 요청됨)
    const privateKey = await exportPrivateKey();

    // ✅ 3. 일정 시간 후 자동으로 숨기기
    showPrivateKeyModal(privateKey, {
      autoHideAfter: 60000, // 60초 후 자동 숨김
      disableScreenshot: true, // 스크린샷 방지 (Android)
    });

  } catch (error) {
    if (error.code === 'BIOMETRIC_FAILED') {
      Alert.alert('인증 실패', '생체 인증에 실패했습니다');
    }
  }
};
```

## 생체 인증 활용

```tsx
import { useBiometricAuth } from '@giwa/react-native-wallet';

function SecureAction() {
  const { authenticate, isAvailable, biometryType } = useBiometricAuth();

  const handleSensitiveAction = async () => {
    if (!isAvailable) {
      // 생체 인증 불가 시 PIN 등 대체 인증
      const pinValid = await verifyPin();
      if (!pinValid) return;
    } else {
      // 생체 인증
      const success = await authenticate({
        promptMessage: '트랜잭션을 승인하려면 인증하세요',
      });
      if (!success) return;
    }

    // 민감한 작업 실행
    await performSensitiveAction();
  };
}
```

## 트랜잭션 보안

### 주소 검증

```tsx
import { GiwaError, ErrorCodes } from '@giwa/react-native-wallet';

const validateAndSend = async (to: string, amount: string) => {
  // ✅ 1. 주소 형식 검증
  if (!/^0x[a-fA-F0-9]{40}$/.test(to)) {
    throw new GiwaError('유효하지 않은 주소 형식입니다', ErrorCodes.INVALID_ADDRESS);
  }

  // ✅ 2. 자신에게 전송 방지
  if (to.toLowerCase() === wallet.address.toLowerCase()) {
    Alert.alert('경고', '자신에게 전송하시겠습니까?');
  }

  // ✅ 3. 금액 검증
  const amountWei = parseEther(amount);
  if (amountWei <= 0n) {
    throw new GiwaError('금액은 0보다 커야 합니다');
  }

  // ✅ 4. 잔액 확인
  if (amountWei > balance) {
    throw new GiwaError('잔액이 부족합니다', ErrorCodes.INSUFFICIENT_FUNDS);
  }

  // ✅ 5. 큰 금액 전송 시 추가 확인
  const threshold = parseEther('1'); // 1 ETH
  if (amountWei >= threshold) {
    const confirmed = await confirmLargeTransaction(amount);
    if (!confirmed) return;
  }

  await sendTransaction({ to, value: amount });
};
```

### 트랜잭션 시뮬레이션

```tsx
const safeSendTransaction = async (tx) => {
  // ✅ 전송 전 시뮬레이션
  try {
    await estimateGas(tx);
  } catch (error) {
    Alert.alert(
      '트랜잭션 실패 예상',
      '이 트랜잭션은 실패할 것으로 예상됩니다. 계속하시겠습니까?'
    );
    return;
  }

  await sendTransaction(tx);
};
```

## 피싱 방지

### RPC URL 검증

```tsx
// SDK 내부에서 자동 검증
const ALLOWED_RPC_DOMAINS = [
  'giwa.io',
  'sepolia-rpc.giwa.io',
  'rpc.giwa.io',
];

// 커스텀 RPC 사용 시 경고
<GiwaProvider
  config={{
    network: 'mainnet',
    customRpcUrl: 'https://custom-rpc.example.com', // 경고 표시됨
  }}
>
```

### 컨트랙트 상호작용 검증

```tsx
// 알려진 컨트랙트 주소 확인
import { CONTRACT_ADDRESSES, getContractAddresses } from '@giwa/react-native-wallet';

const isOfficialContract = (address: string) => {
  const contracts = getContractAddresses('mainnet');
  return Object.values(contracts).includes(address.toLowerCase());
};

// 토큰 승인 전 확인
const safeApprove = async (tokenAddress: string, spender: string, amount: string) => {
  if (!isOfficialContract(spender)) {
    const confirmed = await Alert.alert(
      '⚠️ 알 수 없는 컨트랙트',
      `${spender}는 공식 GIWA 컨트랙트가 아닙니다.\n계속하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { text: '계속', style: 'destructive' },
      ]
    );
    if (!confirmed) return;
  }

  await approve(tokenAddress, spender, amount);
};
```

## 로깅 및 디버깅

### 안전한 로깅

```tsx
// ❌ 잘못된 예
console.log('개인키:', privateKey);
console.log('니모닉:', mnemonic);

// ✅ 올바른 예
console.log('지갑 생성 완료');
console.log('주소:', wallet.address); // 주소는 공개 정보

// ✅ 개발 환경에서만 로깅
if (__DEV__) {
  console.log('디버그 정보:', safeData);
}
```

### 에러 리포팅

```tsx
// ❌ 잘못된 예 - 민감 정보 포함
Sentry.captureException(error, {
  extra: { privateKey, mnemonic },
});

// ✅ 올바른 예 - 민감 정보 제외
Sentry.captureException(error, {
  extra: {
    walletAddress: wallet.address,
    network: config.network,
    errorCode: error.code,
  },
});
```

## 앱 보안 설정

### Android 보안

```java
// android/app/src/main/java/.../MainActivity.java
@Override
protected void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    // 스크린샷 방지
    getWindow().setFlags(
        WindowManager.LayoutParams.FLAG_SECURE,
        WindowManager.LayoutParams.FLAG_SECURE
    );
}
```

### iOS 보안

```swift
// ios/YourApp/AppDelegate.swift
func applicationWillResignActive(_ application: UIApplication) {
    // 앱 전환 시 화면 가리기
    let blurEffect = UIBlurEffect(style: .light)
    let blurView = UIVisualEffectView(effect: blurEffect)
    blurView.frame = window?.frame ?? CGRect.zero
    blurView.tag = 999
    window?.addSubview(blurView)
}

func applicationDidBecomeActive(_ application: UIApplication) {
    // 블러 제거
    window?.viewWithTag(999)?.removeFromSuperview()
}
```

## 보안 체크리스트

### 개발 시

- [ ] 개인키/니모닉 로깅 금지
- [ ] 하드코딩된 키 없음
- [ ] 에러 메시지에 민감 정보 없음
- [ ] 모든 입력값 검증

### 릴리스 전

- [ ] 디버그 로그 제거
- [ ] ProGuard/R8 난독화 적용
- [ ] SSL Pinning 설정
- [ ] 스크린샷 방지 활성화

### 사용자 교육

- [ ] 니모닉 백업 강조
- [ ] 개인키 공유 경고
- [ ] 피싱 사이트 주의
- [ ] 큰 금액 전송 시 주소 확인

## 다음 단계

- [API 레퍼런스](/docs/api/hooks) - 모든 Hook API
- [지갑 관리](/docs/guides/wallet-management) - 지갑 기능
