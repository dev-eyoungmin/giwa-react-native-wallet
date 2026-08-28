import type { Address, Hex } from 'viem';
import type { NetworkType } from '../types/network';

/**
 * Shared zero address constant, used as the "TBD / not deployed" placeholder
 * across contract address tables and network validation.
 */
export const ZERO_ADDRESS: Address = '0x0000000000000000000000000000000000000000';

export interface ContractAddresses {
  // Bridge – L2 predeploys + L1 (Ethereum Sepolia) OP Stack contracts
  l1StandardBridge: Address;
  l2StandardBridge: Address;
  optimismPortal: Address;
  l1CrossDomainMessenger: Address;
  disputeGameFactory: Address;
  // GIWA ID (up.id) – L2 name registry
  upnameRegistry: Address;
  // EAS (Dojang)
  eas: Address;
  schemaRegistry: Address;
  dojangScroll: Address;
  attestationIndexer: Address;
  schemaBook: Address;
  dojangAttesterBook: Address;
  // Tokens
  weth: Address;
  // Utility
  multicall3: Address;
}

export const CONTRACT_ADDRESSES: Record<NetworkType, ContractAddresses> = {
  testnet: {
    // Bridge - L1 (Ethereum Sepolia) OP Stack contracts + L2 predeploy
    l1StandardBridge: '0x77b2ffc0F57598cAe1DB76cb398059cF5d10A7E7' as Address,
    l2StandardBridge: '0x4200000000000000000000000000000000000010' as Address,
    optimismPortal: '0x956962C34687A954e611A83619ABaA37Ce6bC78A' as Address,
    l1CrossDomainMessenger: '0x23ce19ED800fbbC964B9350b01B9113a8508D3F1' as Address,
    disputeGameFactory: '0x37347caB2afaa49B776372279143D71ad1f354F6' as Address,

    // GIWA ID (up.id) - L2 name registry
    upnameRegistry: '0x091D00004f21eb2Fc30964A8a4995692d9b49628' as Address,

    // EAS - Dojang (OP Stack standard predeploy addresses + Dojang contracts)
    eas: '0x4200000000000000000000000000000000000021' as Address,
    schemaRegistry: '0x4200000000000000000000000000000000000020' as Address,
    dojangScroll: '0xd5077b67dcb56caC8b270C7788FC3E6ee03F17B9' as Address,
    attestationIndexer: '0x9C9Bf29880448aB39795a11b669e22A0f1d790ec' as Address,
    schemaBook: '0x78cBb3413FBb6aF05EF1D21e646440e56baE3AD6' as Address,
    dojangAttesterBook: '0xDA282E89244424E297Ce8e78089B54D043FB28B6' as Address,

    // Tokens
    weth: '0x4200000000000000000000000000000000000006' as Address,

    // Utility
    multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11' as Address,
  },
  mainnet: {
    // GIWA mainnet has not launched - only the L2 predeploys are known.
    l1StandardBridge: ZERO_ADDRESS, // TBD - GIWA mainnet not launched
    l2StandardBridge: '0x4200000000000000000000000000000000000010' as Address,
    optimismPortal: ZERO_ADDRESS, // TBD - GIWA mainnet not launched
    l1CrossDomainMessenger: ZERO_ADDRESS, // TBD - GIWA mainnet not launched
    disputeGameFactory: ZERO_ADDRESS, // TBD - GIWA mainnet not launched

    upnameRegistry: ZERO_ADDRESS, // TBD - GIWA mainnet not launched

    eas: '0x4200000000000000000000000000000000000021' as Address,
    schemaRegistry: '0x4200000000000000000000000000000000000020' as Address,
    dojangScroll: ZERO_ADDRESS, // TBD - GIWA mainnet not launched
    attestationIndexer: ZERO_ADDRESS, // TBD - GIWA mainnet not launched
    schemaBook: ZERO_ADDRESS, // TBD - GIWA mainnet not launched
    dojangAttesterBook: ZERO_ADDRESS, // TBD - GIWA mainnet not launched

    weth: '0x4200000000000000000000000000000000000006' as Address,

    multicall3: ZERO_ADDRESS, // TBD - GIWA mainnet not launched
  },
};

export function getContractAddresses(network: NetworkType = 'testnet'): ContractAddresses {
  return CONTRACT_ADDRESSES[network];
}

/**
 * Dojang attestation schema UIDs.
 * These are the GIWA Sepolia UIDs; mainnet schema UIDs will differ once
 * mainnet launches. Dojang availability is gated per network by the
 * DojangScroll/AttestationIndexer contract addresses, not by these UIDs.
 */
export const DOJANG_SCHEMAS = {
  /** `bool isVerified` */
  VERIFIED_ADDRESS: '0x072d75e18b2be4f89a13a7147240477481c4b526d5795802acba59046b426e08' as `0x${string}`,
  /** `uint256 coinType, uint64 snapshotAt, uint192 leafCount, uint256 totalAmount, bytes32 root` */
  BALANCE_ROOT: '0x369faa9c2cd261c45be3db5e230b585f5f1abecf8e12be575bb543e917e6db52' as `0x${string}`,
  /** `uint256 balance, bytes32 salt, bytes32[] proofs` */
  VERIFIED_BALANCE: '0x77bf88ca262cc63e1b185dccd870aacc5320b8987ef6c7169920f265fe6ab5e9' as `0x${string}`,
  /** `bytes32 codeHash, string domain` */
  VERIFIED_CODE: '0x55ac1369dac97522d062b89ffdc4e752b48fbeba86915fdb956c7c2d0501d280' as `0x${string}`,
} as const;

/**
 * A known Dojang attester (issuer of on-chain verification attestations).
 */
export interface DojangAttester {
  name: string;
  id: Hex;
  address: Address;
}

/**
 * Known Dojang attesters, keyed by identifier.
 * These are the GIWA Sepolia addresses/UIDs; availability per network is
 * controlled via `getDojangAttesters`.
 */
export const DOJANG_ATTESTERS = {
  UPBIT_KOREA: {
    name: 'UPBIT KOREA',
    id: '0xd99b42e778498aa3c9c1f6a012359130252780511687a35982e8e52735453034',
    address: '0x09B170CA2A006081042992bCE7379B85a02149C6',
  },
  TESTNET_FAUCET: {
    name: 'TESTNET FAUCET',
    id: '0xaa92f8c143657dde575de430aecaea6ca91f2e6072339b16932d426895d8d678',
    address: '0x63CCe2b569A7bC35895ee24306c1512fefc06121',
  },
} as const satisfies Record<string, DojangAttester>;

/**
 * Get the known Dojang attesters for a network, in priority order.
 * testnet: [UPBIT_KOREA, TESTNET_FAUCET]; mainnet: [UPBIT_KOREA]
 */
export function getDojangAttesters(network: NetworkType = 'testnet'): DojangAttester[] {
  return network === 'testnet'
    ? [DOJANG_ATTESTERS.UPBIT_KOREA, DOJANG_ATTESTERS.TESTNET_FAUCET]
    : [DOJANG_ATTESTERS.UPBIT_KOREA];
}

export const DEFAULT_DOJANG_ATTESTER_ID: Hex = DOJANG_ATTESTERS.UPBIT_KOREA.id;
