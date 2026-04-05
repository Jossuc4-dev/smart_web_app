// src/redux/slices/venteSlice.ts
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import BASE_URL from '../../config/ApiConfig';
import type { CommandeResponse, detailledClient, Facture } from '../../models/interfaces';
import { useApiFetch } from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';

interface CommandeState {
  commands: CommandeResponse[];
  paidCommands: CommandeResponse[];
  pendingCommands: CommandeResponse[];
  creditCommands: CommandeResponse[];
  clients: detailledClient[];
  status: 'idle' | 'loading' | 'failed';
  validateStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  deleteStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  lastUpdated: Date | null;
  sessionExpired: boolean;
}

const initialState: CommandeState = {
  commands: [],
  paidCommands: [],
  pendingCommands: [],
  creditCommands: [],
  clients: [],
  status: 'idle',
  validateStatus: 'idle',
  deleteStatus: 'idle',
  error: null,
  lastUpdated: null,
  sessionExpired: false,
};

// Fonction utilitaire pour gérer les réponses fetch
const handleResponse = async (response: Response) => {
  if (response.status === 401) {
    throw new Error('SESSION_EXPIRED');
  }
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json()
  console.log({dataCommand:data})
  
  return data;
};

// Thunk for fetching commands
export const fetchCommands = createAsyncThunk<
  CommandeResponse[], 
  string, 
  { rejectValue: string }
>(
  'commands/fetchCommands',
  async (token, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/vente/commande`, {
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

// Thunk for fetching a single command
export const fetchCommandById = createAsyncThunk<
  CommandeResponse,
  { id: number; token: string },
  { rejectValue: string }
>(
  'commands/fetchCommandById',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/vente/${id}`, {
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

// Thunk for creating a command
export const createCommand = createAsyncThunk<
  CommandeResponse,
  { 
    data: {
      clientId: number;
      produitId: number;
      quantite: number;
      typePaiement?: 'CASH' | 'CARTE' | 'MOBILE_MONEY' | 'CREDIT';
      notes?: string;
      adresseLivraison?: string;
    }; 
    token: string;
  },
  { rejectValue: string }
>(
  'commands/createCommand',
  async ({ data, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/vente/commande`, {
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

// Thunk for validating payment
export const validatePayment = createAsyncThunk<
  CommandeResponse,
  { id: number; token: string; typePaiement?: string },
  { rejectValue: string }
>(
  'commands/validatePayment',
  async ({ id, token, typePaiement = 'CASH' }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/vente/commande/valid/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        // body: JSON.stringify({ valide: true, typePaiement }),
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

// Thunk for deleting command
export const deleteCommand = createAsyncThunk<
  number,
  { id: number; token: string },
  { rejectValue: string }
>(
  'commands/deleteCommand',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/vente/commande/${id}`, {
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

// Thunk for fetching clients
export const fetchClients = createAsyncThunk<
  detailledClient[],
  string,
  { rejectValue: string }
>(
  'commands/fetchClients',
  async (token, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/vente/clients`, {
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

// Thunk for fetching a single client
export const fetchClientById = createAsyncThunk<
  detailledClient,
  { id: number; token: string },
  { rejectValue: string }
>(
  'commands/fetchClientById',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/vente/clients/${id}`, {
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

// Thunk for creating a client
export const createClient = createAsyncThunk<
  detailledClient,
  { 
    data: {
      nom: string;
      email: string;
      telephone: string;
      adresse?: string;
    }; 
    token: string;
  },
  { rejectValue: string }
>(
  'commands/createClient',
  async ({ data, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/vente/clients`, {
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

const commandeSlice = createSlice({
  name: 'commands',
  initialState,
  reducers: {
    resetStatus: (state) => {
      state.status = 'idle';
      state.validateStatus = 'idle';
      state.deleteStatus = 'idle';
      state.error = null;
      state.sessionExpired = false;
    },
    clearCommands: (state) => {
      state.commands = [];
      state.paidCommands = [];
      state.pendingCommands = [];
      state.creditCommands = [];
    },
    resetValidateStatus: (state) => {
      state.validateStatus = 'idle';
    },
    resetDeleteStatus: (state) => {
      state.deleteStatus = 'idle';
    },
    setSessionExpired: (state) => {
      state.sessionExpired = true;
      state.error = 'Votre session a expiré';
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCommands
      .addCase(fetchCommands.pending, (state) => {
        state.status = 'loading';
        state.error = null;
        state.sessionExpired = false;
      })
      .addCase(fetchCommands.fulfilled, (state, action: PayloadAction<CommandeResponse[]>) => {
        state.status = 'idle';
        state.commands = action.payload;
        state.lastUpdated = new Date();
        
        // Filtrer les commandes par statut
        state.paidCommands = action.payload.filter(c => 
          c.valide && c.factures?.every((f: Facture) => f.payed)
        );
        
        state.pendingCommands = action.payload.filter(c => 
          !c.valide || c.factures?.some((f: Facture) => !f.payed)
        );
        
        // state.creditCommands = action.payload.filter(c => 
        //   c.typePaiement === 'CREDIT' || 
        //   (c.factures && c.factures.some((f: Facture) => f.typePaiement.toString() === 'CREDIT' && !f.payed))
        // );
      })
      .addCase(fetchCommands.rejected, (state, action) => {
        state.status = 'failed';
        if (action.payload === 'SESSION_EXPIRED') {
          state.sessionExpired = true;
          state.error = 'Votre session a expiré';
        } else {
          state.error = action.payload || 'Erreur lors du chargement des commandes';
        }
      })
      
      // fetchCommandById
      .addCase(fetchCommandById.pending, (state) => {
        state.status = 'loading';
        state.sessionExpired = false;
      })
      .addCase(fetchCommandById.fulfilled, (state, action: PayloadAction<CommandeResponse>) => {
        state.status = 'idle';
        const index = state.commands.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.commands[index] = action.payload;
        } else {
          state.commands.push(action.payload);
        }
      })
      .addCase(fetchCommandById.rejected, (state, action) => {
        state.status = 'failed';
        if (action.payload === 'SESSION_EXPIRED') {
          state.sessionExpired = true;
          state.error = 'Votre session a expiré';
        } else {
          state.error = action.payload || 'Erreur lors du chargement de la commande';
        }
      })
      
      // createCommand
      .addCase(createCommand.pending, (state) => {
        state.status = 'loading';
        state.sessionExpired = false;
      })
      .addCase(createCommand.fulfilled, (state, action: PayloadAction<CommandeResponse>) => {
        state.status = 'idle';
        state.commands.push(action.payload);
        
        if (!action.payload.valide) {
          state.pendingCommands.push(action.payload);
        }
        
        if (action.payload.typePaiement === 'CREDIT') {
          state.creditCommands.push(action.payload);
        }
      })
      .addCase(createCommand.rejected, (state, action) => {
        state.status = 'failed';
        if (action.payload === 'SESSION_EXPIRED') {
          state.sessionExpired = true;
          state.error = 'Votre session a expiré';
        } else {
          state.error = action.payload || 'Erreur lors de la création de la commande';
        }
      })
      
      // validatePayment
      .addCase(validatePayment.pending, (state) => {
        state.validateStatus = 'loading';
        state.error = null;
        state.sessionExpired = false;
      })
      .addCase(validatePayment.fulfilled, (state, action: PayloadAction<CommandeResponse>) => {
        state.validateStatus = 'succeeded';
        const updated = action.payload;
        const index = state.commands.findIndex(c => c.id === updated.id);
        
        if (index !== -1) {
          state.commands[index] = updated;
        }
        
        // Mettre à jour les listes filtrées
        state.paidCommands = state.commands.filter(c => 
          c.valide && c.factures?.every((f: Facture) => f.payed)
        );
        
        state.pendingCommands = state.commands.filter(c => 
          !c.valide || c.factures?.some((f: Facture) => !f.payed)
        );
        
        // state.creditCommands = state.commands.filter(c => 
        //   c.typePaiement === 'CREDIT' || 
        //   (c.factures && c.factures.some((f: Facture) => f.typePaiement === 'CREDIT' && !f.payed))
        // );
      })
      .addCase(validatePayment.rejected, (state, action) => {
        state.validateStatus = 'failed';
        if (action.payload === 'SESSION_EXPIRED') {
          state.sessionExpired = true;
          state.error = 'Votre session a expiré';
        } else {
          state.error = action.payload || 'Erreur lors de la validation du paiement';
        }
      })
      
      // deleteCommand
      .addCase(deleteCommand.pending, (state) => {
        state.deleteStatus = 'loading';
        state.error = null;
        state.sessionExpired = false;
      })
      .addCase(deleteCommand.fulfilled, (state, action: PayloadAction<number>) => {
        state.deleteStatus = 'succeeded';
        const id = action.payload;
        
        state.commands = state.commands.filter(c => c.id !== id);
        state.paidCommands = state.paidCommands.filter(c => c.id !== id);
        state.pendingCommands = state.pendingCommands.filter(c => c.id !== id);
        state.creditCommands = state.creditCommands.filter(c => c.id !== id);
      })
      .addCase(deleteCommand.rejected, (state, action) => {
        state.deleteStatus = 'failed';
        if (action.payload === 'SESSION_EXPIRED') {
          state.sessionExpired = true;
          state.error = 'Votre session a expiré';
        } else {
          state.error = action.payload || 'Erreur lors de la suppression de la commande';
        }
      })
      
      // fetchClients
      .addCase(fetchClients.pending, (state) => {
        state.status = 'loading';
        state.sessionExpired = false;
      })
      .addCase(fetchClients.fulfilled, (state, action: PayloadAction<detailledClient[]>) => {
        state.status = 'idle';
        state.clients = action.payload;
      })
      .addCase(fetchClients.rejected, (state, action) => {
        state.status = 'failed';
        if (action.payload === 'SESSION_EXPIRED') {
          state.sessionExpired = true;
          state.error = 'Votre session a expiré';
        } else {
          state.error = action.payload || 'Erreur lors du chargement des clients';
        }
      })
      
      // fetchClientById
      .addCase(fetchClientById.pending, (state) => {
        state.status = 'loading';
        state.sessionExpired = false;
      })
      .addCase(fetchClientById.fulfilled, (state, action: PayloadAction<detailledClient>) => {
        state.status = 'idle';
        const index = state.clients.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.clients[index] = action.payload;
        } else {
          state.clients.push(action.payload);
        }
      })
      .addCase(fetchClientById.rejected, (state, action) => {
        state.status = 'failed';
        if (action.payload === 'SESSION_EXPIRED') {
          state.sessionExpired = true;
          state.error = 'Votre session a expiré';
        } else {
          state.error = action.payload || 'Erreur lors du chargement du client';
        }
      })
      
      // createClient
      .addCase(createClient.pending, (state) => {
        state.status = 'loading';
        state.sessionExpired = false;
      })
      .addCase(createClient.fulfilled, (state, action: PayloadAction<detailledClient>) => {
        state.status = 'idle';
        state.clients.push(action.payload);
      })
      .addCase(createClient.rejected, (state, action) => {
        state.status = 'failed';
        if (action.payload === 'SESSION_EXPIRED') {
          state.sessionExpired = true;
          state.error = 'Votre session a expiré';
        } else {
          state.error = action.payload || 'Erreur lors de la création du client';
        }
      });
  },
});

export const { 
  resetStatus, 
  clearCommands, 
  resetValidateStatus, 
  resetDeleteStatus,
  setSessionExpired 
} = commandeSlice.actions;

export default commandeSlice.reducer;