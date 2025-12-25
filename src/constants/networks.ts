import type { GiwaNetwork, NetworkType } from '../types';

export const GIWA_NETWORKS: Record<NetworkType, GiwaNetwork> = {
  testnet: {
    id: 91342,
    name: 'GIWA Sepolia',
    rpcUrl: 'https://sepolia-rpc.giwa.io',
    flashblocksRpcUrl: 'https://sepolia-rpc-flashblocks.giwa.io',
    flashblocksWsUrl: 'wss://sepolia-rpc-flashblocks.giwa.io',
    explorerUrl: 'https://sepolia-explorer.giwa.io',
    currency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
  mainnet: {
    id: 91341, // TBD - will be updated when mainnet launches
    name: 'GIWA Mainnet',
    rpcUrl: 'https://rpc.giwa.io',
    flashblocksRpcUrl: 'https://rpc-flashblocks.giwa.io', // TBD
    flashblocksWsUrl: 'wss://rpc-flashblocks.giwa.io', // TBD
    explorerUrl: 'https://explorer.giwa.io',
    currency: {
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
    },
  },
};

export const DEFAULT_NETWORK: NetworkType = 'testnet';

export function getNetwork(network: NetworkType = DEFAULT_NETWORK): GiwaNetwork {
  return GIWA_NETWORKS[network];
}
