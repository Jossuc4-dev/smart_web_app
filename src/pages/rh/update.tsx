// src/pages/rh/update/[id].tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FaArrowLeft,
  FaSave,
  FaUser,
  FaEnvelope,
  FaBriefcase,
  FaMoneyBillWave,
  FaBuilding,
  FaFileSignature,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaChevronDown,
  FaIdCard,
  FaVenusMars,
  FaHeart,
  FaCalendarAlt,
  FaChild
} from 'react-icons/fa';
import './update.css';
import BASE_URL from '../../config/ApiConfig';

interface Profession {
  id: number;
  poste: string;
  salaire: number;
}

interface UserData {
  id: number;
  nom: string;
  email: string;
  profession: {
    poste: string;
    salaire: number;
  };
  boolcnaps: boolean;
  numeroCnaps?: string;
  cnaps?: any[];
  cin: string;
  sexe: 'HOMME' | 'FEMME';
  situation: 'CELIBATAIRE' | 'MARIE';
  dateEmbauche: string;
  enfants: number;
}

export default function UpdateUserScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  // États des champs
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [profession, setProfession] = useState('');
  const [salaire, setSalaire] = useState('');
  const [cin, setCin] = useState('');
  const [sexe, setSexe] = useState<'HOMME' | 'FEMME' | ''>('');
  const [situation, setSituation] = useState<'CELIBATAIRE' | 'MARIE' | ''>('');
  const [dateEmbauche, setDateEmbauche] = useState('');
  const [enfants, setEnfants] = useState('0');

  // États CNAPS
  const [enableCnaps, setEnableCnaps] = useState(false);
  const [numeroCnaps, setNumeroCnaps] = useState('');

  // États UI
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showProfessionsDropdown, setShowProfessionsDropdown] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [originalData, setOriginalData] = useState<UserData | null>(null);

  // Chargement des données
  useEffect(() => {
    const fetchData = async () => {
      if (!token || !id) return;

      try {
        setLoading(true);

        // Charger l'utilisateur
        const userResponse = await fetch(`${BASE_URL}/rh/staff/id/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const userData: UserData = await userResponse.json();
        setOriginalData(userData);

        // Remplir les champs
        setNom(userData.nom || '');
        setEmail(userData.email || '');
        setProfession(userData.profession?.poste?.toString() || '');
        setSalaire(userData.profession?.salaire?.toString() || '');
        setCin(userData.cin || '');
        setSexe(userData.sexe || '');
        setSituation(userData.situation || '');
        setDateEmbauche(userData.dateEmbauche?.split('T')[0] || '');
        setEnfants(userData.enfants?.toString() || '0');
        setEnableCnaps(!!userData.boolcnaps);
        setNumeroCnaps(userData.numeroCnaps || '');

        // Charger les professions
        const profResponse = await fetch(`${BASE_URL}/rh/profession/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const profData: Profession[] = await profResponse.json();
        setProfessions(profData);
      } catch (err) {
        console.error('Erreur chargement:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, token]);

  // Validation
  const validateForm = () => {
    const newErrors = {
      nom: !nom.trim(),
      email: !email.trim() || !email.includes('@'),
      profession: !profession.trim(),
      salaire: !salaire.trim() || isNaN(Number(salaire)) || Number(salaire) <= 0,
      cin: !cin.trim() || cin.length !== 12,
      sexe: !sexe,
      situation: !situation,
      numeroCnaps: enableCnaps && !numeroCnaps.trim(),
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(e => e);
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  // Soumission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    const selectedProfession = professions.find(p => p.poste === profession);

    const formData = {
      nom,
      email,
      profession,
      salaire: Number(salaire),
      cin,
      sexe,
      situation,
      dateEmbauche: new Date(dateEmbauche).toISOString(),
      enfants: Number(enfants),
      cnaps: enableCnaps ? numeroCnaps : null,
      idProfession: selectedProfession?.id,
    };

    console.log('Données à soumettre:', formData);

    try {
      const response = await fetch(`${BASE_URL}/rh/staff/id/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setShowSuccessModal(true);
      } else {
        setErrors(prev => ({ ...prev, submit: result.message || "Impossible de mettre à jour" }));
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, submit: "Erreur réseau ou serveur" as any}));
    } finally {
      setSubmitting(false);
    }
  };

  // Détecter les changements
  const hasChanges = () => {
    if (!originalData) return false;
    
    return (
      nom !== originalData.nom ||
      email !== originalData.email ||
      profession !== originalData.profession?.poste ||
      salaire !== originalData.profession?.salaire?.toString() ||
      cin !== originalData.cin ||
      sexe !== originalData.sexe ||
      situation !== originalData.situation ||
      dateEmbauche !== originalData.dateEmbauche?.split('T')[0] ||
      enfants !== originalData.enfants?.toString() ||
      enableCnaps !== originalData.boolcnaps ||
      numeroCnaps !== (originalData.numeroCnaps || '')
    );
  };

  if (loading) {
    return (
      <div className="update-loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="update-user-container">
      {/* Header */}
      <header className="update-header">
        <button className="back-button" onClick={() => navigate(`/rh/${id}`)}>
          <FaArrowLeft />
          Retour
        </button>
        <h1>
          <FaUser />
          Modifier l'employé
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="update-form">
        {/* Avatar et statut */}
        <div className="form-header">
          <div className="user-avatar">
            <span className="avatar-text">
              {nom.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="user-info">
            <h2>{nom || 'Nom complet'}</h2>
            <p className="user-email">{email || 'email@exemple.com'}</p>
            {hasChanges() && (
              <span className="unsaved-badge">
                <FaExclamationTriangle />
                Modifications non enregistrées
              </span>
            )}
          </div>
        </div>

        {/* Sections du formulaire */}
        <div className="form-sections">
          {/* Informations de base */}
          <section className="form-section">
            <h3 className="section-title">
              <FaUser className="section-icon" />
              Informations de base
            </h3>

            <div className="form-grid">
              <div className={`form-group ${touched.nom && errors.nom ? 'error' : ''}`}>
                <label>
                  <FaUser className="input-icon" />
                  Nom complet *
                </label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  onBlur={() => handleBlur('nom')}
                  placeholder="Ex: Rakoto Jean"
                  className={touched.nom && errors.nom ? 'error' : ''}
                />
                {touched.nom && errors.nom && (
                  <span className="error-message">Nom obligatoire</span>
                )}
              </div>

              <div className={`form-group ${touched.email && errors.email ? 'error' : ''}`}>
                <label>
                  <FaEnvelope className="input-icon" />
                  Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => handleBlur('email')}
                  placeholder="Ex: jean.rakoto@entreprise.mg"
                  className={touched.email && errors.email ? 'error' : ''}
                />
                {touched.email && errors.email && (
                  <span className="error-message">Email invalide</span>
                )}
              </div>
            </div>
          </section>

          {/* Informations professionnelles */}
          <section className="form-section">
            <h3 className="section-title">
              <FaBriefcase className="section-icon" />
              Informations professionnelles
            </h3>

            <div className="form-grid">
              <div className={`form-group ${touched.profession && errors.profession ? 'error' : ''}`}>
                <label>
                  <FaBriefcase className="input-icon" />
                  Poste *
                </label>
                <div className="custom-select">
                  <div
                    className={`select-trigger ${touched.profession && errors.profession ? 'error' : ''}`}
                    onClick={() => setShowProfessionsDropdown(!showProfessionsDropdown)}
                  >
                    <span>{profession || "Sélectionnez un poste"}</span>
                    <FaChevronDown className={`chevron ${showProfessionsDropdown ? 'open' : ''}`} />
                  </div>
                  {showProfessionsDropdown && (
                    <div className="select-dropdown">
                      {professions.map((prof) => (
                        <div
                          key={prof.id}
                          className={`dropdown-item ${profession === prof.poste ? 'selected' : ''}`}
                          onClick={() => {
                            setProfession(prof.poste);
                            setSalaire(prof.salaire.toString());
                            setShowProfessionsDropdown(false);
                          }}
                        >
                          <strong>{prof.poste}</strong>
                          <span className="item-salaire">{prof.salaire.toLocaleString()} Ar</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {touched.profession && errors.profession && (
                  <span className="error-message">Poste obligatoire</span>
                )}
              </div>

              <div className={`form-group ${touched.salaire && errors.salaire ? 'error' : ''}`}>
                <label>
                  <FaMoneyBillWave className="input-icon" />
                  Salaire (Ar) *
                </label>
                <input
                  type="number"
                  value={salaire}
                  onChange={(e) => setSalaire(e.target.value)}
                  onBlur={() => handleBlur('salaire')}
                  placeholder="Ex: 1500000"
                  className={touched.salaire && errors.salaire ? 'error' : ''}
                />
                {touched.salaire && errors.salaire && (
                  <span className="error-message">Salaire invalide</span>
                )}
              </div>
            </div>
          </section>

          {/* Informations personnelles */}
          <section className="form-section">
            <h3 className="section-title">
              <FaIdCard className="section-icon" />
              Informations personnelles
            </h3>

            <div className="form-grid">
              <div className={`form-group ${touched.cin && errors.cin ? 'error' : ''}`}>
                <label>
                  <FaIdCard className="input-icon" />
                  Numéro CIN *
                </label>
                <input
                  type="text"
                  value={cin}
                  onChange={(e) => setCin(e.target.value)}
                  onBlur={() => handleBlur('cin')}
                  placeholder="12 chiffres"
                  maxLength={12}
                  className={touched.cin && errors.cin ? 'error' : ''}
                />
                {touched.cin && errors.cin && (
                  <span className="error-message">CIN invalide (12 chiffres)</span>
                )}
              </div>

              <div className={`form-group ${touched.sexe && errors.sexe ? 'error' : ''}`}>
                <label>
                  <FaVenusMars className="input-icon" />
                  Sexe *
                </label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="sexe"
                      value="HOMME"
                      checked={sexe === 'HOMME'}
                      onChange={(e) => setSexe('HOMME')}
                      onBlur={() => handleBlur('sexe')}
                    />
                    <span>Homme</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="sexe"
                      value="FEMME"
                      checked={sexe === 'FEMME'}
                      onChange={(e) => setSexe('FEMME')}
                      onBlur={() => handleBlur('sexe')}
                    />
                    <span>Femme</span>
                  </label>
                </div>
                {touched.sexe && errors.sexe && (
                  <span className="error-message">Sexe obligatoire</span>
                )}
              </div>

              <div className={`form-group ${touched.situation && errors.situation ? 'error' : ''}`}>
                <label>
                  <FaHeart className="input-icon" />
                  Situation matrimoniale *
                </label>
                <div className="radio-group">
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="situation"
                      value="CELIBATAIRE"
                      checked={situation === 'CELIBATAIRE'}
                      onChange={(e) => setSituation('CELIBATAIRE')}
                      onBlur={() => handleBlur('situation')}
                    />
                    <span>Célibataire</span>
                  </label>
                  <label className="radio-label">
                    <input
                      type="radio"
                      name="situation"
                      value="MARIE"
                      checked={situation === 'MARIE'}
                      onChange={(e) => setSituation('MARIE')}
                      onBlur={() => handleBlur('situation')}
                    />
                    <span>Marié(e)</span>
                  </label>
                </div>
                {touched.situation && errors.situation && (
                  <span className="error-message">Situation obligatoire</span>
                )}
              </div>

              <div className="form-group">
                <label>
                  <FaCalendarAlt className="input-icon" />
                  Date d'embauche *
                </label>
                <input
                  type="date"
                  value={dateEmbauche}
                  onChange={(e) => setDateEmbauche(e.target.value)}
                  className="date-input"
                />
              </div>

              <div className="form-group">
                <label>
                  <FaChild className="input-icon" />
                  Nombre d'enfants
                </label>
                <input
                  type="number"
                  value={enfants}
                  onChange={(e) => setEnfants(e.target.value)}
                  min="0"
                  placeholder="0"
                />
              </div>
            </div>
          </section>

          {/* Section CNAPS */}
          <section className="form-section">
            <h3 className="section-title">
              <FaBuilding className="section-icon" />
              Affiliation CNAPS
            </h3>

            <div className="switch-group">
              <label className="switch-label">
                <span>Activer CNAPS</span>
                <div className="switch">
                  <input
                    type="checkbox"
                    checked={enableCnaps}
                    onChange={(e) => setEnableCnaps(e.target.checked)}
                  />
                  <span className="switch-slider"></span>
                </div>
              </label>
            </div>

            {enableCnaps && (
              <div className={`form-group ${touched.numeroCnaps && errors.numeroCnaps ? 'error' : ''}`}>
                <label>
                  <FaFileSignature className="input-icon" />
                  Numéro CNAPS *
                </label>
                <input
                  type="text"
                  value={numeroCnaps}
                  onChange={(e) => setNumeroCnaps(e.target.value)}
                  onBlur={() => handleBlur('numeroCnaps')}
                  placeholder="Ex: 123456789012"
                  className={touched.numeroCnaps && errors.numeroCnaps ? 'error' : ''}
                />
                {touched.numeroCnaps && errors.numeroCnaps && (
                  <span className="error-message">Numéro CNAPS obligatoire</span>
                )}
              </div>
            )}
          </section>

          {/* Erreur générale */}
          {errors.submit && (
            <div className="error-banner">
              <FaExclamationTriangle />
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Boutons d'action */}
          <div className="form-actions">
            <button
              type="button"
              className="cancel-btn"
              onClick={() => navigate(`/rh/${id}`)}
              disabled={submitting}
            >
              <FaTimes />
              Annuler
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={submitting || !hasChanges()}
            >
              {submitting ? (
                <>
                  <span className="spinner"></span>
                  Enregistrement...
                </>
              ) : (
                <>
                  <FaSave />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Modal de succès */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="success-modal">
            <FaCheckCircle className="success-icon" />
            <h2>Succès !</h2>
            <p>Les informations ont été modifiées avec succès.</p>
            <button
              className="modal-btn"
              onClick={() => {
                setShowSuccessModal(false);
                navigate(`/rh/${id}`);
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}