// src/pages/rh/RHScreen.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { fetchAllUsers } from '../../redux/slices/rhSlices';
import {
  selectAllUsers as selectAllUsersSelector,
  selectUsersLoading as selectUsersLoadingSelector,
} from '../../redux/selectors/rh.selector';
import { useAuth } from '../../contexts/AuthContext';

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
} from 'react-icons/fa';

import './index.css';
import BASE_URL from '../../config/ApiConfig';

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
  const [totalProfessions, setTotalProfessions] = useState<number>(0);

  useEffect(() => {
    if (user?.role !== 'ADMIN') setErrorAuth(true);
  }, [user]);

  useEffect(() => {
    if (token && !errorAuth) {
      dispatch(fetchAllUsers(token));
    }
  }, [token, dispatch, errorAuth]);

  // ✅ Récupération du nombre de postes via GET /rh/profession
  useEffect(() => {
    if (token && !errorAuth) {
      fetch(`${BASE_URL}/rh/profession`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data: unknown[]) => {
          if (Array.isArray(data)) setTotalProfessions(data.length);
        })
        .catch(() => setTotalProfessions(0));
    }
  }, [token, errorAuth]);

  const globalStats = useMemo(() => {
    const totalEmployees = users?.length || 0;
    const totalSalary = users?.reduce((sum, u) => sum + (u.profession?.salaire || 0), 0) || 0;
    const onLeave =
      users?.filter(u => u.conges?.some((c) => new Date(c.dateFin) >= new Date())).length || 0;
    const admins = users?.filter(u => u.role === 'ADMIN').length || 0;
    return { totalEmployees, totalSalary, onLeave, admins };
  }, [users]);

  const filteredUsers = useMemo(() => {
    let list = users || [];
    if (filter === 'admin') list = list.filter((u) => u.role === 'ADMIN');
    if (filter === 'employee') list = list.filter((u) => u.role !== 'ADMIN');
    if (search.trim()) {
      const term = search.toLowerCase().trim();
      list = list.filter(
        (u) =>
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
    if (user.conges?.some((c: any) => new Date(c.dateFin) >= new Date())) return 'warning';
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
      <header className="rh-header">
        <div className="header-left">
          <p className="header-subtitle">Gérez votre équipe et leurs informations</p>
        </div>
        <div className="header-actions">
          <button className="btn-refresh" onClick={handleRefresh} title="Rafraîchir">
            <FaSyncAlt />
          </button>
        </div>
      </header>

      {/* Stats Cards — 4 colonnes */}
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
            <span className="stat-value">{globalStats.totalSalary.toLocaleString()} Ar</span>
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
              {((globalStats.onLeave / globalStats.totalEmployees) * 100 || 0).toFixed(1)}% de
              l'équipe
            </span>
          </div>
        </div>

        {/* ✅ Card Postes — cliquable → /rh/professions */}
        <div
          className="stat-card stat-card--clickable"
          onClick={() => navigate('/rh/profession')}
          title="Gérer les postes"
        >
          <div className="stat-icon-wrapper accent">
            <FaBriefcase className="stat-icon" />
          </div>
          <div className="stat-details">
            <span className="stat-value">{totalProfessions}</span>
            <span className="stat-label">Postes</span>
            <span className="stat-trend">Dans l'entreprise</span>
          </div>
          <FaChevronRight className="stat-card-chevron" />
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

      <div className="results-info">
        <span>{filteredUsers.length} collaborateur(s) trouvé(s)</span>
      </div>

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
                <div className="staff-avatar">{getInitials(emp.nom || '')}</div>
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

      <button className="fab-add" onClick={() => navigate('/rh/add')}>
        <FaUserPlus />
      </button>
    </div>
  );
}