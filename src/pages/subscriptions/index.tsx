// src/pages/admin/AbonnementsScreen.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import {
  fetchOffres,
  fetchAbonnements,
  payerAbonnement,
  resetStatus,
} from '../../redux/slices/adminSlice';
import { useAuth } from '../../contexts/AuthContext';
import {
  FaBox,
  FaCalendarAlt,
  FaCheckCircle,
  FaClock,
  FaCreditCard,
  FaExclamationTriangle,
  FaInfoCircle,
  FaSearch,
  FaShoppingBag,
  FaSyncAlt,
  FaTimes,
  FaUser,
} from 'react-icons/fa';
import { MdBusinessCenter, MdDateRange } from 'react-icons/md';
import './index.css';
import type { Abonnement, Offre } from '../../models/interfaces';

interface PaiementModalState {
  open: boolean;
  offreId?: number;
  offreNom?: string;
}

export default function AbonnementsScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token, logout } = useAuth();

  // Selecteurs Redux
  const offres = useAppSelector(state => state.admin.offres) || [];
  const abonnements = useAppSelector(state => state.admin.abonnements) || [];
  const loading = useAppSelector(state => state.admin.status === 'loading');
  const abonnementStatus = useAppSelector(state => state.admin.abonnementStatus);
  const error = useAppSelector(state => state.admin.error);
  const sessionExpired = useAppSelector(state => state.admin.sessionExpired);

  const [activeTab, setActiveTab] = useState<'offres' | 'abonnements'>('offres');
  const [searchOffre, setSearchOffre] = useState('');
  const [searchAbonnement, setSearchAbonnement] = useState('');
  const [paiementModal, setPaiementModal] = useState<PaiementModalState>({ open: false });
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

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

  // Chargement initial
  useEffect(() => {
    if (token && !sessionExpired) {
      dispatch(fetchOffres(token));
      dispatch(fetchAbonnements(token));
    }
  }, [token, dispatch, sessionExpired]);

  // Gestion des erreurs
  useEffect(() => {
    if (error && !sessionExpired) {
      setErrorMessage(error);
      setShowErrorModal(true);
    }
  }, [error, sessionExpired]);

  // Gestion des succès
  useEffect(() => {
    if (abonnementStatus === 'succeeded') {
      setSuccessMessage('Paiement effectué avec succès');
      setShowSuccessMessage(true);
      dispatch(resetStatus());
      
      // Recharger les données
      if (token && !sessionExpired) {
        dispatch(fetchOffres(token));
        dispatch(fetchAbonnements(token));
      }
    }
  }, [abonnementStatus, dispatch, token, sessionExpired]);

  // Masquer le message de succès après 5 secondes
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  const handleRefresh = () => {
    if (token && !sessionExpired) {
      dispatch(fetchOffres(token));
      dispatch(fetchAbonnements(token));
    }
  };

  const handlePayerAbonnement = async () => {
    if (!token || sessionExpired || !paiementModal.offreId) return;
    
    await dispatch(payerAbonnement({ 
      data: { idOffre: paiementModal.offreId },
      token 
    }));
    setPaiementModal({ open: false });
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const getStatutAbonnement = (abonnement: Abonnement) => {
    const now = new Date();
    const endDate = new Date(abonnement.endDate);
    return endDate < now ? 'expire' : 'actif';
  };

  const filteredOffres = offres.filter((o: Offre) =>
    o.services?.toLowerCase().includes(searchOffre.toLowerCase()) ||
    o.montant?.includes(searchOffre)
  );

  const filteredAbonnements = abonnements.filter((a: Abonnement) =>
    a.reference?.toLowerCase().includes(searchAbonnement.toLowerCase()) ||
    a.offre?.services?.toLowerCase().includes(searchAbonnement.toLowerCase()) ||
    a.entreprise?.nom?.toLowerCase().includes(searchAbonnement.toLowerCase())
  );

  if (loading && offres.length === 0 && abonnements.length === 0 && !sessionExpired) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Chargement des données...</p>
      </div>
    );
  }

  return (
    <div className="abonnements-container">
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

      {/* Modal de paiement */}
      {paiementModal.open && (
        <div className="modal-overlay" onClick={() => setPaiementModal({ open: false })}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirmer le paiement</h3>
              <button className="close-btn" onClick={() => setPaiementModal({ open: false })}>
                <FaTimes />
              </button>
            </div>
            
            <div className="modal-body">
              <p>Vous êtes sur le point de souscrire à l'offre :</p>
              <div className="offre-summary">
                <strong>{paiementModal.offreNom}</strong>
              </div>
              <p className="confirm-text">Confirmez-vous le paiement ?</p>
            </div>

            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setPaiementModal({ open: false })}
              >
                Annuler
              </button>
              <button 
                className="submit-btn"
                onClick={handlePayerAbonnement}
              >
                Confirmer le paiement
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="abonnements-header">
        <h1>
          <MdBusinessCenter className="header-icon" />
          Abonnements
        </h1>
        <div className="header-actions">
          <button 
            className="refresh-btn" 
            onClick={handleRefresh} 
            title="Actualiser"
            disabled={sessionExpired}
          >
            <FaSyncAlt className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </header>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'offres' ? 'active' : ''}`}
          onClick={() => !sessionExpired && setActiveTab('offres')}
          disabled={sessionExpired}
        >
          <FaBox />
          <span>Offres disponibles</span>
          <span className="tab-badge">{offres.length}</span>
        </button>
        <button
          className={`tab-btn ${activeTab === 'abonnements' ? 'active' : ''}`}
          onClick={() => !sessionExpired && setActiveTab('abonnements')}
          disabled={sessionExpired}
        >
          <FaShoppingBag />
          <span>Historique des abonnements</span>
          <span className="tab-badge">{abonnements.length}</span>
        </button>
      </div>

      {/* Contenu des onglets */}
      <div className="tab-content">
        {activeTab === 'offres' && (
          <>
            <div className="section-header">
              <h2>Offres disponibles</h2>
            </div>

            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Rechercher une offre..."
                value={searchOffre}
                onChange={(e) => setSearchOffre(e.target.value)}
                disabled={sessionExpired}
              />
              {searchOffre && (
                <FaTimes className="clear-icon" onClick={() => setSearchOffre('')} />
              )}
            </div>

            <div className="offres-grid">
              {filteredOffres.length === 0 ? (
                <div className="empty-state">
                  <FaBox size={48} />
                  <p>Aucune offre trouvée</p>
                </div>
              ) : (
                filteredOffres.map((offre: Offre) => (
                  <div key={offre.id} className={`offre-card ${sessionExpired ? 'disabled' : ''}`}>
                    <div className="offre-header">
                      <h3>{offre.services}</h3>
                    </div>
                    
                    <div className="offre-body">
                      <div className="offre-price">
                        <span className="price">{offre.montant}</span>
                      </div>
                      <div className="offre-duree">
                        {offre.duree === 'MENSUELLE' ? (
                          <><FaClock /> Mensuel</>
                        ) : (
                          <><FaCalendarAlt /> Annuel</>
                        )}
                      </div>
                    </div>

                    <div className="offre-footer">
                      <button 
                        className="btn-subscribe"
                        onClick={() => !sessionExpired && setPaiementModal({ 
                          open: true, 
                          offreId: offre.id,
                          offreNom: offre.services
                        })}
                        disabled={sessionExpired}
                      >
                        <FaCreditCard /> Souscrire
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === 'abonnements' && (
          <>
            <div className="section-header">
              <h2>Historique des abonnements</h2>
            </div>

            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Rechercher par référence, offre ou entreprise..."
                value={searchAbonnement}
                onChange={(e) => setSearchAbonnement(e.target.value)}
                disabled={sessionExpired}
              />
              {searchAbonnement && (
                <FaTimes className="clear-icon" onClick={() => setSearchAbonnement('')} />
              )}
            </div>

            <div className="abonnements-list">
              {filteredAbonnements.length === 0 ? (
                <div className="empty-state">
                  <FaShoppingBag size={48} />
                  <p>Aucun abonnement trouvé</p>
                </div>
              ) : (
                filteredAbonnements.map((abonnement: Abonnement) => {
                  const statut = getStatutAbonnement(abonnement);
                  return (
                    <div key={abonnement.id} className={`abonnement-card ${statut} ${sessionExpired ? 'disabled' : ''}`}>
                      <div className="abonnement-header">
                        <div className="abonnement-ref">
                          <FaInfoCircle />
                          <span>{abonnement.reference}</span>
                        </div>
                        <span className={`statut-badge ${statut}`}>
                          {statut === 'actif' ? 'Actif' : 'Expiré'}
                        </span>
                      </div>

                      <div className="abonnement-body">
                        <div className="abonnement-offre">
                          <strong>{abonnement.offre?.services}</strong>
                          <span className="montant">{abonnement.offre?.montant}</span>
                        </div>

                        {abonnement.entreprise && (
                          <div className="abonnement-entreprise">
                            <FaUser />
                            <span>{abonnement.entreprise.nom}</span>
                            <span className="email">{abonnement.entreprise.email}</span>
                          </div>
                        )}

                        <div className="abonnement-dates">
                          <div className="date-item">
                            <MdDateRange />
                            <span>Début: {formatDate(abonnement.date)}</span>
                          </div>
                          <div className="date-item">
                            <MdDateRange />
                            <span>Fin: {formatDate(abonnement.endDate)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="abonnement-footer">
                        <span className="duree">
                          {abonnement.offre?.duree === 'MENSUELLE' ? 'Abonnement mensuel' : 'Abonnement annuel'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}