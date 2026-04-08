// src/pages/rh/add.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FaUserPlus,
  FaArrowLeft,
  FaEnvelope,
  FaLock,
  FaUser,
  FaBriefcase,
  FaMoneyBillWave,
  FaIdCard,
  FaVenusMars,
  FaHeart,
  FaCalendarAlt,
  FaChild,
  FaFileSignature,
  FaPercentage,
  FaBuilding,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSave,
  FaTimes,
  FaChevronDown,
  FaMoneyBill
} from 'react-icons/fa';

import './add.css';
import BASE_URL from '../../config/ApiConfig';

interface Profession {
  id: number;
  poste: string;
  reference: string;
}

export default function AddUserScreen() {
  const navigate = useNavigate();
  const { token } = useAuth();

  // États des champs
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [profession, setProfession] = useState('');
  const [salaire, setSalaire] = useState('');
  const [reference, setReference] = useState('');
  const [mdp, setMdp] = useState('');
  const [confMdp, setConfMdp] = useState('');
  const [cin, setCin] = useState('');
  const [sexe, setSexe] = useState<'HOMME' | 'FEMME' | ''>('');
  const [situation, setSituation] = useState<'CELIBATAIRE' | 'MARIE' | ''>('');
  const [dateEmbauche, setDateEmbauche] = useState(new Date().toISOString().split('T')[0]);
  const [enfants, setEnfants] = useState('0');

  // États CNAPS
  const [enableCnaps, setEnableCnaps] = useState(false);
  const [numeroCnaps, setNumeroCnaps] = useState('');
  const [montantPersonnel, setMontantPersonnel] = useState('');
  const [montantEntreprise, setMontantEntreprise] = useState('');

  // États IRSA
  const [enableIrsa, setEnableIrsa] = useState(false);
  const [numeroIrsa, setNumeroIrsa] = useState('');
  const [montantIrsa, setMontantIrsa] = useState('');

  // États UI
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProfessions, setLoadingProfessions] = useState(true);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showProfessionsDropdown, setShowProfessionsDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});


  // Chargement des professions
  useEffect(() => {
    const fetchProfessions = async () => {
      if (!token) return;

      try {
        setLoadingProfessions(true);
        const response = await fetch(`${BASE_URL}/rh/profession/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        const data = await response.json();
        setProfessions(data);
      } catch (err) {
        console.error('Erreur chargement professions:', err);
      } finally {
        setLoadingProfessions(false);
      }
    };

    fetchProfessions();
  }, [token]);

  // Validation
  const validateForm = () => {
    const newErrors = {
      nom: !nom.trim(),
      email: !email.trim() || !email.includes('@'),
      profession: !profession.trim(),
      salaire: !salaire.trim() || isNaN(Number(salaire)) || Number(salaire) <= 0,
      mdp: !mdp.trim() || mdp.length < 6,
      confMdp: !confMdp.trim(),
      mdpMatch: mdp !== confMdp,
      cin: !cin.trim() || cin.length !== 12,
      sexe: !sexe,
      situation: !situation,
      numeroCnaps: enableCnaps && !numeroCnaps.trim(),
      montantPersonnel: enableCnaps && !montantPersonnel.trim(),
      montantEntreprise: enableCnaps && !montantEntreprise.trim(),
      numeroIrsa: enableIrsa && !numeroIrsa.trim(),
      montantIrsa: enableIrsa && !montantIrsa.trim(),
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

    setLoading(true);

    const selectedProfession = professions.find(p => p.poste === profession);

    const formData = {
      nom,
      email,
      profession,
      salaire: Number(salaire),
      password: mdp,
      cin,
      sexe,
      situation,
      dateEmbauche: new Date(dateEmbauche).toISOString(),
      enfants: Number(enfants),
      cnapsbool: enableCnaps,
      irsabool: enableIrsa,
      idProfession: selectedProfession?.id,
      role: 'USER',
      numCnaps: enableCnaps ? numeroCnaps : null,
      montantPersonnel: enableCnaps ? montantPersonnel : null,
      montantEntreprise: enableCnaps ? montantEntreprise : null,
      montantIrsa: enableIrsa ? montantIrsa : null,
    };

    try {
      const response = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
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
        setErrors(prev => ({ ...prev, submit: result.message || "Impossible d'ajouter l'employé" }));
      }
    } catch (err) {
      setErrors(prev => ({ ...prev, submit: "Erreur lors de la requête" as any }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-user-container">
      {/* Header */}
      <header className="add-user-header">
        <button className="back-button" onClick={() => navigate('/rh')}>
          <FaArrowLeft />
          Retour
        </button>
        <h1>
          <FaUserPlus />
          Ajouter un employé
        </h1>
      </header>

      <form onSubmit={handleSubmit} className="add-user-form">
        {/* Informations de base */}
        <section className="form-section">
          <h2 className="section-title">
            <FaUser className="section-icon" />
            Informations de base
          </h2>

          <div className="form-grid">
            <div className={`form-group ${touched.nom && errors.nom ? 'error' : ''}`}>
              <label>
                <FaUser className="input-icon" />
                Nom complet *
              </label>
              <input
                type="text"
                placeholder="Ex: Rakoto Jean"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                onBlur={() => handleBlur('nom')}
                className={touched.nom && errors.nom ? 'error' : ''}
              />
              {touched.nom && errors.nom && (
                <span className="error-message">Nom obligatoire</span>
              )}
            </div>

            <div className={`form-group ${touched.email && errors.email ? 'error' : ''}`}>
              <label>
                <FaEnvelope className="input-icon" />
                Email professionnel *
              </label>
              <input
                type="email"
                placeholder="Ex: jean.rakoto@entreprise.mg"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
                className={touched.email && errors.email ? 'error' : ''}
              />
              {touched.email && errors.email && (
                <span className="error-message">Email invalide</span>
              )}
            </div>

            <div className={`form-group ${touched.profession && errors.profession ? 'error' : ''}`}>
              <label>
                <FaBriefcase className="input-icon" />
                Poste / Profession *
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
                    {loadingProfessions ? (
                      <div className="dropdown-loading">Chargement...</div>
                    ) : (
                      professions.map((prof) => (
                        <div
                          key={prof.id}
                          className="dropdown-item"
                          onClick={() => {
                            setProfession(prof.poste);
                            setReference(prof.reference);
                            setShowProfessionsDropdown(false);
                          }}
                        >
                          <strong>{prof.poste}</strong>
                          <span className="item-salaire">{prof.reference}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              {touched.profession && errors.profession && (
                <span className="error-message">Poste obligatoire</span>
              )}
            </div>

            <div className={`form-group ${touched.reference && errors.reference ? 'error' : ''}`}>
              <label>
                <FaMoneyBill className="input-icon" />
                Salaire mensuel
              </label>
              <input
                type="number"
                placeholder="Ex: 1500000"
                value={salaire}
                onChange={(e) => setSalaire(e.target.value)}
                onBlur={() => handleBlur('salaire')}
                className={touched.salaire && errors.salaire ? 'error' : ''}
              />
            </div>
          </div>
        </section>

        {/* Sécurité */}
        <section className="form-section">
          <h2 className="section-title">
            <FaLock className="section-icon" />
            Sécurité
          </h2>

          <div className="form-grid">
            <div className={`form-group ${touched.mdp && (errors.mdp || errors.mdpMatch) ? 'error' : ''}`}>
              <label>
                <FaLock className="input-icon" />
                Mot de passe *
              </label>
              <input
                type="password"
                placeholder="Au moins 6 caractères"
                value={mdp}
                onChange={(e) => setMdp(e.target.value)}
                onBlur={() => handleBlur('mdp')}
                className={touched.mdp && (errors.mdp || errors.mdpMatch) ? 'error' : ''}
              />
              {touched.mdp && errors.mdp && (
                <span className="error-message">Mot de passe trop court</span>
              )}
            </div>

            <div className={`form-group ${touched.confMdp && (errors.confMdp || errors.mdpMatch) ? 'error' : ''}`}>
              <label>
                <FaLock className="input-icon" />
                Confirmer mot de passe *
              </label>
              <input
                type="password"
                placeholder="Répétez le mot de passe"
                value={confMdp}
                onChange={(e) => setConfMdp(e.target.value)}
                onBlur={() => handleBlur('confMdp')}
                className={touched.confMdp && (errors.confMdp || errors.mdpMatch) ? 'error' : ''}
              />
              {touched.confMdp && errors.confMdp && (
                <span className="error-message">Confirmation obligatoire</span>
              )}
              {touched.confMdp && errors.mdpMatch && (
                <span className="error-message">Les mots de passe ne correspondent pas</span>
              )}
            </div>
          </div>
        </section>

        {/* Informations personnelles */}
        <section className="form-section">
          <h2 className="section-title">
            <FaIdCard className="section-icon" />
            Informations personnelles
          </h2>

          <div className="form-grid">
            <div className={`form-group ${touched.cin && errors.cin ? 'error' : ''}`}>
              <label>
                <FaIdCard className="input-icon" />
                Numéro CIN *
              </label>
              <input
                type="text"
                placeholder="Ex: 101010101010"
                value={cin}
                onChange={(e) => setCin(e.target.value)}
                onBlur={() => handleBlur('cin')}
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
                placeholder="Ex: 2"
                value={enfants}
                onChange={(e) => setEnfants(e.target.value)}
                min="0"
              />
            </div>
          </div>
        </section>

        {/* Section CNAPS */}
        <section className="form-section">
          <h2 className="section-title">
            <FaFileSignature className="section-icon" />
            Affiliation CNAPS
          </h2>

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
            <div className="form-grid">
              <div className={`form-group ${touched.numeroCnaps && errors.numeroCnaps ? 'error' : ''}`}>
                <label>
                  <FaFileSignature className="input-icon" />
                  Numéro CNAPS *
                </label>
                <input
                  type="text"
                  placeholder="Ex: 123456789012"
                  value={numeroCnaps}
                  onChange={(e) => setNumeroCnaps(e.target.value)}
                  onBlur={() => handleBlur('numeroCnaps')}
                  className={touched.numeroCnaps && errors.numeroCnaps ? 'error' : ''}
                />
                {touched.numeroCnaps && errors.numeroCnaps && (
                  <span className="error-message">Numéro CNAPS obligatoire</span>
                )}
              </div>

              <div className={`form-group ${touched.montantPersonnel && errors.montantPersonnel ? 'error' : ''}`}>
                <label>
                  <FaUser className="input-icon" />
                  Part du personnel *
                </label>
                <input
                  type="number"
                  placeholder="Ex: 5000"
                  value={montantPersonnel}
                  onChange={(e) => setMontantPersonnel(e.target.value)}
                  onBlur={() => handleBlur('montantPersonnel')}
                  className={touched.montantPersonnel && errors.montantPersonnel ? 'error' : ''}
                />
                {touched.montantPersonnel && errors.montantPersonnel && (
                  <span className="error-message">Part du personnel obligatoire</span>
                )}
              </div>

              <div className={`form-group ${touched.montantEntreprise && errors.montantEntreprise ? 'error' : ''}`}>
                <label>
                  <FaBuilding className="input-icon" />
                  Part de l'entreprise *
                </label>
                <input
                  type="number"
                  placeholder="Ex: 8000"
                  value={montantEntreprise}
                  onChange={(e) => setMontantEntreprise(e.target.value)}
                  onBlur={() => handleBlur('montantEntreprise')}
                  className={touched.montantEntreprise && errors.montantEntreprise ? 'error' : ''}
                />
                {touched.montantEntreprise && errors.montantEntreprise && (
                  <span className="error-message">Part de l'entreprise obligatoire</span>
                )}
              </div>
            </div>
          )}
        </section>

        {/* Section IRSA */}
        <section className="form-section">
          <h2 className="section-title">
            <FaPercentage className="section-icon" />
            Taxe IRSA
          </h2>

          <div className="switch-group">
            <label className="switch-label">
              <span>Activer IRSA</span>
              <div className="switch">
                <input
                  type="checkbox"
                  checked={enableIrsa}
                  onChange={(e) => setEnableIrsa(e.target.checked)}
                />
                <span className="switch-slider"></span>
              </div>
            </label>
          </div>

          {enableIrsa && (
            <div className="form-grid">
              <div className={`form-group ${touched.numeroIrsa && errors.numeroIrsa ? 'error' : ''}`}>
                <label>
                  <FaFileSignature className="input-icon" />
                  Immatriculation IRSA *
                </label>
                <input
                  type="text"
                  placeholder="Ex: 123456789012"
                  value={numeroIrsa}
                  onChange={(e) => setNumeroIrsa(e.target.value)}
                  onBlur={() => handleBlur('numeroIrsa')}
                  className={touched.numeroIrsa && errors.numeroIrsa ? 'error' : ''}
                />
                {touched.numeroIrsa && errors.numeroIrsa && (
                  <span className="error-message">Numéro IRSA obligatoire</span>
                )}
              </div>

              <div className={`form-group ${touched.montantIrsa && errors.montantIrsa ? 'error' : ''}`}>
                <label>
                  <FaPercentage className="input-icon" />
                  Montant de la taxe *
                </label>
                <input
                  type="number"
                  placeholder="Ex: 5000"
                  value={montantIrsa}
                  onChange={(e) => setMontantIrsa(e.target.value)}
                  onBlur={() => handleBlur('montantIrsa')}
                  className={touched.montantIrsa && errors.montantIrsa ? 'error' : ''}
                />
                {touched.montantIrsa && errors.montantIrsa && (
                  <span className="error-message">Montant IRSA obligatoire</span>
                )}
              </div>
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
            onClick={() => navigate('/rh')}
            disabled={loading}
          >
            <FaTimes />
            Annuler
          </button>
          <button
            type="submit"
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Traitement...
              </>
            ) : (
              <>
                <FaSave />
                Ajouter l'employé
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal de succès */}
      {showSuccessModal && (
        <div className="modal-overlay">
          <div className="success-modal">
            <FaCheckCircle className="success-icon" />
            <h2>Succès !</h2>
            <p>L'employé a été ajouté avec succès.</p>
            <button
              className="modal-btn"
              onClick={() => {
                setShowSuccessModal(false);
                navigate('/rh');
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