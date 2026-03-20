// src/redux/selectors/compte.selectors.ts
import { type RootState } from '../store';

export const selectCompte = (state: RootState) => state.compte.compte;
export const selectCompteLoading = (state: RootState) => state.compte.loading;
export const selectCompteError = (state: RootState) => state.compte.error;

export const selectSoldeActuel = (state: RootState) => state.compte.compte?.montant!;

// Ajout dans compte.selectors.ts

export const selectTotalDepots = (state: RootState): number =>
  state.finance.transactions // ← on reste sur finance.transactions pour l'instant
    ?.filter(t => t.type === 'depot')
    .reduce((sum, t) => sum + (t.quantite * t.prixUnitaire || 0), 0) ?? 0;

export const selectTotalRetraits = (state: RootState): number =>
  state.finance.transactions
    ?.filter(t => t.type === 'retrait')
    .reduce((sum, t) => sum + (t.quantite * t.prixUnitaire || 0), 0) ?? 0;

// Variante plus propre (si vous dupliquez ou déplacez les transactions dans compteSlice plus tard)
export const selectSoldeCalcule = (state: RootState): number => {
  const deps = selectTotalDepots(state);
  const retr = selectTotalRetraits(state);
  // + autres flux si nécessaire (ventes - achats, etc.)
  return deps - retr + (state.compte.compte?.montant ?? 0);
};