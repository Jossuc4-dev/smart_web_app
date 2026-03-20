// src/pages/rh/RHScreen.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import {
  fetchAllUsers,
} from '../../redux/slices/rhSlices';
import {
  selectAllUsers as selectAllUsersSelector,
  selectUsersLoading as selectUsersLoadingSelector,
} from '../../redux/selectors/rh.selector';
import { useAuth } from '../../contexts/AuthContext';

// Icônes
import {
  FaUsers,
  FaMoneyBillWave,
  FaCalendarTimes,
  FaSearch,
  FaTimes,
  FaSyncAlt,
  FaUserPlus,
  FaChevronRight,
  FaUserTie,
  FaUserClock,
  FaBriefcase,
  FaEnvelope,
  FaPhone,
} from 'react-icons/fa';

import './index.css';

type FilterType = 'all' | 'admin' | 'employee';

export default function RHScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const users = useAppSelector(selectAllUsersSelector);
  const loading = useAppSelector(selectUsersLoadingSelector);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [errorAuth, setErrorAuth] = useState(false);

  // Vérification rôle ADMIN
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      setErrorAuth(true);
    }
  }, [user]);

  // Chargement initial des données
  useEffect(() => {
    if (token && !errorAuth) {
      dispatch(fetchAllUsers(token));
    }
  }, [token, dispatch, errorAuth]);

  // Statistiques globales
  const globalStats = useMemo(() => {
    const totalEmployees = users?.length || 0;
    const totalSalary = users?.reduce((sum, u) => sum + (u.profession?.salaire || 0), 0) || 0;
    const onLeave = users?.filter(u =>
      u.conges?.some((c) => new Date(c.dateFin) >= new Date())
    ).length || 0;
    const admins = users?.filter(u => u.role === 'ADMIN').length || 0;

    return { totalEmployees, totalSalary, onLeave, admins };
  }, [users]);

  // Filtrage
  const filteredUsers = useMemo(() => {
    let list = users || [];

    if (filter === 'admin') list = list.filter((u) => u.role === 'ADMIN');
    if (filter === 'employee') list = list.filter((u) => u.role !== 'ADMIN');

    if (search.trim()) {
      const term = search.toLowerCase().trim();
      list = list.filter((u) => 
        u.nom?.toLowerCase().includes(term) ||
        u.profession?.poste?.toLowerCase().includes(term)
      );
    }

    return list;
  }, [users, filter, search]);

  const handleRefresh = () => {
    if (token) dispatch(fetchAllUsers(token));
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getStatusColor = (user: any) => {
    if (user.conges?.some((c: any) => new Date(c.dateFin) >= new Date())) {
      return 'warning';
    }
    return user.role === 'ADMIN' ? 'primary' : 'success';
  };

  if (loading) {
    return (
      <div className="rh-loading">
        <div className="spinner" />
        <p>Chargement de l'équipe...</p>
      </div>
    );
  }

  if (errorAuth) {
    return (
      <div className="rh-unauthorized">
        <FaUsers className="empty-icon" />
        <h2>Accès restreint</h2>
        <p>Cette section est réservée aux administrateurs.</p>
        <button className="btn-primary" onClick={() => navigate('/')}>
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="rh-page">
      {/* Header */}
      <header className="rh-header">
        <div className="header-left">
          <h1>Gestion des Ressources Humaines</h1>
          <p className="header-subtitle">Gérez votre équipe et leurs informations</p>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={handleRefresh} title="Rafraîchir">
            <FaSyncAlt />
          </button>
        </div>
      </header>

      {/* Stats Cards - En ligne */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <FaUsers className="stat-icon" />
          </div>
          <div className="stat-details">
            <span className="stat-value">{globalStats.totalEmployees}</span>
            <span className="stat-label">Collaborateurs</span>
            <span className="stat-trend">+{globalStats.admins} admins</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper success">
            <FaMoneyBillWave className="stat-icon" />
          </div>
          <div className="stat-details">
            <span className="stat-value">
              {globalStats.totalSalary.toLocaleString()} Ar
            </span>
            <span className="stat-label">Masse salariale</span>
            <span className="stat-trend">Mensuelle</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper warning">
            <FaCalendarTimes className="stat-icon" />
          </div>
          <div className="stat-details">
            <span className="stat-value">{globalStats.onLeave}</span>
            <span className="stat-label">En congé</span>
            <span className="stat-trend">
              {((globalStats.onLeave / globalStats.totalEmployees) * 100 || 0).toFixed(1)}% de l'équipe
            </span>
          </div>
        </div>
      </div>

      {/* Barre de contrôle */}
      <div className="controls-bar">
        <div className="search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher par nom, poste ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-btn" onClick={() => setSearch('')}>
              <FaTimes />
            </button>
          )}
        </div>

        <div className="filter-group">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Tous ({users?.length || 0})
          </button>
          <button
            className={`filter-btn ${filter === 'admin' ? 'active' : ''}`}
            onClick={() => setFilter('admin')}
          >
            Admins ({globalStats.admins})
          </button>
          <button
            className={`filter-btn ${filter === 'employee' ? 'active' : ''}`}
            onClick={() => setFilter('employee')}
          >
            Employés ({(users?.length || 0) - globalStats.admins})
          </button>
        </div>
      </div>

      {/* Résultats */}
      <div className="results-info">
        <span>{filteredUsers.length} collaborateur(s) trouvé(s)</span>
      </div>

      {/* Grille des employés */}
      {filteredUsers.length === 0 ? (
        <div className="empty-state">
          <FaSearch className="empty-icon" />
          <h3>Aucun résultat</h3>
          <p>Aucun collaborateur ne correspond à votre recherche</p>
          {(search || filter !== 'all') && (
            <button 
              className="btn-primary" 
              onClick={() => {
                setSearch('');
                setFilter('all');
              }}
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="staff-grid">
          {filteredUsers.map((emp) => (
            <div
              key={emp.id}
              className={`staff-card status-${getStatusColor(emp)}`}
              onClick={() => navigate(`/rh/${emp.id}`)}
            >
              <div className="staff-card-header">
                <div className="staff-avatar">
                  {getInitials(emp.nom || '')}
                </div>
                <div className="staff-badges">
                  {emp.role === 'ADMIN' && (
                    <span className="badge badge-admin">
                      <FaUserTie /> Admin
                    </span>
                  )}
                  {emp.conges?.some((c: any) => new Date(c.dateFin) >= new Date()) && (
                    <span className="badge badge-conge">
                      <FaUserClock /> Congé
                    </span>
                  )}
                </div>
              </div>

              <div className="staff-card-body">
                <h3 className="staff-name">{emp.nom || 'Nom non renseigné'}</h3>
                
                <div className="staff-info-item">
                  <FaBriefcase className="info-icon" />
                  <div>
                    <span className="info-label">Poste</span>
                    <p className="info-value">{emp.profession?.poste || 'Non défini'}</p>
                  </div>
                </div>
              </div>

              <div className="staff-card-footer">
                <div className="salary-info">
                  <FaMoneyBillWave className="salary-icon" />
                  <span className="salary-value">
                    {emp.profession?.salaire?.toLocaleString() || '0'} Ar
                  </span>
                  <span className="salary-period">/mois</span>
                </div>
                <FaChevronRight className="chevron-icon" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB pour ajouter */}
      <button className="fab-add" onClick={() => navigate('/rh/add')}>
        <FaUserPlus />
      </button>
    </div>
  );
}