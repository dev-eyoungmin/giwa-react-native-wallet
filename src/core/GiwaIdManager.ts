import { BaseError, ContractFunctionRevertedError, keccak256, stringToHex, toHex, type Address } from 'viem';
import { normalize } from 'viem/ens';
import type { GiwaClient } from './GiwaClient';
import type { GiwaId } from '../types';
import { safeLog } from '../utils/errors';
import { isTbdAddress } from '../utils/networkValidator';
import { validateAndChecksumAddress } from '../utils/validation';

/** Timeout (ms) for the best-effort token metadata fetch in `getGiwaId`. */
const AVATAR_FETCH_TIMEOUT_MS = 5000;

/** GIWA up.id domain suffix. */
export const UP_ID_DOMAIN = 'up.id';

/**
 * UpnameRegistry ABI - the L2 "Upbit Web3 Names" ERC-721 registry, plus the
 * `ERC721NonexistentToken` custom error so viem can decode reverts for
 * unregistered token ids.
 */
const UPNAME_REGISTRY_ABI = [
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'ownedTokenId',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getLabel',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'key', type: 'bytes32' }],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'hasActiveName',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'isClaimable',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'name', type: 'string' }],
    outputs: [{ type: 'bool' }],
  },
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ type: 'string' }],
  },
  {
    type: 'error',
    name: 'ERC721NonexistentToken',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
  },
] as const;

/**
 * Check whether an error thrown by an UpnameRegistry read is the expected
 * "token does not exist" revert. This is an expected, non-exceptional
 * outcome (unregistered name) and must not be logged via `safeLog`.
 */
function isNonexistentTokenRevert(err: unknown): boolean {
  if (!(err instanceof BaseError)) {
    return false;
  }
  const revertError = err.walk((e) => e instanceof ContractFunctionRevertedError);
  if (!(revertError instanceof ContractFunctionRevertedError)) {
    return false;
  }
  return revertError.data?.errorName === 'ERC721NonexistentToken';
}

/**
 * Compute the UpnameRegistry token id for a bare label:
 * `tokenId = uint256(keccak256(bytes(label)))`.
 */
function labelToTokenId(label: string): bigint {
  return BigInt(keccak256(stringToHex(label)));
}

/**
 * GIWA ID Manager - resolves `up.id` names via the on-chain `UpnameRegistry`
 * on GIWA L2 (an ERC-721 registry, symbol `UPNAME`).
 *
 * This manager is read-only: `up.id` names are minted/managed elsewhere, not
 * through this SDK.
 */
export class GiwaIdManager {
  private client: GiwaClient;
  private cache: Map<string, GiwaId> = new Map();

  constructor(client: GiwaClient) {
    this.client = client;
  }

  /**
   * Resolve a `up.id` name to its owner address.
   * @param name - Name (e.g., "alice" or "alice.up.id")
   */
  async resolveAddress(name: string): Promise<Address | null> {
    const contracts = this.client.getContractAddresses();
    if (isTbdAddress(contracts.upnameRegistry)) {
      return null;
    }

    const label = this.normalizeLabel(name);
    if (!label) {
      return null;
    }

    const publicClient = this.client.getPublicClient();
    const tokenId = labelToTokenId(label);

    try {
      const owner = await publicClient.readContract({
        address: contracts.upnameRegistry,
        abi: UPNAME_REGISTRY_ABI,
        functionName: 'ownerOf',
        args: [tokenId],
      });
      return owner;
    } catch (err) {
      if (!isNonexistentTokenRevert(err)) {
        safeLog('GiwaIdManager.resolveAddress', err);
      }
      return null;
    }
  }

  /**
   * Reverse resolve an address to its `up.id` name.
   * @param address - Wallet address
   */
  async resolveName(address: Address): Promise<string | null> {
    const contracts = this.client.getContractAddresses();
    if (isTbdAddress(contracts.upnameRegistry)) {
      return null;
    }

    const validated = validateAndChecksumAddress(address, 'address');
    const publicClient = this.client.getPublicClient();

    try {
      const tokenId = await publicClient.readContract({
        address: contracts.upnameRegistry,
        abi: UPNAME_REGISTRY_ABI,
        functionName: 'ownedTokenId',
        args: [validated],
      });

      if (tokenId === 0n) {
        return null;
      }

      const label = await publicClient.readContract({
        address: contracts.upnameRegistry,
        abi: UPNAME_REGISTRY_ABI,
        functionName: 'getLabel',
        args: [toHex(tokenId, { size: 32 })],
      });

      if (!label) {
        return null;
      }

      // Verify the label round-trips to the same tokenId before trusting it -
      // a mismatch means unexpected registry state, not user input.
      if (labelToTokenId(label) !== tokenId) {
        safeLog(
          'GiwaIdManager.resolveName',
          new Error(`label/tokenId mismatch for owner ${validated}`)
        );
        return null;
      }

      return `${label}.${UP_ID_DOMAIN}`;
    } catch (err) {
      if (!isNonexistentTokenRevert(err)) {
        safeLog('GiwaIdManager.resolveName', err);
      }
      return null;
    }
  }

  /**
   * Get full GIWA ID info for a name, including a best-effort avatar image
   * URL read from the token metadata.
   * @param name - Name (e.g., "alice" or "alice.up.id")
   */
  async getGiwaId(name: string): Promise<GiwaId | null> {
    const label = this.normalizeLabel(name);
    if (!label) {
      return null;
    }

    const cached = this.cache.get(label);
    if (cached) {
      return cached;
    }

    const contracts = this.client.getContractAddresses();
    if (isTbdAddress(contracts.upnameRegistry)) {
      return null;
    }

    const address = await this.resolveAddress(label);
    if (!address) {
      return null;
    }

    const publicClient = this.client.getPublicClient();
    const tokenId = labelToTokenId(label);

    let tokenUri: string | undefined;
    try {
      tokenUri = await publicClient.readContract({
        address: contracts.upnameRegistry,
        abi: UPNAME_REGISTRY_ABI,
        functionName: 'tokenURI',
        args: [tokenId],
      });
    } catch (err) {
      if (!isNonexistentTokenRevert(err)) {
        safeLog('GiwaIdManager.getGiwaId', err);
      }
    }

    const avatar = await this.getAvatarFromTokenUri(tokenUri);

    const giwaId: GiwaId = {
      name: `${label}.${UP_ID_DOMAIN}`,
      address,
      tokenId,
      tokenUri,
      avatar,
    };

    this.cache.set(label, giwaId);

    return giwaId;
  }

  /**
   * Check whether a name is available (unclaimed).
   * @param name - Name (e.g., "alice" or "alice.up.id")
   */
  async isAvailable(name: string): Promise<boolean> {
    const contracts = this.client.getContractAddresses();
    if (isTbdAddress(contracts.upnameRegistry)) {
      return false;
    }

    const label = this.normalizeLabel(name);
    if (!label) {
      return false;
    }

    const publicClient = this.client.getPublicClient();

    try {
      return await publicClient.readContract({
        address: contracts.upnameRegistry,
        abi: UPNAME_REGISTRY_ABI,
        functionName: 'isClaimable',
        args: [label],
      });
    } catch (err) {
      safeLog('GiwaIdManager.isAvailable', err);
      return false;
    }
  }

  /**
   * Best-effort fetch of a token's metadata to extract the `image` field.
   * Only fetches `https://` URIs (never `data:`/`ipfs:`/etc, to bound this
   * to a plain HTTPS request and avoid SSRF via arbitrary schemes), and
   * bounds the request with a timeout. Never throws; returns undefined on
   * any failure.
   */
  private async getAvatarFromTokenUri(tokenUri: string | undefined): Promise<string | undefined> {
    if (!tokenUri || !/^https:\/\//i.test(tokenUri)) {
      return undefined;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), AVATAR_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(tokenUri, { signal: controller.signal });
      const metadata = await response.json();
      const image = metadata?.image;
      return typeof image === 'string' && /^https:\/\//i.test(image) ? image : undefined;
    } catch {
      return undefined;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Normalize a name input to the bare, lower-cased on-chain label:
   * lower-case, `normalize()` (viem/ens), then strip a trailing `.up.id`.
   * Returns null for an empty label, and also for input `normalize()`
   * rejects (e.g. disallowed characters, stray underscores, empty labels,
   * illegal character mixtures) - this is a best-effort resolver over
   * arbitrary user input, so it never throws.
   */
  private normalizeLabel(name: string): string | null {
    let normalized: string;
    try {
      normalized = normalize(name.toLowerCase());
    } catch {
      return null;
    }
    const label = normalized.endsWith(`.${UP_ID_DOMAIN}`)
      ? normalized.slice(0, -`.${UP_ID_DOMAIN}`.length)
      : normalized;
    return label.length > 0 ? label : null;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
