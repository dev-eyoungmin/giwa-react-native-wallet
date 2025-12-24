import { useState, useCallback, useMemo, useRef } from 'react';
import { useGiwaManagers, useGiwaWalletContext } from '../providers/GiwaProvider';
import type { Address } from 'viem';

// GIWA Testnet Faucet URL
const FAUCET_URL = 'https://faucet.giwa.io';

export interface UseFaucetReturn {
  requestFaucet: (address?: Address) => Promise<void>;
  getFaucetUrl: () => string;
  isLoading: boolean;
  error: Error | null;
}


export function useFaucet(): UseFaucetReturn {
  const { client } = useGiwaManagers();
  const { wallet } = useGiwaWalletContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const clientRef = useRef(client);
  clientRef.current = client;

  const walletAddressRef = useRef(wallet?.address);
  walletAddressRef.current = wallet?.address;

  const requestFaucet = useCallback(
    async (address?: Address): Promise<void> => {
      const targetAddress = address || walletAddressRef.current;
      if (!targetAddress) {
        throw new Error('Wallet address is required.');
      }

      // Check if on testnet
      const network = clientRef.current.getNetwork();
      if (network !== 'testnet') {
        throw new Error('Faucet is only available on testnet.');
      }

      setIsLoading(true);
      setError(null);

      try {
        // Open faucet URL in browser
        // In React Native, you'd use Linking.openURL
        // For now, just return the action
        const url = `${FAUCET_URL}?address=${targetAddress}`;

        // This would need platform-specific implementation
        // Linking.openURL(url);
        console.log(`Faucet URL: ${url}`);

        // Note: Actual faucet request implementation depends on the faucet API
        // Some faucets are web-based, others have API endpoints
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Faucet request failed');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const getFaucetUrl = useCallback((): string => {
    return FAUCET_URL;
  }, []);

  return useMemo(() => ({
    requestFaucet,
    getFaucetUrl,
    isLoading,
    error,
  }), [requestFaucet, getFaucetUrl, isLoading, error]);
}
