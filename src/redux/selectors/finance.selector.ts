// src/redux/selectors/finance.selector.ts
import type { Transaction } from '../../models';
import { type RootState } from '../store';

export const selectCompteResultat = (state: RootState) => state.finance.compteResultat;
export const selectBilanComptable = (state: RootState) => state.finance.bilanComptable;
export const selectTransactions = (state: RootState) => state.finance.transactions;
export const selectFinanceLoading = (state: RootState) => state.finance.loading;
export const selectFinanceError = (state: RootState) => state.finance.error;

// Computed values – uniquement ce qui concerne vraiment la finance / résultat / mouvements stock/ventes
export const selectTotalVentes = (state: RootState): number =>
  state.finance.transactions
    ?.filter(t => t.type === 'vente')
    .reduce((sum, t) => sum + (t.quantite * t.prixUnitaire || 0), 0) ?? 0;

export const selectTotalAchats = (state: RootState): number =>
  state.finance.transactions
    ?.filter(t => t.type === 'achat')
    .reduce((sum, t) => sum + (t.quantite * t.prixUnitaire || 0), 0) ?? 0;

export const selectTransactionsByDate = (
  state: RootState,
  startDate?: Date,
  endDate?: Date
): Transaction[] => {
  if (!state.finance.transactions?.length) return [];

  let filtered = [...state.finance.transactions];

  if (startDate) {
    filtered = filtered.filter(t => new Date(t.date) >= startDate);
  }
  if (endDate) {
    filtered = filtered.filter(t => new Date(t.date) <= endDate);
  }

  // Tri descendant (plus récent en premier)
  return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};