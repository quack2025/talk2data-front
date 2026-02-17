import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import type { APIKeyCreate, APIKeyOut, APIKeyWithSecret } from '@/types/apiKey';

export function useApiKeys() {
  const [keys, setKeys] = useState<APIKeyOut[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newKeySecret, setNewKeySecret] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<APIKeyOut[]>('/api-keys');
      setKeys(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch API keys');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createKey = useCallback(async (data: APIKeyCreate): Promise<APIKeyWithSecret> => {
    setError(null);
    try {
      const created = await api.post<APIKeyWithSecret>('/api-keys', data);
      setKeys(prev => [created, ...prev]);
      setNewKeySecret(created.key);
      return created;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create API key';
      setError(message);
      throw err;
    }
  }, []);

  const deactivateKey = useCallback(async (keyId: string) => {
    setError(null);
    try {
      const updated = await api.patch<APIKeyOut>(`/api-keys/${keyId}/deactivate`);
      setKeys(prev => prev.map(k => (k.id === keyId ? { ...k, is_active: false } : k)));
      return updated;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to deactivate API key';
      setError(message);
      throw err;
    }
  }, []);

  const deleteKey = useCallback(async (keyId: string) => {
    setError(null);
    try {
      // DELETE /api-keys/{keyId} returns 204 (no content).
      // api.request always calls response.json(), which throws on empty body.
      // We catch the JSON parse error and treat it as success.
      await api.delete(`/api-keys/${keyId}`).catch((err) => {
        // If the request itself failed (4xx/5xx), ApiError is thrown before json parse.
        // A SyntaxError from json() on 204 means the delete succeeded.
        if (err?.name === 'SyntaxError' || err?.message?.includes('JSON')) return;
        throw err;
      });
      setKeys(prev => prev.filter(k => k.id !== keyId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete API key';
      setError(message);
      throw err;
    }
  }, []);

  const clearSecret = useCallback(() => {
    setNewKeySecret(null);
  }, []);

  return {
    keys,
    isLoading,
    error,
    newKeySecret,
    fetchKeys,
    createKey,
    deactivateKey,
    deleteKey,
    clearSecret,
  };
}
