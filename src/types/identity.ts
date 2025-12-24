/**
 * Identity/Authentication type definitions (GIWA ID, Dojang)
 */
import type { Address, Hex } from 'viem';

// GIWA ID
export interface GiwaId {
  name: string;
  address: Address;
  avatar?: string;
  records?: Record<string, string>;
}

// Dojang (EAS-based attestation)
export type AttestationType =
  | 'verified_address'
  | 'balance_root'
  | 'verified_balance'
  | 'verified_code';

export interface Attestation {
  uid: Hex;
  schema: Hex;
  attester: Address;
  recipient: Address;
  attestationType: AttestationType;
  data: Hex;
  time: bigint;
  expirationTime: bigint;
  revocable: boolean;
  revoked: boolean;
}
