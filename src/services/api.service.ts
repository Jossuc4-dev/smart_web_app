// src/services/api.service.ts
import { useAuth } from '../contexts/AuthContext';

interface FetchOptions extends RequestInit {
  headers?: HeadersInit;
}

class ApiService {
  private static instance: ApiService;
  private logoutCallback: (() => void) | null = null;

  private constructor() {}

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  setLogoutCallback(callback: () => void) {
    this.logoutCallback = callback;
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      // Token invalide ou expiré
      if (this.logoutCallback) {
        this.logoutCallback();
      }
      throw new Error('Session expirée. Veuillez vous reconnecter.');
    }
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || `Erreur HTTP ${response.status}`);
    }
    
    return response;
  }

  async fetchWithAuth(url: string, token: string, options: FetchOptions = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      return this.handleResponse(response);
    } catch (error) {
      if (error instanceof Error && error.message === 'Failed to fetch') {
        throw new Error('Erreur de connexion au serveur');
      }
      throw error;
    }
  }

  async get<T>(url: string, token: string): Promise<T> {
    const response = await this.fetchWithAuth(url, token);
    return response.json();
  }

  async post<T>(url: string, token: string, data: any): Promise<T> {
    const response = await this.fetchWithAuth(url, token, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async put<T>(url: string, token: string, data: any): Promise<T> {
    const response = await this.fetchWithAuth(url, token, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async delete<T>(url: string, token: string): Promise<T> {
    const response = await this.fetchWithAuth(url, token, {
      method: 'DELETE',
    });
    return response.json();
  }
}

export const apiService = ApiService.getInstance();