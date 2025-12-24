import { useState, useCallback, useRef } from 'react';

/**
 * Hook for managing common async action state
 *
 * Clean code principles:
 * - DRY (Don't Repeat Yourself): Abstract repeated isLoading/error pattern from all hooks
 * - SRP (Single Responsibility): Only handles async state management
 *
 * @example
 * const { execute, isLoading, error } = useAsyncAction(
 *   async (amount: string) => await bridgeManager.withdrawETH(amount)
 * );
 */
export interface AsyncActionState {
  isLoading: boolean;
  error: Error | null;
}

export interface UseAsyncActionReturn<TResult, TArgs extends unknown[]> extends AsyncActionState {
  execute: (...args: TArgs) => Promise<TResult>;
  reset: () => void;
}

export function useAsyncAction<TResult, TArgs extends unknown[]>(
  action: (...args: TArgs) => Promise<TResult>,
  options?: {
    onSuccess?: (result: TResult) => void;
    onError?: (error: Error) => void;
  }
): UseAsyncActionReturn<TResult, TArgs> {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Store action in ref to exclude from dependencies
  const actionRef = useRef(action);
  actionRef.current = action;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  const execute = useCallback(async (...args: TArgs): Promise<TResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await actionRef.current(...args);
      optionsRef.current?.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      optionsRef.current?.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
  }, []);

  return { execute, isLoading, error, reset };
}

/**
 * Hook for managing multiple async actions as a group
 *
 * @example
 * const actions = useAsyncActions({
 *   withdraw: async (amount: string) => await bridge.withdraw(amount),
 *   deposit: async (amount: string) => await bridge.deposit(amount),
 * });
 *
 * await actions.withdraw.execute('1.0');
 * console.log(actions.withdraw.isLoading);
 */
export function useAsyncActions<
  T extends Record<string, (...args: never[]) => Promise<unknown>>
>(actions: T): {
  [K in keyof T]: UseAsyncActionReturn<
    Awaited<ReturnType<T[K]>>,
    Parameters<T[K]>
  >;
} {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  // Manage individual state for each action
  const [states, setStates] = useState<Record<string, AsyncActionState>>(() =>
    Object.keys(actions).reduce(
      (acc, key) => ({ ...acc, [key]: { isLoading: false, error: null } }),
      {}
    )
  );

  const executors = useRef<Record<string, (...args: unknown[]) => Promise<unknown>>>({});

  // Create executor for each action
  Object.keys(actions).forEach((key) => {
    if (!executors.current[key]) {
      executors.current[key] = async (...args: unknown[]) => {
        setStates((prev) => ({
          ...prev,
          [key]: { isLoading: true, error: null },
        }));

        try {
          const result = await (actionsRef.current[key] as (...args: unknown[]) => Promise<unknown>)(...args);
          setStates((prev) => ({
            ...prev,
            [key]: { isLoading: false, error: null },
          }));
          return result;
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          setStates((prev) => ({
            ...prev,
            [key]: { isLoading: false, error },
          }));
          throw error;
        }
      };
    }
  });

  return Object.keys(actions).reduce((acc, key) => {
    return {
      ...acc,
      [key]: {
        execute: executors.current[key],
        isLoading: states[key]?.isLoading ?? false,
        error: states[key]?.error ?? null,
        reset: () =>
          setStates((prev) => ({
            ...prev,
            [key]: { isLoading: false, error: null },
          })),
      },
    };
  }, {} as ReturnType<typeof useAsyncActions<T>>);
}
