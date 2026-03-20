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
import { useAuth } from '../../contexts/AuthContext';
import { generateResultatPDF } from '../../pdf/pdfResultat';
import { generateBilanPDF } from '../../pdf/pdfBilan';
import { generateTransactionsPDF } from '../../pdf/pdfTransactions';

import './index.css';
import { fetchCompte } from '../../redux/slices/compteFinanceSlice';
import type { Compte } from '../../models';

type SectionType = 'RESULTAT' | 'BILAN' | 'TRANSACTIONS';
type BilanSubType = 'ACTIF' | 'PASSIF';

const TRANSACTIONS_PER_PAGE = 4;

export default function FinanceScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, token, logout} = useAuth();

  const compteResultat = useAppSelector(selectCompteResultat);
  const bilanComptable = useAppSelector(selectBilanComptable);
  const account = useAppSelector(state => state.compte);
  const transactions = useAppSelector(selectTransactions) || [];
  const loading = useAppSelector(selectFinanceLoading);
  const error = useAppSelector(selectFinanceError);

  const [sectionActive, setSectionActive] = useState<SectionType>('RESULTAT');
  const [bilanSubActive, setBilanSubActive] = useState<BilanSubType>('ACTIF');
  const [errorAuthorization, setErrorAuthorization] = useState(false);
  const [currentTxPage, setCurrentTxPage] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);

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

  // ── Données pour l'affichage ──
  const [solde,setSolde] = useState(0)
  const ca = compteResultat?.chiffreAffaires! ?? 0;
  const resultatNet = compteResultat?.resultatNet ?? 0;

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
  useEffect(()=>{
    fetchAccount()
  },[dispatch])

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
      {/* En-tête / Navigation entre sections */}
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
        </div>
      </div>

      {/* Aperçu rapide solde / CA / Résultat */}
      <div className="fi-overview-cards">
        <div className="fi-card" onClick={()=>navigate('/finance/wallet')}>
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

      {/* Contenu selon la section active */}
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
              {/* ... autres lignes actif ... */}
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

      {/* Bouton flottant PDF */}
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