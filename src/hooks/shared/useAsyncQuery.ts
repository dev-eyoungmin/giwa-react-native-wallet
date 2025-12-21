import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 데이터 조회용 비동기 훅 (자동 fetch + refetch 지원)
 *
 * 클린 코드 원칙:
 * - DRY: useBalance 등에서 반복되는 fetch/refetch 패턴 추상화
 * - SRP: 데이터 조회 상태 관리만 담당
 *
 * @example
 * const { data, isLoading, error, refetch } = useAsyncQuery(
 *   () => tokenManager.getBalance(address),
 *   { enabled: !!address }
 * );
 */
export interface UseAsyncQueryOptions<T> {
  /** 쿼리 활성화 여부 (기본값: true) */
  enabled?: boolean;
  /** 초기 데이터 */
  initialData?: T;
  /** 자동 refetch 간격 (ms) */
  refetchInterval?: number;
  /** 성공 콜백 */
  onSuccess?: (data: T) => void;
  /** 에러 콜백 */
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

  // queryFn을 ref로 저장하여 의존성에서 제외
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

  // 초기 fetch
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
