// src/components/Layout/Layout.tsx
import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.css';
import { StockAlertToast } from '../notifications/stockAlertToast';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, token } = useAuth();
  const location = useLocation();

  // Ne pas afficher le layout sur la page de login
  if (location.pathname === '/') {
    return <Outlet />;
  }

  const alertesStock = 0; // À remplacer par votre logique réelle

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="app-layout">
      <Sidebar
        alertesStock={alertesStock}
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
      {/*
        ✅ StockAlertToast — une seule instance, toujours montée.
        Invisible tant qu'aucune alerte n'arrive via Socket.IO.
        Seuls les ADMIN reçoivent les alertes stock (filtrage côté backend).
      */}
      {user?.role === 'ADMIN' && (
        <StockAlertToast token={token} />
      )}
    </div>
  );
};

// Fonction utilitaire pour obtenir le titre de la page
const getPageTitle = (pathname: string): string => {
  const titles: { [key: string]: string } = {
    '/dashboard': 'Tableau de bord',
    '/stock': 'Gestion de stock',
    '/vente': 'Gestion des ventes',
    '/finance': 'Finance',
    '/report': 'Rapports',
    '/rh': 'Ressources humaines',
  };

  // Gestion des sous-pages
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