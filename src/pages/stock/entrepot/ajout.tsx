// src/pages/stock/EntrepotAdd.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
  FaWarehouse,
  FaArrowLeft,
  FaCity,
  FaMapMarkerAlt,
  FaPlus,
  FaCheck,
  FaExclamationTriangle
} from 'react-icons/fa';
import './ajout.css';
import BASE_URL from '../../../config/ApiConfig';

interface EntrepotFormData {
  ville: string;
  zone: string;
}

export default function EntrepotAdd() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [formData, setFormData] = useState<EntrepotFormData>({
    ville: '',
    zone: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.ville.trim()) {
      newErrors.ville = 'La ville est requise';
    } else if (formData.ville.trim().length < 2) {
      newErrors.ville = 'La ville doit contenir au moins 2 caractères';
    }

    if (!formData.zone.trim()) {
      newErrors.zone = 'La zone est requise';
    } else if (formData.zone.trim().length < 2) {
      newErrors.zone = 'La zone doit contenir au moins 2 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setSubmitError(null);

    try {
      const response = await fetch(`${BASE_URL}/stock/entrepot/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ville: formData.ville.trim(),
          zone: formData.zone.trim(),
          idEntreprise: 0 // L'ID entreprise sera récupéré automatiquement par le backend via le token
        }),
      });

      if (response.status === 401) {
        setSubmitError('Session expirée. Veuillez vous reconnecter.');
        return;
      }

      if (response.ok) {
        const result = await response.json();
        // Rediriger vers la liste des entrepôts avec un message de succès
        navigate('/stock/entrepots', {
          state: {
            success: true,
            message: `Entrepôt ${formData.ville} - Zone ${formData.zone} créé avec succès`,
            entrepot: result.data
          }
        });
      } else {
        const error = await response.json();
        setSubmitError(error.message || 'Erreur lors de la création de l\'entrepôt');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setSubmitError('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Effacer l'erreur du champ lorsqu'il est modifié
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="entrepot-add-container">
      <header className="entrepot-add-header">
        <div className="header-content">
          <button className="back-btn" onClick={() => navigate('/stock/entrepots')}>
            <FaArrowLeft />
          </button>
          <div className="header-title">
            <div className="header-icon">
              <FaWarehouse />
            </div>
            <div>
              <h1>Ajouter un entrepôt</h1>
              <p>Créez un nouveau site de stockage</p>
            </div>
          </div>
        </div>
      </header>

      <div className="entrepot-add-content">
        <div className="form-card">
          <form onSubmit={handleSubmit}>
            {/* Champ Ville */}
            <div className="form-group">
              <label htmlFor="ville">
                <FaCity className="label-icon" />
                Ville <span className="required">*</span>
              </label>
              <div className={`input-wrapper ${errors.ville ? 'error' : ''}`}>
                <FaCity className="input-icon" />
                <input
                  type="text"
                  id="ville"
                  name="ville"
                  value={formData.ville}
                  onChange={handleChange}
                  placeholder="Ex: Antananarivo, Tamatave, Mahajanga..."
                  className="form-input"
                  disabled={loading}
                />
              </div>
              {errors.ville && <span className="error-message">{errors.ville}</span>}
            </div>

            {/* Champ Zone */}
            <div className="form-group">
              <label htmlFor="zone">
                <FaMapMarkerAlt className="label-icon" />
                Zone / Quartier <span className="required">*</span>
              </label>
              <div className={`input-wrapper ${errors.zone ? 'error' : ''}`}>
                <FaMapMarkerAlt className="input-icon" />
                <input
                  type="text"
                  id="zone"
                  name="zone"
                  value={formData.zone}
                  onChange={handleChange}
                  placeholder="Ex: Ankorondrano, Andraharo, Ampasamazava..."
                  className="form-input"
                  disabled={loading}
                />
              </div>
              {errors.zone && <span className="error-message">{errors.zone}</span>}
            </div>

            {/* Message d'erreur global */}
            {submitError && (
              <div className="submit-error">
                <FaExclamationTriangle />
                <span>{submitError}</span>
              </div>
            )}

            {/* Actions du formulaire */}
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate('/stock/entrepots')}
                disabled={loading}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Création...
                  </>
                ) : (
                  <>
                    <FaPlus />
                    Créer l'entrepôt
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Informations supplémentaires */}
        <div className="info-card">
          <h4>Informations</h4>
          <p>Un entrepôt représente un lieu physique où vous stockez vos marchandises.</p>
          <ul>
            <li>Chaque entrepôt est unique par sa ville et sa zone</li>
            <li>Vous pouvez avoir plusieurs entrepôts dans la même ville</li>
            <li>Les produits seront répartis dans vos différents entrepôts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}