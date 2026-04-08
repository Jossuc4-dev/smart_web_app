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
  selectCommandsLoading,
  selectValidateStatus,
  selectDeleteStatus,
  selectCommandsError,
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
  FaInfoCircle,
  FaStar,
  FaUser,
  FaCalendarAlt,
  FaBox,
  FaInfoCircle as FaInfoCircleSolid,
  FaEnvelope,
  FaPhone,
  FaTag,
  FaBarcode,
  FaMoneyBillWave,
  FaReceipt,
  FaBuilding,
  FaCalendarCheck
} from 'react-icons/fa';
import './index.css';
import type { CommandeResponse, detailledClient } from '../../models/interfaces';
import { generateInvoicePdf, generateMultiplePdf } from '../../pdf/pdfFacture';

type FilterType = 'all' | 'paid' | 'pending' | 'credit';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatDateTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function VentesScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { token, logout } = useAuth();

  const allCommands = useAppSelector(selectAllCommands) || [];
  const clients = useAppSelector(state => state.vente.clients) || [];
  const loading = useAppSelector(selectCommandsLoading);
  const validateStatus = useAppSelector(selectValidateStatus);
  const deleteStatus = useAppSelector(selectDeleteStatus);
  const error = useAppSelector(selectCommandsError);
  const sessionExpired = useAppSelector(state => state.vente.sessionExpired);

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
  const [showSessionExpiredModal, setShowSessionExpiredModal] = useState(false);
  const [selectedCommandDetails, setSelectedCommandDetails] = useState<CommandeResponse | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (token && !sessionExpired) {
      dispatch(fetchCommands(token));
      dispatch(fetchClients(token));
    }
  }, [token, dispatch, sessionExpired]);

  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => setShowSuccessMessage(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  useEffect(() => {
    if (error && !sessionExpired) {
      setErrorMessage(error);
      setShowErrorModal(true);
    }
  }, [error, sessionExpired]);

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

  const handleRowClick = (command: CommandeResponse) => {
    if (!sessionExpired) {
      setSelectedCommandDetails(command);
      setShowDetailsModal(true);
    }
  };

  const filteredCommands = useMemo(() => {
    let list = [...allCommands];
    switch (activeFilter) {
      case 'paid':    list = list.filter(c => c.valide && c.factures?.every(f => f.payed)); break;
      case 'pending': list = list.filter(c => !c.valide || c.factures?.some(f => !f.payed)); break;
      case 'credit':  list = list.filter(c => c.typePaiement === 'CREDIT'); break;
    }
    if (searchValue.trim()) {
      const term = searchValue.toLowerCase().trim();
      list = list.filter(c =>
        c.client?.nom?.toLowerCase().includes(term) ||
        c.reference?.toLowerCase().includes(term) ||
        c.produit?.nom?.toLowerCase().includes(term)
      );
    }
    return list;
  }, [allCommands, activeFilter, searchValue]);

  // Stats
  const calculatedStats = useMemo(() => {
    const total = allCommands.length;
    const paid = allCommands.filter(c => c.valide && c.factures?.every(f => f.payed)).length;
    const pending = allCommands.filter(c => !c.valide || c.factures?.some(f => !f.payed)).length;
    const credit = allCommands.filter(c => c.typePaiement === 'CREDIT').length;
    const totalAmount = allCommands.reduce((s, c) => s + (c.quantite * c.produit?.prixVente || 0), 0);
    const paidAmount = allCommands.filter(c => c.valide && c.factures?.every(f => f.payed))
      .reduce((s, c) => s + (c.quantite * c.produit?.prixVente || 0), 0);
    const pendingAmount = allCommands.filter(c => !c.valide || c.factures?.some(f => !f.payed))
      .reduce((s, c) => s + (c.quantite * c.produit?.prixVente || 0), 0);
    const creditAmount = allCommands.filter(c => c.typePaiement === 'CREDIT')
      .reduce((s, c) => s + (c.quantite * c.produit?.prixVente || 0), 0);

    const clientTotals: Record<string, { nom: string; total: number; count: number }> = {};
    for (const cmd of allCommands) {
      const nom = cmd.client?.nom;
      if (!nom) continue;
      const montant = (cmd.quantite * cmd.produit?.prixVente) || 0;
      if (!clientTotals[nom]) clientTotals[nom] = { nom, total: 0, count: 0 };
      clientTotals[nom].total += montant;
      clientTotals[nom].count += 1;
    }
    const bestClient = Object.values(clientTotals).sort((a, b) => b.total - a.total)[0] || null;

    return { total, paid, pending, credit, totalAmount, paidAmount, pendingAmount, creditAmount, bestClient };
  }, [allCommands]);

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
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedCommands(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleBulkValidate = async () => {
    if (selectedCommands.size === 0 || sessionExpired) return;
    const toValidate = Array.from(selectedCommands).filter(id => {
      const c = allCommands.find(c => c.id === id);
      return c && !c.valide;
    });
    if (toValidate.length === 0) { setErrorMessage('Aucune commande non validée sélectionnée'); setShowErrorModal(true); return; }
    for (const id of toValidate) if (token) await dispatch(validatePayment({ id, token, typePaiement: 'CASH' }));
    setSelectedCommands(new Set());
    setShowBulkActions(false);
  };

  const handleBulkDelete = () => {
    if (selectedCommands.size === 0 || sessionExpired) return;
    const toDelete = Array.from(selectedCommands);
    if (window.confirm(`Supprimer ${toDelete.length} commande(s) ? Cette action est irréversible.`)) {
      toDelete.forEach(id => { if (token) dispatch(deleteCommand({ id, token })); });
      setSelectedCommands(new Set());
      setShowBulkActions(false);
    }
  };

  const handleBulkPdf = () => {
    if (selectedCommands.size === 0 || sessionExpired) return;
    const selectedList = allCommands.filter(c => selectedCommands.has(c.id));
    generateMultiplePdf(selectedList, () => { setErrorMessage('Erreur lors de la génération du PDF.'); setShowErrorModal(true); });
  };

  const handleDelete = (id: number) => {
    if (token && !sessionExpired) { dispatch(deleteCommand({ id, token })); setShowDeleteModal(null); }
  };

  const handleValidate = async (id: number) => {
    if (token && !sessionExpired) {
      await dispatch(validatePayment({ id, token, typePaiement: 'CASH' })).unwrap();
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
    return 'Partiel';
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
      {showSuccessMessage && (
        <div className="success-message"><FaCheck /> {successMessage}</div>
      )}

      {showSessionExpiredModal && (
        <div className="modal-overlay">
          <div className="modal session-expired-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon warning"><FaExclamationTriangle /></div>
            <h3>Session expirée</h3>
            <p>Votre session a expiré. Vous allez être redirigé vers la page de connexion.</p>
            <div className="redirect-spinner" />
          </div>
        </div>
      )}

      {showErrorModal && !sessionExpired && (
        <div className="modal-overlay" onClick={() => setShowErrorModal(false)}>
          <div className="modal error-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-icon error"><FaExclamationTriangle /></div>
            <h3>Erreur</h3>
            <p>{errorMessage}</p>
            <button className="confirm-btn" onClick={() => setShowErrorModal(false)}>Compris</button>
          </div>
        </div>
      )}

      <header className="ventes-header">
        <h1>Ventes</h1>
        <div className="header-actions">
          <button className="refresh-btn" onClick={handleRefresh} title="Actualiser" disabled={sessionExpired}>
            <FaSyncAlt className={loading ? 'spinning' : ''} />
          </button>
        </div>
      </header>

      {showBulkActions && !sessionExpired && (
        <div className="bulk-actions-bar">
          <div className="bulk-info">
            <FaInfoCircle />
            <span>{selectedCommands.size} commande(s) sélectionnée(s)</span>
          </div>
          <div className="bulk-buttons">
            <button className="bulk-validate-btn" onClick={handleBulkValidate} disabled={validateStatus === 'loading'}>
              {validateStatus === 'loading' ? <><div className="spinner-small" /> Validation...</> : <><FaCheck /> Valider</>}
            </button>
            <button className="bulk-pdf-btn" onClick={handleBulkPdf} disabled={sessionExpired}>
              <FaFilePdf /> PDF Groupé
            </button>
            <button className="bulk-delete-btn" onClick={handleBulkDelete} disabled={sessionExpired}>
              <FaTrash /> Supprimer
            </button>
            <button className="bulk-clear-btn" onClick={() => { setSelectedCommands(new Set()); setShowBulkActions(false); }}>
              <FaTimes /> Annuler
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="stats-grid">
        <div className={`stat-card total ${activeFilter === 'all' ? 'active' : ''} ${sessionExpired ? 'disabled' : ''}`}
          onClick={() => !sessionExpired && setActiveFilter('all')}>
          <FaShoppingCart className="stat-icon" />
          <div className="stat-value">{calculatedStats.total}</div>
          <div className="stat-label">Total</div>
        </div>

        <div className={`stat-card paid ${activeFilter === 'paid' ? 'active' : ''} ${sessionExpired ? 'disabled' : ''}`}
          onClick={() => !sessionExpired && setActiveFilter('paid')}>
          <FaCheck className="stat-icon" />
          <div className="stat-value">{calculatedStats.paid}</div>
          <div className="stat-label">Payées</div>
          <div className="stat-subvalue">{calculatedStats.paidAmount.toLocaleString()} Ar</div>
        </div>

        <div className={`stat-card pending ${activeFilter === 'pending' ? 'active' : ''} ${sessionExpired ? 'disabled' : ''}`}
          onClick={() => !sessionExpired && setActiveFilter('pending')}>
          <FaClock className="stat-icon" />
          <div className="stat-value">{calculatedStats.pending}</div>
          <div className="stat-label">En attente</div>
          <div className="stat-subvalue">{calculatedStats.pendingAmount.toLocaleString()} Ar</div>
        </div>

        <div className={`stat-card credit ${activeFilter === 'credit' ? 'active' : ''} ${sessionExpired ? 'disabled' : ''}`}
          onClick={() => !sessionExpired && setActiveFilter('credit')}>
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

        <div className="stat-card best-client">
          <FaStar className="stat-icon" />
          {calculatedStats.bestClient ? (
            <>
              <div className="stat-value best-client-name">{calculatedStats.bestClient.nom}</div>
              <div className="stat-label">Meilleur client</div>
              <div className="stat-subvalue">{calculatedStats.bestClient.total.toLocaleString()} Ar · {calculatedStats.bestClient.count} cmd</div>
            </>
          ) : (
            <>
              <div className="stat-value">—</div>
              <div className="stat-label">Meilleur client</div>
            </>
          )}
        </div>
      </div>

      {/* Search & filters */}
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
          {searchValue && <FaTimes className="clear-icon" onClick={() => setSearchValue('')} title="Effacer" />}
        </div>

        <div className="filter-buttons">
          <button className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => !sessionExpired && setActiveFilter('all')} disabled={sessionExpired}>Tous ({calculatedStats.total})</button>
          <button className={`filter-btn ${activeFilter === 'paid' ? 'active' : ''}`} onClick={() => !sessionExpired && setActiveFilter('paid')} disabled={sessionExpired}>Payées ({calculatedStats.paid})</button>
          <button className={`filter-btn ${activeFilter === 'pending' ? 'active' : ''}`} onClick={() => !sessionExpired && setActiveFilter('pending')} disabled={sessionExpired}>En attente ({calculatedStats.pending})</button>
          <button className={`filter-btn ${activeFilter === 'credit' ? 'active' : ''}`} onClick={() => !sessionExpired && setActiveFilter('credit')} disabled={sessionExpired}>À crédit ({calculatedStats.credit})</button>
        </div>
      </div>

      {/* Liste des commandes */}
      <div className="commands-section">
        <div className="section-header">
          <h2 className="section-title">Commandes</h2>
          {filteredCommands.length > 0 && !sessionExpired && (
            <button className="select-all-btn" onClick={toggleSelectAll}>
              {selectedCommands.size === filteredCommands.length
                ? <><FaCheckSquare /> Tout désélectionner</>
                : <><FaRegSquare /> Tout sélectionner</>}
            </button>
          )}
        </div>

        {filteredCommands.length > 0 && (
          <div className="commands-list-header">
            <span className="col-check" />
            <span className="col-ref">Référence</span>
            <span className="col-client">Client</span>
            <span className="col-product">Produit</span>
            <span className="col-amount">Montant</span>
            <span className="col-date">Date</span>
            <span className="col-status">Statut</span>
          </div>
        )}

        <div className="commands-list">
          {filteredCommands.map(command => {
            const isSelected = selectedCommands.has(command.id);
            const statusClass = getStatusClass(command);
            const statusText = getStatusText(command);

            return (
              <div
                key={command.id}
                className={`command-row ${statusClass} ${isSelected ? 'selected' : ''} ${sessionExpired ? 'disabled' : ''}`}
                onClick={() => handleRowClick(command)}
              >
                <span className="col-check" onClick={(e) => e.stopPropagation()}>
                  <button className="checkbox-btn" onClick={() => !sessionExpired && toggleSelectCommand(command.id)} disabled={sessionExpired}>
                    {isSelected ? <FaCheckSquare /> : <FaRegSquare />}
                  </button>
                </span>

                <span className="col-ref">
                  <span className="row-ref-badge">{command.reference}</span>
                </span>

                <span className="col-client row-client">
                  <FaUser className="row-col-icon" />
                  {command.client?.nom || 'Client inconnu'}
                </span>

                <span className="col-product row-product" title={command.produit?.nom || 'Produit inconnu'}>
                  <FaBox className="row-col-icon" />
                  {command.produit?.nom
                    ? (command.produit.nom.length > 28 ? command.produit.nom.substring(0, 28) + '…' : command.produit.nom)
                    : 'Produit inconnu'}
                </span>

                <span className="col-amount row-amount">
                  {((command.quantite || 0) * (command.produit?.prixVente || 0)).toLocaleString()} Ar
                </span>

                <span className="col-date row-date">
                  <FaCalendarAlt className="row-col-icon" />
                  {formatDate(command.date)}
                </span>

                <span className="col-status">
                  <span className={`command-status ${statusClass}`}>{statusText}</span>
                </span>

                <span className="col-actions row-actions" onClick={(e) => e.stopPropagation()}>
                  {!command.valide && (
                    <button className="validate-btn row-action-btn" onClick={() => !sessionExpired && setShowValidateModal(command.id)}
                      title="Valider" disabled={validateStatus === 'loading' || sessionExpired}>
                      <FaCheck />
                    </button>
                  )}
                </span>
              </div>
            );
          })}

          {filteredCommands.length === 0 && !sessionExpired && (
            <div className="empty-state">
              <FaShoppingCart size={48} color="#ccc" />
              <p>Aucune commande trouvée</p>
              {searchValue || activeFilter !== 'all' ? (
                <button className="reset-filters-btn" onClick={() => { setSearchValue(''); setActiveFilter('all'); }}>
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

      {/* Clients récents */}
      <div className="clients-section">
        <h2 className="section-title">Clients récents</h2>
        <div className="clients-list">
          {clients.length > 0 && (
            <div className="clients-list-header">
              <span className="ccol-name">Nom</span>
              <span className="ccol-email">Email</span>
              <span className="ccol-phone">Téléphone</span>
              <span className="ccol-orders">Commandes</span>
              <span className="ccol-total">Total achats</span>
            </div>
          )}
          <div className="clients-list-body">
            {clients.map((client: detailledClient) => {
              const totalClient = (client.commandes || []).reduce(
                (s, cmd) => s + ((cmd.quantite ?? 0) * (cmd.produit?.prixVente ?? 0)), 0
              );
              return (
                <div key={client.id} className={`client-row ${sessionExpired ? 'disabled' : ''}`}>
                  <span className="ccol-name client-row-name">
                    <span className="client-avatar">{client.nom.charAt(0).toUpperCase()}</span>
                    {client.nom}
                  </span>
                  <span className="ccol-email client-row-email">{client.email}</span>
                  <span className="ccol-phone">{client.telephone}</span>
                  <span className="ccol-orders">
                    <span className="client-order-badge">{client.commandes?.length || 0}</span>
                  </span>
                  <span className="ccol-total client-row-total">
                    {totalClient.toLocaleString()} Ar
                  </span>
                </div>
              );
            })}
            {clients.length === 0 && !sessionExpired && (
              <div className="empty-clients"><p>Aucun client enregistré</p></div>
            )}
          </div>
        </div>
      </div>

      <button className={`fab ${sessionExpired ? 'disabled' : ''}`}
        onClick={() => !sessionExpired && navigate('/ventes/add')}
        title="Nouvelle commande" disabled={sessionExpired}>
        <FaPlus />
      </button>

      {/* Modal suppression */}
      {showDeleteModal && !sessionExpired && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Confirmer la suppression ?</h3>
            <p>Cette action est irréversible.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteModal(null)}>Annuler</button>
              <button className="confirm-btn delete" onClick={() => handleDelete(showDeleteModal)} disabled={deleteStatus === 'loading'}>
                {deleteStatus === 'loading' ? <><div className="spinner-small" /> Suppression...</> : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal validation */}
      {showValidateModal && !sessionExpired && (
        <div className="modal-overlay" onClick={() => setShowValidateModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Valider le paiement ?</h3>
            <p>La commande sera marquée comme payée.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowValidateModal(null)}>Annuler</button>
              <button className="confirm-btn" onClick={() => handleValidate(showValidateModal)} disabled={validateStatus === 'loading'}>
                {validateStatus === 'loading' ? <><div className="spinner-small" /> Validation...</> : 'Valider'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails Commande - Version améliorée */}
      {showDetailsModal && selectedCommandDetails && !sessionExpired && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal details-modal" onClick={e => e.stopPropagation()}>
            <div className="details-modal-header">
              <h3>
                <div className="header-icon">
                  <FaReceipt />
                </div>
                Détails de la commande
              </h3>
            </div>

            <div className="details-modal-body">
              {/* Grille d'informations */}
              <div className="details-grid">
                {/* Carte Informations générales */}
                <div className="details-card">
                  <div className="details-card-title">
                    <FaInfoCircleSolid />
                    Général
                  </div>
                  <div className="details-card-content">
                    <div className="details-info-row">
                      <span className="details-info-label">Référence :</span>
                      <span className="details-info-value"><FaTag className="row-col-icon" style={{ marginRight: 4 }} /> {selectedCommandDetails.reference}</span>
                    </div>
                    <div className="details-info-row">
                      <span className="details-info-label">Date :</span>
                      <span className="details-info-value"><FaCalendarAlt className="row-col-icon" style={{ marginRight: 4 }} /> {formatDateTime(selectedCommandDetails.date)}</span>
                    </div>
                    <div className="details-info-row">
                      <span className="details-info-label">Statut :</span>
                      <span className={`status-badge-large ${getStatusClass(selectedCommandDetails)}`}>
                        {getStatusText(selectedCommandDetails)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Carte Client */}
                <div className="details-card">
                  <div className="details-card-title">
                    <FaUser />
                    Client
                  </div>
                  <div className="details-card-content">
                    <div className="details-info-row">
                      <span className="details-info-label">Nom :</span>
                      <span className="details-info-value"><strong>{selectedCommandDetails.client?.nom || 'Client inconnu'}</strong></span>
                    </div>
                    {selectedCommandDetails.client?.email && (
                      <div className="details-info-row">
                        <span className="details-info-label"><FaEnvelope className="row-col-icon" /> Email :</span>
                        <span className="details-info-value">{selectedCommandDetails.client.email}</span>
                      </div>
                    )}
                    {selectedCommandDetails.client?.telephone && (
                      <div className="details-info-row">
                        <span className="details-info-label"><FaPhone className="row-col-icon" /> Téléphone :</span>
                        <span className="details-info-value">{selectedCommandDetails.client.telephone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Carte Produit - Pleine largeur si nécessaire */}
                <div className="details-card full-width">
                  <div className="details-card-title">
                    <FaBox />
                    Produit
                  </div>
                  <div className="details-card-content">
                    <div className="details-info-row">
                      <span className="details-info-label">Nom :</span>
                      <span className="details-info-value"><strong>{selectedCommandDetails.produit?.nom || 'Produit inconnu'}</strong></span>
                    </div>
                    <div className="details-info-row">
                      <span className="details-info-label"><FaBarcode className="row-col-icon" /> Référence :</span>
                      <span className="details-info-value">{selectedCommandDetails.produit?.numero || 'N/A'}</span>
                    </div>
                    <div className="details-info-row">
                      <span className="details-info-label"><FaBuilding className="row-col-icon" /> Type :</span>
                      <span className="details-info-value">{selectedCommandDetails.produit?.type || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Carte Informations financières */}
                <div className="details-card full-width">
                  <div className="details-card-title">
                    <FaMoneyBillWave />
                    Informations financières
                  </div>
                  <div className="details-card-content">
                    <div className="details-info-row">
                      <span className="details-info-label">Quantité :</span>
                      <span className="details-info-value">{selectedCommandDetails.quantite} unité(s)</span>
                    </div>
                    <div className="details-info-row">
                      <span className="details-info-label">Prix unitaire :</span>
                      <span className="details-info-value">{selectedCommandDetails.produit?.prixVente?.toLocaleString() || 0} Ar</span>
                    </div>
                    <div className="details-info-row">
                      <span className="details-info-label">Montant total :</span>
                      <span className="details-info-value highlight">
                        {((selectedCommandDetails.quantite || 0) * (selectedCommandDetails.produit?.prixVente || 0)).toLocaleString()} Ar
                      </span>
                    </div>
                    <div className="details-info-row">
                      <span className="details-info-label">Type de paiement :</span>
                      <span className="details-info-value">
                        <span className="payment-badge">{getPaymentTypeLabel(selectedCommandDetails.typePaiement)}</span>
                      </span>
                    </div>
                    <div className="details-info-row">
                      <span className="details-info-label"><FaCalendarCheck className="row-col-icon" /> Date d'échéance :</span>
                      <span className="details-info-value">{formatDate(selectedCommandDetails.datePaiement)}</span>
                    </div>
                  </div>
                </div>

                {/* Factures */}
                {selectedCommandDetails.factures && selectedCommandDetails.factures.length > 0 && (
                  <div className="details-card full-width">
                    <div className="details-card-title">
                      <FaFilePdf />
                      Factures
                    </div>
                    <div className="details-card-content">
                      {selectedCommandDetails.factures.map((facture, idx) => (
                        <div key={idx} className="facture-item">
                          <span className="facture-numero">{facture.numero}</span>
                          <span className={`facture-status ${facture.payed ? 'payed' : 'unpaid'}`}>
                            {facture.payed ? 'Payée' : 'Non payée'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="details-modal-footer">
              <button className="pdf-btn-small row-action-btn"
                    onClick={() => generateInvoicePdf(selectedCommandDetails, () => { setErrorMessage('Erreur PDF.'); setShowErrorModal(true); })}
                    title="Facture PDF" disabled={sessionExpired}>
                    <FaFilePdf />
                  </button>
                  <button className="delete-btn row-action-btn"
                    onClick={() => !sessionExpired && setShowDeleteModal(selectedCommandDetails.id)}
                    title="Supprimer" disabled={deleteStatus === 'loading' || sessionExpired}>
                    <FaTrash />
                  </button>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}