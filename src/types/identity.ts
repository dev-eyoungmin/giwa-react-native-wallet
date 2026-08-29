/**
 * Identity/Authentication type definitions (GIWA ID, Dojang)
 */
import type { Address, Hex } from 'viem';

// GIWA ID (up.id, resolved via the on-chain UpnameRegistry)
export interface GiwaId {
  /** Full name, e.g. "alice.up.id" */
  name: string;
  address: Address;
  /** ERC-721 token id in UpnameRegistry (= keccak256(label)) */
  tokenId: bigint;
  tokenUri?: string;
  /** Best-effort image URL from token metadata */
  avatar?: string;
}

// Dojang (EAS-based attestation)
export type AttestationType =
  | 'verified_address'
  | 'balance_root'
  | 'verified_balance'
  | 'verified_code'
  | 'unknown';

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

/**
 * Decoded Dojang attestation payload, keyed by the schema it came from.
 * `decodeAttestationData` returns null for `'unknown'` schemas or on decode
 * failure (see DojangManager).
 */
export type DojangAttestationData =
  | { type: 'verified_address'; isVerified: boolean }
  | {
      type: 'balance_root';
      coinType: bigint;
      snapshotAt: bigint;
      leafCount: bigint;
      totalAmount: bigint;
      root: Hex;
    }
  | { type: 'verified_balance'; balance: bigint; salt: Hex; proofs: readonly Hex[] }
  | { type: 'verified_code'; codeHash: Hex; domain: string };
