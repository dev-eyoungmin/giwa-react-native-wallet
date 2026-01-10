import {
  type Address,
  type Hex,
  decodeAbiParameters,
} from 'viem';
import type { GiwaClient } from './GiwaClient';
import type { Attestation, AttestationType } from '../types';
import { DOJANG_SCHEMAS } from '../constants/contracts';
import { safeLog } from '../utils/errors';

// EAS ABI (simplified)
const EAS_ABI = [
  {
    name: 'getAttestation',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'uid', type: 'bytes32' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'uid', type: 'bytes32' },
          { name: 'schema', type: 'bytes32' },
          { name: 'time', type: 'uint64' },
          { name: 'expirationTime', type: 'uint64' },
          { name: 'revocationTime', type: 'uint64' },
          { name: 'refUID', type: 'bytes32' },
          { name: 'recipient', type: 'address' },
          { name: 'attester', type: 'address' },
          { name: 'revocable', type: 'bool' },
          { name: 'data', type: 'bytes' },
        ],
      },
    ],
  },
  {
    name: 'isAttestationValid',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'uid', type: 'bytes32' }],
    outputs: [{ type: 'bool' }],
  },
] as const;

// Schema Registry ABI (simplified)
const SCHEMA_REGISTRY_ABI = [
  {
    name: 'getSchema',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'uid', type: 'bytes32' }],
    outputs: [
      {
        type: 'tuple',
        components: [
          { name: 'uid', type: 'bytes32' },
          { name: 'resolver', type: 'address' },
          { name: 'revocable', type: 'bool' },
          { name: 'schema', type: 'string' },
        ],
      },
    ],
  },
] as const;

interface RawAttestation {
  uid: Hex;
  schema: Hex;
  time: bigint;
  expirationTime: bigint;
  revocationTime: bigint;
  refUID: Hex;
  recipient: Address;
  attester: Address;
  revocable: boolean;
  data: Hex;
}

/**
 * Dojang Manager - handles EAS-based attestation operations
 *
 * Dojang is GIWA's attestation service that provides:
 * - Verified Address: KYC-verified wallet addresses
 * - Balance Root: Merkle tree summary of balance data
 * - Verified Balance: Balance attestation at specific time
 * - Verified Code: On-chain verification of off-chain codes
 */
export class DojangManager {
  private client: GiwaClient;

  constructor(client: GiwaClient) {
    this.client = client;
  }

  /**
   * Get attestation by UID
   * @param uid - Attestation UID
   */
  async getAttestation(uid: Hex): Promise<Attestation | null> {
    const publicClient = this.client.getPublicClient();
    const contracts = this.client.getContractAddresses();

    try {
      const rawAttestation = await publicClient.readContract({
        address: contracts.eas,
        abi: EAS_ABI,
        functionName: 'getAttestation',
        args: [uid],
      });

      const attestation = rawAttestation as unknown as RawAttestation;

      // Check if attestation exists
      if (attestation.uid === '0x0000000000000000000000000000000000000000000000000000000000000000') {
        return null;
      }

      // Determine attestation type from schema
      const attestationType = this.getAttestationType(attestation.schema);

      return {
        uid: attestation.uid,
        schema: attestation.schema,
        attester: attestation.attester,
        recipient: attestation.recipient,
        attestationType,
        data: attestation.data,
        time: attestation.time,
        expirationTime: attestation.expirationTime,
        revocable: attestation.revocable,
        revoked: attestation.revocationTime > 0n,
      };
    } catch (err) {
      safeLog('DojangManager.getAttestation', err);
      return null;
    }
  }

  /**
   * Check if attestation is valid
   * @param uid - Attestation UID
   */
  async isAttestationValid(uid: Hex): Promise<boolean> {
    const publicClient = this.client.getPublicClient();
    const contracts = this.client.getContractAddresses();

    try {
      const isValid = await publicClient.readContract({
        address: contracts.eas,
        abi: EAS_ABI,
        functionName: 'isAttestationValid',
        args: [uid],
      });

      return isValid as boolean;
    } catch (err) {
      safeLog('DojangManager.isAttestationValid', err);
      return false;
    }
  }

  /**
   * Check if address has verified address attestation
   * @param address - Address to check
   */
  async hasVerifiedAddress(_address: Address): Promise<boolean> {
    // This would require indexing or events to find attestations by recipient
    // For now, return false as placeholder
    // In production, you'd use a subgraph or indexer
    return false;
  }

  /**
   * Get all attestations for an address
   * Note: Requires indexer/subgraph in production
   * @param address - Recipient address
   */
  async getAttestationsForAddress(
    _address: Address
  ): Promise<Attestation[]> {
    // Placeholder - would need subgraph/indexer
    return [];
  }

  /**
   * Get verified balance attestation
   * @param uid - Attestation UID
   */
  async getVerifiedBalance(
    uid: Hex
  ): Promise<{ balance: bigint; timestamp: bigint } | null> {
    const attestation = await this.getAttestation(uid);
    if (!attestation || attestation.attestationType !== 'verified_balance') {
      return null;
    }

    try {
      // Decode the attestation data
      // Schema: "uint256 balance, uint64 timestamp"
      const decoded = decodeAbiParameters(
        [
          { name: 'balance', type: 'uint256' },
          { name: 'timestamp', type: 'uint64' },
        ],
        attestation.data
      );

      return {
        balance: decoded[0] as bigint,
        timestamp: decoded[1] as bigint,
      };
    } catch (err) {
      safeLog('DojangManager.getVerifiedBalance', err);
      return null;
    }
  }

  /**
   * Determine attestation type from schema UID
   */
  private getAttestationType(schemaUid: Hex): AttestationType {
    if (schemaUid === DOJANG_SCHEMAS.VERIFIED_ADDRESS) {
      return 'verified_address';
    }
    if (schemaUid === DOJANG_SCHEMAS.BALANCE_ROOT) {
      return 'balance_root';
    }
    if (schemaUid === DOJANG_SCHEMAS.VERIFIED_BALANCE) {
      return 'verified_balance';
    }
    if (schemaUid === DOJANG_SCHEMAS.VERIFIED_CODE) {
      return 'verified_code';
    }
    return 'verified_address'; // Default
  }

  /**
   * Get schema information
   * @param schemaUid - Schema UID
   */
  async getSchema(schemaUid: Hex): Promise<{
    uid: Hex;
    schema: string;
    revocable: boolean;
  } | null> {
    const publicClient = this.client.getPublicClient();
    const contracts = this.client.getContractAddresses();

    try {
      const schema = await publicClient.readContract({
        address: contracts.schemaRegistry,
        abi: SCHEMA_REGISTRY_ABI,
        functionName: 'getSchema',
        args: [schemaUid],
      });

      const result = schema as { uid: Hex; schema: string; revocable: boolean };

      return {
        uid: result.uid,
        schema: result.schema,
        revocable: result.revocable,
      };
    } catch (err) {
      safeLog('DojangManager.getSchema', err);
      return null;
    }
  }
}
