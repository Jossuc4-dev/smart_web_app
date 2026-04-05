// src/hooks/useApi.ts
import { useCallback, useEffect, useRef } from 'react';
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

// ─── Hook utilitaire : fetch avec refresh automatique ─────────────────────────

/**
 * Remplace fetch() dans toute l'application.
 * Si la réponse est 401, tente un refresh du token et rejoue la requête.
 * Usage : const apiFetch = useApiFetch();
 *         const data = await apiFetch('/api/ressource', { method: 'GET' });
 */
export const useApiFetch = (token:string, logout:()=>void) => {
  const tokenRef = useRef(token);
  useEffect(() => { tokenRef.current = token; }, [token]);

  return useCallback(
    async (url: string, options: RequestInit = {}): Promise<Response> => {
      const currentToken = tokenRef.current;

      const makeRequest = (tkn: string | null) =>
        fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...(tkn ? { Authorization: `Bearer ${tkn}` } : {}),
            ...(options.headers ?? {}),
          },
        });

      let response = await makeRequest(currentToken);

      // 401 → on tente un refresh avant de déconnecter
      if (response.status === 401 && currentToken) {
        const refreshRes = await fetch(`${BASE_URL}/auth/verify-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: currentToken }),
        });

        if (refreshRes.ok) {
          const { token: newToken } = await refreshRes.json();
          localStorage.setItem('token', newToken);
          tokenRef.current = newToken;
          // Rejouer la requête originale avec le nouveau token
          response = await makeRequest(newToken);
        } else {
          logout();
        }
      }

      return response;
    },
    [logout]
  );
};