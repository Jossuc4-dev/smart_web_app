// src/contexts/AuthContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { getSocket } from '../hooks/useSocket';
import BASE_URL from '../config/ApiConfig';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface User {
  id: number;
  nom: string;
  email: string;
  role: 'ADMIN' | 'SUPERADMIN' | 'USER';
  profession: {
    poste: string;
    idEntreprise: number;
    entreprise: {
      id: number;
      nom: string;
    };
  };
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (userData: { token: string; user: User }) => void;
  logout: () => void;
}

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Durée d'inactivité avant déconnexion automatique : 15 minutes */
const INACTIVITY_LIMIT_MS = 15 * 60 * 1000;

/** Événements considérés comme une "interaction" utilisateur */
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'click',
];

// ─── Context ──────────────────────────────────────────────────────────────────

const defaultAuthContext: AuthContextType = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  logout: () => {},
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé à l'intérieur de AuthProvider");
  }
  return context;
};

// ─── Provider ─────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  const navigate = useNavigate();

  // Refs pour éviter les closures périmées dans les timers
  const tokenRef = useRef<string | null>(null);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingRef = useRef(false);

  // ── Déconnexion ─────────────────────────────────────────────────────────────

  const logout = useCallback(() => {
    // Annuler le timer d'inactivité
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    tokenRef.current = null;

    setState({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });

    navigate('/', { replace: true });
  }, [navigate]);

  // ── Refresh du token ─────────────────────────────────────────────────────────

  /**
   * Appelle /auth/verify-token.
   * Si le backend renvoie un nouveau token, on le stocke.
   * Si la requête échoue (token complètement invalide), on déconnecte.
   */
  const refreshToken = useCallback(async (): Promise<string | null> => {
    const currentToken = tokenRef.current;
    if (!currentToken) return null;

    // Empêcher les appels parallèles simultanés
    if (isRefreshingRef.current) return currentToken;
    isRefreshingRef.current = true;

    try {
      const res = await fetch(`${BASE_URL}/auth/verify-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: currentToken }),
      });

      if (!res.ok) {
        // Token complètement invalide → déconnexion
        logout();
        return null;
      }

      const data = await res.json();
      const newToken: string = data.token;

      // Mettre à jour le token partout
      localStorage.setItem('token', newToken);
      tokenRef.current = newToken;
      setState((prev) => ({ ...prev, token: newToken }));

      return newToken;
    } catch {
      // Erreur réseau → on garde la session active pour ne pas pénaliser
      // l'utilisateur sur une coupure momentanée
      return currentToken;
    } finally {
      isRefreshingRef.current = false;
    }
  }, [logout]);

  // ── Timer d'inactivité ───────────────────────────────────────────────────────

  const resetInactivityTimer = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    inactivityTimerRef.current = setTimeout(() => {
      // 15 min sans interaction → déconnexion directe, même si le token est encore valide
      logout();
    }, INACTIVITY_LIMIT_MS);
  }, [logout]);

  // ── Gestionnaire d'activité ──────────────────────────────────────────────────

  /**
   * Appelé à chaque interaction utilisateur :
   * 1. Remet à zéro le timer d'inactivité.
   * 2. Si le token est expiré (ou proche de l'expiration), lance un refresh.
   */
  const handleUserActivity = useCallback(() => {
    if (!tokenRef.current) return;

    // Réinitialiser le compteur d'inactivité
    resetInactivityTimer();

    // Vérifier si le token JWT est expiré côté client avant d'appeler le backend
    try {
      const payload = JSON.parse(atob(tokenRef.current.split('.')[1]));
      const expiresAt: number = payload.expires_at
        ? new Date(payload.expires_at).getTime()
        : payload.exp * 1000;

      if (Date.now() >= expiresAt) {
        // Token expiré → refresh silencieux
        refreshToken();
      }
    } catch {
      // Token malformé → déconnexion
      logout();
    }
  }, [resetInactivityTimer, refreshToken, logout]);

  // ── Attacher / détacher les listeners d'activité ────────────────────────────

  const startActivityListeners = useCallback(() => {
    ACTIVITY_EVENTS.forEach((event) =>
      window.addEventListener(event, handleUserActivity, { passive: true })
    );
    // Démarrer le timer dès l'attachement
    resetInactivityTimer();
  }, [handleUserActivity, resetInactivityTimer]);

  const stopActivityListeners = useCallback(() => {
    ACTIVITY_EVENTS.forEach((event) =>
      window.removeEventListener(event, handleUserActivity)
    );
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
  }, [handleUserActivity]);

  // ── Initialisation au montage ────────────────────────────────────────────────

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const parsedUser: User = JSON.parse(storedUser);

        tokenRef.current = storedToken;
        setState({
          token: storedToken,
          user: parsedUser,
          isAuthenticated: true,
          isLoading: false,
        });

        getSocket(storedToken);
        startActivityListeners();
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }

    return () => {
      stopActivityListeners();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Note : startActivityListeners / stopActivityListeners sont stables (useCallback),
  // mais on ne les met pas en deps pour n'exécuter cet effet qu'une seule fois au montage.

  // ── Login ────────────────────────────────────────────────────────────────────

  const login = useCallback(
    (userData: { token: string; user: User }) => {
      localStorage.setItem('token', userData.token);
      localStorage.setItem('user', JSON.stringify(userData.user));

      tokenRef.current = userData.token;

      setState({
        token: userData.token,
        user: userData.user,
        isAuthenticated: true,
        isLoading: false,
      });

      startActivityListeners();
      navigate('/dashboard');
    },
    [navigate, startActivityListeners]
  );

  // ── Valeur exposée ───────────────────────────────────────────────────────────

  const value: AuthContextType = {
    ...state,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
