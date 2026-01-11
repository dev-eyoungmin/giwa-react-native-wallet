---
sidebar_position: 1
---

# Understanding GIWA Blockchain and SDK

이 문서는 블록체인 기초부터 GIWA Chain의 기술 아키텍처와 SDK 개발 배경까지 상세하게 설명합니다.

---

## Table of Contents

1. [Blockchain Fundamentals](#1-blockchain-fundamentals)
2. [Ethereum and Smart Contracts](#2-ethereum-and-smart-contracts)
3. [Layer 2 Scaling Solutions](#3-layer-2-scaling-solutions)
4. [OP Stack and Optimistic Rollup](#4-op-stack-and-optimistic-rollup)
5. [Understanding GIWA Chain](#5-understanding-giwa-chain)
6. [Flashblocks: Ultra-Fast Transaction Confirmation](#6-flashblocks-ultra-fast-transaction-confirmation)
7. [GIWA React Native SDK Development Background](#7-giwa-react-native-sdk-development-background)
8. [References](#8-references)

---

## 1. Blockchain Fundamentals

### 1.1 What is Blockchain?

블록체인은 중앙 서버가 아닌 네트워크 참여자들이 공동으로 데이터를 기록하고 관리하는 **분산 원장 기술(DLT)**의 한 형태입니다.

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Block 1   │───▶│   Block 2   │───▶│   Block 3   │───▶│   Block N   │
│             │    │             │    │             │    │             │
│ - Hash      │    │ - Hash      │    │ - Hash      │    │ - Hash      │
│ - Prev Hash │    │ - Prev Hash │    │ - Prev Hash │    │ - Prev Hash │
│ - Txs       │    │ - Txs       │    │ - Txs       │    │ - Txs       │
│ - Timestamp │    │ - Timestamp │    │ - Timestamp │    │ - Timestamp │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
```

### 1.2 Key Characteristics

| 특성 | 설명 |
|------|------|
| **Decentralization** | 단일 권한이 아닌 네트워크 참여자들이 공동으로 데이터를 관리 |
| **Immutability** | 한 번 기록된 데이터는 수정하거나 삭제할 수 없음 |
| **Transparency** | 모든 거래 이력이 공개되어 누구나 검증 가능 |
| **Consensus Mechanism** | 네트워크 참여자들이 데이터의 유효성에 동의하는 방법 |

### 1.3 Consensus Mechanism

블록체인 네트워크가 새로운 블록을 생성하고 트랜잭션을 검증하는 방법입니다.

#### Proof of Work (PoW)
- 비트코인에서 사용
- 복잡한 수학 문제를 풀어 블록 생성 권한을 획득
- 높은 에너지 소비가 단점

#### Proof of Stake (PoS)
- 이더리움 2.0에서 사용
- 암호화폐를 담보로 스테이킹하여 블록 생성 권한을 획득
- 에너지 효율적이지만 "부익부" 구조에 대한 우려

### 1.4 Transaction

블록체인에서 발생하는 모든 상태 변경을 기록하는 단위입니다.

```typescript
interface Transaction {
  from: string;      // 발신자 주소
  to: string;        // 수신자 주소
  value: bigint;     // 전송 금액 (wei 단위)
  data: string;      // 스마트 컨트랙트 호출 데이터
  nonce: number;     // 발신자의 트랜잭션 순번
  gasLimit: bigint;  // 최대 가스 사용량
  gasPrice: bigint;  // 가스당 가격
}
```

---

## 2. Ethereum and Smart Contracts

### 2.1 Ethereum

이더리움은 비탈릭 부테린이 2015년에 설립한 **프로그래밍 가능한 블록체인** 플랫폼입니다. 단순한 가치 전송을 넘어 **스마트 컨트랙트**를 통해 복잡한 비즈니스 로직을 블록체인에서 실행할 수 있습니다.

### 2.2 Ethereum Virtual Machine (EVM)

EVM (Ethereum Virtual Machine)은 스마트 컨트랙트를 실행하는 가상 컴퓨터입니다.

```
┌─────────────────────────────────────────────────────────────┐
│                     Ethereum Network                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                         EVM                           │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │   │
│  │  │ Smart       │  │ Smart       │  │ Smart       │   │   │
│  │  │ Contract A  │  │ Contract B  │  │ Contract C  │   │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    World State                          │ │
│  │  Account 0x1234... : Balance: 10 ETH, Nonce: 5         │ │
│  │  Account 0x5678... : Balance: 25 ETH, Nonce: 12        │ │
│  │  Contract 0xABCD... : Code: 0x6080..., Storage: {...}  │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Smart Contract

스마트 컨트랙트는 특정 조건이 충족되면 사전 정의된 작업을 수행하는 **자동 실행 프로그램**입니다.

```solidity
// Solidity 스마트 컨트랙트 예제
contract SimpleToken {
    mapping(address => uint256) public balances;

    function transfer(address to, uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}
```

### 2.4 Gas

가스는 이더리움에서 연산을 수행하는 데 필요한 비용 단위입니다.

| 연산 | 가스 비용 |
|------|-----------|
| Addition/Subtraction | 3 gas |
| Multiplication/Division | 5 gas |
| Storage Read | 200 gas |
| Storage Write | 20,000 gas |
| Contract Deployment | 32,000+ gas |

```
Transaction Cost = Gas Used × Gas Price

Example: 21,000 gas × 20 Gwei = 0.00042 ETH
```

### 2.5 Ethereum's Limitations: Scalability Problem

이더리움 메인넷 (Layer 1)은 다음과 같은 한계가 있습니다:

| 문제 | 설명 |
|------|------|
| **Low TPS** | 초당 약 15-30건의 트랜잭션만 처리 가능 |
| **High Gas Fees** | 네트워크 혼잡 시 가스 비용이 수십~수백 달러에 달함 |
| **Long Finality Time** | 블록 생성에 약 12초, 최종 확인에 수 분 소요 |

이러한 문제를 해결하기 위해 **Layer 2 솔루션**이 등장했습니다.

---

## 3. Layer 2 Scaling Solutions

### 3.1 Layer 1 vs Layer 2

```
┌─────────────────────────────────────────────────────────────────┐
│                        Layer 2 (L2)                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   GIWA       │  │   Base       │  │   Arbitrum   │  ...      │
│  │   Chain      │  │              │  │   One        │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                    │
│         ▼                 ▼                 ▼                    │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              Data Availability & Settlement                 ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Layer 1 (Ethereum)                           │
│                                                                  │
│  - 최종 보안 제공                                                │
│  - 데이터 가용성                                                 │
│  - 분쟁 해결                                                     │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Types of Layer 2

#### Optimistic Rollup
- **원리**: 트랜잭션이 유효하다고 "낙관적으로" 가정하고 처리
- **챌린지 기간**: 약 7일간 부정한 트랜잭션에 대해 누구나 이의 제기 가능
- **대표 프로젝트**: Optimism, Arbitrum, Base, **GIWA**
- **장점**: 뛰어난 EVM 호환성, 개발 편의성

#### ZK (Zero-Knowledge) Rollup
- **원리**: 암호학적 증명을 통해 트랜잭션 유효성을 즉시 증명
- **대표 프로젝트**: zkSync, StarkNet, Polygon zkEVM
- **장점**: 빠른 최종성, 높은 보안성
- **단점**: 제한된 EVM 호환성, 복잡한 개발

### 3.3 How Rollups Work

```
┌─────────────────────────────────────────────────────────────┐
│                    Layer 2 Rollup                            │
│                                                              │
│  1. Collect user transactions                                │
│     ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                         │
│     │ Tx1 │ │ Tx2 │ │ Tx3 │ │ Tx4 │  ...                    │
│     └─────┘ └─────┘ └─────┘ └─────┘                         │
│                      │                                       │
│                      ▼                                       │
│  2. Create transaction batch                                 │
│     ┌─────────────────────────────────────┐                 │
│     │ Batch: [Tx1, Tx2, Tx3, Tx4, ...]    │                 │
│     │ State Root: 0xabc123...             │                 │
│     └─────────────────────────────────────┘                 │
│                      │                                       │
│                      ▼                                       │
│  3. Submit compressed data to L1                             │
│     ┌─────────────────────────────────────┐                 │
│     │ Compressed Calldata + State Root    │                 │
│     └─────────────────────────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    Layer 1 (Ethereum)                        │
│                                                              │
│  - 배치 데이터 저장                                          │
│  - State Root 검증 (Optimistic: 7일 대기)                    │
│  - 최종 확인 (Finality)                                      │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Advantages of Layer 2

| 항목 | Layer 1 (Ethereum) | Layer 2 (GIWA) |
|------|-------------------|----------------|
| TPS | ~15-30 | ~2,000+ |
| Gas Fee | $5-100+ | $0.001-0.01 |
| Block Time | ~12s | ~1s |
| Finality | 수 분 | 수 초 (Flashblocks: 200ms) |

---

## 4. OP Stack and Optimistic Rollup

### 4.1 What is OP Stack?

OP Stack은 Optimism에서 개발한 **모듈식 오픈소스 블록체인 개발 프레임워크**입니다. 누구나 OP Stack을 사용하여 자신만의 Layer 2 체인을 구축할 수 있습니다.

### 4.2 OP Stack Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         OP Stack                                 │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Sequencer                                ││
│  │  - 트랜잭션 순서 결정                                       ││
│  │  - 블록 생성                                                ││
│  │  - L1에 배치 제출                                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Execution Engine                         ││
│  │  - EVM 호환 실행 환경                                       ││
│  │  - op-geth (Geth 포크)                                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Derivation Pipeline                       ││
│  │  - L1 데이터로부터 L2 상태 재구성                           ││
│  │  - op-node                                                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Bridge (Standard Bridge)                  ││
│  │  - L1 ↔ L2 자산 전송                                        ││
│  │  - 네이티브 브릿지                                          ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Major OP Stack Based Chains

| 체인 | 개발사 | 특징 |
|------|--------|------|
| **OP Mainnet** | Optimism | 오리지널 OP Stack |
| **Base** | Coinbase | 1억+ 사용자 기반 |
| **GIWA** | Upbit | 한국 최대 거래소 연동 |
| **Zora** | Zora | NFT 특화 |
| **Mode** | Mode Network | DeFi 특화 |
| **Worldchain** | World (Worldcoin) | 신원 인증 특화 |

### 4.4 Superchain Vision

Superchain은 OP Stack 기반 체인들이 상호운용 가능한 네트워크를 형성하는 비전입니다.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Superchain                                │
│                                                                  │
│   ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐            │
│   │  GIWA   │  │  Base   │  │  Zora   │  │  Mode   │  ...       │
│   └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘            │
│        │            │            │            │                  │
│        └────────────┴────────────┴────────────┘                  │
│                         │                                        │
│                         ▼                                        │
│              ┌─────────────────────┐                             │
│              │ Cross-Chain Messaging │                           │
│              │ Shared Sequencing     │                           │
│              │ Unified Liquidity     │                           │
│              └─────────────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Understanding GIWA Chain

### 5.1 What is GIWA?

**GIWA**는 OP Stack 기반의 이더리움 Layer 2 블록체인으로, Web3 진입 장벽을 낮추고 누구나 쉽게 사용할 수 있는 인프라를 제공합니다.

"GIWA"라는 이름은 한국 전통 기와에서 유래했습니다. 개별 기와는 작은 조각이지만 함께 모이면 견고한 구조물을 형성하듯이, 많은 빌더와 아이디어가 모여 견고한 Web3 생태계를 형성합니다.

### 5.2 Core Values of GIWA

| 가치 | 설명 |
|------|------|
| **Accessibility** | Web3가 어렵게 느껴지는 장벽을 허물고, 누구나 사용할 수 있는 인프라 제공 |
| **Openness** | 특정 주체에 의존하지 않는 오픈 Layer 2, 전 세계적으로 사용 가능 |
| **Builder Friendly** | 한국어와 영어 문서, 개발자 온보딩 지원 |
| **Institution Integration** | 업비트와의 연결로 사용자, 데이터, 풍부한 유동성을 Web3 생태계로 |

### 5.3 Technical Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       GIWA Chain                                 │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                     Applications                             ││
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         ││
│  │  │ DeFi    │  │ NFT     │  │ Gaming  │  │ Social  │  ...    ││
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘         ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    GIWA Features                             ││
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          ││
│  │  │ GIWA ID     │  │ Dojang      │  │ Flashblocks │          ││
│  │  │ (ENS-based) │  │ (EAS-based) │  │ (~200ms)    │          ││
│  │  └─────────────┘  └─────────────┘  └─────────────┘          ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    OP Stack (Bedrock)                        ││
│  │  - Sequencer      - Execution Engine (op-geth)              ││
│  │  - Derivation     - Standard Bridge                         ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Ethereum Sepolia (Testnet)                    │
│                    Ethereum Mainnet (Mainnet)                    │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 Technical Features of GIWA

| 특징 | 설명 |
|------|------|
| **Fast Block Creation** | 매 1초마다 새 블록 (이더리움: 12초) |
| **EVM Compatible** | 기존 Solidity 스마트 컨트랙트를 수정 없이 배포 가능 |
| **Low Fees** | 이더리움 대비 약 90% 이상 저렴한 가스 비용 |
| **Flashblocks** | ~200ms 사전 확인 제공 |
| **GIWA ID** | ENS 기반 사람이 읽을 수 있는 주소 시스템 |
| **Dojang** | EAS 기반 증명 시스템 |

### 5.5 Network Information

#### Testnet (GIWA Sepolia)

| 항목 | 값 |
|------|-----|
| Chain ID | `91342` |
| Network Name | GIWA Sepolia |
| RPC URL | `https://sepolia-rpc.giwa.io` |
| Flashblocks RPC | `https://sepolia-rpc-flashblocks.giwa.io` |
| Flashblocks WebSocket | `wss://sepolia-rpc-flashblocks.giwa.io` |
| Block Explorer | `https://sepolia-explorer.giwa.io` |
| Currency | ETH |
| Base Layer | Ethereum Sepolia |

#### Mainnet (Coming Soon)

| 항목 | 값 |
|------|-----|
| Chain ID | `91341` (잠정) |
| Network Name | GIWA Mainnet |
| RPC URL | `https://rpc.giwa.io` |
| Block Explorer | `https://explorer.giwa.io` |
| Currency | ETH |
| Base Layer | Ethereum Mainnet |

---

## 6. Flashblocks: Ultra-Fast Transaction Confirmation

### 6.1 What is Flashblocks?

Flashblocks는 Flashbots에서 개발한 **스트리밍 블록 구성 레이어**로, 표준 2초 블록 시간을 기다리지 않고 **약 200-250ms마다** 사전 확인을 제공합니다.

### 6.2 How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                    Standard Block (2s)                           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                      Full Block                          │   │
│  │                                                          │   │
│  │  Flashblock 1  Flashblock 2  Flashblock 3  Flashblock 4  │   │
│  │  (0-250ms)     (250-500ms)   (500-750ms)   (750-1000ms)  │   │
│  │                                                          │   │
│  │  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   │   │
│  │  │ Tx1,Tx2 │   │ Tx3,Tx4 │   │ Tx5,Tx6 │   │ Tx7,Tx8 │   │   │
│  │  └─────────┘   └─────────┘   └─────────┘   └─────────┘   │   │
│  │       │             │             │             │        │   │
│  │       ▼             ▼             ▼             ▼        │   │
│  │  Preconfirm   Preconfirm   Preconfirm   Preconfirm      │   │
│  │  (~200ms)     (~450ms)     (~700ms)     (~950ms)        │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│                    Final Block with State Root                   │
│                         (Finalized after 2s)                     │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Flashblocks vs Standard Confirmation

| 항목 | Standard Confirmation | Flashblocks |
|------|----------------------|-------------|
| Confirmation Time | 2s | ~200ms |
| Trust Level | Final | Preconfirmation (높은 신뢰) |
| Final Confirmation | 동일 시간 | 2초 후 최종 |
| Use Cases | 일반 트랜잭션 | 실시간 UX가 필요한 앱 |

### 6.4 Flashblocks Use Cases

```tsx
// 표준 트랜잭션 (2초 대기)
const receipt = await sendTransaction(tx);
// 2초 후 확인

// Flashblocks 사용 (~200ms)
const { preconfirmation, result } = await flashblocks.sendTransaction(tx);
// ~200ms 후 사전 확인
console.log('Preconfirmed!', preconfirmation.preconfirmedAt);

// 2초 후 최종 확인
const finalReceipt = await result.wait();
```

### 6.5 Advantages of Flashblocks

| 장점 | 설명 |
|------|------|
| **Instant Feedback** | 사용자에게 거의 즉각적인 트랜잭션 확인 제공 |
| **Enhanced UX** | 게임, DEX와 같이 실시간 응답이 필요한 앱에 적합 |
| **Maintains Security** | 최종 확인은 여전히 2초 후 State Root와 함께 완료 |
| **EVM Compatible** | 기존 코드를 수정하지 않고 사용 가능 |

---

## 7. GIWA React Native SDK Development Background

### 7.1 Why We Built This SDK

#### Problem Recognition

1. **Web3 모바일 개발의 어려움**
   - React Native에서 블록체인 통합은 복잡한 설정이 필요
   - React Native에서 viem, ethers와 같은 웹 라이브러리의 호환성 문제
   - 보안 저장소 (Keychain/Keystore) 통합의 복잡성

2. **GIWA Chain 특화 기능 부재**
   - Flashblocks, GIWA ID, Dojang과 같은 GIWA 특화 기능 지원 필요
   - 네트워크 설정의 복잡성

3. **개발 생산성 저하**
   - 반복되는 보일러플레이트 코드
   - 지갑 관리, 트랜잭션 처리 등의 공통 로직 중복

#### Solution: @giwa/react-native-wallet

```
┌─────────────────────────────────────────────────────────────────┐
│                    Before (Without SDK)                          │
│                                                                  │
│  App Code                                                        │
│     │                                                            │
│     ├── viem 설정                                                │
│     ├── ethers 설정                                              │
│     ├── Keychain/Keystore 통합                                   │
│     ├── 네트워크 설정                                            │
│     ├── 지갑 생성/복구 로직                                      │
│     ├── 트랜잭션 처리 로직                                       │
│     ├── 토큰 처리 로직                                           │
│     ├── 브릿지 로직                                              │
│     └── 에러 처리                                                │
│                                                                  │
│  → 수천 줄의 보일러플레이트 코드                                  │
└─────────────────────────────────────────────────────────────────┘

                              ▼

┌─────────────────────────────────────────────────────────────────┐
│                     After (With SDK)                             │
│                                                                  │
│  App Code                                                        │
│     │                                                            │
│     └── @giwa/react-native-wallet                               │
│              │                                                   │
│              ├── useGiwaWallet()   → 지갑 관리                   │
│              ├── useBalance()      → 잔액 조회                   │
│              ├── useTransaction()  → 트랜잭션                    │
│              ├── useFlashblocks()  → 초고속 확인                 │
│              ├── useGiwaId()       → GIWA ID                     │
│              └── useDojang()       → 증명서                      │
│                                                                  │
│  → 깔끔하고 직관적인 Hook API                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 SDK Design Principles

#### Clean Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Presentation Layer                        │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  React Hooks (useGiwaWallet, useBalance, useTransaction...) ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Domain Layer                              │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Managers (WalletManager, TokenManager, BridgeManager...)   ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Infrastructure Layer                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │  Adapters (SecureStorage, Biometric)                        ││
│  │  GiwaClient (viem wrapper)                                  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

#### Core Design Principles

| 원칙 | 적용 |
|------|------|
| **DRY (Don't Repeat Yourself)** | 공통 비동기 패턴을 `useAsyncAction`, `useAsyncQuery`로 추상화 |
| **SRP (Single Responsibility)** | 각 Manager와 Hook이 단일 책임만 처리 |
| **DIP (Dependency Inversion)** | Adapter 인터페이스를 통한 플랫폼 추상화 |
| **OCP (Open-Closed Principle)** | 확장에는 열려있고, 수정에는 닫혀있는 구조 |

### 7.3 SDK Key Features

#### Wallet Management
```tsx
const { wallet, createWallet, recoverWallet } = useGiwaWallet();

// 새 지갑 생성
const { wallet, mnemonic } = await createWallet();

// 시드 구문으로 복구
const recoveredWallet = await recoverWallet(mnemonic);
```

#### Balance Query
```tsx
const { balance, formattedBalance, refetch } = useBalance();
// balance: 1000000000000000000n (wei)
// formattedBalance: "1.0" (ETH)
```

#### Flashblocks Transaction
```tsx
const { sendTransaction } = useFlashblocks();

const { preconfirmation, result } = await sendTransaction({
  to: '0x...',
  value: parseEther('0.1'),
});

// ~200ms 후
console.log('Preconfirmed!', preconfirmation.preconfirmedAt);
```

#### GIWA ID Resolution
```tsx
const { resolveAddress, resolveName } = useGiwaId();

const address = await resolveAddress('alice.giwa.id');
const name = await resolveName('0x...');
```

### 7.4 Platform Compatibility

```
┌─────────────────────────────────────────────────────────────────┐
│                    @giwa/react-native-wallet                     │
│                                                                  │
│  ┌───────────────────────┐    ┌───────────────────────┐         │
│  │        Expo           │    │    React Native CLI   │         │
│  │                       │    │                       │         │
│  │  expo-secure-store    │    │  react-native-keychain│         │
│  │  expo-local-auth      │    │  react-native-biometrics│       │
│  └───────────────────────┘    └───────────────────────┘         │
│              │                          │                        │
│              └──────────┬───────────────┘                        │
│                         │                                        │
│                         ▼                                        │
│              ┌─────────────────────┐                             │
│              │   Adapter Factory   │                             │
│              │   (Auto Detection)  │                             │
│              └─────────────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
```

SDK는 실행 환경을 자동으로 감지하고 적절한 네이티브 모듈을 사용합니다:

| 기능 | Expo | React Native CLI |
|------|------|------------------|
| Secure Storage | expo-secure-store | react-native-keychain |
| Biometric Auth | expo-local-authentication | react-native-biometrics |

### 7.5 Security Considerations

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Architecture                         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Application Layer                         ││
│  │  - 민감한 데이터를 메모리에 평문으로 저장하지 않음          ││
│  │  - 사용 직후 메모리에서 니모닉/개인키 제거                  ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Secure Storage                            ││
│  │                                                              ││
│  │  iOS: Keychain (Hardware-backed)                            ││
│  │  ├── kSecAttrAccessibleWhenUnlockedThisDeviceOnly           ││
│  │  └── Secure Enclave (가능한 경우)                           ││
│  │                                                              ││
│  │  Android: Keystore (Hardware-backed)                        ││
│  │  ├── AndroidKeyStore 제공자                                 ││
│  │  └── StrongBox (가능한 경우)                                ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Biometric Protection                      ││
│  │  - 트랜잭션 서명 시 생체 인증 필요                          ││
│  │  - Face ID / Touch ID / 지문                                ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. References

### Official Documentation

- [GIWA Official Documentation](https://docs.giwa.io)
- [Optimism Documentation](https://docs.optimism.io)
- [OP Stack Documentation](https://stack.optimism.io)
- [Ethereum Official Documentation](https://ethereum.org/developers)

### Technical Resources

- [Flashblocks Deep Dive - Optimism](https://www.optimism.io/blog/flashblocks-deep-dive-250ms-preconfirmations-on-op-mainnet)
- [Flashblocks Deep Dive: How we made Base 10x faster](https://blog.base.dev/flashblocks-deep-dive)
- [OP Stack Flashblocks and the Evolution of L2 Architecture - Gelato](https://gelato.cloud/blog/op-stack-flashblocks-and-the-evolution-of-l2-architecture)
- [How Do Optimistic Rollups Work - Alchemy](https://www.alchemy.com/overviews/optimistic-rollups)
- [L2BEAT - Layer 2 Ecosystem Status](https://l2beat.com/)

### Development Tools

- [viem - TypeScript Ethereum Library](https://viem.sh)
- [wagmi - React Hooks for Ethereum](https://wagmi.sh)

---

## Conclusion

GIWA Chain은 OP Stack 기반의 이더리움 Layer 2로, Web3 진입 장벽을 낮추고 누구나 쉽게 블록체인 애플리케이션을 사용할 수 있는 인프라를 제공합니다.

`@giwa/react-native-wallet` SDK는 React Native 앱에서 GIWA Chain 기능을 쉽게 활용할 수 있도록 설계되었습니다. 복잡한 블록체인 통합 로직을 추상화하고, 개발자가 비즈니스 로직에 집중할 수 있도록 직관적인 Hook API를 제공합니다.

기와가 작은 조각들이 모여 견고한 지붕을 형성하듯이, 이 SDK가 GIWA 생태계 위에서 다양한 애플리케이션이 꽃필 수 있는 기반이 되기를 바랍니다.
