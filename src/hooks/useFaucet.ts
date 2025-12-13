import { useState, useCallback } from 'react';
import { useGiwaContext } from '../providers/GiwaProvider';
import type { Address } from 'viem';

// GIWA Testnet Faucet URL
const FAUCET_URL = 'https://faucet.giwa.io';

export interface UseFaucetReturn {
  requestFaucet: (address?: Address) => Promise<void>;
  getFaucetUrl: () => string;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for testnet faucet operations
 */
export function useFaucet(): UseFaucetReturn {
  const { wallet, client } = useGiwaContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const requestFaucet = useCallback(
    async (address?: Address): Promise<void> => {
      const targetAddress = address || wallet?.address;
      if (!targetAddress) {
        throw new Error('지갑 주소가 필요합니다.');
      }

      // Check if on testnet
      const network = client.getNetwork();
      if (network !== 'testnet') {
        throw new Error('Faucet은 테스트넷에서만 사용할 수 있습니다.');
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
        const error = err instanceof Error ? err : new Error('Faucet 요청 실패');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [wallet, client]
  );

  const getFaucetUrl = useCallback((): string => {
    return FAUCET_URL;
  }, []);

  return {
    requestFaucet,
    getFaucetUrl,
    isLoading,
    error,
  };
}
