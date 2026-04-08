// src/pages/finance/index.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['finance','common']);
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

  // Local state
  const [sectionActive, setSectionActive] = useState<SectionType>('RESULTAT');
  const [bilanSubActive, setBilanSubActive] = useState<BilanSubType>('ACTIF');
  const [errorAuthorization, setErrorAuthorization] = useState(false);
  const [currentTxPage, setCurrentTxPage] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [solde, setSolde] = useState(0);
  const [walletTab, setWalletTab] = useState<'depot' | 'retrait'>('depot');
  const [montant, setMontant] = useState<string>('');
  const [motif, setMotif] = useState<string>('');
  const [showSolde, setShowSolde] = useState<boolean>(true);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showChart, setShowChart] = useState<'line' | 'pie'>('line');

  // Vérification rôle ADMIN
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      setErrorAuthorization(true);
    }
  }, [user]);

  // Chargement des données finances
  useEffect(() => {
    if (token && !errorAuthorization) {
      dispatch(fetchCompteResultat(token));
      dispatch(fetchBilanComptable(token));
      dispatch(fetchGeneral(token));
      dispatch(fetchAllTransactions(token));
    }
  }, [token, dispatch, errorAuthorization]);

  // Chargement du compte (solde)
  const fetchAccount = async () => {
    try {
      const account = await dispatch(fetchCompte() as any).unwrap() as {
        success: boolean;
        data: Compte;
        message?: string;
      };
      if (!account.success) {
        logout();
      } else {
        setSolde(account.data.montant);
      }
    } catch (err) {
      console.error('Erreur récupération compte:', err);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, [dispatch]);

  // Pagination
  const paginatedTransactions = transactions.slice(
    (currentTxPage - 1) * TRANSACTIONS_PER_PAGE,
    currentTxPage * TRANSACTIONS_PER_PAGE
  );
  const totalTxPages = Math.ceil(transactions.length / TRANSACTIONS_PER_PAGE);

  // Export PDF
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

  // Format monétaire
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('fr-MG', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value).replace('MGA', 'Ar');
  };

  // Actions Dépôt / Retrait
  const handleDepot = async () => {
    const value = parseFloat(montant);
    if (isNaN(value) || value <= 0) return;

    try {
      const resp = await dispatch(deposit({ montant: value, motif }) as any).unwrap();
      if (!resp.success && resp.message?.includes('expiré')) {
        logout();
        return;
      }
      setSuccessMessage(t('wallet.deposit_success', { amount: formatAr(value) }));
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
      alert(t('wallet.insufficient_balance'));
      return;
    }

    try {
      await dispatch(withdraw({ montant: value, type: 'retrait', motif }) as any).unwrap();
      setSuccessMessage(t('wallet.withdraw_success', { amount: formatCurrency(value) }));
      setMontant('');
      fetchAccount();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Erreur retrait:', err);
    }
  };

  // Données graphiques
  const getLineChartData = () => {
    const sorted = [...(transactions || [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    let currentSolde = solde;
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
      { name: t('wallet.deposits'), value: depots, color: WALLET_COLORS[0] },
      { name: t('wallet.withdrawals'), value: retraitsAbs, color: WALLET_COLORS[1] },
      { name: t('wallet.available_balance'), value: reste, color: WALLET_COLORS[2] },
    ].filter((item) => item.value > 0);
  };

  const ca = compteResultat?.chiffreAffaires ?? 0;
  const resultatNet = compteResultat?.resultatNet ?? 0;

  // Loading
  if (loading) {
    return (
      <div className="fi-loading">
        <div className="fi-spinner" />
        <p>{t('loading')}</p>
      </div>
    );
  }

  // Accès restreint
  if (errorAuthorization) {
    return (
      <div className="fi-unauthorized">
        <span className="fi-unauth-icon">🔒</span>
        <h2>{t('unauthorized.title')}</h2>
        <p>{t('unauthorized.message')}</p>
        <button onClick={() => navigate('/dashboard')}>
          ← {t('common:back_to_dashboard')}
        </button>
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
      {/* Header */}
      <div className="fi-header">
        <h1>{t('title')}</h1>
        <div className="fi-tabs">
          <button
            className={sectionActive === 'RESULTAT' ? 'active' : ''}
            onClick={() => setSectionActive('RESULTAT')}
          >
            {t('sections.resultat')}
          </button>
          <button
            className={sectionActive === 'BILAN' ? 'active' : ''}
            onClick={() => setSectionActive('BILAN')}
          >
            {t('sections.bilan')}
          </button>
          <button
            className={sectionActive === 'TRANSACTIONS' ? 'active' : ''}
            onClick={() => setSectionActive('TRANSACTIONS')}
          >
            {t('sections.transactions')}
          </button>
          <button
            className={sectionActive === 'WALLET' ? 'active' : ''}
            onClick={() => setSectionActive('WALLET')}
          >
            💳 {t('sections.wallet')}
          </button>
        </div>
      </div>

      {/* Aperçu rapide */}
      <div className="fi-overview-cards">
        <div className="fi-card" onClick={() => setSectionActive('WALLET')}>
          <h3>{t('overview.balance')}</h3>
          <div className="fi-value">{solde.toLocaleString('fr-MG')} Ar</div>
        </div>
        <div className="fi-card">
          <h3>{t('overview.revenue')}</h3>
          <div className="fi-value">{ca.toLocaleString('fr-MG')} Ar</div>
        </div>
        <div className="fi-card">
          <h3>{t('overview.net_result')}</h3>
          <div className={`fi-value ${resultatNet >= 0 ? 'positive' : 'negative'}`}>
            {resultatNet.toLocaleString('fr-MG')} Ar
          </div>
        </div>
      </div>

      {/* COMPTE DE RÉSULTAT */}
      {sectionActive === 'RESULTAT' && compteResultat && (
        <div className="fi-section">
          <h2 className="fi-section-title">
            {t('resultat.title')} – {compteResultat.annee}
          </h2>
          <div className="cr-ligne">
            <span>{t('resultat.revenue')}</span>
            <span className="montant">{compteResultat.chiffreAffaires.toLocaleString('fr-MG')} Ar</span>
          </div>
          <div className="cr-ligne">
            <span>{t('resultat.gross_margin')}</span>
            <span className="montant">{compteResultat.margeBrute.toLocaleString('fr-MG')} Ar</span>
            <span className="pourcentage">({compteResultat.margeBrutePourcentage})</span>
          </div>
          <div className="cr-ligne important">
            <span>{t('resultat.added_value')}</span>
            <span className="montant">{compteResultat.valeurAjoutee.toLocaleString('fr-MG')} Ar</span>
          </div>
          <div className="cr-ligne important">
            <span>{t('resultat.ebe')}</span>
            <span className="montant">{compteResultat.ebe.toLocaleString('fr-MG')} Ar</span>
          </div>
          <div className="cr-ligne important">
            <span>{t('resultat.operating_result')}</span>
            <span className={`montant ${compteResultat.resultatExploitation >= 0 ? 'pos' : 'neg'}`}>
              {compteResultat.resultatExploitation.toLocaleString('fr-MG')} Ar
            </span>
          </div>
          <div className="cr-ligne final">
            <span>{t('resultat.net_result')}</span>
            <span className={`montant final ${compteResultat.resultatNet >= 0 ? 'pos' : 'neg'}`}>
              {compteResultat.resultatNet.toLocaleString('fr-MG')} Ar
            </span>
          </div>
        </div>
      )}

      {/* BILAN COMPTABLE */}
      {sectionActive === 'BILAN' && bilanComptable && (
        <div className="fi-section">
          <div className="fi-sub-tabs">
            <button
              className={bilanSubActive === 'ACTIF' ? 'active' : ''}
              onClick={() => setBilanSubActive('ACTIF')}
            >
              {t('bilan.actif')}
            </button>
            <button
              className={bilanSubActive === 'PASSIF' ? 'active' : ''}
              onClick={() => setBilanSubActive('PASSIF')}
            >
              {t('bilan.passif')}
            </button>
          </div>

          {bilanSubActive === 'ACTIF' && (
            <>
              <div className="fi-row">
                <span className="fi-row-label">{t('bilan.receivables')}</span>
                <span className="fi-row-value">{bilanComptable.actif.creancesClients.toLocaleString('fr-MG')} Ar</span>
              </div>
              <div className="fi-row">
                <span className="fi-row-label">{t('bilan.stocks')}</span>
                <span className="fi-row-value">{bilanComptable.actif.stockValorise.toLocaleString('fr-MG')} Ar</span>
              </div>
              <div className="fi-separator" />
              <div className="fi-row-final">
                <span className="fi-row-final-label">{t('bilan.total_actif')}</span>
                <span className="fi-row-final-value">
                  {bilanComptable.actif.totalActif.toLocaleString('fr-MG')} Ar
                </span>
              </div>
            </>
          )}

          {bilanSubActive === 'PASSIF' && (
            <>
              <div className="fi-row">
                <span className="fi-row-label">{t('bilan.supplier_debts')}</span>
                <span className="fi-row-value neg">
                  {bilanComptable.passif.dettesFournisseurs.toLocaleString('fr-MG')} Ar
                </span>
              </div>
              <div className="fi-row">
                <span className="fi-row-label">{t('bilan.equity')}</span>
                <span className="fi-row-value pos">
                  {bilanComptable.passif.capitauxPropres.toLocaleString('fr-MG')} Ar
                </span>
              </div>
              <div className="fi-separator" />
              <div className="fi-row-final">
                <span className="fi-row-final-label">{t('bilan.total_passif')}</span>
                <span className="fi-row-final-value" style={{ color: '#015a4c' }}>
                  {bilanComptable.passif.totalPassif.toLocaleString('fr-MG')} Ar
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* TRANSACTIONS */}
      {sectionActive === 'TRANSACTIONS' && (
        <div className="fi-section">
          <div className="fi-section-title">
            {t('transactions.title')}
            <span className="fi-year-badge">{transactions.length} {t('transactions.total')}</span>
          </div>
          {paginatedTransactions.length === 0 ? (
            <div className="fi-empty">{t('transactions.no_data')}</div>
          ) : (
            paginatedTransactions.map((tx: any) => (
              <div key={tx.id} className="fi-tx-item">
                <div className={`fi-tx-icon ${tx.type === 'ENTREE' ? 'entree' : 'sortie'}`}>
                  {tx.type === 'ENTREE' ? '📦' : '💸'}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="fi-tx-ref">
                    {tx.type === 'ENTREE' ? t('transactions.purchase') : t('transactions.sale')} | 
                    REF : {tx.ref}
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
                {t('transactions.page')} {currentTxPage} / {totalTxPages}
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

      {/* WALLET / PORTEFEUILLE */}
      {sectionActive === 'WALLET' && (
        <div className="wallet-section">
          {/* Carte Solde */}
          <div className="wlt-solde-card">
            <div className="wlt-solde-content">
              <div>
                <span className="wlt-solde-label">{t('wallet.current_balance')}</span>
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
                  <FaArrowUp /> {t('wallet.deposit')}
                </button>
                <button
                  className={`wlt-action-btn ${walletTab === 'retrait' ? 'active' : ''}`}
                  onClick={() => setWalletTab('retrait')}
                >
                  <FaArrowDown /> {t('wallet.withdrawal')}
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
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

          {/* Stats */}
          <div className="wlt-stats-grid">
            <div className="wlt-stat-card">
              <FaWallet className="wlt-stat-icon" />
              <div>
                <span className="wlt-stat-label">{t('wallet.balance')}</span>
                <span className="wlt-stat-value">{formatCurrency(solde)}</span>
              </div>
            </div>
            <div className="wlt-stat-card">
              <FaArrowUp className="wlt-stat-icon" style={{ color: '#1B8A5A' }} />
              <div>
                <span className="wlt-stat-label">{t('wallet.deposits')}</span>
                <span className="wlt-stat-value">{formatCurrency(totalDepots)}</span>
              </div>
            </div>
            <div className="wlt-stat-card">
              <FaArrowDown className="wlt-stat-icon" style={{ color: '#E05A5A' }} />
              <div>
                <span className="wlt-stat-label">{t('wallet.withdrawals')}</span>
                <span className="wlt-stat-value">{formatCurrency(totalRetraits)}</span>
              </div>
            </div>
          </div>

          {/* Graphiques */}
          <div className="wlt-chart-section">
            <div className="wlt-chart-header">
              <h3>
                {showChart === 'line' ? <FaChartLine /> : <FaChartPie />}
                {showChart === 'line' 
                  ? t('wallet.balance_evolution') 
                  : t('wallet.funds_distribution')}
              </h3>
              <div className="wlt-chart-toggle">
                <button className={showChart === 'line' ? 'active' : ''} onClick={() => setShowChart('line')}>
                  <FaChartLine />
                </button>
                <button className={showChart === 'pie' ? 'active' : ''} onClick={() => setShowChart('pie')}>
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
                    <Tooltip formatter={(value: any) => formatAr(value)} />
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
                    >
                      {getPieData().map((_, index) => (
                        <Cell key={`cell-${index}`} fill={WALLET_COLORS[index % WALLET_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Formulaire Dépôt / Retrait */}
          <div className="wlt-transaction-card">
            <div className="wlt-transaction-tabs">
              <button
                className={`wlt-tab ${walletTab === 'depot' ? 'active' : ''}`}
                onClick={() => setWalletTab('depot')}
              >
                <FaArrowUp /> {t('wallet.deposit')}
              </button>
              <button
                className={`wlt-tab ${walletTab === 'retrait' ? 'active' : ''}`}
                onClick={() => setWalletTab('retrait')}
              >
                <FaArrowDown /> {t('wallet.withdrawal')}
              </button>
            </div>

            <div className="wlt-transaction-form">
              {walletTab === 'retrait' && (
                <div className="wlt-solde-info">
                  {t('wallet.available')} : {formatCurrency(solde)}
                </div>
              )}
              <div className="wlt-form-group">
                <label>{t('wallet.amount')}</label>
                <input
                  type="number"
                  className="wlt-montant-input"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder={t('wallet.amount_placeholder')}
                  disabled={compteLoading}
                  min="0"
                  step="1000"
                />
              </div>
              <div className="wlt-form-group">
                <label>{t('wallet.reason')}</label>
                <input
                  type="text"
                  className="wlt-motif-input"
                  value={motif}
                  onChange={(e) => setMotif(e.target.value)}
                  placeholder={t('wallet.reason_placeholder')}
                  disabled={compteLoading}
                />
              </div>
              <button
                className={`wlt-submit-btn ${walletTab}`}
                onClick={walletTab === 'depot' ? handleDepot : handleRetrait}
                disabled={compteLoading || !montant || parseFloat(montant) <= 0}
              >
                {compteLoading ? (
                  t('wallet.processing')
                ) : (
                  <>
                    <FaExchangeAlt />
                    {walletTab === 'depot' 
                      ? t('wallet.do_deposit') 
                      : t('wallet.do_withdrawal')}
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Historique */}
          <div className="wlt-historique-section">
            <h3>
              <FaHistory /> {t('wallet.recent_transactions')}
            </h3>
            <div className="wlt-historique-list">
              {(transactions || []).slice(0, 6).map((item: any, index: number) => (
                <div key={index} className="wlt-historique-item">
                  <div className="wlt-historique-info">
                    <span className="wlt-historique-date">
                      {new Date(item.date).toLocaleDateString('fr-FR')}
                    </span>
                    <span className="wlt-historique-type">
                      {item.type === 'depot' || item.type === 'SORTIE' ? (
                        <><FaArrowUp style={{ color: '#1B8A5A' }} /> {t('wallet.deposit')}</>
                      ) : (
                        <><FaArrowDown style={{ color: '#E05A5A' }} /> {t('wallet.withdrawal')}</>
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
                <div className="wlt-no-data">{t('transactions.no_data')}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bouton PDF */}
      <div className="fi-fab-wrap">
        <span className="fi-fab-tooltip">{t('export_pdf')}</span>
        <button
          className={`fi-fab ${pdfLoading ? 'loading' : ''}`}
          onClick={handleDownloadPdf}
          disabled={pdfLoading}
        >
          {pdfLoading ? '⏳' : '📄'}
        </button>
      </div>
    </div>
  );
}