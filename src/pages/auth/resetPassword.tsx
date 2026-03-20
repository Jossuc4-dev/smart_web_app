// resetPassword.tsx (version mise à jour avec les classes CSS)

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLock, FiCheckCircle, FiAlertCircle, FiArrowLeft, FiRefreshCw } from 'react-icons/fi';
import { HiOutlineKey } from 'react-icons/hi';
import BASE_URL from '../../config/ApiConfig';
import './resetPassword.css';

export default function ResetPassword() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('resetEmail');
    if (storedEmail) {
      setEmail(storedEmail);
    }
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    let strength = 0;
    if (newPassword.length >= 6) strength++;
    if (newPassword.length >= 10) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;
    if (/[^A-Za-z0-9]/.test(newPassword)) strength++;
    setPasswordStrength(Math.min(strength, 4));
  }, [newPassword]);

  const handleCodeChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      if (value && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    digits.split('').forEach((digit, idx) => {
      if (idx < 6) newCode[idx] = digit;
    });
    setCode(newCode);
    
    const lastFilledIndex = Math.min(digits.length, 5);
    const nextInput = document.getElementById(`code-${lastFilledIndex}`);
    nextInput?.focus();
  };

  const getStrengthColor = (index: number) => {
    if (index < passwordStrength) {
      if (passwordStrength === 1) return 'bg-red-500';
      if (passwordStrength === 2) return 'bg-orange-500';
      if (passwordStrength === 3) return 'bg-yellow-500';
      if (passwordStrength === 4) return 'bg-green-500';
      return 'bg-gray-200';
    }
    return 'bg-gray-200';
  };

  const getStrengthText = () => {
    if (passwordStrength === 0) return 'Très faible';
    if (passwordStrength === 1) return 'Faible';
    if (passwordStrength === 2) return 'Moyen';
    if (passwordStrength === 3) return 'Fort';
    return 'Très fort';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Veuillez saisir le code à 6 chiffres');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: fullCode,
          newPassword,
          email
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        sessionStorage.removeItem('resetEmail');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(data.message);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la réinitialisation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) return;
    
    setIsLoading(true);
    try {
      await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      setError('');
      setCode(['', '', '', '', '', '']);
      if (firstInputRef.current) {
        firstInputRef.current.focus();
      }
    } catch (err: any) {
      setError('Erreur lors du renvoi du code');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="success-page">
        <div className="success-container">
          <div className="success-icon-wrapper">
            <FiCheckCircle className="success-icon" />
          </div>
          <h1 className="success-title">Mot de passe réinitialisé !</h1>
          <p className="success-description">
            Votre mot de passe a été modifié avec succès.
          </p>
          <div className="redirect-box">
            <div className="redirect-spinner" />
            <p className="redirect-text">
              Redirection vers la page de connexion...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        {/* Header */}
        <div className="reset-header">
          <div className="icon-box">
            <HiOutlineKey />
          </div>
          <h1 className="reset-title">Réinitialiser</h1>
          <p className="reset-subtitle">
            {email ? `Code envoyé à ${email}` : 'Entrez le code reçu par email'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <FiAlertCircle className="error-icon" />
            <p className="error-text">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="reset-form">
          {/* Code Input */}
          <div className="code-section">
            <label className="code-label">Code de vérification</label>
            <div className="code-inputs-wrapper" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <input
                  key={index}
                  id={`code-${index}`}
                  ref={index === 0 ? firstInputRef : null}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleCodeChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="code-input"
                  disabled={isLoading}
                />
              ))}
            </div>
          </div>

          {/* New Password */}
          <div className="password-section">
            <label className="password-label">Nouveau mot de passe</label>
            <div className="password-input-wrapper">
              <FiLock className="password-icon" />
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="password-input"
              />
            </div>
            {newPassword && (
              <div className="password-strength">
                <div className="strength-bars">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`strength-bar ${getStrengthColor(i)}`}
                    />
                  ))}
                </div>
                <p className="strength-text">Force : {getStrengthText()}</p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="password-section">
            <label className="password-label">Confirmer le mot de passe</label>
            <div className="password-input-wrapper">
              <FiLock className="password-icon" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isLoading}
                className="password-input"
              />
            </div>
            {confirmPassword && newPassword !== confirmPassword && (
              <p className="password-mismatch">Les mots de passe ne correspondent pas</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="submit-button"
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                <span>Réinitialisation...</span>
              </>
            ) : (
              'Réinitialiser le mot de passe'
            )}
          </button>

          {/* Action Buttons */}
          <div className="action-buttons">
            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              className="action-button"
            >
              <FiArrowLeft />
              <span>Retour</span>
            </button>
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isLoading}
              className="action-button"
            >
              <FiRefreshCw />
              <span>Renvoyer</span>
            </button>
          </div>
        </form>

        {/* Help Text */}
        <div className="help-text">
          <p>Le code est valable pendant 15 minutes</p>
        </div>
      </div>
    </div>
  );
}