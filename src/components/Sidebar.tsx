// src/components/Sidebar/Sidebar.tsx
import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LuLayoutDashboard,
  LuPackage,
  LuReceiptText,
  LuTriangleAlert,
  LuUser,
  LuWallet,
  LuLogOut,
  LuCircleHelp,
  LuCreditCard,
  LuChevronUp,
  LuChevronDown,
  LuBook
} from "react-icons/lu";
import "./sidebar.css";
import Logo from '../assets/images/logo-smart.png';
import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from 'react-i18next';   // ← Ajout important

// ─── Types ────────────────────────────────────────────────────────────────────
export interface SidebarProps {
  alertesStock: number;
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userRole?: string;
  onLogout?: () => void;
}

interface NavItemProps {
  icon: React.ElementType;
  label: string;
  badge?: number;
  path: string;
}

interface ProfileMenuItemProps {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  color?: string;
}

// ─── Language Switcher ───────────────────────────────────────────────────────
function LanguageSwitcher() {
  const { i18n } = useTranslation('sidebar');

  const languages = [
    { code: 'fr', label: '🇫🇷', name: 'Fr' },
    { code: 'en', label: '🇬🇧', name: 'En' }
  ];

  return (
    <div className="language-switcher">
      {languages.map(({ code, label }) => (
        <button
          key={code}
          className={`lang-btn ${i18n.language === code ? 'active' : ''}`}
          onClick={() => {
            i18n.changeLanguage(code)
          }}
          title={`Passer en ${code.toUpperCase()}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ─── NavItem (inchangé) ───────────────────────────────────────────────────────
function NavItem({ icon: Icon, label, badge, path }: NavItemProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = location.pathname === path ||
    (path !== '/dashboard' && location.pathname.startsWith(path));

  return (
    <div
      className={`nav-item${isActive ? " nav-item--active" : ""}`}
      onClick={() => navigate(path)}
    >
      <span className="nav-item__icon">
        <Icon size={18} strokeWidth={1.5} />
      </span>
      <span>{label}</span>
      {badge != null && badge > 0 && (
        <span className="nav-item__badge">{badge}</span>
      )}
    </div>
  );
}

// ─── ProfileMenuItem (inchangé) ───────────────────────────────────────────────
function ProfileMenuItem({ icon: Icon, label, onClick, color }: ProfileMenuItemProps) {
  return (
    <div className="profile-menu-item" onClick={onClick}>
      <Icon size={14} color={color || "var(--sb-text-muted)"} />
      <span style={{ color: color || "var(--sb-text-muted)" }}>{label}</span>
    </div>
  );
}

// ─── Sidebar Principal ────────────────────────────────────────────────────────
export default function Sidebar({
  alertesStock,
  isOpen,
  onClose,
  userName = "Admin",
  userRole = "Administrateur",
  onLogout
}: SidebarProps) {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation('sidebar');

  // Obtenir le prénom et les initiales
  const firstName = userName?.split(' ')[0] || "Admin";
  const initials = userName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || "AD";

  // Fermer le menu profil
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { label: t('dashboard'), icon: LuLayoutDashboard, path: "/dashboard" },
    { label: t('ventes'), icon: LuReceiptText, path: "/vente" },
    { label: t('stock'), icon: LuPackage, path: "/stock" },
    { label: t('reports'), icon: LuTriangleAlert, badge: alertesStock, path: "/report" },
    { label: t('finance'), icon: LuWallet, path: "/finance" },
    { label: t('rh'), icon: LuUser, path: "/rh" },
    { label: t('formations'), icon: LuBook, path: "/formation" }
  ];

  // ... (handleLogout, handleSubscription, handleHelp, handleProfile restent identiques)

  const handleLogout = () => {
    if (onLogout) onLogout();
    setIsProfileMenuOpen(false);
  };

  const handleSubscription = () => {
    navigate('/subscriptions');
    setIsProfileMenuOpen(false);
  };

  const handleHelp = () => {
    navigate('/aide');
    setIsProfileMenuOpen(false);
  };

  const handleProfile = () => {
    navigate(`/profile/${user?.id}`);
    setIsProfileMenuOpen(false);
  };

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}

      <aside className={`sidebar${isOpen ? " sidebar--open" : ""}`}>
        {/* ── Header avec Logo + Sélecteur de langue ─────────────────────────── */}
        <div className="sidebar__header">
          <div className="sidebar__logo">
            <div className="sidebar__logo-icon">
              <img src={Logo} alt="Logo" className="sidebar__logo-image" width={30} height={30} />
            </div>
            <span className="sidebar__logo-text">My Business</span>
          </div>

          {/* ← Sélecteur de langue ajouté ici */}
          <LanguageSwitcher />
        </div>

        {/* ── Navigation ───────────────────────────────────────────────────── */}
        <span className="sidebar__section-label">Navigation</span>
        <nav className="sidebar__nav">
          {navItems.map((item) => (
            <NavItem key={item.path} {...item} />
          ))}
        </nav>

        {/* Footer utilisateur (inchangé) */}
        <div className="sidebar__footer" ref={profileRef}>
          {/* ... reste du code du footer identique ... */}
          <div
            className="sidebar__user"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          >
            <div className="sidebar__avatar">{initials}</div>
            <div className="sidebar__user-info">
              <div className="sidebar__user-name">{firstName}</div>
              <div className="sidebar__user-role">{userRole}</div>
            </div>
            <div className="sidebar__user-arrow">
              {isProfileMenuOpen ? <LuChevronUp size={16} /> : <LuChevronDown size={16} />}
            </div>
          </div>

          {isProfileMenuOpen && (
            <div className="profile-menu">
              <ProfileMenuItem icon={LuUser} label={t('profil')} onClick={handleProfile} />
              <ProfileMenuItem icon={LuCreditCard} label={t('abonnement')} onClick={handleSubscription} />
              <ProfileMenuItem icon={LuCircleHelp} label={t('aide')} onClick={handleHelp} />
              <div className="profile-menu-divider" />
              <ProfileMenuItem
                icon={LuLogOut}
                label={t('deconnexion')}
                onClick={handleLogout}
                color="#f87171"
              />
            </div>
          )}
        </div>
      </aside>
    </>
  );
}