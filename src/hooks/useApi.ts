// src/hooks/useApi.ts
import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api.service';
import BASE_URL from '../config/ApiConfig';
import React from 'react';

export function useApi() {
  const { token, logout } = useAuth();

  // Initialiser le callback de logout
  React.useEffect(() => {
    apiService.setLogoutCallback(logout);
  }, [logout]);

  const buildUrl = (endpoint: string) => {
    const cleanEndpoint = endpoint.replace(/^\/+|\/+$/g, '');
    return `${BASE_URL}/${cleanEndpoint}`;
  };

  const get = useCallback(async <T = any>(endpoint: string): Promise<T> => {
    if (!token) throw new Error('Non authentifié');
    return apiService.get<T>(buildUrl(endpoint), token);
  }, [token]);

  const post = useCallback(async <T = any>(endpoint: string, data: any): Promise<T> => {
    if (!token) throw new Error('Non authentifié');
    return apiService.post<T>(buildUrl(endpoint), token, data);
  }, [token]);

  const put = useCallback(async <T = any>(endpoint: string, data: any): Promise<T> => {
    if (!token) throw new Error('Non authentifié');
    return apiService.put<T>(buildUrl(endpoint), token, data);
  }, [token]);

  const del = useCallback(async <T = any>(endpoint: string): Promise<T> => {
    if (!token) throw new Error('Non authentifié');
    return apiService.delete<T>(buildUrl(endpoint), token);
  }, [token]);

  return { get, post, put, delete: del };
}