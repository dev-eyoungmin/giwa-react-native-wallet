/**
 * 네트워크 관련 타입 정의
 */

export type NetworkType = 'mainnet' | 'testnet';

export interface GiwaNetwork {
  id: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}
