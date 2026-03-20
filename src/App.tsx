// src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import './App.css';
import { Provider } from "react-redux";
import { store } from "./redux/store";
import {AuthProvider} from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/route/ProtectedRoute";
import { PublicRoute } from "./components/route/PublicRoute";
import Layout from "./components/Layout/Layout";

// Pages
import DashboardScreen from './pages/dashboard';
import AuthScreen from "./pages/auth";
import StockScreen from "./pages/stock";
import FinanceScreen from "./pages/finance";
import ReportPage from "./pages/report";
import VenteScreen from "./pages/ventes";
import RHScreen from "./pages/rh";
import UpdateProductScreen from "./pages/stock/update";
import AddProductScreen from "./pages/stock/add";
import ProductDetailScreen from "./pages/stock/id";
import UserDetailScreen from "./pages/rh/id";
import AddUserScreen from "./pages/rh/add";
import UpdateUserScreen from "./pages/rh/update";
import SelectProductsScreen from "./pages/ventes/add";
import AddCommandeForm from "./pages/ventes/add/[id]";
import AbonnementsScreen from "./pages/subscriptions";
import SubscribeScreen from "./pages/subscriptions/add/[id]";
import HelpScreen from "./pages/help";
import DepositScreen from "./pages/finance/wallet";
import Wallet from "./pages/finance/wallet";
import ForgotPassword from "./pages/auth/forgotPassword";
import ResetPassword from "./pages/auth/resetPassword";

function App() {
  return (
    <Provider store={store}>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Route publique - sans layout */}
            <Route
              path="/"
              element={
                <PublicRoute>
                  <AuthScreen />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPassword />
                </PublicRoute>
              }
            />
             <Route
              path="/reset-password"
              element={
                <PublicRoute>
                  <ResetPassword />
                </PublicRoute>
              }
            />

            {/* Routes protégées avec Layout */}
            <Route element={<Layout />}>
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardScreen />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/stock"
                element={
                  <ProtectedRoute>
                    <StockScreen />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/stock/:id"
                element={
                  <ProtectedRoute>
                    <ProductDetailScreen />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/stock/add"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AddProductScreen />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/stock/update/:id"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <UpdateProductScreen />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/finance"
                element={
                  <ProtectedRoute>
                    <FinanceScreen />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/finance/wallet"
                element={
                  <ProtectedRoute>
                    <Wallet />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/report"
                element={
                  <ProtectedRoute>
                    <ReportPage />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/vente"
                element={
                  <ProtectedRoute>
                    <VenteScreen />
                  </ProtectedRoute>
                }
              />

              <Route
                path='/ventes'
                element={
                  <ProtectedRoute>
                    <VenteScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/ventes/add'
                element={
                  <ProtectedRoute>
                    <SelectProductsScreen />
                  </ProtectedRoute>
                }
              />
              <Route
                path='/ventes/add/:id'
                element={
                  <ProtectedRoute>
                    <AddCommandeForm />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/rh"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <RHScreen />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/rh/:id"
                element={
                  <ProtectedRoute>
                    <UserDetailScreen />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/rh/add"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AddUserScreen />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/rh/update/:id"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <UpdateUserScreen />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/subscriptions"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AbonnementsScreen />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/subscriptions/add/:id"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <SubscribeScreen />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/aide/"
                element={
                  <ProtectedRoute>
                    <HelpScreen />
                  </ProtectedRoute>
                }
              />

            </Route>
            {/* Redirection 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </Provider>
  );
}

export default App;