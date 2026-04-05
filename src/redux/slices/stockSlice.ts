// src/redux/slices/stockSlice.ts
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import BASE_URL from '../../config/ApiConfig';
import type { Produit } from '../../models';

interface StockState {
  products: Produit[];
  salesProducts: Produit[]; // Ajout d'un état séparé pour les produits de vente
  status: 'idle' | 'loading' | 'failed';
  salesStatus: 'idle' | 'loading' | 'failed'; // Statut pour les produits de vente
  addStatus: 'idle' | 'adding' | 'succeeded' | 'failed';
  addSuccess: boolean;
  error: string | null;
}

const initialState: StockState = {
  products: [],
  salesProducts: [],
  status: 'idle',
  salesStatus: 'idle',
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
      const data = await response.json()
      console.log({produits:data})
      return data;
    } catch (err) {
      return rejectWithValue((err as Error).message);
    }
  }
);

export const fetchForSalesProducts = createAsyncThunk<Produit[], string>(
  'stock/fetchForSalesProducts',
  async (token, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/stock/produit/sales`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // Filtrer uniquement les produits avec stock > 0 pour la vente
      return data;
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

export const updateProduct = createAsyncThunk<Produit, { id: number; data: any; token: string }>(
  'stock/updateProduct',
  async ({ id, data, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/stock/produit/${id}`, {
        method: 'PUT',
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

export const deleteProduct = createAsyncThunk<number, { id: number; token: string }>(
  'stock/deleteProduct',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${BASE_URL}/stock/produit/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return id;
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
    clearSalesProducts: (state) => {
      state.salesProducts = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<Produit[]>) => {
        state.status = 'idle';
        state.products = action.payload;
        // Mettre à jour aussi les produits de vente si nécessaire
        state.salesProducts = action.payload.filter(p => p.quantite > 0);
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload as string;
      })
      
      // Fetch Sales Products
      .addCase(fetchForSalesProducts.pending, (state) => {
        state.salesStatus = 'loading';
      })
      .addCase(fetchForSalesProducts.fulfilled, (state, action: PayloadAction<Produit[]>) => {
        state.salesStatus = 'idle';
        state.salesProducts = action.payload;
      })
      .addCase(fetchForSalesProducts.rejected, (state, action) => {
        state.salesStatus = 'failed';
        state.error = action.payload as string;
      })
      
      // Add Product
      .addCase(addProduct.pending, (state) => {
        state.addStatus = 'adding';
        state.addSuccess = false;
        state.error = null;
      })
      .addCase(addProduct.fulfilled, (state, action: PayloadAction<Produit>) => {
        state.addStatus = 'succeeded';
        state.addSuccess = true;
        state.products.push(action.payload);
        // Ajouter aux produits de vente si quantite > 0
        if (action.payload.quantite > 0) {
          state.salesProducts.push(action.payload);
        }
      })
      .addCase(addProduct.rejected, (state, action) => {
        state.addStatus = 'failed';
        state.addSuccess = false;
        state.error = action.payload as string;
      })
      
      // Update Product
      .addCase(updateProduct.fulfilled, (state, action: PayloadAction<Produit>) => {
        const index = state.products.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.products[index] = action.payload;
        }
        
        // Mettre à jour les produits de vente
        const salesIndex = state.salesProducts.findIndex(p => p.id === action.payload.id);
        if (action.payload.quantite > 0) {
          if (salesIndex !== -1) {
            state.salesProducts[salesIndex] = action.payload;
          } else {
            state.salesProducts.push(action.payload);
          }
        } else {
          if (salesIndex !== -1) {
            state.salesProducts.splice(salesIndex, 1);
          }
        }
      })
      
      // Delete Product
      .addCase(deleteProduct.fulfilled, (state, action: PayloadAction<number>) => {
        state.products = state.products.filter(p => p.id !== action.payload);
        state.salesProducts = state.salesProducts.filter(p => p.id !== action.payload);
      });
  },
});

export const { resetAddSuccess, clearSalesProducts } = stockSlice.actions;
export default stockSlice.reducer;