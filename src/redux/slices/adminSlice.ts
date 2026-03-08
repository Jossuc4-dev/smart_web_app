// src/redux/slices/adminSlice.ts
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import BASE_URL from '../../config/ApiConfig';
import type { Offre, Abonnement } from '../../models/interfaces';

interface AdminState {
  offres: Offre[];
  abonnements: Abonnement[];
  currentOffre: Offre | null;
  currentAbonnement: Abonnement | null;
  status: 'idle' | 'loading' | 'failed'; // Changé pour correspondre à venteSlice
  offreStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  abonnementStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  lastUpdated: Date | null; // Ajouté comme dans venteSlice
  sessionExpired: boolean;
}

const initialState: AdminState = {
  offres: [],
  abonnements: [],
  currentOffre: null,
  currentAbonnement: null,
  status: 'idle',
  offreStatus: 'idle',
  abonnementStatus: 'idle',
  error: null,
  lastUpdated: null,
  sessionExpired: false,
};

// Fonction utilitaire pour gérer les réponses fetch (comme dans venteSlice)
const handleResponse = async (response: Response) => {
  if (response.status === 401) {
    throw new Error('SESSION_EXPIRED');
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// Thunks pour les offres
export const fetchOffres = createAsyncThunk<
  Offre[],
  string,
  { rejectValue: string }
>(
  'admin/fetchOffres',
  async (token, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/admin/offre`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      return await handleResponse(response);
    } catch (err) {
      const errorMessage = (err as Error).message;
      if (errorMessage === 'SESSION_EXPIRED') {
        return rejectWithValue('SESSION_EXPIRED');
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchOffreById = createAsyncThunk<
  Offre,
  { id: number; token: string },
  { rejectValue: string }
>(
  'admin/fetchOffreById',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/admin/offre/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      return await handleResponse(response);
    } catch (err) {
      const errorMessage = (err as Error).message;
      if (errorMessage === 'SESSION_EXPIRED') {
        return rejectWithValue('SESSION_EXPIRED');
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const createOffre = createAsyncThunk<
  Offre,
  { data: Omit<Offre, 'id'>; token: string },
  { rejectValue: string }
>(
  'admin/createOffre',
  async ({ data, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/admin/offre`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      return await handleResponse(response);
    } catch (err) {
      const errorMessage = (err as Error).message;
      if (errorMessage === 'SESSION_EXPIRED') {
        return rejectWithValue('SESSION_EXPIRED');
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateOffre = createAsyncThunk<
  Offre,
  { id: number; data: Partial<Offre>; token: string },
  { rejectValue: string }
>(
  'admin/updateOffre',
  async ({ id, data, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/admin/offre/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      return await handleResponse(response);
    } catch (err) {
      const errorMessage = (err as Error).message;
      if (errorMessage === 'SESSION_EXPIRED') {
        return rejectWithValue('SESSION_EXPIRED');
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteOffre = createAsyncThunk<
  number,
  { id: number; token: string },
  { rejectValue: string }
>(
  'admin/deleteOffre',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/admin/offre/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 401) {
        throw new Error('SESSION_EXPIRED');
      }
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }
      
      return id;
    } catch (err) {
      const errorMessage = (err as Error).message;
      if (errorMessage === 'SESSION_EXPIRED') {
        return rejectWithValue('SESSION_EXPIRED');
      }
      return rejectWithValue(errorMessage);
    }
  }
);

// Thunks pour les abonnements
export const fetchAbonnements = createAsyncThunk<
  Abonnement[],
  string,
  { rejectValue: string }
>(
  'admin/fetchAbonnements',
  async (token, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/admin/subscription`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      return await handleResponse(response);
    } catch (err) {
      const errorMessage = (err as Error).message;
      if (errorMessage === 'SESSION_EXPIRED') {
        return rejectWithValue('SESSION_EXPIRED');
      }
      return rejectWithValue(errorMessage);
    }
  }
);

export const payerAbonnement = createAsyncThunk<
  Abonnement,
  { data: { idOffre: number; reference?: string }; token: string },
  { rejectValue: string }
>(
  'admin/payerAbonnement',
  async ({ data, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/admin/subscription/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      return await handleResponse(response);
    } catch (err) {
      const errorMessage = (err as Error).message;
      if (errorMessage === 'SESSION_EXPIRED') {
        return rejectWithValue('SESSION_EXPIRED');
      }
      return rejectWithValue(errorMessage);
    }
  }
);

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    resetStatus: (state) => {
      state.status = 'idle';
      state.offreStatus = 'idle';
      state.abonnementStatus = 'idle';
      state.error = null;
      state.sessionExpired = false;
    },
    setSessionExpired: (state) => {
      state.sessionExpired = true;
      state.error = 'Votre session a expiré';
    },
    clearCurrentOffre: (state) => {
      state.currentOffre = null;
    },
    clearCurrentAbonnement: (state) => {
      state.currentAbonnement = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchOffres
      .addCase(fetchOffres.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.sessionExpired = false;
      })
      .addCase(fetchOffres.fulfilled, (state, action: PayloadAction<Offre[]>) => {
        state.status = 'idle';
        state.offres = action.payload;
        state.lastUpdated = new Date();
      })
      .addCase(fetchOffres.rejected, (state, action) => {
        state.status = 'failed';
        if (action.payload === 'SESSION_EXPIRED') {
          state.sessionExpired = true;
          state.error = 'Votre session a expiré';
        } else {
          state.error = action.payload || 'Erreur lors du chargement des offres';
        }
      })
      
      // fetchOffreById
      .addCase(fetchOffreById.pending, (state) => {
        state.status = 'loading';
        state.sessionExpired = false;
      })
      .addCase(fetchOffreById.fulfilled, (state, action: PayloadAction<Offre>) => {
        state.status = 'idle';
        state.currentOffre = action.payload;
      })
      .addCase(fetchOffreById.rejected, (state, action) => {
        state.status = 'failed';
        if (action.payload === 'SESSION_EXPIRED') {
          state.sessionExpired = true;
          state.error = 'Votre session a expiré';
        } else {
          state.error = action.payload || 'Erreur lors du chargement de l\'offre';
        }
      })
      
      // createOffre
      .addCase(createOffre.pending, (state) => {
        state.offreStatus = 'loading';
        state.sessionExpired = false;
      })
      .addCase(createOffre.fulfilled, (state, action: PayloadAction<Offre>) => {
        state.offreStatus = 'succeeded';
        state.offres.push(action.payload);
        state.lastUpdated = new Date();
      })
      .addCase(createOffre.rejected, (state, action) => {
        state.offreStatus = 'failed';
        if (action.payload === 'SESSION_EXPIRED') {
          state.sessionExpired = true;
          state.error = 'Votre session a expiré';
        } else {
          state.error = action.payload || 'Erreur lors de la création de l\'offre';
        }
      })
      
      // updateOffre
      .addCase(updateOffre.pending, (state) => {
        state.offreStatus = 'loading';
        state.sessionExpired = false;
      })
      .addCase(updateOffre.fulfilled, (state, action: PayloadAction<Offre>) => {
        state.offreStatus = 'succeeded';
        const index = state.offres.findIndex(o => o.id === action.payload.id);
        if (index !== -1) {
          state.offres[index] = action.payload;
        }
        if (state.currentOffre?.id === action.payload.id) {
          state.currentOffre = action.payload;
        }
        state.lastUpdated = new Date();
      })
      .addCase(updateOffre.rejected, (state, action) => {
        state.offreStatus = 'failed';
        if (action.payload === 'SESSION_EXPIRED') {
          state.sessionExpired = true;
          state.error = 'Votre session a expiré';
        } else {
          state.error = action.payload || 'Erreur lors de la mise à jour de l\'offre';
        }
      })
      
      // deleteOffre
      .addCase(deleteOffre.pending, (state) => {
        state.offreStatus = 'loading';
        state.sessionExpired = false;
      })
      .addCase(deleteOffre.fulfilled, (state, action: PayloadAction<number>) => {
        state.offreStatus = 'succeeded';
        state.offres = state.offres.filter(o => o.id !== action.payload);
        if (state.currentOffre?.id === action.payload) {
          state.currentOffre = null;
        }
        state.lastUpdated = new Date();
      })
      .addCase(deleteOffre.rejected, (state, action) => {
        state.offreStatus = 'failed';
        if (action.payload === 'SESSION_EXPIRED') {
          state.sessionExpired = true;
          state.error = 'Votre session a expiré';
        } else {
          state.error = action.payload || 'Erreur lors de la suppression de l\'offre';
        }
      })
      
      // fetchAbonnements
      .addCase(fetchAbonnements.pending, (state) => {
        state.status = 'loading';
        state.sessionExpired = false;
      })
      .addCase(fetchAbonnements.fulfilled, (state, action: PayloadAction<Abonnement[]>) => {
        state.status = 'idle';
        state.abonnements = action.payload;
        state.lastUpdated = new Date();
      })
      .addCase(fetchAbonnements.rejected, (state, action) => {
        state.status = 'failed';
        if (action.payload === 'SESSION_EXPIRED') {
          state.sessionExpired = true;
          state.error = 'Votre session a expiré';
        } else {
          state.error = action.payload || 'Erreur lors du chargement des abonnements';
        }
      })
      
      // payerAbonnement
      .addCase(payerAbonnement.pending, (state) => {
        state.abonnementStatus = 'loading';
        state.sessionExpired = false;
      })
      .addCase(payerAbonnement.fulfilled, (state, action: PayloadAction<Abonnement>) => {
        state.abonnementStatus = 'succeeded';
        state.abonnements.unshift(action.payload);
        state.lastUpdated = new Date();
      })
      .addCase(payerAbonnement.rejected, (state, action) => {
        state.abonnementStatus = 'failed';
        if (action.payload === 'SESSION_EXPIRED') {
          state.sessionExpired = true;
          state.error = 'Votre session a expiré';
        } else {
          state.error = action.payload || 'Erreur lors du paiement de l\'abonnement';
        }
      });
  },
});

export const { 
  resetStatus, 
  setSessionExpired,
  clearCurrentOffre,
  clearCurrentAbonnement 
} = adminSlice.actions;

export default adminSlice.reducer;