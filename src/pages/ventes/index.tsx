// src/pages/ventes/VentesScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { 
  fetchCommands, 
  fetchClients, 
  validatePayment, 
  deleteCommand,
  resetValidateStatus,
  resetDeleteStatus,
  setSessionExpired 
} from '../../redux/slices/venteSlice';
import { 
  selectAllCommands, 
  selectPaidCommands, 
  selectPendingCommands,
  selectCreditCommands,
  selectCommandsLoading,
  selectValidateStatus,
  selectDeleteStatus,
  selectCommandsError,
  selectCommandsStats
} from '../../redux/selectors/vente.selector';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FaShoppingCart, 
  FaEuroSign, 
  FaClock, 
  FaSearch, 
  FaSyncAlt, 
  FaPlus, 
  FaTrash, 
  FaCheck, 
  FaFilePdf, 
  FaTimes, 
  FaCreditCard,
  FaRegSquare, 
  FaCheckSquare,
  FaExclamationTriangle,
  FaInfoCircle
} from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './index.css';
import type { CommandeResponse, detailledClient } from '../../models/interfaces';
import { generateInvoicePdf, generateMultiplePdf } from '../../pdf/pdfFacture';

type FilterType = 'all' | 'paid' | 'pending' | 'credit';

// Fonction utilitaire pour formater la date
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR');
};

export default function VentesScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, logout } = useAuth();

  // Selecteurs Redux
  const allCommands = useAppSelector(selectAllCommands) || [];
  const paidCommands = useAppSelector(selectPaidCommands) || [];
  const pendingCommands = useAppSelector(selectPendingCommands) || [];
  const creditCommands = useAppSelector(selectCreditCommands) || [];
  const clients = useAppSelector(state => state.vente.clients) || [];
  const loading = useAppSelector(selectCommandsLoading);
  const validateStatus = useAppSelector(selectValidateStatus);
  const deleteStatus = useAppSelector(selectDeleteStatus);
  const error = useAppSelector(selectCommandsError);
  const stats = useAppSelector(selectCommandsStats);
  const sessionExpired = useAppSelector(state => state.vente.sessionExpired);

  // États locaux
  const [searchValue, setSearchValue] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [showValidateModal, setShowValidateModal] = useState<number | null>(null);
  const [selectedCommands, setSelectedCommands] = useState<Set<number>>(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(location.state?.success || false);
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

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

  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);

  // Chargement initial des données
  useEffect(() => {
    if (token && !sessionExpired) {
      dispatch(fetchCommands(token));
      dispatch(fetchClients(token));
    }
  }, [token, dispatch, sessionExpired]);

  // Gestion des messages de succès
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  // Gestion des erreurs
  useEffect(() => {
    if (error && !sessionExpired) {
      setErrorMessage(error);
      setShowErrorModal(true);
    }
  }, [error, sessionExpired]);

  // Reset des statuts après action
  useEffect(() => {
    if (validateStatus === 'succeeded') {
      setSuccessMessage('Paiement validé avec succès');
      setShowSuccessMessage(true);
      dispatch(resetValidateStatus());
    }
    if (deleteStatus === 'succeeded') {
      setSuccessMessage('Commande supprimée avec succès');
      setShowSuccessMessage(true);
      dispatch(resetDeleteStatus());
    }
  }, [validateStatus, deleteStatus, dispatch]);

  const handleRefresh = () => {
    if (token && !sessionExpired) {
      dispatch(fetchCommands(token));
      setSelectedCommands(new Set());
      setShowBulkActions(false);
    }
  };

  // Calcul des commandes filtrées
  const filteredCommands = useMemo(() => {
    let list = [...allCommands];
    
    // Application du filtre principal basé sur les factures
    switch (activeFilter) {
      case 'paid':
        list = list.filter(c => c.valide && c.factures?.every(f => f.payed));
        break;
      case 'pending':
        list = list.filter(c => !c.valide || c.factures?.some(f => !f.payed));
        break;
      case 'credit':
        list = list.filter(c => c.typePaiement === 'CREDIT');
        break;
      default:
        break;
    }

    // Application de la recherche
    if (searchValue.trim()) {
      const term = searchValue.toLowerCase().trim();
      list = list.filter(c => 
        c.client?.nom.toLowerCase().includes(term) || 
        c.reference?.toLowerCase().includes(term) ||
        c.produit?.nom.toLowerCase().includes(term)
      );
    }

    return list;
  }, [allCommands, activeFilter, searchValue]);

  // Calcul des statistiques
  const calculatedStats = useMemo(() => {
    const total = allCommands.length;
    const paid = allCommands.filter(c => c.valide && c.factures?.every(f => f.payed)).length;
    const pending = allCommands.filter(c => !c.valide || c.factures?.some(f => !f.payed)).length;
    const credit = allCommands.filter(c => c.typePaiement === 'CREDIT').length;
    const totalAmount = allCommands.reduce((sum, c) => sum + (c.quantite * c.produit?.prixVente || 0), 0);
    const paidAmount = allCommands
      .filter(c => c.valide && c.factures?.every(f => f.payed))
      .reduce((sum, c) => sum + (c.quantite * c.produit?.prixVente || 0), 0);
    const pendingAmount = allCommands
      .filter(c => !c.valide || c.factures?.some(f => !f.payed))
      .reduce((sum, c) => sum + (c.quantite * c.produit?.prixVente || 0), 0);
    const creditAmount = allCommands
      .filter(c => c.typePaiement === 'CREDIT')
      .reduce((sum, c) => sum + (c.quantite * c.produit?.prixVente || 0), 0);

    return { total, paid, pending, credit, totalAmount, paidAmount, pendingAmount, creditAmount };
  }, [allCommands]);

  // Gestion de la sélection
  const toggleSelectAll = () => {
    if (selectedCommands.size === filteredCommands.length) {
      setSelectedCommands(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedCommands(new Set(filteredCommands.map(c => c.id)));
      setShowBulkActions(true);
    }
  };

  const toggleSelectCommand = (id: number) => {
    const newSelected = new Set(selectedCommands);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCommands(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleBulkValidate = async () => {
    if (selectedCommands.size === 0 || sessionExpired) return;
    
    const toValidate = Array.from(selectedCommands).filter(id => {
      const command = allCommands.find(c => c.id === id);
      return command && !command.valide;
    });

    if (toValidate.length === 0) {
      setErrorMessage('Aucune commande non validée sélectionnée');
      setShowErrorModal(true);
      return;
    }

    for (const id of toValidate) {
      if (token) {
        await dispatch(validatePayment({ id, token, typePaiement: 'CASH' }));
      }
    }
    
    setSelectedCommands(new Set());
    setShowBulkActions(false);
  };

  const handleBulkDelete = () => {
    if (selectedCommands.size === 0 || sessionExpired) return;
    
    const toDelete = Array.from(selectedCommands);
    if (window.confirm(`Supprimer ${toDelete.length} commande(s) ? Cette action est irréversible.`)) {
      toDelete.forEach(id => {
        if (token) dispatch(deleteCommand({ id, token }));
      });
      setSelectedCommands(new Set());
      setShowBulkActions(false);
    }
  };

  const handleBulkPdf = () => {
    if (selectedCommands.size === 0 || sessionExpired) return;
    const selectedList = allCommands.filter(c => selectedCommands.has(c.id));
    generateMultiplePdf(selectedList,()=>{
      setErrorMessage('Erreur lors de la génération du PDF. Veuillez réessayer.');
      setShowErrorModal(true);
    });
  };

  const handleDelete = (id: number) => {
    if (token && !sessionExpired) {
      dispatch(deleteCommand({ id, token }));
      setShowDeleteModal(null);
    }
  };

  const handleValidate = (id: number) => {
    if (token && !sessionExpired) {
      dispatch(validatePayment({ id, token, typePaiement: 'CASH' }));
      setShowValidateModal(null);
    }
  };

  const getPaymentTypeLabel = (type: string): string => {
    switch (type) {
      case 'CASH': return 'Espèces';
      case 'CARTE': return 'Carte';
      case 'MOBILE_MONEY': return 'Mobile Money';
      case 'CREDIT': return 'Crédit';
      default: return type;
    }
  };

  const getStatusClass = (command: CommandeResponse): string => {
    if (command.valide && command.factures?.every(f => f.payed)) return 'status-paid';
    if (command.typePaiement === 'CREDIT' && !command.valide) return 'status-credit';
    if (!command.valide) return 'status-pending';
    return '';
  };

  const getStatusText = (command: CommandeResponse): string => {
    if (command.valide && command.factures?.every(f => f.payed)) return 'Payé';
    if (command.typePaiement === 'CREDIT' && !command.valide) return 'Crédit';
    if (!command.valide) return 'En attente';
    return 'Partiellement payé';
  };

  if (loading && allCommands.length === 0 && !sessionExpired) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p>Chargement des ventes...</p>
      </div>
    );
  }

  return (
    <div className="ventes-container">
      {/* Message de succès */}
      {showSuccessMessage && (
        <div className="success-message">
          <FaCheck /> {successMessage}
        </div>
      )}

      {/* Modal de session expirée */}
      {showSessionExpiredModal && (
        <div className="modal-overlay">
          <div className="modal session-expired-modal" onClick={e => e.stopPropagation()}>
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

      <header className="ventes-header">
        <h1>Ventes</h1>
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

      {/* Barre d'actions groupées */}
      {showBulkActions && !sessionExpired && (
        <div className="bulk-actions-bar">
          <div className="bulk-info">
            <FaInfoCircle />
            <span>{selectedCommands.size} commande(s) sélectionnée(s)</span>
          </div>
          <div className="bulk-buttons">
            <button 
              className="bulk-validate-btn" 
              onClick={handleBulkValidate}
              disabled={validateStatus === 'loading'}
            >
              {validateStatus === 'loading' ? (
                <><div className="spinner-small" /> Validation...</>
              ) : (
                <><FaCheck /> Valider</>
              )}
            </button>
            <button 
              className="bulk-pdf-btn" 
              onClick={handleBulkPdf}
              disabled={sessionExpired}
            >
              <FaFilePdf /> PDF Groupé
            </button>
            <button 
              className="bulk-delete-btn" 
              onClick={handleBulkDelete}
              disabled={sessionExpired}
            >
              <FaTrash /> Supprimer
            </button>
            <button className="bulk-clear-btn" onClick={() => {
              setSelectedCommands(new Set());
              setShowBulkActions(false);
            }}>
              <FaTimes /> Annuler
            </button>
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div 
          className={`stat-card total ${activeFilter === 'all' ? 'active' : ''} ${sessionExpired ? 'disabled' : ''}`} 
          onClick={() => !sessionExpired && setActiveFilter('all')}
        >
          <FaShoppingCart className="stat-icon" />
          <div className="stat-value">{calculatedStats.total}</div>
          <div className="stat-label">Total</div>
        </div>
        <div 
          className={`stat-card paid ${activeFilter === 'paid' ? 'active' : ''} ${sessionExpired ? 'disabled' : ''}`} 
          onClick={() => !sessionExpired && setActiveFilter('paid')}
        >
          <FaCheck className="stat-icon" />
          <div className="stat-value">{calculatedStats.paid}</div>
          <div className="stat-label">Payées</div>
          <div className="stat-subvalue">{calculatedStats.paidAmount.toLocaleString()} Ar</div>
        </div>
        <div 
          className={`stat-card pending ${activeFilter === 'pending' ? 'active' : ''} ${sessionExpired ? 'disabled' : ''}`} 
          onClick={() => !sessionExpired && setActiveFilter('pending')}
        >
          <FaClock className="stat-icon" />
          <div className="stat-value">{calculatedStats.pending}</div>
          <div className="stat-label">En attente</div>
          <div className="stat-subvalue">{calculatedStats.pendingAmount.toLocaleString()} Ar</div>
        </div>
        <div 
          className={`stat-card credit ${activeFilter === 'credit' ? 'active' : ''} ${sessionExpired ? 'disabled' : ''}`} 
          onClick={() => !sessionExpired && setActiveFilter('credit')}
        >
          <FaCreditCard className="stat-icon" />
          <div className="stat-value">{calculatedStats.credit}</div>
          <div className="stat-label">À crédit</div>
          <div className="stat-subvalue">{calculatedStats.creditAmount.toLocaleString()} Ar</div>
        </div>
        <div className="stat-card amount">
          <FaEuroSign className="stat-icon" />
          <div className="stat-value">{calculatedStats.totalAmount.toLocaleString()} Ar</div>
          <div className="stat-label">CA total</div>
        </div>
      </div>

      <div className="search-filter">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher client, référence ou produit..."
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            className="search-input"
            disabled={sessionExpired}
          />
          {searchValue && (
            <FaTimes 
              className="clear-icon" 
              onClick={() => setSearchValue('')}
              title="Effacer la recherche"
            />
          )}
        </div>

        <div className="filter-buttons">
          <button 
            className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`} 
            onClick={() => !sessionExpired && setActiveFilter('all')}
            disabled={sessionExpired}
          >
            Tous ({calculatedStats.total})
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'paid' ? 'active' : ''}`} 
            onClick={() => !sessionExpired && setActiveFilter('paid')}
            disabled={sessionExpired}
          >
            Payées ({calculatedStats.paid})
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'pending' ? 'active' : ''}`} 
            onClick={() => !sessionExpired && setActiveFilter('pending')}
            disabled={sessionExpired}
          >
            En attente ({calculatedStats.pending})
          </button>
          <button 
            className={`filter-btn ${activeFilter === 'credit' ? 'active' : ''}`} 
            onClick={() => !sessionExpired && setActiveFilter('credit')}
            disabled={sessionExpired}
          >
            À crédit ({calculatedStats.credit})
          </button>
        </div>
      </div>

      <div className="commands-section">
        <div className="section-header">
          <h2 className="section-title">Commandes</h2>
          {filteredCommands.length > 0 && !sessionExpired && (
            <button className="select-all-btn" onClick={toggleSelectAll}>
              {selectedCommands.size === filteredCommands.length ? (
                <><FaCheckSquare /> Tout désélectionner</>
              ) : (
                <><FaRegSquare /> Tout sélectionner</>
              )}
            </button>
          )}
        </div>

        <div className="commands-grid">
          {filteredCommands.map(command => {
            const isSelected = selectedCommands.has(command.id);
            const statusClass = getStatusClass(command);
            const statusText = getStatusText(command);
            
            return (
              <div key={command.id} className={`command-card ${statusClass} ${isSelected ? 'selected' : ''} ${sessionExpired ? 'disabled' : ''}`}>
                <div className="command-checkbox">
                  <button 
                    className="checkbox-btn"
                    onClick={() => !sessionExpired && toggleSelectCommand(command.id)}
                    title={isSelected ? 'Désélectionner' : 'Sélectionner'}
                    disabled={sessionExpired}
                  >
                    {isSelected ? <FaCheckSquare /> : <FaRegSquare />}
                  </button>
                </div>

                <div className="command-info">
                  <div className="command-header">
                    <p className="command-ref">Réf: {command.reference}</p>
                    <span className={`command-status ${statusClass}`}>
                      {statusText}
                    </span>
                  </div>
                  
                  <p className="command-client">
                    <strong>{command.client.nom}</strong>
                  </p>
                  
                  <div className="command-details">
                    <span className="command-product" title={command.produit.nom}>
                      {command.produit.nom.length > 30 
                        ? command.produit.nom.substring(0, 30) + '...' 
                        : command.produit.nom}
                    </span>
                    <span className="command-quantity">x{command.quantite}</span>
                  </div>
                  
                  <div className="command-footer">
                    <p className="command-amount">
                      {(command.quantite * command.produit.prixVente).toLocaleString()} Ar
                    </p>
                    <p className="command-payment">
                      {getPaymentTypeLabel(command.typePaiement)}
                    </p>
                    <p className="command-date">
                      {formatDate(command.date)}
                    </p>
                  </div>
                </div>

                <div className="command-actions">
                  {!command.valide && (
                    <button 
                      className="validate-btn" 
                      onClick={() => !sessionExpired && setShowValidateModal(command.id)}
                      title="Valider le paiement"
                      disabled={validateStatus === 'loading' || sessionExpired}
                    >
                      <FaCheck />
                    </button>
                  )}
                  <button 
                    className="pdf-btn-small" 
                    onClick={() => generateInvoicePdf(command,()=>{
                      setErrorMessage('Erreur lors de la génération du PDF. Veuillez réessayer.');
                      setShowErrorModal(true);
                    })}
                    title="Télécharger la facture"
                    disabled={sessionExpired}
                  >
                    <FaFilePdf />
                  </button>
                  <button 
                    className="delete-btn" 
                    onClick={() => !sessionExpired && setShowDeleteModal(command.id)}
                    title="Supprimer"
                    disabled={deleteStatus === 'loading' || sessionExpired}
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            );
          })}
          
          {filteredCommands.length === 0 && !sessionExpired && (
            <div className="empty-state">
              <FaShoppingCart size={48} color="#ccc" />
              <p>Aucune commande trouvée</p>
              {searchValue || activeFilter !== 'all' ? (
                <button 
                  className="reset-filters-btn" 
                  onClick={() => {
                    setSearchValue('');
                    setActiveFilter('all');
                  }}
                >
                  Réinitialiser les filtres
                </button>
              ) : (
                <button className="add-first-btn" onClick={() => navigate('/ventes/add')}>
                  <FaPlus /> Créer une commande
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="clients-section">
        <h2 className="section-title">Clients récents</h2>
        <div className="clients-grid">
          {clients.slice(0, 6).map((client: detailledClient) => (
            <div key={client.id} className={`client-card ${sessionExpired ? 'disabled' : ''}`}>
              <p className="client-name">{client.nom}</p>
              <p className="client-email">{client.email}</p>
              <p className="client-phone">{client.telephone}</p>
              <p className="client-commandes">
                {client.commandes?.length || 0} commande(s)
              </p>
            </div>
          ))}
          {clients.length === 0 && !sessionExpired && (
            <div className="empty-clients">
              <p>Aucun client enregistré</p>
            </div>
          )}
        </div>
      </div>

      <button 
        className={`fab ${sessionExpired ? 'disabled' : ''}`} 
        onClick={() => !sessionExpired && navigate('/ventes/add')} 
        title="Nouvelle commande"
        disabled={sessionExpired}
      >
        <FaPlus />
      </button>

      {/* Modal de confirmation de suppression */}
      {showDeleteModal && !sessionExpired && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Confirmer la suppression ?</h3>
            <p>Cette action est irréversible.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteModal(null)}>
                Annuler
              </button>
              <button 
                className="confirm-btn delete" 
                onClick={() => handleDelete(showDeleteModal)}
                disabled={deleteStatus === 'loading'}
              >
                {deleteStatus === 'loading' ? (
                  <><div className="spinner-small" /> Suppression...</>
                ) : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de validation de paiement */}
      {showValidateModal && !sessionExpired && (
        <div className="modal-overlay" onClick={() => setShowValidateModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Valider le paiement ?</h3>
            <p>La commande sera marquée comme payée.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowValidateModal(null)}>
                Annuler
              </button>
              <button 
                className="confirm-btn" 
                onClick={() => handleValidate(showValidateModal)}
                disabled={validateStatus === 'loading'}
              >
                {validateStatus === 'loading' ? (
                  <><div className="spinner-small" /> Validation...</>
                ) : 'Valider'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}