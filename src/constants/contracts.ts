import type { Address } from 'viem';
import type { NetworkType } from '../types';

export interface ContractAddresses {
  // Bridge contracts
  l1StandardBridge: Address;
  l2StandardBridge: Address;

  // ENS (GIWA ID) contracts
  ensRegistry: Address;
  ensResolver: Address;

  // EAS (Dojang) contracts
  eas: Address;
  schemaRegistry: Address;

  // Token contracts
  weth: Address;
}

export const CONTRACT_ADDRESSES: Record<NetworkType, ContractAddresses> = {
  testnet: {
    // Bridge - OP Stack standard addresses
    l1StandardBridge: '0x0000000000000000000000000000000000000000' as Address, // TBD - L1 contract
    l2StandardBridge: '0x4200000000000000000000000000000000000010' as Address,

    // ENS - GIWA ID
    ensRegistry: '0x0000000000000000000000000000000000000000' as Address, // TBD
    ensResolver: '0x0000000000000000000000000000000000000000' as Address, // TBD

    // EAS - Dojang (OP Stack standard predeploy addresses)
    eas: '0x4200000000000000000000000000000000000021' as Address,
    schemaRegistry: '0x4200000000000000000000000000000000000020' as Address,

    // Tokens
    weth: '0x4200000000000000000000000000000000000006' as Address,
  },
  mainnet: {
    l1StandardBridge: '0x0000000000000000000000000000000000000000' as Address, // TBD - L1 contract
    l2StandardBridge: '0x4200000000000000000000000000000000000010' as Address,
    ensRegistry: '0x0000000000000000000000000000000000000000' as Address, // TBD
    ensResolver: '0x0000000000000000000000000000000000000000' as Address, // TBD
    // EAS - Dojang (OP Stack standard predeploy addresses)
    eas: '0x4200000000000000000000000000000000000021' as Address,
    schemaRegistry: '0x4200000000000000000000000000000000000020' as Address,
    weth: '0x4200000000000000000000000000000000000006' as Address,
  },
};

export function getContractAddresses(network: NetworkType = 'testnet'): ContractAddresses {
  return CONTRACT_ADDRESSES[network];
}

// Dojang attestation schema UIDs
export const DOJANG_SCHEMAS = {
  VERIFIED_ADDRESS: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
  BALANCE_ROOT: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
  VERIFIED_BALANCE: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
  VERIFIED_CODE: '0x0000000000000000000000000000000000000000000000000000000000000000' as `0x${string}`,
} as const;
