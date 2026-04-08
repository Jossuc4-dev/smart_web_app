import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  User, 
  Mail, 
  Lock, 
  Briefcase, 
  Calendar, 
  Baby, 
  IdCard,
  Shield,
  TrendingUp,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Eye,
  EyeOff,
  Home,
  AlertCircle,
  DollarSign,
  Briefcase as BriefcaseIcon
} from 'lucide-react';
import './register.css';
import BASE_URL from '../../config/ApiConfig';

// Types pour les données de l'entreprise
interface CompanyData {
  nom_entreprise: string;
  email_entreprise: string;
  activite: string;
}

// Types pour les données professionnelles
interface ProfessionData {
  posteGerant: string;
  salaireGerant: number;
}

// Types pour les données du propriétaire
interface OwnerData {
  nom: string;
  email: string;
  password: string;
  sexe: 'HOMME' | 'FEMME';
  situation: 'CELIBATAIRE' | 'MARIE' | 'DIVORCE' | 'VEUF';
  dateEmbauche: string;
  enfants: number;
  cin: string;
  activationCnaps: boolean;
  numCnaps: string;
  montantPersonnel: number;
  montantEntreprise: number;
  activationIRSA: boolean;
  montantIrsa: number;
}

// Types pour les erreurs
interface Errors {
  [key: string]: string;
}

// Types pour la réponse API
interface ApiResponse {
  success: boolean;
  message?: string;
  token?: string;
}

// Types pour les données envoyées à l'API
interface RegisterRequestData {
  company: CompanyData;
  profession: ProfessionData;
  owner: OwnerData;
}

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Errors>({});
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);

  // Données de l'entreprise
  const [companyData, setCompanyData] = useState<CompanyData>({
    nom_entreprise: '',
    email_entreprise: '',
    activite: ''
  });

  // Données professionnelles
  const [professionData, setProfessionData] = useState<ProfessionData>({
    posteGerant: '',
    salaireGerant: 0
  });

  // Données du propriétaire
  const [ownerData, setOwnerData] = useState<OwnerData>({
    nom: '',
    email: '',
    password: '',
    sexe: 'HOMME',
    situation: 'CELIBATAIRE',
    dateEmbauche: '',
    enfants: 0,
    cin: '',
    activationCnaps: false,
    numCnaps: '',
    montantPersonnel: 0,
    montantEntreprise: 0,
    activationIRSA: false,
    montantIrsa: 0
  });

  const activities: string[] = [
    'Commerce alimentaire',
    'Commerce de détail',
    'Services',
    'Technologie',
    'Industrie',
    'Agriculture',
    'Artisanat',
    'Autre'
  ];

  const postes: string[] = [
    'Gérant',
    'Directeur Général',
    'PDG',
    'Propriétaire',
    'Co-fondateur',
    'Administrateur',
    'Autre'
  ];

  // Fonctions de validation
  const validateStep1 = (): boolean => {
    const newErrors: Errors = {};
    
    if (!companyData.nom_entreprise.trim()) {
      newErrors.nom_entreprise = 'Le nom de l\'entreprise est requis';
    } else if (companyData.nom_entreprise.length < 3) {
      newErrors.nom_entreprise = 'Le nom doit contenir au moins 3 caractères';
    }
    
    if (!companyData.email_entreprise.trim()) {
      newErrors.email_entreprise = 'L\'email professionnel est requis';
    } else if (!/^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(companyData.email_entreprise)) {
      newErrors.email_entreprise = 'Email invalide';
    }
    
    if (!companyData.activite) {
      newErrors.activite = 'Veuillez sélectionner un secteur d\'activité';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newErrors: Errors = {};
    
    if (!ownerData.nom.trim()) {
      newErrors.nom = 'Le nom complet est requis';
    } else if (ownerData.nom.length < 3) {
      newErrors.nom = 'Le nom doit contenir au moins 3 caractères';
    }
    
    if (!ownerData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@([^\s@]+\.)+[^\s@]+$/.test(ownerData.email)) {
      newErrors.email = 'Email invalide';
    }
    
    if (!ownerData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (ownerData.password.length < 8) {
      newErrors.password = 'Le mot de passe doit contenir au moins 8 caractères';
    } else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])/.test(ownerData.password)) {
      newErrors.password = 'Le mot de passe doit contenir une majuscule, une minuscule et un chiffre';
    }
    
    if (!ownerData.dateEmbauche) {
      newErrors.dateEmbauche = 'La date d\'embauche est requise';
    } else {
      const date = new Date(ownerData.dateEmbauche);
      if (date > new Date()) {
        newErrors.dateEmbauche = 'La date ne peut pas être dans le futur';
      }
    }
    
    if (!ownerData.cin.trim()) {
      newErrors.cin = 'Le numéro CIN est requis';
    } else if (ownerData.cin.length < 8) {
      newErrors.cin = 'Le CIN doit contenir au moins 8 caractères';
    }
    
    if (!professionData.posteGerant) {
      newErrors.posteGerant = 'Le poste du gérant est requis';
    }
    
    if (!professionData.salaireGerant || professionData.salaireGerant <= 0) {
      newErrors.salaireGerant = 'Le salaire du gérant est requis et doit être supérieur à 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: Errors = {};
    
    if (ownerData.activationCnaps) {
      if (!ownerData.numCnaps.trim()) {
        newErrors.numCnaps = 'Le numéro CNAPS est requis';
      } else if (ownerData.numCnaps.length < 5) {
        newErrors.numCnaps = 'Numéro CNAPS invalide';
      }
      
      if (ownerData.montantPersonnel < 0) {
        newErrors.montantPersonnel = 'Le montant ne peut pas être négatif';
      }
      
      if (ownerData.montantEntreprise < 0) {
        newErrors.montantEntreprise = 'Le montant ne peut pas être négatif';
      }
    }
    
    if (ownerData.activationIRSA) {
      if (ownerData.montantIrsa <= 0) {
        newErrors.montantIrsa = 'Le montant IRSA doit être supérieur à 0';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setCompanyData({
      ...companyData,
      [name]: value
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleProfessionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setProfessionData({
      ...professionData,
      [name]: name === 'salaireGerant' ? parseFloat(value) || 0 : value
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleOwnerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setOwnerData({
      ...ownerData,
      [name]: type === 'checkbox' ? checked : value
    });
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const nextStep = (): void => {
    let isValid = false;
    
    switch (step) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      default:
        isValid = true;
    }
    
    if (isValid) {
      setStep(step + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = (): void => {
    setStep(step - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!validateStep3()) {
      return;
    }
    
    setIsSubmitting(true);

    const requestData: RegisterRequestData = {
      company: {
        nom_entreprise: companyData.nom_entreprise,
        email_entreprise: companyData.email_entreprise,
        activite: companyData.activite
      },
      profession: {
        posteGerant: professionData.posteGerant,
        salaireGerant: professionData.salaireGerant
      },
      owner: {
        nom: ownerData.nom,
        email: ownerData.email,
        password: ownerData.password,
        sexe: ownerData.sexe,
        situation: ownerData.situation,
        dateEmbauche: ownerData.dateEmbauche,
        enfants: ownerData.enfants,
        cin: ownerData.cin,
        activationCnaps: ownerData.activationCnaps,
        numCnaps: ownerData.numCnaps!,
        montantPersonnel: ownerData.montantPersonnel || 0,
        montantEntreprise: ownerData.montantEntreprise || 0,
        activationIRSA: ownerData.activationIRSA,
        montantIrsa: ownerData.montantIrsa || 0
      }
    };

    console.log('Envoi des données:', requestData);

    try {
      const response = await fetch(`${BASE_URL}/client/account/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data: ApiResponse = await response.json();
      console.log(data);

      if (response.ok && data.success) {
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        
        setShowSuccessPopup(true);
        
        setTimeout(() => {
          navigate('/', { 
            state: { 
              message: data.message || 'Inscription réussie ! Connectez-vous.' 
            } 
          });
        }, 3000);
      } else {
        const errorMessage = data.message || 'Erreur lors de l\'inscription';
        alert(errorMessage);
        console.error('Erreur API:', data);
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      alert('Erreur de connexion au serveur.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToHome = (): void => {
    navigate('/');
  };

  const getStepClass = (stepNumber: number): string => {
    if (step === stepNumber) return 'active';
    if (step > stepNumber) return 'completed';
    return '';
  };

  const closePopup = (): void => {
    setShowSuccessPopup(false);
    navigate('/', { 
      state: { 
        message: 'Inscription réussie ! Connectez-vous.' 
      } 
    });
  };

  return (
    <div className="register-page">
      {/* Popup de confirmation */}
      {showSuccessPopup && (
        <div className="popup-overlay">
          <div className="popup-container success-popup">
            <div className="popup-icon">
              <CheckCircle size={64} color="#2c7a6e" />
            </div>
            <h3>Inscription réussie !</h3>
            <p>
              Votre compte a été créé avec succès.<br />
              Un email de confirmation a été envoyé à <strong>{ownerData.email}</strong>.<br />
              Veuillez vérifier votre boîte de réception.
            </p>
            <button onClick={closePopup} className="popup-button">
              Continuer vers la connexion
            </button>
          </div>
        </div>
      )}

      <div className="register-container">
        <div className="register-header">
          <button className="back-home-btn" onClick={handleBackToHome}>
            <Home size={20} />
            Retour à l'accueil
          </button>
          <h1>Créer votre compte</h1>
          <p>Rejoignez SmartBusiness et simplifiez la gestion de votre entreprise</p>
          
          <div className="steps-indicator">
            <div className={`step ${getStepClass(1)}`}>
              <div className="step-number">1</div>
              <span className="step-label">Entreprise</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${getStepClass(2)}`}>
              <div className="step-number">2</div>
              <span className="step-label">Propriétaire</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${getStepClass(3)}`}>
              <div className="step-number">3</div>
              <span className="step-label">Options</span>
            </div>
            <div className="step-line"></div>
            <div className={`step ${getStepClass(4)}`}>
              <div className="step-number">4</div>
              <span className="step-label">Validation</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Étape 1 : Informations entreprise */}
          {step === 1 && (
            <div className="step-content fade-in">
              <div className="step-icon">
                <Building2 size={48} color="#2c7a6e" />
              </div>
              <h2>Informations de l'entreprise</h2>
              
              <div className="form-group">
                <label>
                  <Building2 size={18} />
                  Nom de l'entreprise
                </label>
                <input
                  type="text"
                  name="nom_entreprise"
                  placeholder="Ex: Mateza tôle"
                  value={companyData.nom_entreprise}
                  onChange={handleCompanyChange}
                  className={errors.nom_entreprise ? 'error' : ''}
                />
                {errors.nom_entreprise && (
                  <div className="error-message">
                    <AlertCircle size={14} />
                    {errors.nom_entreprise}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>
                  <Mail size={18} />
                  Email professionnel
                </label>
                <input
                  type="email"
                  name="email_entreprise"
                  placeholder="contact@entreprise.mg"
                  value={companyData.email_entreprise}
                  onChange={handleCompanyChange}
                  className={errors.email_entreprise ? 'error' : ''}
                />
                {errors.email_entreprise && (
                  <div className="error-message">
                    <AlertCircle size={14} />
                    {errors.email_entreprise}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>
                  <Briefcase size={18} />
                  Secteur d'activité
                </label>
                <select
                  name="activite"
                  value={companyData.activite}
                  onChange={handleCompanyChange}
                  className={errors.activite ? 'error' : ''}
                >
                  <option value="">Sélectionnez votre secteur</option>
                  {activities.map((act) => (
                    <option key={act} value={act}>{act}</option>
                  ))}
                </select>
                {errors.activite && (
                  <div className="error-message">
                    <AlertCircle size={14} />
                    {errors.activite}
                  </div>
                )}
              </div>

              <div className="form-navigation">
                <button type="button" className="btn-next" onClick={nextStep}>
                  Suivant <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Étape 2 : Informations propriétaire et profession */}
          {step === 2 && (
            <div className="step-content fade-in">
              <div className="step-icon">
                <User size={48} color="#2c7a6e" />
              </div>
              <h2>Informations du propriétaire</h2>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <User size={18} />
                    Nom complet
                  </label>
                  <input
                    type="text"
                    name="nom"
                    placeholder="Votre nom complet"
                    value={ownerData.nom}
                    onChange={handleOwnerChange}
                    className={errors.nom ? 'error' : ''}
                  />
                  {errors.nom && (
                    <div className="error-message">
                      <AlertCircle size={14} />
                      {errors.nom}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <Mail size={18} />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    placeholder="votre@email.com"
                    value={ownerData.email}
                    onChange={handleOwnerChange}
                    className={errors.email ? 'error' : ''}
                  />
                  {errors.email && (
                    <div className="error-message">
                      <AlertCircle size={14} />
                      {errors.email}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>
                  <Lock size={18} />
                  Mot de passe
                </label>
                <div className="password-input">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Créez un mot de passe sécurisé"
                    value={ownerData.password}
                    onChange={handleOwnerChange}
                    className={errors.password ? 'error' : ''}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <div className="error-message">
                    <AlertCircle size={14} />
                    {errors.password}
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Sexe</label>
                  <select
                    name="sexe"
                    value={ownerData.sexe}
                    onChange={handleOwnerChange}
                  >
                    <option value="HOMME">Homme</option>
                    <option value="FEMME">Femme</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Situation familiale</label>
                  <select
                    name="situation"
                    value={ownerData.situation}
                    onChange={handleOwnerChange}
                  >
                    <option value="CELIBATAIRE">Célibataire</option>
                    <option value="MARIE">Marié(e)</option>
                    <option value="DIVORCE">Divorcé(e)</option>
                    <option value="VEUF">Veuf/Veuve</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <Calendar size={18} />
                    Date d'embauche
                  </label>
                  <input
                    type="date"
                    name="dateEmbauche"
                    value={ownerData.dateEmbauche}
                    onChange={handleOwnerChange}
                    className={errors.dateEmbauche ? 'error' : ''}
                  />
                  {errors.dateEmbauche && (
                    <div className="error-message">
                      <AlertCircle size={14} />
                      {errors.dateEmbauche}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <Baby size={18} />
                    Nombre d'enfants
                  </label>
                  <input
                    type="number"
                    name="enfants"
                    min="0"
                    value={ownerData.enfants}
                    onChange={handleOwnerChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  <IdCard size={18} />
                  Numéro CIN
                </label>
                <input
                  type="text"
                  name="cin"
                  placeholder="Votre numéro CIN"
                  value={ownerData.cin}
                  onChange={handleOwnerChange}
                  className={errors.cin ? 'error' : ''}
                />
                {errors.cin && (
                  <div className="error-message">
                    <AlertCircle size={14} />
                    {errors.cin}
                  </div>
                )}
              </div>

              <div className="section-divider">
                <span>Informations professionnelles</span>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <BriefcaseIcon size={18} />
                    Poste du gérant
                  </label>
                  <select
                    name="posteGerant"
                    value={professionData.posteGerant}
                    onChange={handleProfessionChange}
                    className={errors.posteGerant ? 'error' : ''}
                  >
                    <option value="">Sélectionnez votre poste</option>
                    {postes.map((poste) => (
                      <option key={poste} value={poste}>{poste}</option>
                    ))}
                  </select>
                  {errors.posteGerant && (
                    <div className="error-message">
                      <AlertCircle size={14} />
                      {errors.posteGerant}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    <DollarSign size={18} />
                    Salaire du gérant (Ar)
                  </label>
                  <input
                    type="number"
                    name="salaireGerant"
                    placeholder="Ex: 500000"
                    value={professionData.salaireGerant}
                    onChange={handleProfessionChange}
                    className={errors.salaireGerant ? 'error' : ''}
                  />
                  {errors.salaireGerant && (
                    <div className="error-message">
                      <AlertCircle size={14} />
                      {errors.salaireGerant}
                    </div>
                  )}
                </div>
              </div>

              <div className="form-navigation">
                <button type="button" className="btn-prev" onClick={prevStep}>
                  <ChevronLeft size={20} /> Précédent
                </button>
                <button type="button" className="btn-next" onClick={nextStep}>
                  Suivant <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Étape 3 : Options CNAPS et IRSA */}
          {step === 3 && (
            <div className="step-content fade-in">
              <div className="step-icon">
                <Shield size={48} color="#2c7a6e" />
              </div>
              <h2>Options sociales et fiscales</h2>

              {/* CNAPS */}
              <div className="option-card">
                <div className="option-header">
                  <Shield size={24} color="#2c7a6e" />
                  <div className="option-info">
                    <h3>Activation CNAPS</h3>
                    <p>Caisse Nationale de Prévoyance Sociale</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="activationCnaps"
                      checked={ownerData.activationCnaps}
                      onChange={handleOwnerChange}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {ownerData.activationCnaps && (
                  <div className="option-details slide-down">
                    <div className="form-group">
                      <label>Numéro CNAPS</label>
                      <input
                        type="text"
                        name="numCnaps"
                        placeholder="Votre numéro CNAPS"
                        value={ownerData.numCnaps}
                        onChange={handleOwnerChange}
                        className={errors.numCnaps ? 'error' : ''}
                      />
                      {errors.numCnaps && (
                        <div className="error-message">
                          <AlertCircle size={14} />
                          {errors.numCnaps}
                        </div>
                      )}
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Montant personnel (Ar)</label>
                        <input
                          type="number"
                          name="montantPersonnel"
                          placeholder="0"
                          value={ownerData.montantPersonnel}
                          onChange={handleOwnerChange}
                          className={errors.montantPersonnel ? 'error' : ''}
                        />
                        {errors.montantPersonnel && (
                          <div className="error-message">
                            <AlertCircle size={14} />
                            {errors.montantPersonnel}
                          </div>
                        )}
                      </div>
                      <div className="form-group">
                        <label>Montant entreprise (Ar)</label>
                        <input
                          type="number"
                          name="montantEntreprise"
                          placeholder="0"
                          value={ownerData.montantEntreprise}
                          onChange={handleOwnerChange}
                          className={errors.montantEntreprise ? 'error' : ''}
                        />
                        {errors.montantEntreprise && (
                          <div className="error-message">
                            <AlertCircle size={14} />
                            {errors.montantEntreprise}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* IRSA */}
              <div className="option-card">
                <div className="option-header">
                  <TrendingUp size={24} color="#2c7a6e" />
                  <div className="option-info">
                    <h3>Activation IRSA</h3>
                    <p>Impôt sur le Revenu Salarial et Assimilé</p>
                  </div>
                  <label className="toggle-switch">
                    <input
                      type="checkbox"
                      name="activationIRSA"
                      checked={ownerData.activationIRSA}
                      onChange={handleOwnerChange}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                {ownerData.activationIRSA && (
                  <div className="option-details slide-down">
                    <div className="form-group">
                      <label>Montant IRSA (Ar)</label>
                      <input
                        type="number"
                        name="montantIrsa"
                        placeholder="0"
                        value={ownerData.montantIrsa}
                        onChange={handleOwnerChange}
                        className={errors.montantIrsa ? 'error' : ''}
                      />
                      {errors.montantIrsa && (
                        <div className="error-message">
                          <AlertCircle size={14} />
                          {errors.montantIrsa}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-navigation">
                <button type="button" className="btn-prev" onClick={prevStep}>
                  <ChevronLeft size={20} /> Précédent
                </button>
                <button type="button" className="btn-next" onClick={nextStep}>
                  Suivant <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Étape 4 : Validation et récapitulatif */}
          {step === 4 && (
            <div className="step-content fade-in">
              <div className="step-icon">
                <CheckCircle size={48} color="#2c7a6e" />
              </div>
              <h2>Validation de votre inscription</h2>
              <p className="validation-subtitle">
                Vérifiez vos informations avant de finaliser
              </p>

              <div className="summary-card">
                <h3>
                  <Building2 size={20} />
                  Informations entreprise
                </h3>
                <div className="summary-grid">
                  <div><strong>Nom:</strong> {companyData.nom_entreprise}</div>
                  <div><strong>Email:</strong> {companyData.email_entreprise}</div>
                  <div><strong>Activité:</strong> {companyData.activite}</div>
                </div>
              </div>

              <div className="summary-card">
                <h3>
                  <User size={20} />
                  Informations propriétaire
                </h3>
                <div className="summary-grid">
                  <div><strong>Nom:</strong> {ownerData.nom}</div>
                  <div><strong>Email:</strong> {ownerData.email}</div>
                  <div><strong>Sexe:</strong> {ownerData.sexe === 'HOMME' ? 'Homme' : 'Femme'}</div>
                  <div><strong>Situation:</strong> {ownerData.situation === 'CELIBATAIRE' ? 'Célibataire' : ownerData.situation === 'MARIE' ? 'Marié(e)' : ownerData.situation === 'DIVORCE' ? 'Divorcé(e)' : 'Veuf/Veuve'}</div>
                  <div><strong>Enfants:</strong> {ownerData.enfants}</div>
                  <div><strong>CIN:</strong> {ownerData.cin}</div>
                  <div><strong>Date d'embauche:</strong> {new Date(ownerData.dateEmbauche).toLocaleDateString('fr-FR')}</div>
                </div>
              </div>

              <div className="summary-card">
                <h3>
                  <BriefcaseIcon size={20} />
                  Informations professionnelles
                </h3>
                <div className="summary-grid">
                  <div><strong>Poste:</strong> {professionData.posteGerant}</div>
                  <div><strong>Salaire gérant:</strong> {professionData.salaireGerant.toLocaleString()} Ar</div>
                </div>
              </div>

              {(ownerData.activationCnaps || ownerData.activationIRSA) && (
                <div className="summary-card">
                  <h3>
                    <Shield size={20} />
                    Options activées
                  </h3>
                  <div className="summary-grid">
                    {ownerData.activationCnaps && (
                      <>
                        <div><strong>CNAPS:</strong> {ownerData.numCnaps}</div>
                        <div><strong>Montant personnel:</strong> {ownerData.montantPersonnel.toLocaleString()} Ar</div>
                        <div><strong>Montant entreprise:</strong> {ownerData.montantEntreprise.toLocaleString()} Ar</div>
                      </>
                    )}
                    {ownerData.activationIRSA && (
                      <div><strong>IRSA:</strong> {ownerData.montantIrsa.toLocaleString()} Ar</div>
                    )}
                  </div>
                </div>
              )}

              <div className="form-navigation">
                <button type="button" className="btn-prev" onClick={prevStep}>
                  <ChevronLeft size={20} /> Précédent
                </button>
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>Création en cours...</>
                  ) : (
                    <>Créer mon compte <CheckCircle size={20} /></>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Register;