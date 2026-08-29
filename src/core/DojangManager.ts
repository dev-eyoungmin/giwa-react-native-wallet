import {
  BaseError,
  ContractFunctionRevertedError,
  decodeAbiParameters,
  type Address,
  type ContractFunctionParameters,
  type Hex,
} from 'viem';
import type { GiwaClient } from './GiwaClient';
import type { Attestation, AttestationType, DojangAttestationData } from '../types';
import {
  DOJANG_SCHEMAS,
  DEFAULT_DOJANG_ATTESTER_ID,
  getDojangAttesters,
} from '../constants/contracts';
import { safeLog } from '../utils/errors';
import { isTbdAddress } from '../utils/networkValidator';
import { validateAndChecksumAddress } from '../utils/validation';

/** Zero bytes32, used by EAS/Dojang as the "no attestation" sentinel. */
const ZERO_UID: Hex =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

/**
 * DojangScroll custom error names that mean "attestation not found" for the
 * queried parameters. These are expected, non-exceptional outcomes and must
 * not be logged - only unexpected errors go through `safeLog`.
 */
const NOT_FOUND_ERROR_NAMES = new Set<string>([
  'ZeroUid',
  'NotVerifiedAddress',
  'NotVerifiedBalance',
  'BalanceRootNotFound',
  'ExpiredAttestation',
  'RevokedAttestation',
]);

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

/**
 * DojangScroll ABI - verified-address / verified-balance / verify-code read
 * paths, plus the custom "not found" errors so viem can decode reverts.
 */
const DOJANG_SCROLL_ABI = [
  {
    name: 'isVerified',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'addr', type: 'address' },
      { name: 'attesterId', type: 'bytes32' },
    ],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'getVerifiedAddressAttestationUid',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'addr', type: 'address' },
      { name: 'attesterId', type: 'bytes32' },
    ],
    outputs: [{ type: 'bytes32' }],
  },
  {
    name: 'getVerifiedBalance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'coinType', type: 'uint256' },
      { name: 'snapshotAt', type: 'uint64' },
      { name: 'attesterId', type: 'bytes32' },
    ],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getVerifiedBalanceAttestationUid',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'coinType', type: 'uint256' },
      { name: 'snapshotAt', type: 'uint64' },
      { name: 'attesterId', type: 'bytes32' },
    ],
    outputs: [{ type: 'bytes32' }],
  },
  {
    name: 'getBalanceRootAttestationUid',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'coinType', type: 'uint256' },
      { name: 'snapshotAt', type: 'uint64' },
      { name: 'attesterId', type: 'bytes32' },
    ],
    outputs: [{ type: 'bytes32' }],
  },
  {
    name: 'getVerifyCodeAttestationUid',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'codeHash', type: 'bytes32' },
      { name: 'domain', type: 'string' },
      { name: 'attesterId', type: 'bytes32' },
    ],
    outputs: [{ type: 'bytes32' }],
  },
  {
    name: 'isVerifiedCode',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'codeHash', type: 'bytes32' },
      { name: 'domain', type: 'string' },
      { name: 'attesterId', type: 'bytes32' },
    ],
    outputs: [{ type: 'bool' }],
  },
  { type: 'error', name: 'ZeroUid', inputs: [] },
  {
    type: 'error',
    name: 'NotVerifiedAddress',
    inputs: [{ name: 'addr', type: 'address' }],
  },
  {
    type: 'error',
    name: 'NotVerifiedBalance',
    inputs: [
      { name: 'recipient', type: 'address' },
      { name: 'coinType', type: 'uint256' },
      { name: 'snapshotAt', type: 'uint64' },
    ],
  },
  {
    type: 'error',
    name: 'BalanceRootNotFound',
    inputs: [
      { name: 'coinType', type: 'uint256' },
      { name: 'snapshotAt', type: 'uint64' },
    ],
  },
  {
    type: 'error',
    name: 'ExpiredAttestation',
    inputs: [
      { name: 'uid', type: 'bytes32' },
      { name: 'expirationTime', type: 'uint256' },
    ],
  },
  {
    type: 'error',
    name: 'RevokedAttestation',
    inputs: [
      { name: 'uid', type: 'bytes32' },
      { name: 'revocationTime', type: 'uint256' },
    ],
  },
] as const;

/** DojangScroll `view` function names (used to constrain the read helper). */
type DojangScrollFunctionName =
  | 'isVerified'
  | 'getVerifiedAddressAttestationUid'
  | 'getVerifiedBalance'
  | 'getVerifiedBalanceAttestationUid'
  | 'getBalanceRootAttestationUid'
  | 'getVerifyCodeAttestationUid'
  | 'isVerifiedCode';

/** AttestationIndexer ABI - only the 3-arg `getAttestationUid` overload is used here. */
const ATTESTATION_INDEXER_ABI = [
  {
    name: 'getAttestationUid',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'schemaUid', type: 'bytes32' },
      { name: 'attester', type: 'address' },
      { name: 'recipient', type: 'address' },
    ],
    outputs: [{ type: 'bytes32' }],
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
 * Check whether an error thrown/returned by a DojangScroll read is one of
 * the expected "not found" custom errors (see `NOT_FOUND_ERROR_NAMES`).
 * These should be swallowed silently (return null/false), not logged.
 */
function isKnownNotFoundRevert(err: unknown): boolean {
  if (!(err instanceof BaseError)) {
    return false;
  }
  const revertError = err.walk((e) => e instanceof ContractFunctionRevertedError);
  if (!(revertError instanceof ContractFunctionRevertedError)) {
    return false;
  }
  const errorName = revertError.data?.errorName;
  return errorName !== undefined && NOT_FOUND_ERROR_NAMES.has(errorName);
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
      if (attestation.uid === ZERO_UID) {
        return null;
      }

      return this.mapRawAttestation(attestation);
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
   * Check if an address has a verified-address attestation.
   * @param address - Address to check
   * @param attesterId - If given, checks only this attester. If omitted,
   *   checks every known attester for the current network (one multicall)
   *   and returns true if any of them verify the address.
   */
  async hasVerifiedAddress(address: Address, attesterId?: Hex): Promise<boolean> {
    const validated = validateAndChecksumAddress(address);
    const contracts = this.client.getContractAddresses();

    if (isTbdAddress(contracts.dojangScroll)) {
      return false;
    }

    if (attesterId) {
      const result = await this.readDojangScroll<boolean>(
        'isVerified',
        [validated, attesterId],
        'DojangManager.hasVerifiedAddress'
      );
      return result ?? false;
    }

    const attesters = getDojangAttesters(this.client.getNetwork());
    const calls: ContractFunctionParameters[] = attesters.map((attester) => ({
      address: contracts.dojangScroll,
      abi: DOJANG_SCROLL_ABI,
      functionName: 'isVerified',
      args: [validated, attester.id],
    }));

    const results = await this.multicallRead<boolean>(calls, 'DojangManager.hasVerifiedAddress');
    return results.some((result) => result === true);
  }

  /**
   * Get the verified-address attestation UID for an address.
   * @param address - Address to check
   * @param attesterId - If given, queries only this attester. If omitted,
   *   iterates the known attesters for the current network in priority
   *   order and returns the first non-null UID found.
   */
  async getVerifiedAddressAttestationUid(
    address: Address,
    attesterId?: Hex
  ): Promise<Hex | null> {
    const validated = validateAndChecksumAddress(address);
    const contracts = this.client.getContractAddresses();

    if (isTbdAddress(contracts.dojangScroll)) {
      return null;
    }

    if (attesterId) {
      return this.readDojangScrollUid(
        'getVerifiedAddressAttestationUid',
        [validated, attesterId],
        'DojangManager.getVerifiedAddressAttestationUid'
      );
    }

    const attesters = getDojangAttesters(this.client.getNetwork());
    for (const attester of attesters) {
      const uid = await this.readDojangScrollUid(
        'getVerifiedAddressAttestationUid',
        [validated, attester.id],
        'DojangManager.getVerifiedAddressAttestationUid'
      );
      if (uid) {
        return uid;
      }
    }
    return null;
  }

  /**
   * Get a recipient's verified balance for a coin type at a snapshot time.
   * @param recipient - Address to check
   * @param coinType - Coin type identifier (e.g. SLIP-44 coin type)
   * @param snapshotAt - Snapshot timestamp (unix seconds)
   * @param attesterId - Attester to query; defaults to `DEFAULT_DOJANG_ATTESTER_ID`
   *   when omitted (unlike `hasVerifiedAddress`, this is not "any attester").
   */
  async getVerifiedBalance(
    recipient: Address,
    coinType: bigint,
    snapshotAt: bigint,
    attesterId?: Hex
  ): Promise<bigint | null> {
    const validated = validateAndChecksumAddress(recipient);
    const contracts = this.client.getContractAddresses();

    if (isTbdAddress(contracts.dojangScroll)) {
      return null;
    }

    const resolvedAttesterId = attesterId ?? DEFAULT_DOJANG_ATTESTER_ID;
    return this.readDojangScroll<bigint>(
      'getVerifiedBalance',
      [validated, coinType, snapshotAt, resolvedAttesterId],
      'DojangManager.getVerifiedBalance'
    );
  }

  /**
   * Get the verified-balance attestation UID for a recipient/coin/snapshot.
   * @param attesterId - Defaults to `DEFAULT_DOJANG_ATTESTER_ID` when omitted.
   */
  async getVerifiedBalanceAttestationUid(
    recipient: Address,
    coinType: bigint,
    snapshotAt: bigint,
    attesterId?: Hex
  ): Promise<Hex | null> {
    const validated = validateAndChecksumAddress(recipient);
    const contracts = this.client.getContractAddresses();

    if (isTbdAddress(contracts.dojangScroll)) {
      return null;
    }

    const resolvedAttesterId = attesterId ?? DEFAULT_DOJANG_ATTESTER_ID;
    return this.readDojangScrollUid(
      'getVerifiedBalanceAttestationUid',
      [validated, coinType, snapshotAt, resolvedAttesterId],
      'DojangManager.getVerifiedBalanceAttestationUid'
    );
  }

  /**
   * Get the balance-root attestation UID for a coin type / snapshot.
   * @param attesterId - Defaults to `DEFAULT_DOJANG_ATTESTER_ID` when omitted.
   */
  async getBalanceRootAttestationUid(
    coinType: bigint,
    snapshotAt: bigint,
    attesterId?: Hex
  ): Promise<Hex | null> {
    const contracts = this.client.getContractAddresses();

    if (isTbdAddress(contracts.dojangScroll)) {
      return null;
    }

    const resolvedAttesterId = attesterId ?? DEFAULT_DOJANG_ATTESTER_ID;
    return this.readDojangScrollUid(
      'getBalanceRootAttestationUid',
      [coinType, snapshotAt, resolvedAttesterId],
      'DojangManager.getBalanceRootAttestationUid'
    );
  }

  /**
   * Check whether an off-chain code hash/domain pair has been verified.
   * @param attesterId - Defaults to `DEFAULT_DOJANG_ATTESTER_ID` when omitted.
   */
  async isVerifiedCode(codeHash: Hex, domain: string, attesterId?: Hex): Promise<boolean> {
    const contracts = this.client.getContractAddresses();

    if (isTbdAddress(contracts.dojangScroll)) {
      return false;
    }

    const resolvedAttesterId = attesterId ?? DEFAULT_DOJANG_ATTESTER_ID;
    const result = await this.readDojangScroll<boolean>(
      'isVerifiedCode',
      [codeHash, domain, resolvedAttesterId],
      'DojangManager.isVerifiedCode'
    );
    return result ?? false;
  }

  /**
   * Get the verify-code attestation UID for a code hash/domain pair.
   * @param attesterId - Defaults to `DEFAULT_DOJANG_ATTESTER_ID` when omitted.
   */
  async getVerifyCodeAttestationUid(
    codeHash: Hex,
    domain: string,
    attesterId?: Hex
  ): Promise<Hex | null> {
    const contracts = this.client.getContractAddresses();

    if (isTbdAddress(contracts.dojangScroll)) {
      return null;
    }

    const resolvedAttesterId = attesterId ?? DEFAULT_DOJANG_ATTESTER_ID;
    return this.readDojangScrollUid(
      'getVerifyCodeAttestationUid',
      [codeHash, domain, resolvedAttesterId],
      'DojangManager.getVerifyCodeAttestationUid'
    );
  }

  /**
   * Get all Dojang attestations issued to an address, across every known
   * schema and attester for the current network.
   *
   * Reads `AttestationIndexer.getAttestationUid` for each (schema, attester)
   * pair in one multicall, de-duplicates the non-zero UIDs, then reads
   * `EAS.getAttestation` for each UID in a second multicall.
   * @param address - Recipient address
   */
  async getAttestationsForAddress(address: Address): Promise<Attestation[]> {
    const validated = validateAndChecksumAddress(address);
    const contracts = this.client.getContractAddresses();

    if (isTbdAddress(contracts.attestationIndexer)) {
      return [];
    }

    const attesters = getDojangAttesters(this.client.getNetwork());
    const schemas: Hex[] = [
      DOJANG_SCHEMAS.VERIFIED_ADDRESS,
      DOJANG_SCHEMAS.BALANCE_ROOT,
      DOJANG_SCHEMAS.VERIFIED_BALANCE,
      DOJANG_SCHEMAS.VERIFIED_CODE,
    ];

    const indexerCalls: ContractFunctionParameters[] = [];
    for (const schema of schemas) {
      for (const attester of attesters) {
        indexerCalls.push({
          address: contracts.attestationIndexer,
          abi: ATTESTATION_INDEXER_ABI,
          functionName: 'getAttestationUid',
          args: [schema, attester.address, validated],
        });
      }
    }

    const indexerResults = await this.multicallRead<Hex>(
      indexerCalls,
      'DojangManager.getAttestationsForAddress:indexer'
    );

    const uids = new Set<Hex>();
    for (const uid of indexerResults) {
      if (uid && uid !== ZERO_UID) {
        uids.add(uid);
      }
    }

    if (uids.size === 0) {
      return [];
    }

    const easCalls: ContractFunctionParameters[] = Array.from(uids).map((uid) => ({
      address: contracts.eas,
      abi: EAS_ABI,
      functionName: 'getAttestation',
      args: [uid],
    }));

    const rawAttestations = await this.multicallRead<RawAttestation>(
      easCalls,
      'DojangManager.getAttestationsForAddress:eas'
    );

    return rawAttestations
      .filter((raw): raw is RawAttestation => raw !== null && raw.uid !== ZERO_UID)
      .map((raw) => this.mapRawAttestation(raw));
  }

  /**
   * Decode raw attestation `data` bytes into a typed payload for its schema.
   * Returns null for the `'unknown'` attestation type or on decode failure.
   */
  decodeAttestationData(
    attestation: Pick<Attestation, 'attestationType' | 'data'>
  ): DojangAttestationData | null {
    try {
      switch (attestation.attestationType) {
        case 'verified_address': {
          const [isVerified] = decodeAbiParameters(
            [{ name: 'isVerified', type: 'bool' }],
            attestation.data
          );
          return { type: 'verified_address', isVerified };
        }
        case 'balance_root': {
          const [coinType, snapshotAt, leafCount, totalAmount, root] = decodeAbiParameters(
            [
              { name: 'coinType', type: 'uint256' },
              { name: 'snapshotAt', type: 'uint64' },
              { name: 'leafCount', type: 'uint192' },
              { name: 'totalAmount', type: 'uint256' },
              { name: 'root', type: 'bytes32' },
            ],
            attestation.data
          );
          return { type: 'balance_root', coinType, snapshotAt, leafCount, totalAmount, root };
        }
        case 'verified_balance': {
          const [balance, salt, proofs] = decodeAbiParameters(
            [
              { name: 'balance', type: 'uint256' },
              { name: 'salt', type: 'bytes32' },
              { name: 'proofs', type: 'bytes32[]' },
            ],
            attestation.data
          );
          return { type: 'verified_balance', balance, salt, proofs };
        }
        case 'verified_code': {
          const [codeHash, domain] = decodeAbiParameters(
            [
              { name: 'codeHash', type: 'bytes32' },
              { name: 'domain', type: 'string' },
            ],
            attestation.data
          );
          return { type: 'verified_code', codeHash, domain };
        }
        default:
          return null;
      }
    } catch (err) {
      safeLog('DojangManager.decodeAttestationData', err);
      return null;
    }
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

  /**
   * Determine attestation type from schema UID. Returns 'unknown' for any
   * schema not recognized as a Dojang schema.
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
    return 'unknown';
  }

  /**
   * Map a raw EAS attestation tuple to the SDK's `Attestation` shape.
   */
  private mapRawAttestation(raw: RawAttestation): Attestation {
    return {
      uid: raw.uid,
      schema: raw.schema,
      attester: raw.attester,
      recipient: raw.recipient,
      attestationType: this.getAttestationType(raw.schema),
      data: raw.data,
      time: raw.time,
      expirationTime: raw.expirationTime,
      revocable: raw.revocable,
      revoked: raw.revocationTime > 0n,
    };
  }

  /**
   * Single DojangScroll read. Known "not found" reverts resolve to null
   * silently; any other error is logged via `safeLog` and also resolves
   * to null.
   */
  private async readDojangScroll<T>(
    functionName: DojangScrollFunctionName,
    args: readonly unknown[],
    context: string
  ): Promise<T | null> {
    const publicClient = this.client.getPublicClient();
    const contracts = this.client.getContractAddresses();

    try {
      const result = await publicClient.readContract({
        address: contracts.dojangScroll,
        abi: DOJANG_SCROLL_ABI,
        functionName,
        args,
      } as never);
      return result as T;
    } catch (err) {
      if (!isKnownNotFoundRevert(err)) {
        safeLog(context, err);
      }
      return null;
    }
  }

  /**
   * Like `readDojangScroll`, but for the bytes32-UID-returning functions:
   * also normalizes a returned zero UID to null.
   */
  private async readDojangScrollUid(
    functionName: DojangScrollFunctionName,
    args: readonly unknown[],
    context: string
  ): Promise<Hex | null> {
    const result = await this.readDojangScroll<Hex>(functionName, args, context);
    if (!result || result === ZERO_UID) {
      return null;
    }
    return result;
  }

  /**
   * Run a batch of read-only contract calls via `publicClient.multicall`
   * (`allowFailure: true`). Known "not found" reverts resolve to null
   * silently per-entry; any other error is logged via `safeLog` and also
   * resolves to null for that entry.
   */
  private async multicallRead<T>(
    contracts: ContractFunctionParameters[],
    context: string
  ): Promise<(T | null)[]> {
    if (contracts.length === 0) {
      return [];
    }

    const publicClient = this.client.getPublicClient();
    const results = await publicClient.multicall({ contracts, allowFailure: true });

    return results.map((entry) => {
      if (entry.status === 'success') {
        return entry.result as T;
      }
      if (!isKnownNotFoundRevert(entry.error)) {
        safeLog(context, entry.error);
      }
      return null;
    });
  }
}
