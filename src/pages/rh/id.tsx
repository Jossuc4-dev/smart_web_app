// src/pages/rh/[id].tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FaArrowLeft,
  FaEdit,
  FaEnvelope,
  FaMoneyBillWave,
  FaBriefcase,
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaExclamationTriangle,
  FaHistory,
  FaChevronLeft,
  FaChevronRight,
  FaUser,
  FaIdCard,
  FaBuilding,
  FaCreditCard,
  FaCashRegister,
  FaTruckMoving
} from 'react-icons/fa';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './id.css';
import BASE_URL from '../../config/ApiConfig';

interface UserDetail {
  id: number;
  nom: string;
  email: string;
  role: string;
  profession: {
    poste: string;
  };
  salaire: number;
  activities: Array<{
    id: number;
    date: string;
    action: {
      type: string;
      data?: any;
    };
  }>;
  boolcnaps: boolean;
  numeroCnaps?: string;
  cnaps?: Array<any>;
  cin: string;
  sexe: 'HOMME' | 'FEMME';
  situation: 'CELIBATAIRE' | 'MARIE';
  dateEmbauche: string;
  enfants: number;
}

interface Conge {
  id: number;
  dateDebut: string;
  dateFin: string;
  valide: boolean;
}

interface CnapsData {
  number: string;
  status: 'payé' | 'non payé';
  montantDu: number;
  historique?: Array<{
    date: string;
    montant: number;
    statut: string;
  }>;
}

export default function UserDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [utilisateur, setUtilisateur] = useState<UserDetail | null>(null);
  const [activites, setActivites] = useState<any[]>([]);
  const [conges, setConges] = useState<Conge[]>([]);
  const [cnapsData, setCnapsData] = useState<CnapsData | null>(null);
  const [markedDates, setMarkedDates] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'conges' | 'activite' | 'cnaps'>('info');
  
  // Pagination activités
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const calculateDaysBetween = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const loadUser = async (isRefresh = false) => {
    if (!isRefresh) setLoading(true);
    else setRefreshing(true);

    try {
      // Chargement du profil employé
      const response = await fetch(`${BASE_URL}/rh/staff/id/${id}`, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error("Impossible de charger l'employé");
      const data: UserDetail = await response.json();
      setUtilisateur(data);

      // Traitement des activités
      const parsed = data.activities.map((act) => ({
        ...act,
        action: typeof act.action === "string" ? JSON.parse(act.action) : act.action,
      }));
      const sorted = parsed.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setActivites(sorted);

      // Chargement des congés
      const congeResponse = await fetch(`${BASE_URL}/rh/conge/personnel/${id}`, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      let congesList: Conge[] = [];
      let marked = new Set<string>();

      if (congeResponse.ok) {
        const congeData = await congeResponse.json();
        if (congeData.success && congeData.data?.conges) {
          congesList = congeData.data.conges;
          setConges(congesList);

          // Marquage des dates pour les congés VALIDÉS
          congesList.forEach((conge: Conge) => {
            if (conge.valide === true) {
              let current = new Date(conge.dateDebut);
              const end = new Date(conge.dateFin);

              while (current <= end) {
                const dateStr = current.toISOString().split("T")[0];
                marked.add(dateStr);
                current.setDate(current.getDate() + 1);
              }
            }
          });
        }
      }

      // Chargement des données CNAPS
      const cnapsResponse = await fetch(`${BASE_URL}/rh/cnaps/personnel/${id}`, {
        method: "GET",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (cnapsResponse.ok) {
        const cnaps = await cnapsResponse.json();
        setCnapsData({
          number: cnaps.number || 'N/A',
          status: cnaps.status || 'non payé',
          montantDu: cnaps.montantDu || 0,
          historique: cnaps.historique || [],
        });
      }

      setMarkedDates(marked);
      setCurrentPage(1);
    } catch (err) {
      console.error("Erreur chargement:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (id && token) loadUser();
  }, [id, token]);

  const handleRefresh = () => loadUser(true);

  const payerCnaps = async () => {
    if (!cnapsData) return;

    try {
      const response = await fetch(`${BASE_URL}/rh/cnaps/payer/${id}`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        alert('Paiement CNAPS effectué avec succès.');
        loadUser(true);
      } else {
        throw new Error('Échec du paiement');
      }
    } catch (err) {
      alert('Impossible d\'effectuer le paiement CNAPS.');
      console.error(err);
    }
  };

  // Calcul des congés
  const congesPris = conges
    .filter((c) => c.valide === true)
    .reduce((acc, c) => acc + calculateDaysBetween(c.dateDebut, c.dateFin), 0);

  const soldeAnnuel = 30;
  const congesRestants = soldeAnnuel - congesPris;

  if (loading) {
    return (
      <div className="user-loading-container">
        <div className="loading-spinner"></div>
        <p>Chargement du profil...</p>
      </div>
    );
  }

  if (!utilisateur) {
    return (
      <div className="user-error-container">
        <FaExclamationTriangle size={48} />
        <h2>Employé non trouvé</h2>
        <button onClick={() => navigate('/rh')} className="back-to-list">
          Retour à la liste
        </button>
      </div>
    );
  }

  const initials = utilisateur.nom
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const totalPages = Math.ceil(activites.length / itemsPerPage);
  const paginatedActivities = activites.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div className="user-detail-container">
      {/* Header */}
      <header className="user-header">
        <button className="back-button" onClick={() => navigate('/rh')}>
          <FaArrowLeft />
          Retour
        </button>

        <div className="header-actions">
          <button className="refresh-button" onClick={handleRefresh} disabled={refreshing}>
            <span className={refreshing ? 'spinning' : ''}>↻</span>
            Actualiser
          </button>
          <button className="edit-button" onClick={() => navigate(`/rh/update/${id}`)}>
            <FaEdit />
            Modifier
          </button>
        </div>
      </header>

      {/* Profil Card */}
      <div className="profile-card">
        <div className="profile-cover">
          <div className="profile-avatar">
            <span className="avatar-text">{initials}</span>
          </div>
          <h1 className="profile-name">{utilisateur.nom}</h1>
          <p className="profile-role">{utilisateur.profession.poste}</p>
        </div>

        <div className="profile-stats">
          <div className="stat-item">
            <FaEnvelope className="stat-icon" />
            <span className="stat-label">Email</span>
            <span className="stat-value">{utilisateur.email}</span>
          </div>
          <div className="stat-item">
            <FaMoneyBillWave className="stat-icon" />
            <span className="stat-label">Salaire</span>
            <span className="stat-value">{utilisateur.salaire.toLocaleString()} Ar</span>
          </div>
          <div className="stat-item">
            <FaCalendarAlt className="stat-icon" />
            <span className="stat-label">Embauche</span>
            <span className="stat-value">{formatDate(utilisateur.dateEmbauche)}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        <button
          className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
          onClick={() => setActiveTab('info')}
        >
          <FaUser />
          Informations
        </button>
        <button
          className={`tab-button ${activeTab === 'conges' ? 'active' : ''}`}
          onClick={() => setActiveTab('conges')}
        >
          <FaCalendarAlt />
          Congés
        </button>
        <button
          className={`tab-button ${activeTab === 'activite' ? 'active' : ''}`}
          onClick={() => setActiveTab('activite')}
        >
          <FaHistory />
          Activité
        </button>
        {utilisateur.boolcnaps && (
          <button
            className={`tab-button ${activeTab === 'cnaps' ? 'active' : ''}`}
            onClick={() => setActiveTab('cnaps')}
          >
            <FaBuilding />
            CNAPS
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Informations personnelles */}
        {activeTab === 'info' && (
          <div className="info-tab">
            <div className="info-grid">
              <div className="info-card">
                <h3>
                  <FaIdCard className="card-icon" />
                  Identité
                </h3>
                <div className="info-row">
                  <span className="info-label">CIN</span>
                  <span className="info-value">{utilisateur.cin}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Sexe</span>
                  <span className="info-value">
                    {utilisateur.sexe === 'HOMME' ? 'Homme' : 'Femme'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Situation</span>
                  <span className="info-value">
                    {utilisateur.situation === 'MARIE' ? 'Marié(e)' : 'Célibataire'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Enfants</span>
                  <span className="info-value">{utilisateur.enfants}</span>
                </div>
              </div>

              <div className="info-card">
                <h3>
                  <FaBriefcase className="card-icon" />
                  Professionnel
                </h3>
                <div className="info-row">
                  <span className="info-label">Poste</span>
                  <span className="info-value">{utilisateur.profession.poste}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Salaire</span>
                  <span className="info-value salary">
                    {utilisateur.salaire.toLocaleString()} Ar
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Date d'embauche</span>
                  <span className="info-value">{formatDate(utilisateur.dateEmbauche)}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Rôle</span>
                  <span className="info-value role-badge">
                    {utilisateur.role}
                  </span>
                </div>
              </div>

              <div className="info-card full-width">
                <h3>
                  <FaHistory className="card-icon" />
                  Statistiques
                </h3>
                <div className="stats-grid">
                  <div className="stat-box">
                    <span className="stat-box-value">{activites.length}</span>
                    <span className="stat-box-label">Activités</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-box-value">{conges.length}</span>
                    <span className="stat-box-label">Congés</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-box-value">{congesPris}</span>
                    <span className="stat-box-label">Jours pris</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-box-value">{congesRestants}</span>
                    <span className="stat-box-label">Jours restants</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Congés */}
        {activeTab === 'conges' && (
          <div className="conges-tab">
            <div className="conges-stats">
              <div className="conge-stat-card">
                <span className="conge-stat-label">Congés pris</span>
                <span className="conge-stat-value">{congesPris} jours</span>
              </div>
              <div className="conge-stat-card">
                <span className="conge-stat-label">Congés restants</span>
                <span className="conge-stat-value">{congesRestants} jours</span>
              </div>
            </div>

            <div className="calendar-section">
              <h3>Calendrier des congés validés</h3>
              <Calendar
                tileClassName={({ date }:{date:Date}) => {
                  const dateStr = date.toISOString().split('T')[0];
                  return markedDates.has(dateStr) ? 'conge-day' : '';
                }}
                locale="fr-FR"
              />
              <div className="calendar-legend">
                <div className="legend-item">
                  <span className="legend-dot conge"></span>
                  <span>Congé validé</span>
                </div>
              </div>
            </div>

            <div className="conges-list">
              <h3>Historique des congés</h3>
              {conges.length === 0 ? (
                <p className="empty-message">Aucun congé enregistré</p>
              ) : (
                conges.map((conge) => (
                  <div key={conge.id} className="conge-item">
                    <div className="conge-dates">
                      <span className="conge-date">{formatDate(conge.dateDebut)}</span>
                      <span className="conge-separator">→</span>
                      <span className="conge-date">{formatDate(conge.dateFin)}</span>
                    </div>
                    <div className="conge-duration">
                      {calculateDaysBetween(conge.dateDebut, conge.dateFin)} jours
                    </div>
                    <div className="conge-status">
                      {conge.valide ? (
                        <span className="status-badge success">
                          <FaCheckCircle /> Validé
                        </span>
                      ) : (
                        <span className="status-badge warning">
                          <FaTimesCircle /> En attente
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Activité récente */}
        {activeTab === 'activite' && (
          <div className="activite-tab">
            <h3>Activité récente ({activites.length})</h3>

            {activites.length === 0 ? (
              <div className="empty-state">
                <FaHistory size={48} />
                <p>Aucune activité récente</p>
              </div>
            ) : (
              <>
                <div className="activity-list">
                  {paginatedActivities.map((act) => {
                    const actionType = act.action.type || "Action inconnue";
                    const actionData = act.action.data
                      ? typeof act.action.data === "object"
                        ? JSON.stringify(act.action.data)
                        : act.action.data
                      : "";

                    return (
                      <div key={act.id} className="activity-card">
                        <div className="activity-icon">
                            {actionType.includes("vente") || actionType.includes("Facturation") && <FaCashRegister size={24} color="#ca8f21" />}
                            {actionType.includes("Approvisionnement") && <FaTruckMoving size={24} color="#ca8f21" />}
                            {actionType.includes("congé") && <FaCalendarAlt size={24} color="#ca8f21" />}
                            {(actionType.includes("Validation") || actionType.includes("Annulation")) && <FaCheckCircle size={24} color="#ca8f21" />}
                            {!actionType.includes("vente") && !actionType.includes("Facturation") && !actionType.includes("Approvisionnement") && !actionType.includes("congé") && !actionType.includes("Validation") && !actionType.includes("Annulation") && (
                              <FaHistory size={24} color="#ca8f21" />
                            )}
                        </div>

                        <div className="activity-content">
                          <span className="activity-title">{actionType}</span>
                          {actionData && (
                            <span className="activity-detail">{actionData}</span>
                          )}
                        </div>

                        <span className="activity-date">
                          {new Date(act.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="page-btn"
                    >
                      <FaChevronLeft />
                    </button>

                    <span className="page-info">
                      Page {currentPage} / {totalPages}
                    </span>

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="page-btn"
                    >
                      <FaChevronRight />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* CNAPS */}
        {activeTab === 'cnaps' && utilisateur.boolcnaps && (
          <div className="cnaps-tab">
            <div className="cnaps-card">
              <div className="cnaps-header">
                <img 
                  src="https://www.cnaps.mg/wp-content/uploads/2020/07/Logo-CNAPS_.png" 
                  alt="CNAPS Logo" 
                  className="cnaps-logo"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <h3>Affiliation CNAPS</h3>
              </div>

              <div className="cnaps-info">
                <div className="info-row">
                  <span className="info-label">Numéro CNAPS</span>
                  <span className="info-value">{utilisateur.numeroCnaps || 'N/A'}</span>
                </div>

                {utilisateur.cnaps && utilisateur.cnaps.length > 0 && (
                  <div className="info-row">
                    <span className="info-label">Statut paiement</span>
                    <span className={`info-value status-badge ${cnapsData?.status === 'payé' ? 'success' : 'warning'}`}>
                      {cnapsData?.status?.toUpperCase() || 'N/A'}
                    </span>
                  </div>
                )}
              </div>

              {cnapsData?.status === 'non payé' && cnapsData?.montantDu > 0 && (
                <div className="cnaps-payment">
                  <div className="payment-amount">
                    <span>Montant dû</span>
                    <strong>{cnapsData.montantDu.toLocaleString()} Ar</strong>
                  </div>
                  <button className="pay-button" onClick={payerCnaps}>
                    <FaCreditCard />
                    Payer maintenant
                  </button>
                </div>
              )}

              {cnapsData?.historique && cnapsData.historique.length > 0 && (
                <div className="cnaps-historique">
                  <h4>Historique des paiements</h4>
                  <div className="historique-list">
                    {cnapsData.historique.map((item, index) => (
                      <div key={index} className="historique-item">
                        <span className="historique-date">{formatDate(item.date)}</span>
                        <span className="historique-montant">{item.montant.toLocaleString()} Ar</span>
                        <span className={`historique-statut ${item.statut}`}>{item.statut}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}