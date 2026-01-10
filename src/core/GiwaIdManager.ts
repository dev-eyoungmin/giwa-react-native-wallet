import {
  type Address,
  namehash,
} from 'viem';
import { normalize } from 'viem/ens';
import type { GiwaClient } from './GiwaClient';
import type { GiwaId, TransactionResult } from '../types';
import { GiwaError, safeLog } from '../utils/errors';

// ENS Public Resolver ABI (simplified)
const ENS_RESOLVER_ABI = [
  {
    name: 'addr',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'text',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
    ],
    outputs: [{ type: 'string' }],
  },
  {
    name: 'setText',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
      { name: 'value', type: 'string' },
    ],
    outputs: [],
  },
] as const;

// ENS Registry ABI (simplified)
const ENS_REGISTRY_ABI = [
  {
    name: 'resolver',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ type: 'address' }],
  },
  {
    name: 'owner',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'node', type: 'bytes32' }],
    outputs: [{ type: 'address' }],
  },
] as const;

// GIWA ID domain
const GIWA_ID_DOMAIN = 'giwa.id';

/**
 * GIWA ID Manager - handles ENS-based GIWA ID operations
 *
 * GIWA ID allows users to have human-readable names like username.giwa.id
 * instead of long hex addresses.
 */
export class GiwaIdManager {
  private client: GiwaClient;
  private cache: Map<string, GiwaId> = new Map();

  constructor(client: GiwaClient) {
    this.client = client;
  }

  /**
   * Resolve GIWA ID to address
   * @param giwaId - GIWA ID (e.g., "alice" or "alice.giwa.id")
   */
  async resolveAddress(giwaId: string): Promise<Address | null> {
    const publicClient = this.client.getPublicClient();
    const contracts = this.client.getContractAddresses();

    // Normalize the name
    const fullName = this.normalizeGiwaId(giwaId);
    const node = namehash(fullName);

    try {
      // Get resolver
      const resolverAddress = await publicClient.readContract({
        address: contracts.ensRegistry,
        abi: ENS_REGISTRY_ABI,
        functionName: 'resolver',
        args: [node],
      });

      if (resolverAddress === '0x0000000000000000000000000000000000000000') {
        return null;
      }

      // Get address from resolver
      const address = await publicClient.readContract({
        address: resolverAddress as Address,
        abi: ENS_RESOLVER_ABI,
        functionName: 'addr',
        args: [node],
      });

      return address as Address;
    } catch (err) {
      safeLog('GiwaIdManager.resolveAddress', err);
      return null;
    }
  }

  /**
   * Reverse resolve address to GIWA ID
   * @param address - Wallet address
   */
  async resolveName(address: Address): Promise<string | null> {
    const publicClient = this.client.getPublicClient();

    try {
      // Create reverse node
      const reverseNode = namehash(
        `${address.toLowerCase().slice(2)}.addr.reverse`
      );

      const contracts = this.client.getContractAddresses();

      // Get resolver for reverse record
      const resolverAddress = await publicClient.readContract({
        address: contracts.ensRegistry,
        abi: ENS_REGISTRY_ABI,
        functionName: 'resolver',
        args: [reverseNode],
      });

      if (resolverAddress === '0x0000000000000000000000000000000000000000') {
        return null;
      }

      // Get name from resolver
      const name = await publicClient.readContract({
        address: resolverAddress as Address,
        abi: ENS_RESOLVER_ABI,
        functionName: 'name',
        args: [reverseNode],
      });

      return name as string;
    } catch (err) {
      safeLog('GiwaIdManager.resolveName', err);
      return null;
    }
  }

  /**
   * Get full GIWA ID info
   * @param giwaId - GIWA ID
   */
  async getGiwaId(giwaId: string): Promise<GiwaId | null> {
    // Check cache
    const cached = this.cache.get(giwaId.toLowerCase());
    if (cached) {
      return cached;
    }

    const address = await this.resolveAddress(giwaId);
    if (!address) {
      return null;
    }

    const fullName = this.normalizeGiwaId(giwaId);
    const avatar = await this.getTextRecord(giwaId, 'avatar');

    const giwaIdInfo: GiwaId = {
      name: fullName,
      address,
      avatar: avatar || undefined,
    };

    // Cache the result
    this.cache.set(giwaId.toLowerCase(), giwaIdInfo);

    return giwaIdInfo;
  }

  /**
   * Get text record for GIWA ID
   * @param giwaId - GIWA ID
   * @param key - Record key (e.g., "avatar", "url", "description")
   */
  async getTextRecord(giwaId: string, key: string): Promise<string | null> {
    const publicClient = this.client.getPublicClient();
    const contracts = this.client.getContractAddresses();

    const fullName = this.normalizeGiwaId(giwaId);
    const node = namehash(fullName);

    try {
      const resolverAddress = await publicClient.readContract({
        address: contracts.ensRegistry,
        abi: ENS_REGISTRY_ABI,
        functionName: 'resolver',
        args: [node],
      });

      if (resolverAddress === '0x0000000000000000000000000000000000000000') {
        return null;
      }

      const value = await publicClient.readContract({
        address: resolverAddress as Address,
        abi: ENS_RESOLVER_ABI,
        functionName: 'text',
        args: [node, key],
      });

      return (value as string) || null;
    } catch (err) {
      safeLog('GiwaIdManager.getTextRecord', err);
      return null;
    }
  }

  /**
   * Set text record for GIWA ID (requires ownership)
   * @param giwaId - GIWA ID
   * @param key - Record key
   * @param value - Record value
   */
  async setTextRecord(
    giwaId: string,
    key: string,
    value: string
  ): Promise<TransactionResult> {
    const walletClient = this.client.getWalletClient();
    if (!walletClient) {
      throw new GiwaError('Wallet is not connected.', 'WALLET_NOT_CONNECTED');
    }

    const publicClient = this.client.getPublicClient();
    const contracts = this.client.getContractAddresses();

    const fullName = this.normalizeGiwaId(giwaId);
    const node = namehash(fullName);

    // Get resolver
    const resolverAddress = await publicClient.readContract({
      address: contracts.ensRegistry,
      abi: ENS_REGISTRY_ABI,
      functionName: 'resolver',
      args: [node],
    });

    if (resolverAddress === '0x0000000000000000000000000000000000000000') {
      throw new GiwaError('GIWA ID not found.', 'GIWA_ID_NOT_FOUND');
    }

    const hash = await walletClient.writeContract({
      address: resolverAddress as Address,
      abi: ENS_RESOLVER_ABI,
      functionName: 'setText',
      args: [node, key, value],
    });

    // Clear cache
    this.cache.delete(giwaId.toLowerCase());

    return {
      hash,
      wait: async () => {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        return {
          hash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          status: receipt.status === 'success' ? 'success' : 'reverted',
          gasUsed: receipt.gasUsed,
        };
      },
    };
  }

  /**
   * Check if GIWA ID is available
   * @param giwaId - GIWA ID to check
   */
  async isAvailable(giwaId: string): Promise<boolean> {
    const address = await this.resolveAddress(giwaId);
    return address === null;
  }

  /**
   * Normalize GIWA ID to full format
   * @param giwaId - Input (e.g., "alice" or "alice.giwa.id")
   */
  private normalizeGiwaId(giwaId: string): string {
    const normalized = normalize(giwaId.toLowerCase());
    if (normalized.endsWith(`.${GIWA_ID_DOMAIN}`)) {
      return normalized;
    }
    return `${normalized}.${GIWA_ID_DOMAIN}`;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}
