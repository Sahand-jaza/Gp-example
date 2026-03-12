import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { useMemo } from 'react';

export const useApi = () => {
  const { getToken } = useAuth();

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
    });

    instance.interceptors.request.use(async (config) => {
      const token = await getToken();
      if (token && config.headers) {
        // Fallback for types
        (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
      }
      return config;
    });

    return instance;
  }, [getToken]);

  return api;
};
