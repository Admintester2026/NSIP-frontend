// src/hooks/useAsync.js
import { useState, useEffect, useCallback, useRef } from 'react';

// Hook para polling (consultas repetitivas)
export function usePolling(fetchFunction, interval = 5000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchFunction();
      if (mountedRef.current) {
        setData(result);
        setError(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err);
        console.error('Error en polling:', err);
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [fetchFunction]);

  useEffect(() => {
    mountedRef.current = true;
    fetchData();
    
    const intervalId = setInterval(fetchData, interval);
    
    return () => {
      mountedRef.current = false;
      clearInterval(intervalId);
    };
  }, [fetchData, interval]);

  return { data, error, loading };
}

// Hook para mutaciones (POST, PUT, DELETE)
export function useMutation(mutationFunction, options = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const mutate = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await mutationFunction(...args);
      setData(result);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      setError(err);
      options.onError?.(err);
      throw err;
    } finally {
      setLoading(false);
      options.onSettled?.();
    }
  }, [mutationFunction, options]);

  return { mutate, data, error, loading };
}