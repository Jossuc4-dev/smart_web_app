// src/redux/slices/stockSlice.ts
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import BASE_URL from '../../config/ApiConfig'; // Adjust path if needed
import type { Produit } from '../../models'; // From models.ts
import type { BonCommandeData } from '../../models/interfaces';

interface StockState {
  products: Produit[];
  status: 'idle' | 'loading' | 'failed';
  addStatus: 'idle' | 'adding' | 'succeeded' | 'failed'; // Ajout du statut d'ajout
  addSuccess: boolean; // Ajout du flag de succès
  error: string | null;
}

const initialState: StockState = {
  products: [],
  status: 'idle',
  addStatus: 'idle',
  addSuccess: false,
  error: null,
};

export const fetchProducts = createAsyncThunk<Produit[], string>(
  'stock/fetchProducts',
  async (token, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/stock/produit`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const addProduct = createAsyncThunk<Produit, { data: any; token: string }>(
  'stock/addProduct',
  async ({ data, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/stock/produit`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {
    resetAddSuccess: (state) => {
      state.addSuccess = false;
      state.addStatus = 'idle';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<Produit[]>) => {
        state.status = 'idle';
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      // Gestion de addProduct
      .addCase(addProduct.pending, (state) => {
        state.addStatus = 'adding';
        state.addSuccess = false;
        state.error = null;
      })
      .addCase(addProduct.fulfilled, (state, action: PayloadAction<Produit>) => {
        state.addStatus = 'succeeded';
        state.addSuccess = true;
        state.products.push(action.payload); // Ajouter le produit à la liste
      })
      .addCase(addProduct.rejected, (state, action) => {
        state.addStatus = 'failed';
        state.addSuccess = false;
        state.error = action.payload as string;
      });
  },
});

export const { resetAddSuccess } = stockSlice.actions;
export default stockSlice.reducer;