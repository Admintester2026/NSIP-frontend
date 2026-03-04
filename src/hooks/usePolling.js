import { useState, useEffect, useCallback, useRef } from 'react';

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