---
sidebar_position: 3
---

# Core API

GIWA SDK의 Core 모듈 API 레퍼런스입니다. 이 모듈들은 Hook 외부에서 직접 사용할 수 있습니다.

## GiwaClient

viem 기반 블록체인 클라이언트

```tsx
import { GiwaClient } from '@giwa/react-native-wallet';

const client = new GiwaClient({
  network: 'testnet',
  customRpcUrl?: string,
});
```

### 메서드

```tsx
// Public Client (읽기 전용)
client.getPublicClient(): PublicClient

// Wallet Client (서명 필요)
client.getWalletClient(privateKey: string): WalletClient

// 네트워크 정보
client.getNetwork(): NetworkInfo

// 블록 번호
client.getBlockNumber(): Promise<bigint>

// 잔액 조회
client.getBalance(address: string): Promise<bigint>

// 트랜잭션 조회
client.getTransaction(hash: string): Promise<Transaction | null>

// 트랜잭션 영수증
client.getTransactionReceipt(hash: string): Promise<TransactionReceipt | null>
```

---

## WalletManager

지갑 생성 및 관리

```tsx
import { WalletManager } from '@giwa/react-native-wallet';

const walletManager = new WalletManager(secureStorage, biometricAuth);
```

### 메서드

```tsx
// 새 지갑 생성
walletManager.createWallet(): Promise<{
  address: string;
  mnemonic: string;
}>

// 니모닉으로 복구
walletManager.recoverFromMnemonic(mnemonic: string): Promise<{
  address: string;
}>

// 개인키로 가져오기
walletManager.importFromPrivateKey(privateKey: string): Promise<{
  address: string;
}>

// 개인키 내보내기 (생체 인증 필요)
walletManager.exportPrivateKey(): Promise<string>

// 현재 지갑 정보
walletManager.getCurrentWallet(): Promise<WalletInfo | null>

// 지갑 삭제
walletManager.deleteWallet(): Promise<void>

// 지갑 존재 여부
walletManager.hasWallet(): Promise<boolean>
```

---

## TokenManager

ERC-20 토큰 관리

```tsx
import { TokenManager } from '@giwa/react-native-wallet';

const tokenManager = new TokenManager(publicClient, walletClient);
```

### 메서드

```tsx
// 토큰 정보 조회
tokenManager.getTokenInfo(tokenAddress: string): Promise<TokenInfo>

// 토큰 잔액 조회
tokenManager.getBalance(
  tokenAddress: string,
  ownerAddress: string
): Promise<bigint>

// 토큰 전송
tokenManager.transfer(
  tokenAddress: string,
  to: string,
  amount: bigint
): Promise<string>

// 승인
tokenManager.approve(
  tokenAddress: string,
  spender: string,
  amount: bigint
): Promise<string>

// 승인량 조회
tokenManager.allowance(
  tokenAddress: string,
  owner: string,
  spender: string
): Promise<bigint>
```

---

## BridgeManager

L1↔L2 브릿지 관리

```tsx
import { BridgeManager } from '@giwa/react-native-wallet';

const bridgeManager = new BridgeManager(l1Client, l2Client, walletClient);
```

### 메서드

```tsx
// L1 → L2 입금
bridgeManager.deposit(params: {
  amount: bigint;
  token: 'ETH' | string;
}): Promise<{
  l1TxHash: string;
  estimatedTime: number;
}>

// L2 → L1 출금
bridgeManager.withdraw(params: {
  amount: bigint;
  token: 'ETH' | string;
}): Promise<{
  l2TxHash: string;
  estimatedTime: number;
}>

// 입금 상태 조회
bridgeManager.getDepositStatus(l1TxHash: string): Promise<DepositStatus>

// 출금 상태 조회
bridgeManager.getWithdrawStatus(l2TxHash: string): Promise<WithdrawStatus>

// 수수료 추정
bridgeManager.estimateFees(params: {
  direction: 'deposit' | 'withdraw';
  amount: bigint;
  token: 'ETH' | string;
}): Promise<FeeEstimate>
```

---

## FlashblocksManager

Flashblocks 관리

```tsx
import { FlashblocksManager } from '@giwa/react-native-wallet';

const flashblocksManager = new FlashblocksManager(client, walletClient);
```

### 메서드

```tsx
// Flashblocks 트랜잭션 전송
flashblocksManager.sendTransaction(tx: {
  to: string;
  value: bigint;
  data?: string;
}): Promise<{
  preconfirmation: Preconfirmation;
  result: TransactionResult;
}>

// 사용 가능 여부
flashblocksManager.isAvailable(): boolean

// 평균 지연 시간
flashblocksManager.getAverageLatency(): number
```

---

## GiwaIdManager

GIWA ID (ENS) 관리

```tsx
import { GiwaIdManager } from '@giwa/react-native-wallet';

const giwaIdManager = new GiwaIdManager(client);
```

### 메서드

```tsx
// 이름 → 주소
giwaIdManager.resolveAddress(name: string): Promise<string | null>

// 주소 → 이름
giwaIdManager.resolveName(address: string): Promise<string | null>

// 이름 사용 가능 여부
giwaIdManager.isNameAvailable(name: string): Promise<boolean>

// 이름 등록
giwaIdManager.register(
  name: string,
  duration: number
): Promise<{ txHash: string }>

// 프로필 조회
giwaIdManager.getProfile(name: string): Promise<Profile>

// 프로필 설정
giwaIdManager.setProfile(profile: Partial<Profile>): Promise<string>
```

---

## DojangManager

Dojang 증명 관리

```tsx
import { DojangManager } from '@giwa/react-native-wallet';

const dojangManager = new DojangManager(client);
```

### 메서드

```tsx
// 증명 조회
dojangManager.getAttestation(id: string): Promise<Attestation>

// 증명 목록 조회
dojangManager.getAttestations(filter: {
  recipient?: string;
  attester?: string;
  schemaId?: string;
}): Promise<Attestation[]>

// 증명 검증
dojangManager.verifyAttestation(id: string): Promise<boolean>

// 증명 생성 (발급자만)
dojangManager.createAttestation(params: {
  schemaId: string;
  recipient: string;
  data: Record<string, any>;
  expirationTime?: number;
  revocable?: boolean;
}): Promise<{ attestationId: string; txHash: string }>

// 증명 취소 (발급자만)
dojangManager.revokeAttestation(id: string): Promise<string>
```

---

## AdapterFactory

어댑터 팩토리

```tsx
import { AdapterFactory, getAdapterFactory } from '@giwa/react-native-wallet';

// 싱글톤 인스턴스
const factory = getAdapterFactory();

// 또는 직접 생성
const factory = new AdapterFactory({
  forceEnvironment?: 'expo' | 'react-native',
});
```

### 메서드

```tsx
// 환경 감지
factory.detectEnvironment(): 'expo' | 'react-native'

// 어댑터 생성
factory.createAdapters(): Promise<Adapters>

// 개별 어댑터
factory.getSecureStorage(): ISecureStorage
factory.getBiometricAuth(): IBiometricAuth
factory.getClipboard(): IClipboard
```

### Adapters 타입

```tsx
interface Adapters {
  secureStorage: ISecureStorage;
  biometricAuth: IBiometricAuth;
  clipboard: IClipboard;
}
```
