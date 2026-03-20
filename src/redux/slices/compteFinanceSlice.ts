// src/redux/slices/compteSlice.ts
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import BASE_URL from '../../config/ApiConfig';
import type { Compte } from '../../models/index';

interface CompteState {
  compte: Compte | null;
  loading: boolean;
  error: string | null;
}

const initialState: CompteState = {
  compte: null,
  loading: false,
  error: null,
};

// -----------------------------------------------------------------------------
// Dépôt
// -----------------------------------------------------------------------------
export const deposit = createAsyncThunk<
  Compte,
  { montant: number,motif:string },
  { state: { compte: CompteState } }
>(
  'compte/deposit',
  async (data, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token') || ''; // ou via une autre méthode
      const response = await fetch(`${BASE_URL}/finance/depot`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      // if (!response.ok) {
      //   throw new Error(`Erreur ${response.status}`);
      // }

      const d = await response.json();
      return d
    } catch (err: any) {
      return rejectWithValue(err.message || 'Erreur lors du dépôt');
    }
  }
);

// -----------------------------------------------------------------------------
// Retrait
// -----------------------------------------------------------------------------
export const withdraw = createAsyncThunk<
  Compte,
  { montant: number, type:string },
  { state: { compte: CompteState } }
>(
  'compte/withdraw',
  async (data, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${BASE_URL}/finance/retrait`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }

      return await response.json();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Erreur lors du retrait');
    }
  }
);

// -----------------------------------------------------------------------------
// Récupérer le solde / compte actuel
// -----------------------------------------------------------------------------
export const fetchCompte = createAsyncThunk<Compte, void>(
  'compte/fetchCompte',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${BASE_URL}/finance/account`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // if (!response.ok) {
      //   throw new Error(`Erreur ${response.status}`);
      // }

      return await response.json();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Impossible de récupérer le compte');
    }
  }
);

export const fetchAccountTransaction = createAsyncThunk<Compte, void>(
  'compte/fetchAccountTransaction',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token') || '';
      const response = await fetch(`${BASE_URL}/finance/account`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // if (!response.ok) {
      //   throw new Error(`Erreur ${response.status}`);
      // }

      return await response.json();
    } catch (err: any) {
      return rejectWithValue(err.message || 'Impossible de récupérer le compte');
    }
  }
);

const compteSlice = createSlice({
  name: 'compte',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    // fetchCompte
    builder
      .addCase(fetchCompte.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompte.fulfilled, (state, action: PayloadAction<Compte>) => {
        state.loading = false;
        state.compte = action.payload;
      })
      .addCase(fetchCompte.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // deposit
      .addCase(deposit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deposit.fulfilled, (state, action: PayloadAction<Compte>) => {
        state.loading = false;
        state.compte = action.payload;
      })
      .addCase(deposit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // withdraw
      .addCase(withdraw.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(withdraw.fulfilled, (state, action: PayloadAction<Compte>) => {
        state.loading = false;
        state.compte = action.payload;
      })
      .addCase(withdraw.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default compteSlice.reducer;