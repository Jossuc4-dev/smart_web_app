// src/pages/finance/index.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import {
  fetchCompteResultat,
  fetchBilanComptable,
  fetchGeneral,
  fetchAllTransactions,
} from '../../redux/slices/financeSlice';
import {
  selectCompteResultat,
  selectBilanComptable,
  selectTransactions,
  selectFinanceLoading,
  selectFinanceError,
} from '../../redux/selectors/finance.selector';
import {
  selectCompteLoading,
  selectCompteError,
  selectTotalDepots,
  selectTotalRetraits,
} from '../../redux/selectors/compte.selector';
import {
  fetchCompte,
  deposit,
  withdraw,
} from '../../redux/slices/compteFinanceSlice';
import { useAuth } from '../../contexts/AuthContext';
import { generateResultatPDF } from '../../pdf/pdfResultat';
import { generateBilanPDF } from '../../pdf/pdfBilan';
import { generateTransactionsPDF } from '../../pdf/pdfTransactions';
import { generateWalletPDF } from '../../pdf/pdfWallet';
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
  FaWallet,
} from 'react-icons/fa';

import './index.css';
import type { Compte } from '../../models';
import { formatAr } from '../../utils/formatCurrency';

type SectionType = 'RESULTAT' | 'BILAN' | 'TRANSACTIONS' | 'WALLET';
type BilanSubType = 'ACTIF' | 'PASSIF';

const TRANSACTIONS_PER_PAGE = 4;
const WALLET_COLORS = ['#1B8A5A', '#E05A5A', '#2E86AB', '#FF9800', '#9C27B0'];

export default function FinanceScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();

  // Finance selectors
  const compteResultat = useAppSelector(selectCompteResultat);
  const bilanComptable = useAppSelector(selectBilanComptable);
  const transactions = useAppSelector(selectTransactions) || [];
  const loading = useAppSelector(selectFinanceLoading);
  const error = useAppSelector(selectFinanceError);

  // Compte / Wallet selectors
  const compteLoading = useAppSelector(selectCompteLoading);
  const compteError = useAppSelector(selectCompteError);
  const totalDepots = useAppSelector(selectTotalDepots);
  const totalRetraits = useAppSelector(selectTotalRetraits);

  // Shared state
  const [sectionActive, setSectionActive] = useState<SectionType>('RESULTAT');
  const [bilanSubActive, setBilanSubActive] = useState<BilanSubType>('ACTIF');
  const [errorAuthorization, setErrorAuthorization] = useState(false);
  const [currentTxPage, setCurrentTxPage] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [solde, setSolde] = useState(0);

  // Wallet-specific state
  const [walletTab, setWalletTab] = useState<'depot' | 'retrait'>('depot');
  const [montant, setMontant] = useState<string>('');
  const [motif, setMotif] = useState<string>('');
  const [showSolde, setShowSolde] = useState<boolean>(true);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showChart, setShowChart] = useState<'line' | 'pie'>('line');

  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      setErrorAuthorization(true);
    }
  }, [user]);

  useEffect(() => {
    if (token && !errorAuthorization) {
      dispatch(fetchCompteResultat(token));
      dispatch(fetchBilanComptable(token));
      dispatch(fetchGeneral(token));
      dispatch(fetchAllTransactions(token));
    }
  }, [token, dispatch, errorAuthorization]);

  const fetchAccount = async () => {
    const account = await dispatch(fetchCompte() as any).unwrap() as {
      success: boolean;
      data: Compte;
      message?: string;
    };
    if (!account.success) {
      alert('Session expirée');
      logout();
    } else {
      setSolde(account.data.montant);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, [dispatch]);

  // ── Pagination transactions ──
  const paginatedTransactions = transactions.slice(
    (currentTxPage - 1) * TRANSACTIONS_PER_PAGE,
    currentTxPage * TRANSACTIONS_PER_PAGE
  );
  const totalTxPages = Math.ceil(transactions.length / TRANSACTIONS_PER_PAGE);

  // ── PDF export ──
  const handleDownloadPdf = async () => {
    setPdfLoading(true);
    try {
      switch (sectionActive) {
        case 'RESULTAT':
          if (compteResultat) generateResultatPDF(compteResultat);
          break;
        case 'BILAN':
          if (bilanComptable) generateBilanPDF(bilanComptable);
          break;
        case 'TRANSACTIONS':
          generateTransactionsPDF(transactions);
          break;
        case 'WALLET':
          generateWalletPDF({ solde, totalDepots, totalRetraits, transactions });
          break;
      }
    } finally {
      setTimeout(() => setPdfLoading(false), 600);
    }
  };

  // ── Wallet helpers ──
  const formatCurrency = (value: number): string =>
    new Intl.NumberFormat('fr-MG', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(value)
      .replace('MGA', 'Ar');

  const handleDepot = async () => {
    const value = parseFloat(montant);
    if (isNaN(value) || value <= 0) return;
    try {
      const resp = await dispatch(deposit({ montant: value, motif }) as any).unwrap();
      if (!resp.success && resp.message?.includes('expiré')) {
        logout();
        return;
      }
      setSuccessMessage(`Dépôt de ${formatAr(value)} effectué avec succès`);
      setMontant('');
      setMotif('');
      fetchAccount();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Erreur dépôt:', err);
    }
  };

  const handleRetrait = async () => {
    const value = parseFloat(montant);
    if (isNaN(value) || value <= 0) return;
    if (value > solde) {
      alert('Solde insuffisant pour effectuer ce retrait');
      return;
    }
    try {
      await dispatch(withdraw({ montant: value, type: 'retrait', motif }) as any).unwrap();
      setSuccessMessage(`Retrait de ${formatCurrency(value)} effectué avec succès`);
      setMontant('');
      fetchAccount();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Erreur retrait:', err);
    }
  };

  const getLineChartData = () => {
    const sorted = [...(transactions || [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    let currentSolde = solde - totalDepots + totalRetraits;
    return sorted.map((t) => {
      if (t.type === 'depot') currentSolde += t.quantite * t.prixUnitaire || 0;
      if (t.type === 'retrait') currentSolde -= t.quantite * t.prixUnitaire || 0;
      return {
        date: new Date(t.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        solde: currentSolde,
      };
    });
  };

  const getPieData = () => {
    const depots = totalDepots;
    const retraitsAbs = Math.abs(totalRetraits);
    const reste = Math.max(0, solde - depots + retraitsAbs);
    return [
      { name: 'Dépôts cumulés', value: depots, color: WALLET_COLORS[0] },
      { name: 'Retraits cumulés', value: retraitsAbs, color: WALLET_COLORS[1] },
      { name: 'Solde disponible', value: reste, color: WALLET_COLORS[2] },
    ].filter((item) => item.value > 0);
  };

  // ── Données aperçu ──
  const ca = compteResultat?.chiffreAffaires ?? 0;
  const resultatNet = compteResultat?.resultatNet ?? 0;

  if (loading) {
    return (
      <div className="fi-loading">
        <div className="fi-spinner" />
        <p>Chargement des finances…</p>
      </div>
    );
  }

  if (errorAuthorization) {
    return (
      <div className="fi-unauthorized">
        <span className="fi-unauth-icon">🔒</span>
        <h2>Accès restreint</h2>
        <p>Seuls les administrateurs peuvent accéder aux finances.</p>
        <button onClick={() => navigate('/dashboard')}>← Retour au tableau de bord</button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fi-error">
        <span>⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="finance-container">
      {/* En-tête / Navigation */}
      <div className="fi-header">
        <h1>Finances</h1>
        <div className="fi-tabs">
          <button
            className={sectionActive === 'RESULTAT' ? 'active' : ''}
            onClick={() => setSectionActive('RESULTAT')}
          >
            Compte de résultat
          </button>
          <button
            className={sectionActive === 'BILAN' ? 'active' : ''}
            onClick={() => setSectionActive('BILAN')}
          >
            Bilan comptable
          </button>
          <button
            className={sectionActive === 'TRANSACTIONS' ? 'active' : ''}
            onClick={() => setSectionActive('TRANSACTIONS')}
          >
            Transactions
          </button>
          <button
            className={sectionActive === 'WALLET' ? 'active' : ''}
            onClick={() => setSectionActive('WALLET')}
          >
            💳 Portefeuille
          </button>
        </div>
      </div>

      {/* Aperçu rapide */}
      <div className="fi-overview-cards">
        <div className="fi-card" onClick={() => setSectionActive('WALLET')}>
          <h3>Solde compte</h3>
          <div className="fi-value">{solde.toLocaleString('fr-MG')} Ar</div>
        </div>
        <div className="fi-card">
          <h3>Chiffre d'affaires</h3>
          <div className="fi-value">{ca.toLocaleString('fr-MG')} Ar</div>
        </div>
        <div className="fi-card">
          <h3>Résultat net</h3>
          <div className={`fi-value ${resultatNet >= 0 ? 'positive' : 'negative'}`}>
            {resultatNet.toLocaleString('fr-MG')} Ar
          </div>
        </div>
      </div>

      {/* ── COMPTE DE RÉSULTAT ── */}
      {sectionActive === 'RESULTAT' && compteResultat && (
        <div className="fi-section">
          <h2 className="fi-section-title">Compte de résultat – {compteResultat.annee}</h2>
          <div className="cr-ligne">
            <span>Chiffre d'affaires</span>
            <span className="montant">{compteResultat.chiffreAffaires.toLocaleString('fr-MG')} Ar</span>
          </div>
          <div className="cr-ligne">
            <span>Marge brute</span>
            <span className="montant">{compteResultat.margeBrute.toLocaleString('fr-MG')} Ar</span>
            <span className="pourcentage">({compteResultat.margeBrutePourcentage})</span>
          </div>
          <div className="cr-ligne important">
            <span>Valeur ajoutée</span>
            <span className="montant">{compteResultat.valeurAjoutee.toLocaleString('fr-MG')} Ar</span>
          </div>
          <div className="cr-ligne important">
            <span>EBE</span>
            <span className="montant">{compteResultat.ebe.toLocaleString('fr-MG')} Ar</span>
          </div>
          <div className="cr-ligne important">
            <span>Résultat d'exploitation</span>
            <span className={`montant ${compteResultat.resultatExploitation >= 0 ? 'pos' : 'neg'}`}>
              {compteResultat.resultatExploitation.toLocaleString('fr-MG')} Ar
            </span>
          </div>
          <div className="cr-ligne final">
            <span>Résultat net</span>
            <span className={`montant final ${compteResultat.resultatNet >= 0 ? 'pos' : 'neg'}`}>
              {compteResultat.resultatNet.toLocaleString('fr-MG')} Ar
            </span>
          </div>
        </div>
      )}

      {/* ── BILAN COMPTABLE ── */}
      {sectionActive === 'BILAN' && bilanComptable && (
        <div className="fi-section">
          <div className="fi-sub-tabs">
            <button
              className={bilanSubActive === 'ACTIF' ? 'active' : ''}
              onClick={() => setBilanSubActive('ACTIF')}
            >
              Actif
            </button>
            <button
              className={bilanSubActive === 'PASSIF' ? 'active' : ''}
              onClick={() => setBilanSubActive('PASSIF')}
            >
              Passif
            </button>
          </div>
          {bilanSubActive === 'ACTIF' && (
            <>
              <div className="fi-row">
                <span className="fi-row-label">Créances clients</span>
                <span className="fi-row-value">{bilanComptable.actif.creancesClients.toLocaleString('fr-MG')} Ar</span>
              </div>
              <div className="fi-row">
                <span className="fi-row-label">Stocks</span>
                <span className="fi-row-value">{bilanComptable.actif.stockValorise.toLocaleString('fr-MG')} Ar</span>
              </div>
              <div className="fi-separator" />
              <div className="fi-row-final">
                <span className="fi-row-final-label">Total Actif</span>
                <span className="fi-row-final-value">
                  {bilanComptable.actif.totalActif.toLocaleString('fr-MG')} Ar
                </span>
              </div>
            </>
          )}
          {bilanSubActive === 'PASSIF' && (
            <>
              <div className="fi-row">
                <span className="fi-row-label">Dettes fournisseurs</span>
                <span className="fi-row-value neg">
                  {bilanComptable.passif.dettesFournisseurs.toLocaleString('fr-MG')} Ar
                </span>
              </div>
              <div className="fi-row">
                <span className="fi-row-label">Capitaux propres</span>
                <span className="fi-row-value pos">
                  {bilanComptable.passif.capitauxPropres.toLocaleString('fr-MG')} Ar
                </span>
              </div>
              <div className="fi-separator" />
              <div className="fi-row-final">
                <span className="fi-row-final-label">Total Passif</span>
                <span className="fi-row-final-value" style={{ color: '#015a4c' }}>
                  {bilanComptable.passif.totalPassif.toLocaleString('fr-MG')} Ar
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── TRANSACTIONS ── */}
      {sectionActive === 'TRANSACTIONS' && (
        <div className="fi-section">
          <div className="fi-section-title">
            Transactions
            <span className="fi-year-badge">{transactions.length} total</span>
          </div>
          {paginatedTransactions.length === 0 ? (
            <div className="fi-empty">Aucune transaction disponible</div>
          ) : (
            paginatedTransactions.map((tx: any) => (
              <div key={tx.id} className="fi-tx-item">
                <div className={`fi-tx-icon ${tx.type === 'ENTREE' ? 'entree' : 'sortie'}`}>
                  {tx.type === 'ENTREE' ? '📦' : '💸'}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="fi-tx-ref">
                    {tx.type === 'ENTREE' ? 'Achat' : 'Vente'} | REF : {tx.ref}
                  </div>
                  <div className="fi-tx-date">{new Date(tx.date).toLocaleDateString('fr-FR')}</div>
                </div>
                <span className={`fi-tx-amount ${tx.type === 'ENTREE' ? 'neg' : 'pos'}`}>
                  {tx.type === 'ENTREE' ? '-' : '+'}
                  {(tx.quantite * tx.prixUnitaire).toLocaleString('fr-MG')} Ar
                </span>
              </div>
            ))
          )}
          {totalTxPages > 1 && (
            <div className="fi-pagination">
              <button
                className="fi-page-btn"
                onClick={() => setCurrentTxPage((p) => Math.max(1, p - 1))}
                disabled={currentTxPage === 1}
              >
                ‹
              </button>
              <span className="fi-page-text">
                Page {currentTxPage} / {totalTxPages}
              </span>
              <button
                className="fi-page-btn"
                onClick={() => setCurrentTxPage((p) => Math.min(totalTxPages, p + 1))}
                disabled={currentTxPage === totalTxPages}
              >
                ›
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── WALLET (PORTEFEUILLE) ── */}
      {sectionActive === 'WALLET' && (
        <div className="wallet-section">
          {/* Carte solde */}
          <div className="wlt-solde-card">
            <div className="wlt-solde-content">
              <div>
                <span className="wlt-solde-label">Solde actuel</span>
                <div className="wlt-solde-value">
                  <h2>{showSolde ? formatCurrency(solde) : '•••••••'}</h2>
                  <button className="wlt-toggle-visibility" onClick={() => setShowSolde(!showSolde)}>
                    {showSolde ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
              <div className="wlt-solde-actions">
                <button
                  className={`wlt-action-btn ${walletTab === 'depot' ? 'active' : ''}`}
                  onClick={() => setWalletTab('depot')}
                >
                  <FaArrowUp /> Dépôt
                </button>
                <button
                  className={`wlt-action-btn ${walletTab === 'retrait' ? 'active' : ''}`}
                  onClick={() => setWalletTab('retrait')}
                >
                  <FaArrowDown /> Retrait
                </button>
              </div>
            </div>
          </div>

          {/* Alertes */}
          {compteError && (
            <div className="wlt-alert error">
              <FaExclamationCircle />
              <span>{compteError}</span>
            </div>
          )}
          {successMessage && (
            <div className="wlt-alert success">
              <FaCheckCircle />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Stats rapides */}
          <div className="wlt-stats-grid">
            <div className="wlt-stat-card">
              <FaWallet className="wlt-stat-icon" />
              <div>
                <span className="wlt-stat-label">Solde</span>
                <span className="wlt-stat-value">{formatCurrency(solde)}</span>
              </div>
            </div>
            <div className="wlt-stat-card">
              <FaArrowUp className="wlt-stat-icon" style={{ color: '#1B8A5A' }} />
              <div>
                <span className="wlt-stat-label">Dépôts</span>
                <span className="wlt-stat-value">{formatCurrency(totalDepots)}</span>
              </div>
            </div>
            <div className="wlt-stat-card">
              <FaArrowDown className="wlt-stat-icon" style={{ color: '#E05A5A' }} />
              <div>
                <span className="wlt-stat-label">Retraits</span>
                <span className="wlt-stat-value">{formatCurrency(totalRetraits)}</span>
              </div>
            </div>
          </div>

          {/* Graphiques */}
          <div className="wlt-chart-section">
            <div className="wlt-chart-header">
              <h3>
                {showChart === 'line' ? <FaChartLine /> : <FaChartPie />}
                {showChart === 'line' ? ' Évolution du solde' : ' Répartition des fonds'}
              </h3>
              <div className="wlt-chart-toggle">
                <button
                  className={showChart === 'line' ? 'active' : ''}
                  onClick={() => setShowChart('line')}
                >
                  <FaChartLine />
                </button>
                <button
                  className={showChart === 'pie' ? 'active' : ''}
                  onClick={() => setShowChart('pie')}
                >
                  <FaChartPie />
                </button>
              </div>
            </div>
            <div className="wlt-chart-container">
              {showChart === 'line' ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getLineChartData()}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.6} />
                    <XAxis dataKey="date" />
                    <YAxis tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`} />
                    <Tooltip formatter={(value: any) => (typeof value === 'number' ? formatAr(value) : value)} />
                    <Line type="monotone" dataKey="solde" stroke="#2E86AB" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getPieData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {getPieData().map((_, index) => (
                        <Cell key={`cell-${index}`} fill={WALLET_COLORS[index % WALLET_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => (typeof value === 'number' ? formatCurrency(value) : value)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Formulaire dépôt / retrait */}
          <div className="wlt-transaction-card">
            <div className="wlt-transaction-tabs">
              <button
                className={`wlt-tab ${walletTab === 'depot' ? 'active' : ''}`}
                onClick={() => setWalletTab('depot')}
              >
                <FaArrowUp /> Dépôt
              </button>
              <button
                className={`wlt-tab ${walletTab === 'retrait' ? 'active' : ''}`}
                onClick={() => setWalletTab('retrait')}
              >
                <FaArrowDown /> Retrait
              </button>
            </div>
            <div className="wlt-transaction-form">
              {walletTab === 'retrait' && (
                <div className="wlt-solde-info">
                  Solde disponible : {formatCurrency(solde)}
                </div>
              )}
              <div className="wlt-form-group">
                <label>Montant (Ar)</label>
                <input
                  type="number"
                  className="wlt-montant-input"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Saisissez le montant"
                  disabled={compteLoading}
                  min="0"
                  step="1000"
                />
              </div>
              <div className="wlt-form-group">
                <label>Motif</label>
                <input
                  type="text"
                  className="wlt-motif-input"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder="Saisissez le motif"
                  disabled={compteLoading}
                />
              </div>
              <button
                className={`wlt-submit-btn ${walletTab}`}
                onClick={walletTab === 'depot' ? handleDepot : handleRetrait}
                disabled={compteLoading || !montant || parseFloat(montant) <= 0}
              >
                {compteLoading ? (
                  'Traitement...'
                ) : (
                  <>
                    <FaExchangeAlt />
                    {walletTab === 'depot' ? ' Effectuer le dépôt' : ' Effectuer le retrait'}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Historique */}
          <div className="wlt-historique-section">
            <h3>
              <FaHistory /> Dernières transactions
            </h3>
            <div className="wlt-historique-list">
              {(transactions || []).slice(0, 6).map((item: any, index: number) => (
                <div key={index} className="wlt-historique-item">
                  <div className="wlt-historique-info">
                    <span className="wlt-historique-date">
                      {new Date(item.date).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="wlt-historique-type">
                      {item.type === 'depot' ? (
                        <><FaArrowUp style={{ color: '#1B8A5A' }} /> Dépôt</>
                      ) : item.type === 'retrait' ? (
                        <><FaArrowDown style={{ color: '#E05A5A' }} /> Retrait</>
                      ) : item.type === 'ENTREE' ? (
                        <><FaArrowDown style={{ color: '#E05A5A' }} /> Achat</>
                      ) : (
                        <><FaArrowUp style={{ color: '#1B8A5A' }} /> Vente</>
                      )}
                    </span>
                  </div>
                  <div className="wlt-historique-montant">
                    <span className={item.type === 'depot' || item.type === 'SORTIE' ? 'positif' : 'negatif'}>
                      {item.type === 'depot' || item.type === 'SORTIE' ? '+' : '-'}
                      {formatCurrency(item.quantite * item.prixUnitaire || 0)}
                    </span>
                  </div>
                </div>
              ))}
              {(!transactions || transactions.length === 0) && (
                <div className="wlt-no-data">Aucune transaction récente</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FAB PDF */}
      <div className="fi-fab-wrap">
        <span className="fi-fab-tooltip">Exporter en PDF</span>
        <button
          className={`fi-fab ${pdfLoading ? 'loading' : ''}`}
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
          title="Télécharger PDF"
        >
          {pdfLoading ? '⏳' : '📄'}
        </button>
      </div>
    </div>
  );
}