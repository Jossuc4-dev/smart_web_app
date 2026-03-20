// pages/auth/index.tsx
import { useState } from 'react';
import BASE_URL from '../../config/ApiConfig';
import type { UserLoginData } from '../../models';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './index.css';

const LOGO_URL = '/assets/images/logo-smart.png';

// Simple inline SVG icons (no external deps)
const IconMail = () => (
  <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="3"/>
    <path d="m2 7 10 7 10-7"/>
  </svg>
);

const IconLock = () => (
  <svg className="input-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="3"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

export default function AuthScreen() {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const submitLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const response = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), password }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const dataLogin: UserLoginData = await response.json();

      if (dataLogin.success && dataLogin.data) {
        login({
          token: dataLogin.data.token,
          user: dataLogin.data.user,
        });
      } else {
        setErrorMsg(dataLogin.message || 'Identifiants incorrects.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') submitLogin();
  };

  return (
    <div className="auth-container">
      {/* Subtle grid texture */}
      <div className="grid-bg" aria-hidden="true" />

      <div className="login-card">
        {/* Logo */}
        <div className="logo-container">
          <img src={LOGO_URL} alt="Smart Business" className="logo" />
          <h1 className="brand-title">Smart Business</h1>
        </div>

        {/* Title */}
        <h2 className="login-title">
          <span>Bienvenue</span> de retour
        </h2>

        {/* Error */}
        {errorMsg && (
          <div className="error-message" role="alert">
            {errorMsg}
          </div>
        )}

        {/* Email */}
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Adresse e-mail
          </label>
          <div className="input-wrapper">
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={handleKeyDown}
              className="form-input"
              placeholder="vous@smartbusiness.mg"
              autoComplete="email"
              disabled={loading}
            />
            <IconMail />
          </div>
        </div>

        {/* Password */}
        <div className="form-group">
          <label htmlFor="password" className="form-label">
            Mot de passe
          </label>
          <div className="input-wrapper">
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="form-input"
              placeholder="••••••••••"
              autoComplete="current-password"
              disabled={loading}
            />
            <IconLock />
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={submitLogin}
          disabled={loading}
          className={`login-button ${loading ? 'loading' : ''}`}
        >
          {loading && <span className="loading-spinner" aria-hidden="true" />}
          {loading ? 'Connexion en cours…' : 'Se connecter'}
        </button>

        {/* Divider */}
        <div className="divider">
          <span>ou</span>
        </div>

        {/* Forgot */}
        <div className="forgot-password" onClick={()=> navigate("/forgot-password")}>
          <a href="/forgot-password" className="forgot-link">
            Mot de passe oublié ?
          </a>
        </div>
      </div>
    </div>
  );
}