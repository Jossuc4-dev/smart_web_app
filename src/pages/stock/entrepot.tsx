// src/pages/stock/EntrepotsScreen.tsx - Version mise à jour avec bouton d'ajout
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  FaWarehouse,
  FaArrowLeft,
  FaBoxes,
  FaMapMarkerAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaHourglassHalf,
  FaChartLine,
  FaShoppingCart,
  FaBoxOpen,
  FaPlus,
  FaCheck
} from 'react-icons/fa';
import './entrepot.css';
import BASE_URL from '../../config/ApiConfig';

interface EntrepotProduit {
  id: number;
  reference: string;
  quantite: number;
  transport: number;
  dateDepot: string;
  produit: {
    id: number;
    nom: string;
    numero: string;
    prixVente: number;
    type: string;
    prixAchat: number;
    quantite: number;
  };
}

interface Entrepot {
  id: number;
  ville: string;
  zone: string;
  idEntreprise: number;
  Stock?: EntrepotProduit[];
  produits?: EntrepotProduit[];
}

export default function EntrepotsScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { token } = useAuth();
  const [entrepots, setEntrepots] = useState<Entrepot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntrepot, setSelectedEntrepot] = useState<Entrepot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Vérifier s'il y a un message de succès dans la navigation
  useEffect(() => {
    if (location.state?.success && location.state?.message) {
      setSuccessMessage(location.state.message);
      // Effacer le message après 5 secondes
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  useEffect(() => {
    fetchEntrepots();
  }, [token]);

  const fetchEntrepots = async () => {
    try {
      const response = await fetch(`${BASE_URL}/stock/entrepot`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erreur chargement des entrepôts');
      const data = await response.json();
      setEntrepots(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntrepotDetails = async (entrepotId: number) => {
    try {
      const response = await fetch(`${BASE_URL}/stock/entrepot/${entrepotId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erreur chargement des détails');
      const data = await response.json();
      setSelectedEntrepot(data);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const getStockStatus = (quantite: number) => {
    if (quantite === 0) return { label: 'Épuisé', className: 'status-danger', icon: FaExclamationTriangle };
    if (quantite < 10) return { label: 'Stock critique', className: 'status-warning', icon: FaHourglassHalf };
    return { label: 'En stock', className: 'status-success', icon: FaCheckCircle };
  };

  const getEntrepotStats = (entrepot: Entrepot) => {
    const stocks = entrepot.Stock || entrepot.produits || [];
    const totalProduits = stocks.length;
    const totalQuantite = stocks.reduce((sum, s) => sum + s.quantite, 0);
    const valeurStock = stocks.reduce((sum, s) => sum + (s.quantite * s.produit.prixVente), 0);
    const epuise = stocks.filter(s => s.quantite === 0).length;
    const critique = stocks.filter(s => s.quantite > 0 && s.quantite < 10).length;
    const ok = stocks.filter(s => s.quantite >= 10).length;
    
    return { totalProduits, totalQuantite, valeurStock, epuise, critique, ok };
  };

  const getProduitsList = (entrepot: Entrepot) => {
    return entrepot.Stock || entrepot.produits || [];
  };

  if (loading) {
    return (
      <div className="entrepots-loading">
        <div className="spinner"></div>
        <p>Chargement des entrepôts...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="entrepots-error">
        <FaExclamationTriangle />
        <h2>Erreur</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  return (
    <div className="entrepots-container">
      <header className="entrepots-header">
        <div className="header-content">
          <button className="back-btn" onClick={() => navigate('/stock')}>
            <FaArrowLeft />
          </button>
          <div className="header-title">
            <div className="header-icon">
              <FaWarehouse />
            </div>
            <div>
              <h1>Gestion des Entrepôts</h1>
              <p>{entrepots.length} site(s) de stockage</p>
            </div>
          </div>
          {/* Bouton d'ajout d'entrepôt */}
          <button 
            className="add-entrepot-btn"
            onClick={() => navigate('/stock/entrepots/add')}
          >
            <FaPlus />
            Ajouter un entrepôt
          </button>
        </div>
      </header>

      <div className="entrepots-content">
        {/* Message de succès */}
        {successMessage && (
          <div className="success-message">
            <FaCheck />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Grille des entrepôts */}
        {entrepots.length === 0 ? (
          <div className="empty-entrepots">
            <FaWarehouse className="empty-icon" />
            <h3>Aucun entrepôt</h3>
            <p>Vous n'avez pas encore créé d'entrepôt.</p>
            <button 
              className="create-first-btn"
              onClick={() => navigate('/stock/entrepots/add')}
            >
              <FaPlus />
              Créer votre premier entrepôt
            </button>
          </div>
        ) : (
          <div className="entrepots-grid">
            {entrepots.map((entrepot) => {
              const stats = getEntrepotStats(entrepot);
              return (
                <div
                  key={entrepot.id}
                  className="entrepot-card"
                  onClick={() => fetchEntrepotDetails(entrepot.id)}
                >
                  <div className="entrepot-card-header">
                    <FaWarehouse className="entrepot-icon" />
                    <h3>{entrepot.ville}</h3>
                  </div>
                  <div className="entrepot-card-body">
                    <div className="entrepot-location">
                      <FaMapMarkerAlt />
                      <span>Zone: {entrepot.zone}</span>
                    </div>
                    <div className="entrepot-stats-preview">
                      <div className="preview-item">
                        <FaBoxes />
                        <span>{stats.totalProduits} produits</span>
                      </div>
                      <div className="preview-item">
                        <FaShoppingCart />
                        <span>{stats.totalQuantite} unités</span>
                      </div>
                    </div>
                  </div>
                  <div className="entrepot-card-footer">
                    <span>Voir les détails</span>
                    <FaArrowLeft className="arrow-icon" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Détails de l'entrepôt sélectionné */}
        {selectedEntrepot && (
          <div className="entrepot-details">
            <div className="details-header">
              <div className="details-title">
                <FaWarehouse />
                <h2>{selectedEntrepot.ville} - Zone {selectedEntrepot.zone}</h2>
              </div>
              <button className="close-details" onClick={() => setSelectedEntrepot(null)}>
                ✕
              </button>
            </div>

            {(() => {
              const stats = getEntrepotStats(selectedEntrepot);
              const produits = getProduitsList(selectedEntrepot);
              return (
                <>
                  <div className="details-stats">
                    <div className="stat-item">
                      <FaBoxes />
                      <div>
                        <span className="stat-value">{stats.totalProduits}</span>
                        <span className="stat-label">Produits distincts</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <FaShoppingCart />
                      <div>
                        <span className="stat-value">{stats.totalQuantite}</span>
                        <span className="stat-label">Unités totales</span>
                      </div>
                    </div>
                    <div className="stat-item">
                      <FaChartLine />
                      <div>
                        <span className="stat-value">{stats.valeurStock.toLocaleString()} Ar</span>
                        <span className="stat-label">Valeur du stock</span>
                      </div>
                    </div>
                  </div>

                  <div className="status-summary">
                    <div className="status-badge status-danger">
                      <FaExclamationTriangle />
                      <span>Épuisé: {stats.epuise}</span>
                    </div>
                    <div className="status-badge status-warning">
                      <FaHourglassHalf />
                      <span>Critique: {stats.critique}</span>
                    </div>
                    <div className="status-badge status-success">
                      <FaCheckCircle />
                      <span>OK: {stats.ok}</span>
                    </div>
                  </div>

                  <div className="products-list">
                    <h3>Produits dans cet entrepôt</h3>
                    {produits.length === 0 ? (
                      <div className="empty-products">
                        <FaBoxOpen />
                        <p>Aucun produit dans cet entrepôt</p>
                      </div>
                    ) : (
                      <div className="products-table">
                        <table>
                          <thead>
                            <tr>
                              <th>Produit</th>
                              <th>Référence</th>
                              <th>Catégorie</th>
                              <th>Quantité</th>
                              <th>Prix unitaire</th>
                              <th>Valeur totale</th>
                            </tr>
                          </thead>
                          <tbody>
                            {produits.map((stock) => {
                              const status = getStockStatus(stock.quantite);
                              const StatusIcon = status.icon;
                              return (
                                <tr key={stock.id} className={status.className}>
                                  <td>
                                    <strong>{stock.produit.nom}</strong>
                                  </td>
                                  <td>{stock.produit.numero}</td>
                                  <td>{stock.produit.type}</td>
                                  <td className="quantity-cell">
                                    <span className={`quantity-badge ${status.className}`}>
                                      <StatusIcon />
                                      {stock.quantite}
                                    </span>
                                  </td>
                                  <td>{stock.produit.prixVente.toLocaleString()} Ar</td>
                                  <td>{(stock.quantite * stock.produit.prixVente).toLocaleString()} Ar</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}