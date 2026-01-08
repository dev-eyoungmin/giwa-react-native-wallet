import { useState, useCallback, useMemo, useRef } from 'react';
import { Linking, Platform } from 'react-native';
import { useGiwaManagers, useGiwaWalletContext, useGiwaState } from '../providers/GiwaProvider';
import type { Address } from 'viem';

// GIWA Testnet Faucet URL
const FAUCET_URL = 'https://faucet.giwa.io';

export interface UseFaucetReturn {
  requestFaucet: (address?: Address) => Promise<void>;
  getFaucetUrl: () => string;
  isInitializing: boolean;
  isLoading: boolean;
  error: Error | null;
}


export function useFaucet(): UseFaucetReturn {
  const managers = useGiwaManagers();
  const { isLoading: sdkLoading } = useGiwaState();
  const client = managers?.client ?? null;

  const { wallet } = useGiwaWalletContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const clientRef = useRef(client);
  clientRef.current = client;

  const walletAddressRef = useRef(wallet?.address);
  walletAddressRef.current = wallet?.address;

  const requestFaucet = useCallback(
    async (address?: Address): Promise<void> => {
      if (!clientRef.current) {
        throw new Error('SDK is still initializing');
      }

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
        const url = `${FAUCET_URL}?address=${targetAddress}`;

        // Platform-specific implementation
        if (Platform.OS === 'web') {
          // Web platform
          if (typeof window !== 'undefined') {
            window.open(url, '_blank');
          }
        } else {
          // React Native (iOS/Android)
          const supported = await Linking.canOpenURL(url);
          if (supported) {
            await Linking.openURL(url);
          } else {
            throw new Error(`Cannot open faucet URL: ${url}`);
          }
        }
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
    isInitializing: sdkLoading,
    isLoading,
    error,
  }), [requestFaucet, getFaucetUrl, sdkLoading, isLoading, error]);
}
