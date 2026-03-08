// src/pages/subscriptions/SubscribeScreen.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../redux/store';
import { fetchOffreById } from '../../../redux/slices/adminSlice';
import { useAuth } from '../../../contexts/AuthContext';
import {
  FaArrowLeft,
  FaCheckCircle,
  FaCreditCard,
  FaMobileAlt,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCalendarAlt,
  FaClock,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaLock,
} from 'react-icons/fa';
import { MdBusinessCenter, MdDateRange } from 'react-icons/md';
import { RiMoneyEuroCircleFill } from 'react-icons/ri';
import Cards from 'react-credit-cards-2';
import 'react-credit-cards-2/dist/es/styles-compiled.css';
import './index.css';

type PaiementMethod = 'MVOLA' | 'CARTE';

interface CardDetails {
  number: string;
  name: string;
  expiry: string;
  cvc: string;
  focused?: 'number' | 'name' | 'expiry' | 'cvc';
}

interface MvolaDetails {
  phone: string;
}

export default function SubscribeScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { token, logout } = useAuth();

  const offre = useAppSelector(state => state.admin.currentOffre);
  const loading = useAppSelector(state => state.admin.status === 'loading');
  const error = useAppSelector(state => state.admin.error);
  const sessionExpired = useAppSelector(state => state.admin.sessionExpired);

  const [paymentMethod, setPaymentMethod] = useState<PaiementMethod>('MVOLA');
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    number: '',
    name: '',
    expiry: '',
    cvc: '',
  });
  const [mvolaDetails, setMvolaDetails] = useState<MvolaDetails>({
    phone: '',
  });
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [focused, setFocused] = useState<'number' | 'name' | 'expiry' | 'cvc' | undefined>();

  // Gestion de la session expirée
  useEffect(() => {
    if (sessionExpired) {
      setShowSessionExpiredModal(true);
      const timer = setTimeout(() => {
        logout();
        navigate('/', { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [sessionExpired, logout, navigate]);

  // Chargement de l'offre
  useEffect(() => {
    if (token && id && !sessionExpired) {
      dispatch(fetchOffreById({ id: parseInt(id), token }));
    }
  }, [token, id, dispatch, sessionExpired]);

  // Gestion des erreurs
  useEffect(() => {
    if (error && !sessionExpired) {
      setErrorMessage(error);
      setShowErrorModal(true);
    }
  }, [error, sessionExpired]);

  const formatPrice = (amount: string) => {
    const num = parseInt(amount.replace(/[^0-9]/g, ''));
    return new Intl.NumberFormat('fr-MG', { minimumFractionDigits: 0 }).format(num) + ' Ar';
  };

  const validatePhoneNumber = (phone: string): boolean => {
    // Format accepté: 034XXXXXXX (10 chiffres commençant par 03)
    const phoneRegex = /^03[2-4]\d{7}$/;
    return phoneRegex.test(phone);
  };

  const validateCardNumber = (number: string): boolean => {
    const cleanNumber = number.replace(/\s/g, '');
    return cleanNumber.length === 16 && /^\d+$/.test(cleanNumber);
  };

  const validateExpiry = (expiry: string): boolean => {
    const [month, year] = expiry.split('/');
    if (!month || !year) return false;
    
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    
    const expMonth = parseInt(month);
    const expYear = parseInt(year);
    
    if (expMonth < 1 || expMonth > 12) return false;
    if (expYear < currentYear || (expYear === currentYear && expMonth < currentMonth)) return false;
    
    return true;
  };

  const validateCVC = (cvc: string): boolean => {
    return cvc.length >= 3 && cvc.length <= 4 && /^\d+$/.test(cvc);
  };

  const validateForm = (): boolean => {
    if (paymentMethod === 'MVOLA') {
      if (!mvolaDetails.phone.trim()) {
        setErrorMessage('Veuillez entrer votre numéro de téléphone MVola');
        setShowErrorModal(true);
        return false;
      }
      if (!validatePhoneNumber(mvolaDetails.phone)) {
        setErrorMessage('Numéro MVola invalide. Format attendu: 034XXXXXXX');
        setShowErrorModal(true);
        return false;
      }
    } else {
      if (!cardDetails.number.trim()) {
        setErrorMessage('Veuillez entrer votre numéro de carte');
        setShowErrorModal(true);
        return false;
      }
      if (!validateCardNumber(cardDetails.number)) {
        setErrorMessage('Numéro de carte invalide. 16 chiffres requis');
        setShowErrorModal(true);
        return false;
      }
      if (!cardDetails.name.trim()) {
        setErrorMessage('Veuillez entrer le nom sur la carte');
        setShowErrorModal(true);
        return false;
      }
      if (!cardDetails.expiry.trim()) {
        setErrorMessage('Veuillez entrer la date d\'expiration');
        setShowErrorModal(true);
        return false;
      }
      if (!validateExpiry(cardDetails.expiry)) {
        setErrorMessage('Date d\'expiration invalide ou dépassée');
        setShowErrorModal(true);
        return false;
      }
      if (!cardDetails.cvc.trim()) {
        setErrorMessage('Veuillez entrer le code CVC');
        setShowErrorModal(true);
        return false;
      }
      if (!validateCVC(cardDetails.cvc)) {
        setErrorMessage('Code CVC invalide (3-4 chiffres)');
        setShowErrorModal(true);
        return false;
      }
    }

    if (!termsAccepted) {
      setErrorMessage('Veuillez accepter les conditions générales');
      setShowErrorModal(true);
      return false;
    }

    return true;
  };

  const handlePayment = async () => {
    if (!offre || !token || sessionExpired) return;

    if (!validateForm()) return;

    setPaymentLoading(true);

    try {
      const paymentData = {
        amount: parseInt(offre.montant.replace(/[^0-9]/g, '')),
        description: `Abonnement ${offre.duree.toLowerCase()} - ${offre.services}`,
        method: paymentMethod,
        ...(paymentMethod === 'MVOLA' 
          ? { customerNumber: mvolaDetails.phone }
          : { 
              cardNumber: cardDetails.number.replace(/\s/g, ''),
              cardName: cardDetails.name,
              cardExpiry: cardDetails.expiry,
              cardCvc: cardDetails.cvc
            }
        ),
      };

      console.log('Payment data:', paymentData);

      // Simulation d'appel API (à remplacer par votre endpoint réel)
      // const response = await fetch(`${BASE_URL}/pay/process`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     Authorization: `Bearer ${token}`,
      //   },
      //   body: JSON.stringify(paymentData),
      // });

      // if (!response.ok) throw new Error('Erreur de paiement');

      // Simulation de succès
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSuccessMessage('Paiement effectué avec succès ! Votre abonnement est activé.');
      setShowSuccessMessage(true);

      // Redirection après 2 secondes
      setTimeout(() => {
        navigate('/admin/abonnements');
      }, 2000);

    } catch (error) {
      console.error('Payment error:', error);
      setErrorMessage('Erreur lors du paiement. Veuillez réessayer.');
      setShowErrorModal(true);
    } finally {
      setPaymentLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0; i < match.length; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  if (loading) {
    return (
      <div className="subscribe-loading-container">
        <div className="spinner" />
        <p>Chargement de l'offre...</p>
      </div>
    );
  }

  if (!offre && !loading) {
    return (
      <div className="subscribe-error-container">
        <FaExclamationTriangle size={64} color="#ef4444" />
        <h2>Offre non trouvée</h2>
        <p>L'offre que vous recherchez n'existe pas ou a été supprimée.</p>
        <button className="back-button" onClick={() => navigate('/admin/abonnements')}>
          Retour aux offres
        </button>
      </div>
    );
  }

  return (
    <div className="subscribe-container">
      {/* Message de succès */}
      {showSuccessMessage && (
        <div className="success-message">
          <FaCheckCircle /> {successMessage}
        </div>
      )}

      {/* Modal de session expirée */}
      {showSessionExpiredModal && (
        <div className="modal-overlay">
          <div className="modal session-expired-modal">
            <div className="modal-icon warning">
              <FaExclamationTriangle />
            </div>
            <h3>Session expirée</h3>
            <p>Votre session a expiré. Vous allez être redirigé vers la page de connexion.</p>
            <div className="redirect-spinner" />
          </div>
        </div>
      )}

      {/* Modal d'erreur */}
      {showErrorModal && !sessionExpired && (
        <div className="modal-overlay" onClick={() => setShowErrorModal(false)}>
          <div className="modal error-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon error">
              <FaExclamationTriangle />
            </div>
            <h3>Erreur</h3>
            <p>{errorMessage}</p>
            <button className="confirm-btn" onClick={() => setShowErrorModal(false)}>
              Compris
            </button>
          </div>
        </div>
      )}

      <header className="subscribe-header">
        <button className="back-btn" onClick={() => navigate('/admin/abonnements')}>
          <FaArrowLeft />
        </button>
        <h1>
          <MdBusinessCenter className="header-icon" />
          Souscription
        </h1>
        <div style={{ width: 44 }} />
      </header>

      <div className="subscribe-content">
        {/* Carte de l'offre */}
        <div className="offer-card">
          <div className="offer-header">
            <h2>{offre?.services}</h2>
          </div>

          <div className="offer-price">
            <span className="price">{formatPrice(offre?.montant || '0')}</span>
            <span className="duration">
              pour 1 {offre?.duree === 'MENSUELLE' ? 'mois' : 'an'}
            </span>
          </div>

          <div className="offer-features">
            <div className="feature-item">
              <FaCheckCircle className="feature-icon" />
              <span>Accès illimité aux fonctionnalités</span>
            </div>
            <div className="feature-item">
              <FaCheckCircle className="feature-icon" />
              <span>Support prioritaire 24/7</span>
            </div>
            <div className="feature-item">
              <FaCheckCircle className="feature-icon" />
              <span>Rapports avancés et statistiques</span>
            </div>
            <div className="feature-item">
              <FaCheckCircle className="feature-icon" />
              <span>Sauvegarde cloud automatique</span>
            </div>
          </div>
        </div>

        {/* Choix du mode de paiement */}
        <div className="payment-method-section">
          <h3>Mode de paiement</h3>
          <div className="payment-methods">
            <label className={`payment-method-card ${paymentMethod === 'MVOLA' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="MVOLA"
                checked={paymentMethod === 'MVOLA'}
                onChange={(e) => setPaymentMethod(e.target.value as PaiementMethod)}
              />
              <FaMobileAlt className="method-icon" />
              <span>MVola</span>
            </label>
            <label className={`payment-method-card ${paymentMethod === 'CARTE' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value="CARTE"
                checked={paymentMethod === 'CARTE'}
                onChange={(e) => setPaymentMethod(e.target.value as PaiementMethod)}
              />
              <FaCreditCard className="method-icon" />
              <span>Carte bancaire</span>
            </label>
          </div>
        </div>

        {/* Formulaire MVola */}
        {paymentMethod === 'MVOLA' && (
          <div className="mvola-form">
            <div className="form-group">
              <label>
                <FaPhone className="input-icon" />
                Numéro MVola *
              </label>
              <input
                type="tel"
                placeholder="034XXXXXXX"
                value={mvolaDetails.phone}
                onChange={(e) => setMvolaDetails({ phone: e.target.value })}
                maxLength={10}
                className="mvola-input"
              />
              <p className="input-hint">
                Format: 034XXXXXXX (10 chiffres)
              </p>
            </div>
          </div>
        )}

        {/* Formulaire Carte Bancaire */}
        {paymentMethod === 'CARTE' && (
          <div className="card-form">
            <div className="card-preview">
              <Cards
                number={cardDetails.number}
                name={cardDetails.name}
                expiry={cardDetails.expiry}
                cvc={cardDetails.cvc}
                focused={focused}
              />
            </div>

            <div className="form-group">
              <label>
                <FaCreditCard className="input-icon" />
                Numéro de carte *
              </label>
              <input
                type="text"
                placeholder="1234 5678 9012 3456"
                value={cardDetails.number}
                onChange={(e) => setCardDetails({ ...cardDetails, number: formatCardNumber(e.target.value) })}
                onFocus={() => setFocused('number')}
                onBlur={() => setFocused(undefined)}
                maxLength={19}
              />
            </div>

            <div className="form-group">
              <label>
                <FaUser className="input-icon" />
                Nom sur la carte *
              </label>
              <input
                type="text"
                placeholder="JEAN DUPONT"
                value={cardDetails.name}
                onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value.toUpperCase() })}
                onFocus={() => setFocused('name')}
                onBlur={() => setFocused(undefined)}
              />
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label>
                  <FaCalendarAlt className="input-icon" />
                  Expiration *
                </label>
                <input
                  type="text"
                  placeholder="MM/AA"
                  value={cardDetails.expiry}
                  onChange={(e) => setCardDetails({ ...cardDetails, expiry: formatExpiry(e.target.value) })}
                  onFocus={() => setFocused('expiry')}
                  onBlur={() => setFocused(undefined)}
                  maxLength={5}
                />
              </div>

              <div className="form-group half">
                <label>
                  <FaLock className="input-icon" />
                  CVC *
                </label>
                <input
                  type="text"
                  placeholder="123"
                  value={cardDetails.cvc}
                  onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value.replace(/[^0-9]/g, '') })}
                  onFocus={() => setFocused('cvc')}
                  onBlur={() => setFocused(undefined)}
                  maxLength={4}
                />
              </div>
            </div>

            <p className="card-secure-note">
              <FaLock /> Vos informations de paiement sont sécurisées
            </p>
          </div>
        )}

        {/* Récapitulatif */}
        <div className="summary-card">
          <h3>Récapitulatif</h3>
          <div className="summary-row">
            <span>Offre</span>
            <span className="summary-value">{offre?.services}</span>
          </div>
          <div className="summary-row">
            <span>Durée</span>
            <span className="summary-value">
              1 {offre?.duree === 'MENSUELLE' ? 'mois' : 'an'}
            </span>
          </div>
          <div className="summary-row">
            <span>Mode de paiement</span>
            <span className="summary-value">
              {paymentMethod === 'MVOLA' ? 'MVola' : 'Carte bancaire'}
            </span>
          </div>
          <div className="summary-row total">
            <span>Total à payer</span>
            <span className="total-price">{formatPrice(offre?.montant || '0')}</span>
          </div>
        </div>

        {/* Acceptation des conditions */}
        <label className="terms-checkbox">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
          />
          <span>
            J'accepte les <a href="/conditions" target="_blank">conditions générales</a> et la politique de renouvellement automatique
          </span>
        </label>

        {/* Bouton de paiement */}
        <button
          className="pay-button"
          onClick={handlePayment}
          disabled={paymentLoading || !termsAccepted || sessionExpired}
        >
          {paymentLoading ? (
            <>
              <div className="spinner-small" />
              Traitement en cours...
            </>
          ) : (
            <>
              {paymentMethod === 'MVOLA' ? <FaMobileAlt /> : <FaCreditCard />}
              Payer {formatPrice(offre?.montant || '0')}
            </>
          )}
        </button>

        <p className="disclaimer">
          En cliquant sur "Payer", vous confirmez votre souscription à cette offre.
          {paymentMethod === 'MVOLA' && ' Un SMS de confirmation vous sera envoyé.'}
        </p>
      </div>
    </div>
  );
}