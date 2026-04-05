// src/components/Layout/Layout.tsx
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';
import { StockAlertToast } from '../notifications/stockAlertToast';
import { NotificationToast, useToasts } from '../notifications/NotificationToast';
import { useSocketEvent } from '../../hooks/useSocket';
import type { NotificationPayload } from '../notifications/NotificationToast';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, token } = useAuth();
  const location = useLocation();
  const { toasts, addToast, removeToast } = useToasts();

  // ── Écouteurs Socket.IO ──────────────────────────────────────────
  // Notifications publiques (toute l'appli)
  useSocketEvent<NotificationPayload>(
    token,
    'notification:global',
    addToast
  );

  console.log(user)

  // Notifications privées (liées à l'entreprise de l'utilisateur)
  useSocketEvent<NotificationPayload>(
    token,
    user?.profession.entreprise.id ? `notification:user:${user.profession.entreprise.id}` : '__disabled__',
    addToast
  );
  // ────────────────────────────────────────────────────────────────

  if (location.pathname === '/') {
    return <Outlet />;
  }

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-layout">
      <Sidebar
        alertesStock={0}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        userName={user?.nom}
        userRole={user?.role === 'ADMIN' ? 'Administrateur' : 'Utilisateur'}
        onLogout={logout}
      />

      <main className="main-area">
        <div className="content-area">
          <Outlet />
        </div>
      </main>

      {/* Alertes stock — ADMIN uniquement */}
      {user?.role === 'ADMIN' && (
        <StockAlertToast token={token} />
      )}

      {/* ✅ Toast notifications temps réel */}
      <NotificationToast toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

const getPageTitle = (pathname: string): string => {
  const titles: { [key: string]: string } = {
    '/dashboard': 'Tableau de bord',
    '/stock': 'Gestion de stock',
    '/vente': 'Gestion des ventes',
    '/finance': 'Finance',
    '/report': 'Rapports',
    '/rh': 'Ressources humaines',
  };

  if (pathname.startsWith('/stock/')) {
    if (pathname.includes('/add')) return 'Ajouter un produit';
    if (pathname.includes('/update')) return 'Modifier un produit';
    return 'Détail du produit';
  }
  if (pathname.startsWith('/rh/')) {
    if (pathname.includes('/add')) return 'Ajouter un employé';
    if (pathname.includes('/update')) return 'Modifier un employé';
    return 'Détail de l\'employé';
  }
  if (pathname.startsWith('/vente/')) {
    if (pathname.includes('/add')) return 'Nouvelle vente';
    return 'Détail de la vente';
  }

  return titles[pathname] || 'My Business';
};

export default Layout;