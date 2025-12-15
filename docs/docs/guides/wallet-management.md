---
sidebar_position: 1
---

# 지갑 관리

GIWA SDK의 지갑 생성, 복구, 관리 기능을 설명합니다.

## useGiwaWallet Hook

```tsx
import { useGiwaWallet } from '@giwa/react-native-wallet';

function WalletScreen() {
  const {
    wallet,           // 현재 지갑 정보
    isLoading,        // 로딩 상태
    error,            // 에러 정보
    createWallet,     // 새 지갑 생성
    recoverWallet,    // 니모닉으로 복구
    importPrivateKey, // 개인키로 가져오기
    exportPrivateKey, // 개인키 내보내기
    disconnect,       // 지갑 연결 해제
  } = useGiwaWallet();

  // ...
}
```

## 새 지갑 생성

```tsx
const handleCreate = async () => {
  try {
    const { wallet, mnemonic } = await createWallet();

    console.log('주소:', wallet.address);
    console.log('니모닉:', mnemonic); // 12단어 복구 구문

    // 중요: 니모닉을 사용자에게 보여주고 안전하게 백업하도록 안내
    // 니모닉은 한 번만 표시되며, SDK 내부에 저장되지 않습니다
  } catch (error) {
    console.error('지갑 생성 실패:', error.message);
  }
};
```

:::warning 니모닉 보안
니모닉(복구 구문)은 지갑 생성 시 단 한 번만 반환됩니다. SDK는 니모닉을 저장하지 않으므로, 사용자가 반드시 안전한 곳에 백업하도록 안내해야 합니다.
:::

## 지갑 복구

### 니모닉으로 복구

```tsx
const handleRecover = async () => {
  const mnemonic = 'apple banana cherry ...'; // 12단어

  try {
    const wallet = await recoverWallet(mnemonic);
    console.log('복구된 주소:', wallet.address);
  } catch (error) {
    if (error.code === 'INVALID_MNEMONIC') {
      Alert.alert('오류', '유효하지 않은 복구 구문입니다');
    }
  }
};
```

### 개인키로 가져오기

```tsx
const handleImport = async () => {
  const privateKey = '0x...'; // 64자 hex 문자열

  try {
    const wallet = await importPrivateKey(privateKey);
    console.log('가져온 주소:', wallet.address);
  } catch (error) {
    Alert.alert('오류', '유효하지 않은 개인키입니다');
  }
};
```

## 개인키 내보내기

:::danger 주의
개인키 내보내기는 민감한 작업입니다. 반드시 생체 인증 또는 추가 확인 후 실행하세요.
:::

```tsx
const handleExport = async () => {
  try {
    // 생체 인증이 설정된 경우 자동으로 요청됨
    const privateKey = await exportPrivateKey();

    // 화면에 직접 표시하지 말고, 안전한 방식으로 전달
    Alert.alert('개인키', privateKey, [
      { text: '복사', onPress: () => copyToClipboard(privateKey) },
    ]);
  } catch (error) {
    if (error.code === 'BIOMETRIC_FAILED') {
      Alert.alert('인증 실패', '생체 인증에 실패했습니다');
    }
  }
};
```

## 지갑 연결 해제

```tsx
const handleDisconnect = async () => {
  Alert.alert(
    '지갑 연결 해제',
    '정말로 연결을 해제하시겠습니까? 복구 구문이 없으면 지갑을 복구할 수 없습니다.',
    [
      { text: '취소', style: 'cancel' },
      {
        text: '해제',
        style: 'destructive',
        onPress: async () => {
          await disconnect();
        },
      },
    ]
  );
};
```

## 지갑 상태 확인

```tsx
function WalletStatus() {
  const { wallet, isLoading, error } = useGiwaWallet();

  if (isLoading) {
    return <ActivityIndicator />;
  }

  if (error) {
    return <Text>오류: {error.message}</Text>;
  }

  if (!wallet) {
    return <Text>지갑이 연결되지 않았습니다</Text>;
  }

  return (
    <View>
      <Text>주소: {wallet.address}</Text>
      <Text>연결됨: {wallet.isConnected ? '예' : '아니오'}</Text>
    </View>
  );
}
```

## 전체 예제

```tsx
import { useState } from 'react';
import { View, Text, Button, TextInput, Alert } from 'react-native';
import { useGiwaWallet } from '@giwa/react-native-wallet';

export function WalletManager() {
  const {
    wallet,
    createWallet,
    recoverWallet,
    exportPrivateKey,
    disconnect,
    isLoading,
  } = useGiwaWallet();

  const [mnemonicInput, setMnemonicInput] = useState('');
  const [showRecover, setShowRecover] = useState(false);

  if (wallet) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 16, marginBottom: 10 }}>지갑 연결됨</Text>
        <Text selectable style={{ fontFamily: 'monospace', marginBottom: 20 }}>
          {wallet.address}
        </Text>

        <Button title="개인키 내보내기" onPress={exportPrivateKey} />
        <Button title="연결 해제" onPress={disconnect} color="red" />
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      <Button
        title="새 지갑 생성"
        onPress={async () => {
          const { mnemonic } = await createWallet();
          Alert.alert('백업 필요', `복구 구문:\n\n${mnemonic}`);
        }}
        disabled={isLoading}
      />

      <Button
        title="기존 지갑 복구"
        onPress={() => setShowRecover(!showRecover)}
      />

      {showRecover && (
        <>
          <TextInput
            placeholder="12단어 복구 구문 입력"
            value={mnemonicInput}
            onChangeText={setMnemonicInput}
            multiline
            style={{
              borderWidth: 1,
              borderColor: '#ccc',
              padding: 10,
              marginVertical: 10,
            }}
          />
          <Button
            title="복구"
            onPress={() => recoverWallet(mnemonicInput)}
            disabled={isLoading || !mnemonicInput}
          />
        </>
      )}
    </View>
  );
}
```

## 다음 단계

- [트랜잭션](/docs/guides/transactions) - ETH 전송하기
- [토큰](/docs/guides/tokens) - ERC-20 토큰 관리
- [보안](/docs/guides/security) - 보안 모범 사례
