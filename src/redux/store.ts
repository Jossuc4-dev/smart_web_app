// src/redux/store.ts
import { configureStore } from '@reduxjs/toolkit';
import rhReducer from './slices/rhSlices';
import stockReducer from './slices/stockSlice';
import financeReducer from './slices/financeSlice';
import venteReducer from './slices/venteSlice';
import adminReducer from './slices/adminSlice';
import compteReducer from './slices/compteFinanceSlice';


export const store = configureStore({
  reducer: {
    rh: rhReducer,
    stock: stockReducer,
    finance: financeReducer,
    vente: venteReducer,
    admin: adminReducer,
    compte: compteReducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // If needed for non-serializable data
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Hooks (if not already using useAppSelector/useAppDispatch)
import {  useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;