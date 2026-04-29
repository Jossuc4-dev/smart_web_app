import './landing.css';
import { useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo-smart.png'
import { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';

function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="app">
      {/* ── Couches d'animation background ── */}
      <div className="bg-grid" aria-hidden="true" />

      <div className="bg-orbs" aria-hidden="true">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="orb orb-4" />
        <div className="orb orb-5" />
      </div>

      <div className="bg-circuits" aria-hidden="true">
        <div className="circuit-line cl-h1" />
        <div className="circuit-line cl-h2" />
        <div className="circuit-line cl-h3" />
        <div className="circuit-line cl-h4" />
        <div className="circuit-line cl-v1" />
        <div className="circuit-line cl-v2" />
        <div className="circuit-line cl-v3" />
      </div>

      <div className="bg-particles" aria-hidden="true">
        <div className="particle p1" /><div className="particle p2" />
        <div className="particle p3" /><div className="particle p4" />
        <div className="particle p5" /><div className="particle p6" />
        <div className="particle p7" /><div className="particle p8" />
        <div className="particle p9" /><div className="particle p10" />
        <div className="particle p11" /><div className="particle p12" />
      </div>

      <div className="bg-pulse-ring" aria-hidden="true">
        <div className="pulse-ring" />
        <div className="pulse-ring" />
        <div className="pulse-ring" />
      </div>
      {/* Barre de navigation */}
      <nav className="navbar">
        <div className="logo">
          <img src={logo} alt="SmartBusiness" height={50} className="logo-img" />
        </div>
        
        {/* Burger menu icon */}
        <button className="burger-menu" onClick={toggleMenu} aria-label="Menu">
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* Navigation links */}
        <ul className={`nav-links ${menuOpen ? 'active' : ''}`}>
          <li onClick={closeMenu}>Produits</li>
          <li onClick={closeMenu}>Activité</li>
          <li onClick={closeMenu}>Tarif</li>
          <li onClick={closeMenu}>Ressources</li>
          <li className="se-connecter" onClick={() => { navigate('/login'); closeMenu(); }}>
            <a className='login-link'>Se connecter</a>
          </li>
          <li className="creer-compte" onClick={() => { navigate('/register'); closeMenu(); }}>
            Créer un compte
          </li>
        </ul>
      </nav>

      {/* Overlay pour fermer le menu */}
      {menuOpen && <div className="menu-overlay" onClick={closeMenu} />}

      {/* Section principale */}
      <main className="hero">
        <div className='hero_text'>
          <h1 className="hero-title">
            Transformation digitale pour les Petites et Moyennes Entreprises.
          </h1>
          <p className="hero-subtitle">
            Spécialement conçu pour <strong>les PME à Madagascar</strong>
          </p>
        </div>
        <div className='hero_image'>
          <img src={logo} alt="Logo Smart Business" className='logo_hero' />
        </div>
      </main>
          <button className="cta-button" onClick={()=>navigate('/register')}>Démarrer maintenant</button>

      {/* Footer */}
      <footer className="footer">
        <div className="copyright">
          © 2025 SmartBusiness – Tous droits réservés
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;