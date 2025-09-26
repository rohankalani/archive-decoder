import { useState, useCallback, useRef, useEffect } from 'react';
import { AppError, handleAsyncError, logger } from '@/lib/errors';

// ============= Types =============

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: AppError | null;
}

export interface AsyncOperationOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: AppError) => void;
  initialData?: any;
  resetOnExecute?: boolean;
}

// ============= Hook =============

export function useAsyncOperation<T = any, P extends any[] = any[]>(
  operation: (...args: P) => Promise<T>,
  options: AsyncOperationOptions = {}
) {
  const {
    onSuccess,
    onError,
    initialData = null,
    resetOnExecute = true,
  } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const mountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortControllerRef.current?.abort();
    };
  }, []);

  const execute = useCallback(async (...args: P): Promise<T | null> => {
    // Abort previous request if still pending
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    if (resetOnExecute) {
      setState(prev => ({
        ...prev,
        loading: true,
        error: null,
      }));
    } else {
      setState(prev => ({
        ...prev,
        loading: true,
      }));
    }

    const [result, error] = await handleAsyncError(operation(...args));

    if (!mountedRef.current) {
      return null;
    }

    if (error) {
      setState({
        data: resetOnExecute ? null : state.data,
        loading: false,
        error,
      });

      logger.error('Async operation failed', error, {
        operation: operation.name,
        args,
      });

      onError?.(error);
      return null;
    }

    setState({
      data: result,
      loading: false,
      error: null,
    });

    onSuccess?.(result);
    return result;
  }, [operation, onSuccess, onError, resetOnExecute, state.data]);

  const reset = useCallback(() => {
    abortControllerRef.current?.abort();
    setState({
      data: initialData,
      loading: false,
      error: null,
    });
  }, [initialData]);

  const setData = useCallback((data: T | null) => {
    setState(prev => ({
      ...prev,
      data,
    }));
  }, []);

  const setError = useCallback((error: AppError | null) => {
    setState(prev => ({
      ...prev,
      error,
      loading: false,
    }));
  }, []);

  return {
    ...state,
    execute,
    reset,
    setData,
    setError,
    isIdle: !state.loading && !state.error && !state.data,
    isSuccess: !state.loading && !state.error && state.data !== null,
    isError: !state.loading && state.error !== null,
  };
}

// ============= Specialized Hooks =============

export function useQuery<T>(
  queryFn: () => Promise<T>,
  options: AsyncOperationOptions & {
    enabled?: boolean;
    refetchOnMount?: boolean;
    staleTime?: number;
  } = {}
) {
  const {
    enabled = true,
    refetchOnMount = true,
    staleTime = 5 * 60 * 1000, // 5 minutes
    ...asyncOptions
  } = options;

  const lastFetchRef = useRef<number>(0);
  const queryOperation = useAsyncOperation(queryFn, asyncOptions);

  const refetch = useCallback(() => {
    lastFetchRef.current = Date.now();
    return queryOperation.execute();
  }, [queryOperation]);

  useEffect(() => {
    if (!enabled) return;

    const shouldFetch = 
      refetchOnMount && 
      (queryOperation.isIdle || 
       (Date.now() - lastFetchRef.current > staleTime));

    if (shouldFetch) {
      refetch();
    }
  }, [enabled, refetchOnMount, staleTime, refetch, queryOperation.isIdle]);

  return {
    ...queryOperation,
    refetch,
    isStale: Date.now() - lastFetchRef.current > staleTime,
  };
}

export function useMutation<T, P extends any[]>(
  mutationFn: (...args: P) => Promise<T>,
  options: AsyncOperationOptions = {}
) {
  const mutation = useAsyncOperation(mutationFn, {
    ...options,
    resetOnExecute: false, // Mutations typically don't reset data
  });

  const mutate = useCallback(async (...args: P) => {
    return mutation.execute(...args);
  }, [mutation]);

  return {
    ...mutation,
    mutate,
    mutateAsync: mutation.execute,
  };
}

// ============= Loading State Management =============

export function useLoadingState() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading,
    }));
  }, []);

  const isLoading = useCallback((key?: string) => {
    if (key) {
      return loadingStates[key] || false;
    }
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const clearLoading = useCallback((key?: string) => {
    if (key) {
      setLoadingStates(prev => {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      });
    } else {
      setLoadingStates({});
    }
  }, []);

  return {
    setLoading,
    isLoading,
    clearLoading,
    loadingStates,
  };
}