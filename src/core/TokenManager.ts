import {
  type Address,
  formatUnits,
  parseUnits,
  erc20Abi,
} from 'viem';
import type { GiwaClient } from './GiwaClient';
import type { Token, TokenBalance, TransactionResult } from '../types';
import { GiwaTransactionError } from '../utils/errors';
import {
  validateTokenAddress,
  validateAndChecksumAddress,
  validateSpenderAddress,
} from '../utils/validation';

/**
 * Token Manager - handles ERC-20 token operations
 */
export class TokenManager {
  private client: GiwaClient;
  private customTokens: Map<Address, Token> = new Map();

  constructor(client: GiwaClient) {
    this.client = client;
  }

  /**
   * Get token information
   * @param tokenAddress - ERC-20 contract address
   */
  async getToken(tokenAddress: Address): Promise<Token> {
    // Check custom tokens first
    const cached = this.customTokens.get(tokenAddress);
    if (cached) {
      return cached;
    }

    const publicClient = this.client.getPublicClient();

    const [name, symbol, decimals] = await Promise.all([
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'name',
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'symbol',
      }),
      publicClient.readContract({
        address: tokenAddress,
        abi: erc20Abi,
        functionName: 'decimals',
      }),
    ]);

    const token: Token = {
      address: tokenAddress,
      name: name as string,
      symbol: symbol as string,
      decimals: decimals as number,
    };

    return token;
  }

  /**
   * Get token balance
   * @param tokenAddress - ERC-20 contract address
   * @param walletAddress - Wallet address to check
   */
  async getBalance(
    tokenAddress: Address,
    walletAddress: Address
  ): Promise<TokenBalance> {
    const publicClient = this.client.getPublicClient();
    const token = await this.getToken(tokenAddress);

    const balance = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [walletAddress],
    });

    return {
      token,
      balance: balance as bigint,
      formattedBalance: formatUnits(balance as bigint, token.decimals),
    };
  }

  /**
   * Get ETH balance
   * @param walletAddress - Wallet address to check
   */
  async getEthBalance(walletAddress: Address): Promise<{
    balance: bigint;
    formattedBalance: string;
  }> {
    const publicClient = this.client.getPublicClient();
    const balance = await publicClient.getBalance({ address: walletAddress });

    return {
      balance,
      formattedBalance: formatUnits(balance, 18),
    };
  }

  /**
   * Transfer tokens
   * @param tokenAddress - ERC-20 contract address
   * @param to - Recipient address
   * @param amount - Amount to transfer (in token units, not wei)
   */
  async transfer(
    tokenAddress: Address,
    to: Address,
    amount: string
  ): Promise<TransactionResult> {
    // Validate inputs
    const validatedTokenAddress = validateTokenAddress(tokenAddress);
    const validatedRecipient = validateAndChecksumAddress(to, 'recipient');

    const walletClient = this.client.getWalletClient();
    if (!walletClient) {
      throw new GiwaTransactionError('Wallet is not connected.');
    }

    const token = await this.getToken(validatedTokenAddress);

    // Validate amount
    if (!amount || amount.trim() === '') {
      throw new GiwaTransactionError('Transfer amount is required', 'INVALID_AMOUNT');
    }

    const amountInWei = parseUnits(amount, token.decimals);

    if (amountInWei <= 0n) {
      throw new GiwaTransactionError('Transfer amount must be greater than zero', 'INVALID_AMOUNT');
    }

    const hash = await walletClient.writeContract({
      address: validatedTokenAddress,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [validatedRecipient, amountInWei],
    });

    const publicClient = this.client.getPublicClient();

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
   * Approve token spending
   * @param tokenAddress - ERC-20 contract address
   * @param spender - Spender address
   * @param amount - Amount to approve (in token units)
   */
  async approve(
    tokenAddress: Address,
    spender: Address,
    amount: string
  ): Promise<TransactionResult> {
    // Validate inputs
    const validatedTokenAddress = validateTokenAddress(tokenAddress);
    const validatedSpender = validateSpenderAddress(spender);

    const walletClient = this.client.getWalletClient();
    if (!walletClient) {
      throw new GiwaTransactionError('Wallet is not connected.');
    }

    const token = await this.getToken(validatedTokenAddress);

    // Validate amount
    if (!amount || amount.trim() === '') {
      throw new GiwaTransactionError('Approve amount is required', 'INVALID_AMOUNT');
    }

    const amountInWei = parseUnits(amount, token.decimals);

    const hash = await walletClient.writeContract({
      address: validatedTokenAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [validatedSpender, amountInWei],
    });

    const publicClient = this.client.getPublicClient();

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
   * Get allowance
   * @param tokenAddress - ERC-20 contract address
   * @param owner - Token owner address
   * @param spender - Spender address
   */
  async getAllowance(
    tokenAddress: Address,
    owner: Address,
    spender: Address
  ): Promise<bigint> {
    const publicClient = this.client.getPublicClient();

    const allowance = await publicClient.readContract({
      address: tokenAddress,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [owner, spender],
    });

    return allowance as bigint;
  }

  /**
   * Add custom token
   * @param token - Token information
   */
  addCustomToken(token: Token): void {
    this.customTokens.set(token.address, token);
  }

  /**
   * Remove custom token
   * @param tokenAddress - Token address to remove
   */
  removeCustomToken(tokenAddress: Address): void {
    this.customTokens.delete(tokenAddress);
  }

  /**
   * Get all custom tokens
   */
  getCustomTokens(): Token[] {
    return Array.from(this.customTokens.values());
  }
}
