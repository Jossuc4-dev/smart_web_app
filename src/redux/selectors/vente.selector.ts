// src/redux/selectors/vente.selector.ts
import { createSelector } from '@reduxjs/toolkit';
import { type RootState } from '../store';

export const selectCommandsState = (state: RootState) => state.vente;

export const selectAllCommands = createSelector(
  selectCommandsState,
  (state) => state.commands
);

export const selectPaidCommands = createSelector(
  selectCommandsState,
  (state) => state.paidCommands
);

export const selectPendingCommands = createSelector(
  selectCommandsState,
  (state) => state.pendingCommands
);

export const selectCreditCommands = createSelector(
  selectCommandsState,
  (state) => state.creditCommands
);

export const selectCommandsLoading = createSelector(
  selectCommandsState,
  (state) => state.status === 'loading'
);

export const selectCommandsError = createSelector(
  selectCommandsState,
  (state) => state.error
);

export const selectValidateStatus = createSelector(
  selectCommandsState,
  (state) => state.validateStatus
);

export const selectDeleteStatus = createSelector(
  selectCommandsState,
  (state) => state.deleteStatus
);

export const selectLastUpdated = createSelector(
  selectCommandsState,
  (state) => state.lastUpdated
);

export const selectClients = createSelector(
  selectCommandsState,
  (state) => state.clients
);

export const selectCommandById = (id: number) => createSelector(
  selectAllCommands,
  (commands) => commands.find(c => c.id === id)
);

export const selectClientById = (id: number) => createSelector(
  selectClients,
  (clients) => clients.find(c => c.id === id)
);

export const selectCommandsStats = createSelector(
  selectAllCommands,
  selectPaidCommands,
  selectPendingCommands,
  selectCreditCommands,
  (all, paid, pending, credit) => ({
    total: all.length,
    paid: paid.length,
    pending: pending.length,
    credit: credit.length,
    totalAmount: all.reduce((sum, c) => sum + (c.quantite * c.produit?.prixVente || 0), 0),
    paidAmount: paid.reduce((sum, c) => sum + (c.quantite * c.produit?.prixVente || 0), 0),
    pendingAmount: pending.reduce((sum, c) => sum + (c.quantite * c.produit?.prixVente || 0), 0),
    creditAmount: credit.reduce((sum, c) => sum + (c.quantite * c.produit?.prixVente || 0), 0),
  })
);