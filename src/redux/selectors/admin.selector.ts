// src/redux/selectors/admin.selector.ts
import { createSelector } from '@reduxjs/toolkit';
import { type RootState } from '../store';

export const selectAdminState = (state: RootState) => state.admin;

export const selectOffres = createSelector(
  selectAdminState,
  (state) => state.offres
);

export const selectAbonnements = createSelector(
  selectAdminState,
  (state) => state.abonnements
);

export const selectCurrentOffre = createSelector(
  selectAdminState,
  (state) => state.currentOffre
);

export const selectCurrentAbonnement = createSelector(
  selectAdminState,
  (state) => state.currentAbonnement
);

export const selectAdminLoading = createSelector(
  selectAdminState,
  (state) => state.status === 'loading'
);

export const selectOffreStatus = createSelector(
  selectAdminState,
  (state) => state.offreStatus
);

export const selectAbonnementStatus = createSelector(
  selectAdminState,
  (state) => state.abonnementStatus
);

export const selectAdminError = createSelector(
  selectAdminState,
  (state) => state.error
);

export const selectSessionExpired = createSelector(
  selectAdminState,
  (state) => state.sessionExpired
);