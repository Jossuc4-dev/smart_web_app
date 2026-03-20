// src/pages/Wallet.tsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  FaWallet,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaEyeSlash,
  FaHistory,
  FaCheckCircle,
  FaExclamationCircle,
  FaChartLine,
  FaChartPie,
  FaExchangeAlt,
} from 'react-icons/fa';

// Imports depuis compte slice (le nouveau slice dédié)
import {
  fetchCompte,
  deposit,
  withdraw,
  // fetchEvolutionSoldeParJour,   // si tu l'as implémenté côté backend + slice
} from '../../redux/slices/compteFinanceSlice';

import {
  selectSoldeActuel,
  selectCompteLoading,
  selectCompteError,
  selectTotalDepots,
  selectTotalRetraits,
} from '../../redux/selectors/compte.selector';

import {
  selectTransactions,
  selectTransactionsByDate,
} from '../../redux/selectors/finance.selector';

import './wallet.css';
import { useAuth } from '../../contexts/AuthContext';
import type { Compte } from '../../models';

const COLORS = ['#4CAF50', '#2196F3', '#FF9800', '#E91E63', '#9C27B0'];

const Wallet: React.FC = () => {
  const dispatch = useDispatch();
  const { logout } = useAuth()

  // Sélecteurs compte (solde, loading, error, totaux)
  const [solde, setSolde] = useState(0)
  const loading = useSelector(selectCompteLoading);
  const error = useSelector(selectCompteError);
  const totalDepots = useSelector(selectTotalDepots);
  const totalRetraits = useSelector(selectTotalRetraits);

  // Transactions (de finance slice)
  const allTransactions = useSelector(selectTransactions);

  const [activeTab, setActiveTab] = useState<'depot' | 'retrait'>('depot');
  const [montant, setMontant] = useState<string>('');
  const [motif, setMotif] = useState<string>('');
  const [showSolde, setShowSolde] = useState<boolean>(true);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showChart, setShowChart] = useState<'line' | 'pie'>('line');

  useEffect(() => {
    fetchAccount()
    // Si tu as implémenté l'évolution solde par jour :
    // dispatch(fetchEvolutionSoldeParJour());
  }, [dispatch]);

  const fetchAccount = async () => {
    const account = await dispatch(fetchCompte() as any).unwrap() as {success:boolean,data:Compte,message?:string};
    console.log({ account })
    if(!account.success){
      alert("Session expirée")
      logout()
    }else{
      setSolde(account.data.montant)
    }
  }

  const handleDepot = async () => {
    const value = parseFloat(montant);
    if (isNaN(value) || value <= 0) return;

    try {
      const resp = await dispatch(deposit({ montant: value, motif }) as any).unwrap();

      if (!resp.success && resp.message.includes('expiré')) {
        setSuccessMessage(`Token expiré`);
        logout()
      }
      setSuccessMessage(`Dépôt de ${formatCurrency(value)} effectué avec succès`);
      setMontant('');
      setMotif('');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      console.error('Erreur dépôt:', err);
    }
  };

  const handleRetrait = async () => {
    const value = parseFloat(montant);
    console.log(solde)
    if (isNaN(value) || value <= 0) return;
    if (value > solde) {
      alert('Solde insuffisant pour effectuer ce retrait');
      return;
    }

    try {
      await dispatch(withdraw({ montant: value, type: 'retrait' }) as any).unwrap();
      setSuccessMessage(`Retrait de ${formatCurrency(value)} effectué avec succès`);
      setMontant('');
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err: any) {
      console.error('Erreur retrait:', err);
    }
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('fr-MG', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(value)
      .replace('MGA', 'Ar');
  };

  // Données pour le graphique linéaire (évolution solde)
  // → À adapter selon ce que tu renvoies vraiment dans l'historique ou via une nouvelle route
  const getLineChartData = () => {
    // Pour l'instant on simule à partir des transactions (à remplacer par vraie donnée)
    const sorted = [...(allTransactions || [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let currentSolde = solde - totalDepots + totalRetraits; // approximation de départ

    return sorted.map((t) => {
      if (t.type === 'depot') currentSolde += t.quantite * t.prixUnitaire || 0;
      if (t.type === 'retrait') currentSolde -= t.quantite * t.prixUnitaire || 0;

      return {
        date: new Date(t.date).toLocaleDateString('fr-FR', {
          day: '2-digit',
          month: 'short',
        }),
        solde: currentSolde,
      };
    });
  };

  // Données pour le camembert (répartition approximative)
  const getPieData = () => {
    const depots = totalDepots;
    const retraitsAbs = Math.abs(totalRetraits);
    const reste = Math.max(0, solde - depots + retraitsAbs);

    return [
      { name: 'Dépôts cumulés', value: depots, color: COLORS[0] },
      { name: 'Retraits cumulés', value: retraitsAbs, color: COLORS[3] },
      { name: 'Solde disponible', value: reste, color: COLORS[1] },
    ].filter((item) => item.value > 0);
  };

  return (
    <div className="wallet-container">
      {/* Header */}
      <div className="wallet-header">
        <div>
          <h1>
            <FaWallet className="icon" /> Portefeuille
          </h1>
          <p>Gérez vos fonds et suivez vos mouvements</p>
        </div>
      </div>

      {/* Carte Solde */}
      <div className="solde-card">
        <div className="solde-content">
          <div>
            <span className="solde-label">Solde actuel</span>
            <div className="solde-value">
              <h2>{showSolde ? formatCurrency(solde) : '•••••••'}</h2>
              <button className="toggle-visibility" onClick={() => setShowSolde(!showSolde)}>
                {showSolde ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="solde-actions">
            <button
              className={`action-btn ${activeTab === 'depot' ? 'active' : ''}`}
              onClick={() => setActiveTab('depot')}
            >
              <FaArrowUp /> Dépôt
            </button>
            <button
              className={`action-btn ${activeTab === 'retrait' ? 'active' : ''}`}
              onClick={() => setActiveTab('retrait')}
            >
              <FaArrowDown /> Retrait
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="alert error">
          <FaExclamationCircle />
          <span>{error}</span>
        </div>
      )}
      {successMessage && (
        <div className="alert success">
          <FaCheckCircle />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Statistiques rapides */}
      <div className="stats-grid">
        <div className="stat-card">
          <FaWallet className="stat-icon" />
          <div>
            <span className="stat-label">Solde</span>
            <span className="stat-value">{formatCurrency(solde)}</span>
          </div>
        </div>
        <div className="stat-card">
          <FaArrowUp className="stat-icon" style={{ color: '#4CAF50' }} />
          <div>
            <span className="stat-label">Dépôts</span>
            <span className="stat-value">{formatCurrency(totalDepots)}</span>
          </div>
        </div>
        <div className="stat-card">
          <FaArrowDown className="stat-icon" style={{ color: '#f44336' }} />
          <div>
            <span className="stat-label">Retraits</span>
            <span className="stat-value">{formatCurrency(totalRetraits)}</span>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="chart-section">
        <div className="chart-header">
          <h3>
            {showChart === 'line' ? <FaChartLine /> : <FaChartPie />}
            {showChart === 'line' ? 'Évolution du solde' : 'Répartition des fonds'}
          </h3>
          <div className="chart-toggle">
            <button className={showChart === 'line' ? 'active' : ''} onClick={() => setShowChart('line')}>
              <FaChartLine />
            </button>
            <button className={showChart === 'pie' ? 'active' : ''} onClick={() => setShowChart('pie')}>
              <FaChartPie />
            </button>
          </div>
        </div>

        <div className="chart-container">
          {showChart === 'line' ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={getLineChartData()}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.6} />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                <Tooltip
                  formatter={(value: any) => {
                    if (typeof value !== 'number') return value; // sécurité
                    return formatCurrency(value);
                  }}
                />
                <Line type="monotone" dataKey="solde" stroke="#4CAF50" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={getPieData()}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent! * 100).toFixed(0)}%`}
                >
                  {getPieData().map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => {
                    if (typeof value !== 'number') return value; // sécurité
                    return formatCurrency(value);
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Formulaire */}
      <div className="transaction-card">
        <div className="transaction-tabs">
          <button className={`tab ${activeTab === 'depot' ? 'active' : ''}`} onClick={() => setActiveTab('depot')}>
            <FaArrowUp /> Dépôt
          </button>
          <button className={`tab ${activeTab === 'retrait' ? 'active' : ''}`} onClick={() => setActiveTab('retrait')}>
            <FaArrowDown /> Retrait
          </button>
        </div>

        <div className="transaction-form">
          {activeTab === 'retrait' && (
            <div className="solde-info">Solde disponible : {formatCurrency(solde)}</div>
          )}

          <div className="form-group">
            <label>Montant (Ar)</label>
            <input
              type="number"
              className="montant-input"
              value={montant}
              onChange={(e) => setMontant(e.target.value.replace(/[^0-9]/g, ''))}
              placeholder="Saisissez le montant"
              disabled={loading}
              min="0"
              step="1000"
            />
          </div>

          <div className="form-group">
            <label>Motif</label>
            <input
              type="text"
              className="motif-input"
              value={motif}
              onChange={(e) => setMotif(e.target.value)}
              placeholder="Saisissez le motif"
              disabled={loading}
              min="0"
              step="1000"
            />
          </div>

          <button
            className={`submit-btn ${activeTab}`}
            onClick={activeTab === 'depot' ? handleDepot : handleRetrait}
            disabled={loading || !montant || parseFloat(montant) <= 0}
          >
            {loading ? (
              'Traitement...'
            ) : (
              <>
                <FaExchangeAlt />
                {activeTab === 'depot' ? ' Effectuer le dépôt' : ' Effectuer le retrait'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Historique (simplifié ici – à enrichir selon tes besoins) */}
      <div className="historique-section">
        <h3>
          <FaHistory /> Dernières transactions
        </h3>
        <div className="historique-list">
          {(allTransactions || []).slice(0, 6).map((item, index) => (
            <div key={index} className="historique-item">
              <div className="historique-info">
                <span className="historique-date">
                  {new Date(item.date).toLocaleDateString('fr-FR')}
                </span>
                <span className="historique-type">
                  {item.type === 'depot' ? (
                    <>
                      <FaArrowUp style={{ color: '#4CAF50' }} /> Dépôt
                    </>
                  ) : item.type === 'retrait' ? (
                    <>
                      <FaArrowDown style={{ color: '#f44336' }} /> Retrait
                    </>
                  ) : (
                    item.type
                  )}
                </span>
              </div>
              <div className="historique-montant">
                <span className={item.type === 'depot' ? 'positif' : 'negatif'}>
                  {item.type === 'depot' ? '+' : '-'}
                  {formatCurrency(item.quantite * item.prixUnitaire || 0)}
                </span>
              </div>
            </div>
          ))}

          {(!allTransactions || allTransactions.length === 0) && (
            <div className="no-data">Aucune transaction récente</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Wallet;