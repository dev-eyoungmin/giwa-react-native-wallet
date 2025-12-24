import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Async hook for data fetching (auto fetch + refetch support)
 *
 * Clean code principles:
 * - DRY: Abstract repeated fetch/refetch pattern from useBalance etc.
 * - SRP: Only handles data fetching state management
 *
 * @example
 * const { data, isLoading, error, refetch } = useAsyncQuery(
 *   () => tokenManager.getBalance(address),
 *   { enabled: !!address }
 * );
 */
export interface UseAsyncQueryOptions<T> {
  /** Whether query is enabled (default: true) */
  enabled?: boolean;
  /** Initial data */
  initialData?: T;
  /** Auto refetch interval (ms) */
  refetchInterval?: number;
  /** Success callback */
  onSuccess?: (data: T) => void;
  /** Error callback */
  onError?: (error: Error) => void;
}

export interface UseAsyncQueryReturn<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  reset: () => void;
}

export function useAsyncQuery<T>(
  queryFn: () => Promise<T>,
  options: UseAsyncQueryOptions<T> = {}
): UseAsyncQueryReturn<T> {
  const {
    enabled = true,
    initialData = null,
    refetchInterval,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Store queryFn in ref to exclude from dependencies
  const queryFnRef = useRef(queryFn);
  queryFnRef.current = queryFn;

  const onSuccessRef = useRef(onSuccess);
  onSuccessRef.current = onSuccess;

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const fetch = useCallback(async () => {
    if (!enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await queryFnRef.current();
      setData(result);
      onSuccessRef.current?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      onErrorRef.current?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [enabled]);

  // Initial fetch
  useEffect(() => {
    fetch();
  }, [fetch]);

  // refetch interval
  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(fetch, refetchInterval);
    return () => clearInterval(interval);
  }, [fetch, refetchInterval, enabled]);

  const reset = useCallback(() => {
    setData(initialData);
    setIsLoading(false);
    setError(null);
  }, [initialData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetch,
    reset,
  };
}
