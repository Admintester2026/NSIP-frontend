import { useState, useEffect, useCallback, useRef } from 'react';

export function usePolling(asyncFunction, interval = 30000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      const result = await asyncFunction();
      if (mounted.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (mounted.current) {
        setError(err);
      }
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [asyncFunction]);

  useEffect(() => {
    mounted.current = true;
    fetchData();

    if (interval > 0) {
      const timer = setInterval(fetchData, interval);
      return () => {
        clearInterval(timer);
        mounted.current = false;
      };
    }

    return () => {
      mounted.current = false;
    };
  }, [fetchData, interval]);

  return { data, loading, error, refetch: fetchData };
}

export function useMutation(mutationFn, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const mounted = useRef(true);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await mutationFn(...args);
      if (mounted.current) {
        setData(result);
        if (options.onSuccess) {
          options.onSuccess(result);
        }
      }
      return result;
    } catch (err) {
      if (mounted.current) {
        setError(err);
        if (options.onError) {
          options.onError(err);
        }
      }
      throw err;
    } finally {
      if (mounted.current) {
        setLoading(false);
      }
    }
  }, [mutationFn, options]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  return { data, loading, error, execute };
}