# Understanding GIWA Blockchain and SDK

This document provides a detailed explanation from blockchain fundamentals to GIWA Chain's technical architecture and the background of SDK development.

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

Blockchain is a form of **Distributed Ledger Technology (DLT)** where data is recorded and managed collectively by network participants rather than a central server.

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

| Characteristic          | Description                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------- |
| **Decentralization**    | Data is managed collectively by network participants rather than a single authority |
| **Immutability**        | Once recorded, data cannot be modified or deleted                                   |
| **Transparency**        | All transaction history is public and verifiable by anyone                          |
| **Consensus Mechanism** | The way network participants agree on data validity                                 |

### 1.3 Consensus Mechanism

The method by which blockchain networks create new blocks and verify transactions.

#### Proof of Work (PoW)

- Used by Bitcoin
- Obtains block creation rights by solving complex mathematical problems
- High energy consumption is a drawback

#### Proof of Stake (PoS)

- Used by Ethereum 2.0
- Obtains block creation rights by staking cryptocurrency as collateral
- Energy efficient but concerns about "rich get richer" structure

### 1.4 Transaction

The unit that records all state changes occurring on the blockchain.

```typescript
interface Transaction {
  from: string; // Sender address
  to: string; // Recipient address
  value: bigint; // Transfer amount (in wei)
  data: string; // Smart contract call data
  nonce: number; // Sender's transaction sequence number
  gasLimit: bigint; // Maximum gas usage
  gasPrice: bigint; // Price per gas
}
```

---

## 2. Ethereum and Smart Contracts

### 2.1 Ethereum

Ethereum is a **programmable blockchain** platform founded by Vitalik Buterin in 2015. Beyond simple value transfer, it enables complex business logic execution on the blockchain through **smart contracts**.

### 2.2 Ethereum Virtual Machine (EVM)

The EVM (Ethereum Virtual Machine) is a virtual computer that executes smart contracts.

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

A smart contract is an **automatically executing program** that performs predefined actions when specific conditions are met.

```solidity
// Solidity smart contract example
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

Gas is the unit of cost required to perform computations on Ethereum.

| Operation               | Gas Cost    |
| ----------------------- | ----------- |
| Addition/Subtraction    | 3 gas       |
| Multiplication/Division | 5 gas       |
| Storage Read            | 200 gas     |
| Storage Write           | 20,000 gas  |
| Contract Deployment     | 32,000+ gas |

```
Transaction Cost = Gas Used × Gas Price

Example: 21,000 gas × 20 Gwei = 0.00042 ETH
```

### 2.5 Ethereum's Limitations: Scalability Problem

Ethereum mainnet (Layer 1) has the following limitations:

| Problem                | Description                                                                     |
| ---------------------- | ------------------------------------------------------------------------------- |
| **Low TPS**            | Can only process about 15-30 transactions per second                            |
| **High Gas Fees**      | Gas fees can reach tens to hundreds of dollars during network congestion        |
| **Long Finality Time** | Block creation takes about 12 seconds, final confirmation takes several minutes |

**Layer 2 solutions** emerged to solve these problems.

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
│  - Provides final security                                       │
│  - Data Availability                                             │
│  - Dispute Resolution                                            │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Types of Layer 2

#### Optimistic Rollup

- **Principle**: Processes transactions "optimistically" assuming they are valid
- **Challenge Period**: Anyone can challenge fraudulent transactions for about 7 days
- **Representative Projects**: Optimism, Arbitrum, Base, **GIWA**
- **Advantages**: Excellent EVM compatibility, development convenience

#### ZK (Zero-Knowledge) Rollup

- **Principle**: Immediately proves transaction validity through cryptographic proofs
- **Representative Projects**: zkSync, StarkNet, Polygon zkEVM
- **Advantages**: Fast finality, high security
- **Disadvantages**: Limited EVM compatibility, complex development

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
│  - Store batch data                                          │
│  - Verify State Root (Optimistic: 7-day wait)                │
│  - Final Confirmation (Finality)                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.4 Advantages of Layer 2

| Item       | Layer 1 (Ethereum) | Layer 2 (GIWA)               |
| ---------- | ------------------ | ---------------------------- |
| TPS        | ~15-30             | ~2,000+                      |
| Gas Fee    | $5-100+            | $0.001-0.01                  |
| Block Time | ~12s               | ~1s                          |
| Finality   | Minutes            | Seconds (Flashblocks: 200ms) |

---

## 4. OP Stack and Optimistic Rollup

### 4.1 What is OP Stack?

OP Stack is a **modular open-source blockchain development framework** developed by Optimism. Anyone can use OP Stack to build their own Layer 2 chain.

### 4.2 OP Stack Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         OP Stack                                 │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Sequencer                                ││
│  │  - Determines transaction order                             ││
│  │  - Creates blocks                                           ││
│  │  - Submits batches to L1                                    ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Execution Engine                         ││
│  │  - EVM compatible execution environment                     ││
│  │  - op-geth (Geth fork)                                      ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Derivation Pipeline                       ││
│  │  - Reconstructs L2 state from L1 data                       ││
│  │  - op-node                                                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Bridge (Standard Bridge)                  ││
│  │  - L1 ↔ L2 asset transfer                                   ││
│  │  - Native bridge                                            ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 4.3 Major OP Stack Based Chains

| Chain          | Developer         | Features                             |
| -------------- | ----------------- | ------------------------------------ |
| **OP Mainnet** | Optimism          | Original OP Stack                    |
| **Base**       | Coinbase          | 100M+ user base                      |
| **GIWA**       | Upbit             | Korea's largest exchange integration |
| **Zora**       | Zora              | NFT specialized                      |
| **Mode**       | Mode Network      | DeFi specialized                     |
| **Worldchain** | World (Worldcoin) | Identity verification specialized    |

### 4.4 Superchain Vision

Superchain is a vision where OP Stack-based chains form an interoperable network.

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

**GIWA** is an Ethereum Layer 2 blockchain based on OP Stack that lowers the barrier to Web3 entry and provides infrastructure that anyone can easily use.

The name "GIWA" is derived from traditional Korean roof tiles (기와). Just as individual tiles are small pieces but together form a solid structure, many builders and ideas come together to form a robust Web3 ecosystem.

### 5.2 Core Values of GIWA

| Value                       | Description                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------------- |
| **Accessibility**           | Breaking down barriers that make Web3 feel difficult, providing infrastructure anyone can use |
| **Openness**                | An open Layer 2 not dependent on any specific entity, usable worldwide                        |
| **Builder Friendly**        | Documentation in Korean and English, developer onboarding support                             |
| **Institution Integration** | Connection with Upbit brings users, data, and rich liquidity to the Web3 ecosystem            |

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

| Feature                 | Description                                                   |
| ----------------------- | ------------------------------------------------------------- |
| **Fast Block Creation** | New block every 1 second (Ethereum: 12 seconds)               |
| **EVM Compatible**      | Deploy existing Solidity smart contracts without modification |
| **Low Fees**            | Gas fees approximately 90%+ cheaper than Ethereum             |
| **Flashblocks**         | ~200ms preconfirmation provided                               |
| **GIWA ID**             | ENS-based human-readable address system                       |
| **Dojang**              | EAS-based attestation system                                  |

### 5.5 Network Information

#### Testnet (GIWA Sepolia)

| Item                  | Value                                     |
| --------------------- | ----------------------------------------- |
| Chain ID              | `91342`                                   |
| Network Name          | GIWA Sepolia                              |
| RPC URL               | `https://sepolia-rpc.giwa.io`             |
| Flashblocks RPC       | `https://sepolia-rpc-flashblocks.giwa.io` |
| Flashblocks WebSocket | `wss://sepolia-rpc-flashblocks.giwa.io`   |
| Block Explorer        | `https://sepolia-explorer.giwa.io`        |
| Currency              | ETH                                       |
| Base Layer            | Ethereum Sepolia                          |

#### Mainnet (🚧 Under Development)

:::caution
Mainnet is currently under development. Please use **Testnet** for development and testing.
:::

| Item           | Value                |
| -------------- | -------------------- |
| Chain ID       | -                    |
| Network Name   | GIWA Mainnet         |
| RPC URL        | -                    |
| Block Explorer | -                    |
| Status         | 🚧 Under Development |

---

## 6. Flashblocks: Ultra-Fast Transaction Confirmation

### 6.1 What is Flashblocks?

Flashblocks is a **streaming block composition layer** developed by Flashbots that provides preconfirmations **every ~200-250ms** without waiting for the standard 2-second block time.

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

| Item               | Standard Confirmation | Flashblocks                  |
| ------------------ | --------------------- | ---------------------------- |
| Confirmation Time  | 2s                    | ~200ms                       |
| Trust Level        | Final                 | Preconfirmation (high trust) |
| Final Confirmation | Same time             | Final after 2s               |
| Use Cases          | General transactions  | Apps requiring real-time UX  |

### 6.4 Flashblocks Use Cases

```tsx
// Standard transaction (2s wait)
const receipt = await sendTransaction(tx);
// Confirmed after 2s

// Flashblocks usage (~200ms)
const { preconfirmation, result } = await flashblocks.sendTransaction(tx);
// Preconfirmation received after ~200ms
console.log("Preconfirmed!", preconfirmation.preconfirmedAt);

// Final confirmation after 2s
const finalReceipt = await result.wait();
```

### 6.5 Advantages of Flashblocks

| Advantage              | Description                                                    |
| ---------------------- | -------------------------------------------------------------- |
| **Instant Feedback**   | Provides almost immediate transaction confirmation to users    |
| **Enhanced UX**        | Suitable for apps requiring real-time response like games, DEX |
| **Maintains Security** | Final confirmation still completes after 2s with State Root    |
| **EVM Compatible**     | Can be used without modifying existing code                    |

---

## 7. GIWA React Native SDK Development Background

### 7.1 Why We Built This SDK

#### Problem Recognition

1. **Difficulty of Web3 Mobile Development**

   - Blockchain integration in React Native requires complex setup
   - Compatibility issues with web libraries like viem, ethers in React Native
   - Complexity of secure storage (Keychain/Keystore) integration

2. **Lack of GIWA Chain Specific Features**

   - Need to support GIWA-specific features like Flashblocks, GIWA ID, Dojang
   - Network configuration complexity

3. **Reduced Development Productivity**
   - Repetitive boilerplate code
   - Duplicated common logic for wallet management, transaction processing, etc.

#### Solution: giwa-react-native-wallet

```
┌─────────────────────────────────────────────────────────────────┐
│                    Before (Without SDK)                          │
│                                                                  │
│  App Code                                                        │
│     │                                                            │
│     ├── viem setup                                               │
│     ├── ethers setup                                             │
│     ├── Keychain/Keystore integration                            │
│     ├── Network configuration                                    │
│     ├── Wallet creation/recovery logic                           │
│     ├── Transaction processing logic                             │
│     ├── Token handling logic                                     │
│     ├── Bridge logic                                             │
│     └── Error handling                                           │
│                                                                  │
│  → Thousands of lines of boilerplate code                        │
└─────────────────────────────────────────────────────────────────┘

                              ▼

┌─────────────────────────────────────────────────────────────────┐
│                     After (With SDK)                             │
│                                                                  │
│  App Code                                                        │
│     │                                                            │
│     └── giwa-react-native-wallet                               │
│              │                                                   │
│              ├── useGiwaWallet()   → Wallet management           │
│              ├── useBalance()      → Balance query               │
│              ├── useTransaction()  → Transactions                │
│              ├── useFlashblocks()  → Ultra-fast confirmation     │
│              ├── useGiwaId()       → GIWA ID                     │
│              └── useDojang()       → Attestations                │
│                                                                  │
│  → Clean and intuitive Hook API                                  │
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

| Principle                       | Application                                                           |
| ------------------------------- | --------------------------------------------------------------------- |
| **DRY (Don't Repeat Yourself)** | Abstract common async patterns into `useAsyncAction`, `useAsyncQuery` |
| **SRP (Single Responsibility)** | Each Manager and Hook handles only a single responsibility            |
| **DIP (Dependency Inversion)**  | Platform abstraction through Adapter interfaces                       |
| **OCP (Open-Closed Principle)** | Structure open for extension, closed for modification                 |

### 7.3 SDK Key Features

#### Wallet Management

```tsx
const { wallet, createWallet, recoverWallet } = useGiwaWallet();

// Create new wallet
const { wallet, mnemonic } = await createWallet();

// Recover from seed phrase
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
  to: "0x...",
  value: parseEther("0.1"),
});

// After ~200ms
console.log("Preconfirmed!", preconfirmation.preconfirmedAt);
```

#### GIWA ID Resolution

```tsx
const { resolveAddress, resolveName } = useGiwaId();

const address = await resolveAddress("alice.giwa.id");
const name = await resolveName("0x...");
```

### 7.4 Platform Compatibility

```
┌─────────────────────────────────────────────────────────────────┐
│                    giwa-react-native-wallet                     │
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

The SDK automatically detects the execution environment and uses the appropriate native modules:

| Feature        | Expo                      | React Native CLI        |
| -------------- | ------------------------- | ----------------------- |
| Secure Storage | expo-secure-store         | react-native-keychain   |
| Biometric Auth | expo-local-authentication | react-native-biometrics |

### 7.5 Security Considerations

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Architecture                         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Application Layer                         ││
│  │  - Never store sensitive data in plaintext in memory         ││
│  │  - Remove mnemonic/private key from memory immediately       ││
│  │    after use                                                 ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Secure Storage                            ││
│  │                                                              ││
│  │  iOS: Keychain (Hardware-backed)                            ││
│  │  ├── kSecAttrAccessibleWhenUnlockedThisDeviceOnly           ││
│  │  └── Secure Enclave (if available)                          ││
│  │                                                              ││
│  │  Android: Keystore (Hardware-backed)                        ││
│  │  ├── AndroidKeyStore provider                               ││
│  │  └── StrongBox (if available)                               ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                    Biometric Protection                      ││
│  │  - Biometric authentication required for transaction signing ││
│  │  - Face ID / Touch ID / Fingerprint                         ││
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

GIWA Chain is an Ethereum Layer 2 based on OP Stack that lowers the barrier to Web3 entry and provides infrastructure that anyone can easily use for blockchain applications.

The `giwa-react-native-wallet` SDK is designed to easily leverage GIWA Chain features in React Native apps. It abstracts complex blockchain integration logic and provides an intuitive Hook API that allows developers to focus on business logic.

Just as GIWA (traditional Korean roof tiles) are small pieces that together form a solid roof, we hope this SDK will serve as a foundation for various applications to flourish on top of the GIWA ecosystem.
