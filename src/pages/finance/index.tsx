// src/pages/finance/index.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { fetchCompteResultat, fetchBilanComptable, fetchGeneral, fetchAllTransactions } from '../../redux/slices/financeSlice';
import { selectCompteResultat, selectBilanComptable, selectAccount, selectTransactions, selectFinanceLoading, selectFinanceError } from '../../redux/selectors/finance.selector';
import { useAuth } from '../../contexts/AuthContext';
import { generateResultatPDF } from '../../pdf/pdfResultat';
import { generateBilanPDF } from '../../pdf/pdfBilan';
import { generateTransactionsPDF } from '../../pdf/pdfTransactions';

import './index.css';

type SectionType = 'RESULTAT' | 'BILAN' | 'TRANSACTIONS';
type BilanSubType = 'ACTIF' | 'PASSIF';

const TRANSACTIONS_PER_PAGE = 4;

export default function FinanceScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const compteResultat = useAppSelector(selectCompteResultat);
  const bilanComptable = useAppSelector(selectBilanComptable);
  const account = useAppSelector(selectAccount);
  const transactions = useAppSelector(selectTransactions) || [];
  const loading = useAppSelector(selectFinanceLoading);
  const error = useAppSelector(selectFinanceError);

  const [sectionActive, setSectionActive] = useState<SectionType>('RESULTAT');
  const [bilanSubActive, setBilanSubActive] = useState<BilanSubType>('ACTIF');
  const [errorAuthorization, setErrorAuthorization] = useState(false);
  const [currentTxPage, setCurrentTxPage] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== 'ADMIN') setErrorAuthorization(true);
  }, [user]);

  useEffect(() => {
    if (token && !errorAuthorization) {
      dispatch(fetchCompteResultat(token));
      dispatch(fetchBilanComptable(token));
      dispatch(fetchGeneral(token));
      dispatch(fetchAllTransactions(token));
    }
  }, [token, dispatch, errorAuthorization]);

  const paginatedTransactions = transactions.slice(
    (currentTxPage - 1) * TRANSACTIONS_PER_PAGE,
    currentTxPage * TRANSACTIONS_PER_PAGE
  );
  const totalTxPages = Math.ceil(transactions.length / TRANSACTIONS_PER_PAGE);

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
      }
    } finally {
      setTimeout(() => setPdfLoading(false), 600);
    }
  };

  // ── Balance card data ──
  const solde = account?.solde ?? 0;
  const ca = compteResultat?.chiffreAffaires ?? 0;
  const resultatNet = compteResultat?.resultatNet ?? 0;
  console.log({account, compteResultat});

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
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .fi-root {
          font-family: 'DM Sans', sans-serif;
          background: #f0f4f3;
          min-height: 100vh;
          padding-bottom: 100px;
        }

        /* ── Header ── */
        .fi-header {
          background: linear-gradient(135deg, #02927a 0%, #00d4b0 100%);
          padding: 32px 24px 24px;
          position: relative;
          overflow: hidden;
        }
        .fi-header::after {
          content: '';
          position: absolute;
          bottom: -30px; right: -30px;
          width: 140px; height: 140px;
          border-radius: 50%;
          background: rgba(255,255,255,0.07);
        }
        .fi-header h1 {
          font-family: 'Syne', sans-serif;
          font-size: 28px; font-weight: 800;
          color: #fff; letter-spacing: -0.5px;
        }
        .fi-header-sub {
          font-size: 13px; color: rgba(255,255,255,0.75); margin-top: 4px;
        }

        /* ── Balance card ── */
        .fi-balance-card {
          margin: -8px 16px 0;
          background: linear-gradient(135deg, #013d33 0%, #025e4a 60%, #017a62 100%);
          border-radius: 20px;
          padding: 24px 24px 20px;
          position: relative;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(2, 146, 122, 0.35);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          z-index: 2;
        }
        .fi-balance-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(2, 146, 122, 0.45);
        }
        .fi-balance-card::before {
          content: '';
          position: absolute;
          top: -40px; right: -40px;
          width: 180px; height: 180px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,212,176,0.18), transparent 70%);
        }
        .fi-balance-card::after {
          content: '';
          position: absolute;
          bottom: -20px; left: 60px;
          width: 100px; height: 100px;
          border-radius: 50%;
          background: rgba(255,255,255,0.04);
        }

        .fi-balance-top {
          display: flex; justify-content: space-between; align-items: flex-start;
        }
        .fi-balance-label {
          font-size: 12px; color: rgba(255,255,255,0.65);
          text-transform: uppercase; letter-spacing: 0.1em; font-weight: 600;
          margin-bottom: 6px;
        }
        .fi-balance-amount {
          font-family: 'DM Mono', monospace;
          font-size: 34px; font-weight: 500;
          color: #fff; letter-spacing: -1px;
          line-height: 1.1;
        }
        .fi-balance-icon {
          width: 48px; height: 48px; border-radius: 14px;
          background: rgba(255,255,255,0.12);
          display: flex; align-items: center; justify-content: center;
          font-size: 22px;
        }
        .fi-balance-footer {
          display: flex; gap: 16px; margin-top: 20px;
          padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);
        }
        .fi-mini-stat {
          flex: 1;
          background: rgba(255,255,255,0.08);
          border-radius: 10px; padding: 10px 12px;
        }
        .fi-mini-stat-label {
          font-size: 10px; color: rgba(255,255,255,0.55);
          text-transform: uppercase; letter-spacing: 0.08em;
          margin-bottom: 4px;
        }
        .fi-mini-stat-value {
          font-family: 'DM Mono', monospace;
          font-size: 13px; font-weight: 500; color: #fff;
        }
        .fi-mini-stat-value.positive { color: #7fffcc; }
        .fi-mini-stat-value.negative { color: #ffaaaa; }

        /* ── Tabs ── */
        .fi-tabs {
          display: flex; gap: 8px;
          margin: 20px 16px 0;
          background: #fff;
          border-radius: 14px;
          padding: 6px;
          box-shadow: 0 2px 12px rgba(0,0,0,0.07);
        }
        .fi-tab {
          flex: 1; display: flex; flex-direction: column; align-items: center;
          gap: 4px; padding: 10px 4px;
          border: none; background: transparent; cursor: pointer;
          border-radius: 10px; transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .fi-tab-icon { font-size: 18px; }
        .fi-tab-label { font-size: 11px; font-weight: 600; color: #8a9aaa; letter-spacing: 0.02em; }
        .fi-tab.active { background: #02927a; }
        .fi-tab.active .fi-tab-label { color: #fff; }
        .fi-tab:not(.active):hover { background: #f0faf8; }

        /* ── Section content ── */
        .fi-section {
          margin: 16px 16px 0;
          background: #fff;
          border-radius: 18px;
          padding: 24px;
          box-shadow: 0 2px 16px rgba(0,0,0,0.06);
        }
        .fi-section-title {
          font-family: 'Syne', sans-serif;
          font-size: 17px; font-weight: 700;
          color: #1a2a2a; margin-bottom: 20px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .fi-year-badge {
          font-family: 'DM Mono', monospace;
          font-size: 11px; font-weight: 500;
          background: #e8f7f4; color: #02927a;
          padding: 4px 10px; border-radius: 20px;
        }

        /* ── Finance rows ── */
        .fi-row {
          display: flex; justify-content: space-between; align-items: center;
          padding: 11px 0;
          border-bottom: 1px solid #f0f4f3;
          font-size: 14px;
        }
        .fi-row:last-child { border-bottom: none; }
        .fi-row-label { color: #556070; }
        .fi-row-value { font-family: 'DM Mono', monospace; font-weight: 500; color: #1a2a2a; }
        .fi-row-value.pos { color: #1a8a55; }
        .fi-row-value.neg { color: #c0392b; }

        .fi-separator { height: 1px; background: #e8f0ee; margin: 6px 0; }

        .fi-row-highlight {
          background: #f0faf8; border-radius: 10px;
          padding: 12px 14px; margin: 8px 0;
          display: flex; justify-content: space-between;
        }
        .fi-row-highlight .fi-row-label { color: #1a2a2a; font-weight: 600; font-size: 14px; }
        .fi-row-highlight .fi-row-value { font-size: 14px; font-weight: 700; color: #02927a; }

        .fi-row-final {
          background: linear-gradient(90deg, #e8f7f4, #f0fdfb);
          border-radius: 12px; padding: 14px 16px; margin-top: 10px;
          display: flex; justify-content: space-between; align-items: center;
          border: 1.5px solid #c0ede5;
        }
        .fi-row-final-label {
          font-family: 'Syne', sans-serif;
          font-size: 15px; font-weight: 800; color: #015a4c;
        }
        .fi-row-final-value {
          font-family: 'DM Mono', monospace;
          font-size: 16px; font-weight: 500;
        }

        /* ── Bilan sub-tabs ── */
        .fi-sub-tabs {
          display: flex; background: #f0f4f3;
          border-radius: 10px; padding: 4px; margin-bottom: 18px; gap: 4px;
        }
        .fi-sub-tab {
          flex: 1; padding: 9px; border: none; background: transparent;
          border-radius: 8px; font-family: 'Syne', sans-serif;
          font-size: 13px; font-weight: 700; cursor: pointer;
          color: #8a9aaa; transition: all 0.2s;
        }
        .fi-sub-tab.active {
          background: #fff; color: #02927a;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          border-bottom: 2.5px solid #02927a;
        }

        /* ── Transactions ── */
        .fi-tx-item {
          display: flex; align-items: center; gap: 12px;
          padding: 12px 0; border-bottom: 1px solid #f0f4f3;
        }
        .fi-tx-item:last-child { border-bottom: none; }
        .fi-tx-icon {
          width: 42px; height: 42px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; flex-shrink: 0;
        }
        .fi-tx-icon.entree { background: #fdecea; }
        .fi-tx-icon.sortie { background: #eafaf3; }
        .fi-tx-ref { font-weight: 600; font-size: 13px; color: #1a2a2a; }
        .fi-tx-date { font-size: 11px; color: #8a9aaa; margin-top: 2px; }
        .fi-tx-amount {
          margin-left: auto; font-family: 'DM Mono', monospace;
          font-weight: 500; font-size: 14px;
        }
        .fi-tx-amount.pos { color: #1a8a55; }
        .fi-tx-amount.neg { color: #c0392b; }
        .fi-tx-type-badge {
          font-size: 10px; padding: 2px 7px; border-radius: 6px; font-weight: 600;
        }
        .fi-tx-type-badge.entree { background: #fdecea; color: #c0392b; }
        .fi-tx-type-badge.sortie { background: #eafaf3; color: #1a8a55; }

        /* ── Pagination ── */
        .fi-pagination {
          display: flex; align-items: center; justify-content: center;
          gap: 20px; padding-top: 16px; margin-top: 8px;
          border-top: 1px solid #f0f4f3;
        }
        .fi-page-btn {
          width: 38px; height: 38px; border-radius: 10px;
          background: #02927a; color: #fff; border: none;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: 14px; transition: all 0.15s;
        }
        .fi-page-btn:hover:not(:disabled) { background: #017a62; }
        .fi-page-btn:disabled { background: #c8d8d5; cursor: not-allowed; }
        .fi-page-text { font-size: 13px; color: #556070; font-weight: 600; }

        /* ── FAB PDF ── */
        .fi-fab {
          position: fixed; right: 20px; bottom: 32px;
          width: 56px; height: 56px; border-radius: 28px;
          background: #fff; border: none; cursor: pointer;
          box-shadow: 0 4px 20px rgba(0,0,0,0.18);
          display: flex; align-items: center; justify-content: center;
          font-size: 26px; transition: all 0.2s;
          z-index: 100; color: #e74c3c;
        }
        .fi-fab:hover { transform: scale(1.08); box-shadow: 0 8px 28px rgba(231,76,60,0.3); }
        .fi-fab:active { transform: scale(0.96); }
        .fi-fab.loading { opacity: 0.6; animation: fi-pulse 0.6s infinite; }
        @keyframes fi-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(0.94); } }
        .fi-fab-tooltip {
          position: fixed; right: 82px; bottom: 42px;
          background: #1a2a2a; color: #fff;
          font-size: 11px; font-weight: 600;
          padding: 5px 10px; border-radius: 8px;
          white-space: nowrap; opacity: 0; pointer-events: none;
          transition: opacity 0.2s; letter-spacing: 0.04em;
          text-transform: uppercase; z-index: 100;
        }
        .fi-fab-wrap:hover .fi-fab-tooltip { opacity: 1; }
        .fi-fab-wrap { position: fixed; right: 20px; bottom: 32px; z-index: 100; }

        /* ── States ── */
        .fi-loading {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; height: 100vh; gap: 16px;
          color: #02927a; font-weight: 600;
        }
        .fi-spinner {
          width: 36px; height: 36px; border: 3px solid #c0ede5;
          border-top-color: #02927a; border-radius: 50%;
          animation: fi-spin 0.8s linear infinite;
        }
        @keyframes fi-spin { to { transform: rotate(360deg); } }

        .fi-unauthorized {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; height: 100vh; gap: 12px; text-align: center; padding: 32px;
        }
        .fi-unauth-icon { font-size: 64px; }
        .fi-unauthorized h2 { font-family: 'Syne', sans-serif; font-size: 22px; color: #1a2a2a; }
        .fi-unauthorized p { color: #556070; font-size: 14px; max-width: 280px; }
        .fi-unauthorized button {
          margin-top: 12px; padding: 12px 24px; background: #02927a; color: #fff;
          border: none; border-radius: 10px; font-weight: 700; cursor: pointer;
          font-family: 'Syne', sans-serif; font-size: 13px;
        }

        .fi-error {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; height: 100vh; gap: 8px; color: #c0392b;
        }
        .fi-error span { font-size: 48px; }
        .fi-error p { font-size: 14px; }

        .fi-empty {
          text-align: center; padding: 40px 20px;
          color: #aabbb5; font-size: 14px;
        }
      `}</style>

      <div className="fi-root">
        {/* Header */}
        <div className="fi-header">
          <h1>Finances</h1>
          <p className="fi-header-sub">Tableau de bord financier</p>
        </div>

        {/* ── BALANCE CARD (comme React Native) ── */}
        <div className="fi-balance-card" onClick={() => navigate('/wallet/budget')}>
          <div className="fi-balance-top">
            <div>
              <div className="fi-balance-label">Solde actuel</div>
              <div className="fi-balance-amount">
                {solde.toLocaleString('fr-MG')} <span style={{ fontSize: 20, opacity: 0.8 }}>Ar</span>
              </div>
            </div>
            <div className="fi-balance-icon">💳</div>
          </div>

          <div className="fi-balance-footer">
            <div className="fi-mini-stat">
              <div className="fi-mini-stat-label">Chiffre d'affaires</div>
              <div className="fi-mini-stat-value positive">
                {ca.toLocaleString('fr-MG')} Ar
              </div>
            </div>
            <div className="fi-mini-stat">
              <div className="fi-mini-stat-label">Résultat net</div>
              <div className={`fi-mini-stat-value ${resultatNet >= 0 ? 'positive' : 'negative'}`}>
                {resultatNet >= 0 ? '+' : ''}{resultatNet.toLocaleString('fr-MG')} Ar
              </div>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div className="fi-tabs">
          {[
            { key: 'RESULTAT', icon: '📊', label: 'Résultat' },
            { key: 'BILAN', icon: '⚖️', label: 'Bilan' },
            { key: 'TRANSACTIONS', icon: '↔️', label: 'Transactions' },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              className={`fi-tab ${sectionActive === key ? 'active' : ''}`}
              onClick={() => setSectionActive(key as SectionType)}
            >
              <span className="fi-tab-icon">{icon}</span>
              <span className="fi-tab-label">{label}</span>
            </button>
          ))}
        </div>

        {/* ── COMPTE DE RÉSULTAT ── */}
        {sectionActive === 'RESULTAT' && compteResultat && (
          <div className="fi-section">
            <div className="fi-section-title">
              Compte de résultat
              <span className="fi-year-badge">{compteResultat.annee}</span>
            </div>

            <div className="fi-row">
              <span className="fi-row-label">Chiffre d'affaires</span>
              <span className="fi-row-value pos">{compteResultat.chiffreAffaires.toLocaleString('fr-MG')} Ar</span>
            </div>
            <div className="fi-row">
              <span className="fi-row-label">Achats de marchandises</span>
              <span className="fi-row-value neg">-{compteResultat.depenses.achats.toLocaleString('fr-MG')} Ar</span>
            </div>
            <div className="fi-row">
              <span className="fi-row-label">Frais de transport</span>
              <span className="fi-row-value neg">-{compteResultat.depenses.transport.toLocaleString('fr-MG')} Ar</span>
            </div>
            <div className="fi-separator" />
            <div className="fi-row-highlight">
              <span className="fi-row-label">Marge brute</span>
              <span className="fi-row-value">{compteResultat.margeBrute.toLocaleString('fr-MG')} Ar <small style={{ color: '#8aaa98', fontWeight: 400 }}>({compteResultat.margeBrutePourcentage})</small></span>
            </div>
            <div className="fi-row">
              <span className="fi-row-label">Charges d'exploitation</span>
              <span className="fi-row-value neg">-{(compteResultat.valeurAjoutee - compteResultat.ebe).toLocaleString('fr-MG')} Ar</span>
            </div>
            <div className="fi-row">
              <span className="fi-row-label">Valeur ajoutée</span>
              <span className="fi-row-value">{compteResultat.valeurAjoutee.toLocaleString('fr-MG')} Ar</span>
            </div>
            <div className="fi-row">
              <span className="fi-row-label">EBE</span>
              <span className="fi-row-value">{compteResultat.ebe.toLocaleString('fr-MG')} Ar</span>
            </div>
            <div className="fi-row">
              <span className="fi-row-label">Résultat d'exploitation</span>
              <span className="fi-row-value">{compteResultat.resultatExploitation.toLocaleString('fr-MG')} Ar</span>
            </div>
            <div className="fi-row-final">
              <span className="fi-row-final-label">Résultat net</span>
              <span
                className="fi-row-final-value"
                style={{ color: compteResultat.resultatNet >= 0 ? '#155724' : '#721c24' }}
              >
                {compteResultat.resultatNet >= 0 ? '+' : ''}{compteResultat.resultatNet.toLocaleString('fr-MG')} Ar
              </span>
            </div>
          </div>
        )}

        {/* ── BILAN ── */}
        {sectionActive === 'BILAN' && bilanComptable && (
          <div className="fi-section">
            <div className="fi-section-title">
              Bilan comptable
              <span className="fi-year-badge">{bilanComptable.annee}</span>
            </div>

            <div className="fi-sub-tabs">
              <button
                className={`fi-sub-tab ${bilanSubActive === 'ACTIF' ? 'active' : ''}`}
                onClick={() => setBilanSubActive('ACTIF')}
              >
                Actif
              </button>
              <button
                className={`fi-sub-tab ${bilanSubActive === 'PASSIF' ? 'active' : ''}`}
                onClick={() => setBilanSubActive('PASSIF')}
              >
                Passif
              </button>
            </div>

            {bilanSubActive === 'ACTIF' && (
              <>
                <div className="fi-row">
                  <span className="fi-row-label">Trésorerie</span>
                  <span className="fi-row-value">{bilanComptable.actif.tresorerie.toLocaleString('fr-MG')} Ar</span>
                </div>
                <div className="fi-row">
                  <span className="fi-row-label">Stock valorisé</span>
                  <span className="fi-row-value">{bilanComptable.actif.stockValorise.toLocaleString('fr-MG')} Ar</span>
                </div>
                <div className="fi-row">
                  <span className="fi-row-label">Créances clients</span>
                  <span className="fi-row-value">{bilanComptable.actif.creancesClients.toLocaleString('fr-MG')} Ar</span>
                </div>
                {bilanComptable.actif.creancesClientsDetail.totalEnRetard > 0 && (
                  <div className="fi-row">
                    <span className="fi-row-label" style={{ paddingLeft: 12, fontSize: 13 }}>↳ dont en retard</span>
                    <span className="fi-row-value neg">{bilanComptable.actif.creancesClientsDetail.totalEnRetard.toLocaleString('fr-MG')} Ar</span>
                  </div>
                )}
                <div className="fi-separator" />
                <div className="fi-row-final">
                  <span className="fi-row-final-label">Total Actif</span>
                  <span className="fi-row-final-value" style={{ color: '#015a4c' }}>
                    {bilanComptable.actif.totalActif.toLocaleString('fr-MG')} Ar
                  </span>
                </div>
              </>
            )}

            {bilanSubActive === 'PASSIF' && (
              <>
                <div className="fi-row">
                  <span className="fi-row-label">Dettes fournisseurs</span>
                  <span className="fi-row-value neg">{bilanComptable.passif.dettesFournisseurs.toLocaleString('fr-MG')} Ar</span>
                </div>
                <div className="fi-row">
                  <span className="fi-row-label">Capitaux propres</span>
                  <span className="fi-row-value pos">{bilanComptable.passif.capitauxPropres.toLocaleString('fr-MG')} Ar</span>
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
                    {tx.type === 'ENTREE' ? '-' : '+'}{(tx.quantite * tx.prixUnitaire).toLocaleString('fr-MG')} Ar
                  </span>
                </div>
              ))
            )}

            {totalTxPages > 1 && (
              <div className="fi-pagination">
                <button
                  className="fi-page-btn"
                  onClick={() => setCurrentTxPage(p => Math.max(1, p - 1))}
                  disabled={currentTxPage === 1}
                >
                  ‹
                </button>
                <span className="fi-page-text">Page {currentTxPage} / {totalTxPages}</span>
                <button
                  className="fi-page-btn"
                  onClick={() => setCurrentTxPage(p => Math.min(totalTxPages, p + 1))}
                  disabled={currentTxPage === totalTxPages}
                >
                  ›
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── FAB PDF (comme React Native) ── */}
        <div className="fi-fab-wrap">
          <span className="fi-fab-tooltip">Exporter PDF</span>
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
    </>
  );
}