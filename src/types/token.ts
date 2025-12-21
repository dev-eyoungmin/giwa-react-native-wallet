/**
 * 토큰 관련 타입 정의
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
