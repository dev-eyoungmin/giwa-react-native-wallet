/**
 * Token type definitions
 */
import type { Address } from 'viem';

export interface Token {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
  logoUri?: string;
}

export interface TokenBalance {
  token: Token;
  balance: bigint;
  formattedBalance: string;
}
