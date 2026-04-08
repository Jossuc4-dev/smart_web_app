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
import LanguageSwitcher from '../LanguageSwitcher';           // ← NOUVEAU
import { useTranslation } from 'react-i18next';             // ← NOUVEAU

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, token } = useAuth();
  const location = useLocation();
  const { toasts, addToast, removeToast } = useToasts();
  const { t } = useTranslation(['common', 'sidebar']);     // ← Ajout

  // ── Écouteurs Socket.IO ──────────────────────────────────────────
  useSocketEvent<NotificationPayload>(
    token,
    'notification:global',
    addToast
  );

  useSocketEvent<NotificationPayload>(
    token,
    user?.profession.entreprise.id ? `notification:user:${user.profession.entreprise.id}` : '__disabled__',
    addToast
  );

  if (location.pathname === '/') {
    return <Outlet />;
  }

  const closeSidebar = () => setSidebarOpen(false);

  // Titre de page traduit
  const pageTitle = getPageTitle(location.pathname, t);

  return (
    <div className="app-layout">
      <Sidebar
        alertesStock={0}
        isOpen={sidebarOpen}
        onClose={closeSidebar}
        userName={user?.nom}
        userRole={user?.role === 'ADMIN' ? t('sidebar:role.admin') : t('sidebar:role.user')}
        onLogout={logout}
      />

      <main className="main-area">
        {/* Top Bar avec LanguageSwitcher */}
        <div className="top-bar">
          <button 
            className="menu-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
          >
            ☰
          </button>

          {/* <h1 className="page-title">{pageTitle}</h1> */}

          <div className="top-bar-actions">
            <LanguageSwitcher />   {/* ← Placé en haut à droite */}
          </div>
        </div>

        <div className="content-area">
          <Outlet />
        </div>
      </main>

      {/* Alertes stock — ADMIN uniquement */}
      {user?.role === 'ADMIN' && (
        <StockAlertToast token={token} />
      )}

      {/* Toast notifications */}
      <NotificationToast toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

// Fonction getPageTitle traduite
const getPageTitle = (pathname: string, t: any): string => {
  const titles: { [key: string]: string } = {
    '/dashboard': t('sidebar:menu.dashboard'),
    '/stock': t('sidebar:menu.stock'),
    '/vente': t('sidebar:menu.sales'),
    '/ventes': t('sidebar:menu.sales'),
    '/finance': t('sidebar:menu.finance'),
    '/report': t('sidebar:menu.reports'),
    '/rh': t('sidebar:menu.rh'),
    '/formation': t('sidebar:menu.formation'),
    '/aide/': t('sidebar:menu.help'),
    '/subscriptions': t('sidebar:menu.subscriptions'),
  };

  if (pathname.startsWith('/stock/')) {
    if (pathname.includes('/add')) return t('common:action.add_product');
    if (pathname.includes('/update')) return t('common:action.update_product');
    if (pathname.includes('/reapprovisionner')) return t('common:action.restock');
    return t('common:title.product_detail');
  }

  if (pathname.startsWith('/rh/')) {
    if (pathname.includes('/add')) return t('common:action.add_user');
    if (pathname.includes('/update')) return t('common:action.update_user');
    return t('common:title.user_detail');
  }

  if (pathname.startsWith('/ventes/add')) {
    return t('common:title.new_sale');
  }

  if (pathname.startsWith('/profile/')) {
    return t('common:title.profile');
  }

  return titles[pathname] || t('common:title.app_name');
};

export default Layout;