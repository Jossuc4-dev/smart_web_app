// src/pages/ventes/add/index.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../redux/store';
import { fetchForSalesProducts, fetchProducts } from '../../../redux/slices/stockSlice';
import { useAuth } from '../../../contexts/AuthContext';
import { FaSearch, FaTimes, FaFilter, FaArrowLeft, FaPlus } from 'react-icons/fa';
import ProductCard from '../../../components/Card/ProductCard';
import './index.css';

export default function SelectProductsScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const products = useAppSelector(state => state.stock.products) || [];
  const loading = useAppSelector(state => state.stock.status === 'loading');
  
  const [searchValue, setSearchValue] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    if (token) {
      dispatch(fetchForSalesProducts(token));
    }
  }, [token, dispatch]);

  const categories = useMemo(() => {
    const unique = new Set(products.map(p => p.type).filter(Boolean));
    return Array.from(unique).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (activeCategory) {
      filtered = filtered.filter(p => p.type === activeCategory);
    }

    if (searchValue.trim()) {
      const query = searchValue.toLowerCase();
      filtered = filtered.filter(
        p => p.nom.toLowerCase().includes(query) ||
             (p.numero && p.numero?.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [products, activeCategory, searchValue]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;
  const isFilterActive = activeCategory !== null || searchValue.trim() !== '';

  const loadMore = () => {
    setVisibleCount(prev => prev + 15);
  };

  const resetFilters = () => {
    setActiveCategory(null);
    setSearchValue('');
    setVisibleCount(15);
  };

  const handleRefresh = () => {
    setVisibleCount(15);
    if (token) {
      dispatch(fetchProducts(token));
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="select-products-loading-container">
        <div className="spinner" />
        <p>Chargement des produits...</p>
      </div>
    );
  }

  return (
    <div className="select-products-container">
      <div className="select-products-header">
        <button className="back-btn" onClick={() => navigate('/ventes')}>
          <FaArrowLeft />
        </button>
        <h1>Sélectionner un produit</h1>
      </div>

      <div className="select-products-top-bar">
        <div className="select-products-search-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="search-input"
          />
          {searchValue && (
            <FaTimes className="clear-icon" onClick={() => setSearchValue('')} />
          )}
        </div>

        <button 
          className="category-menu-btn"
          onClick={() => setShowCategoryMenu(true)}
        >
          <FaFilter />
          <span>Catégories</span>
        </button>
      </div>

      <div className="select-products-list">
        {displayedProducts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>{searchValue || activeCategory ? 'Aucun produit trouvé' : 'Aucun produit disponible'}</h3>
            <p>Essayez de modifier la recherche ou les catégories</p>
            {isFilterActive && (
              <button className="reset-filters-btn" onClick={resetFilters}>
                Réinitialiser les filtres
              </button>
            )}
          </div>
        ) : (
          <>
            {displayedProducts.map(produit => (
              <div 
                key={produit.id}
                onClick={() => navigate(`/ventes/add/${produit.id}`)}
                className="product-card-link"
              >
                <ProductCard produit={produit} />
              </div>
            ))}

            {hasMore && (
              <button className="load-more-btn" onClick={loadMore}>
                Voir plus
                <span className="load-more-icon">↓</span>
              </button>
            )}
          </>
        )}
      </div>

      {showCategoryMenu && (
        <div className="modal-overlay" onClick={() => setShowCategoryMenu(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Catégories</h2>
              <button className="close-btn" onClick={() => setShowCategoryMenu(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-list">
              <button
                className={`modal-category-item ${!activeCategory ? 'active' : ''}`}
                onClick={() => {
                  setActiveCategory(null);
                  setVisibleCount(15);
                  setShowCategoryMenu(false);
                }}
              >
                Toutes les catégories
              </button>

              {categories.map(cat => (
                <button
                  key={cat}
                  className={`modal-category-item ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => {
                    setActiveCategory(activeCategory === cat ? null : cat);
                    setVisibleCount(15);
                    setShowCategoryMenu(false);
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {isFilterActive && (
              <button 
                className="modal-reset-btn"
                onClick={() => {
                  resetFilters();
                  setShowCategoryMenu(false);
                }}
              >
                Réinitialiser les filtres
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}