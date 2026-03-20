// forgotPassword.tsx

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiArrowLeft, FiSend, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { HiOutlineKey } from 'react-icons/hi';
import './forgotPassword.css';
import BASE_URL from '../../config/ApiConfig';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Veuillez entrer votre adresse email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setIsSubmitted(true);
        sessionStorage.setItem('resetEmail', email);
      } else {
        setError(data.message || 'Une erreur est survenue');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoToReset = () => {
    navigate('/reset-password');
  };

  if (isSubmitted) {
    return (
      <div className="forgot-password-container">
        <div className="forgot-password-card success-card">
          <div className="success-icon-wrapper">
            <FiCheckCircle className="success-icon" />
          </div>
          <h1 className="card-title">Email envoyé !</h1>
          <p className="card-description">
            Un code de réinitialisation a été envoyé à l'adresse :
          </p>
          <p className="email-highlight">{email}</p>
          
          <div className="info-box">
            <FiMail className="info-icon" />
            <p className="info-text">
              Vérifiez votre boîte de réception et vos spams, puis saisissez le code reçu.
            </p>
          </div>

          <button onClick={handleGoToReset} className="btn-primary btn-large">
            Saisir le code
          </button>

          <button onClick={() => setIsSubmitted(false)} className="btn-link">
            Modifier l'adresse email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-card">
        <div className="icon-wrapper">
          <HiOutlineKey className="main-icon" />
        </div>
        
        <h1 className="card-title">Mot de passe oublié ?</h1>
        <p className="card-description">
          Entrez votre adresse email et nous vous enverrons un code pour réinitialiser votre mot de passe.
        </p>

        {error && (
          <div className="error-message">
            <FiAlertCircle className="error-icon" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="forgot-password-form">
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              Adresse email
            </label>
            <div className={`input-wrapper ${isFocused ? 'input-focused' : ''}`}>
              <FiMail className="input-icon" />
              <input
                ref={inputRef}
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="exemple@email.com"
                disabled={isLoading}
                className="form-input"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary btn-large"
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                <span>Envoi en cours...</span>
              </>
            ) : (
              <>
                <FiSend className="btn-icon" />
                <span>Envoyer le code</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => navigate('/login')}
            className="btn-back"
          >
            <FiArrowLeft className="btn-icon" />
            <span>Retour à la connexion</span>
          </button>
        </form>

        <div className="footer-link">
          <p>
            Vous avez déjà reçu un code ?{' '}
            <button onClick={handleGoToReset} className="inline-link">
              Saisir le code ici
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}