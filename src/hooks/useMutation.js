import { useState, useCallback } from 'react';

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