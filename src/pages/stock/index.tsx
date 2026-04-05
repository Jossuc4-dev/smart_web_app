// src/pages/stock/StockScreen.tsx
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { fetchProducts } from '../../redux/slices/stockSlice';
import { selectAllProducts, selectStockLoading } from '../../redux/selectors/stock.selector';
import { useAuth } from '../../contexts/AuthContext';

// react-icons
import { 
  FaBoxOpen, 
  FaExclamationTriangle, 
  FaSearch, 
  FaTimes, 
  FaSyncAlt, 
  FaPlus, 
  FaChevronRight, 
  FaFilter,
  FaBoxes,
  FaChartLine,
  FaTag,
  FaCheckCircle,
  FaHourglassHalf,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaEdit,
  FaTrash,
  FaEllipsisV,
  FaBarcode,
  FaDownload,
  FaUpload,
  FaWarehouse
} from 'react-icons/fa';

import './index.css';
import type { Stock } from '../../models';
import BASE_URL from '../../config/ApiConfig';

type FilterType = 'all' | 'low' | 'out' | 'in-stock';

const PRODUCTS_PER_PAGE = 12;

export default function StockScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { token } = useAuth();

  const products = useAppSelector(selectAllProducts) || [];
  const loading = useAppSelector(selectStockLoading);

  const [searchValue, setSearchValue] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PRODUCTS_PER_PAGE);
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'none'>('none');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [entrepotCount, setEntrepotCount] = useState(0);

  useEffect(() => {
    if (token) {
      dispatch(fetchProducts(token));
      fetchEntrepotStats();
    }
  }, [token, dispatch]);

  const fetchEntrepotStats = async () => {
    try {
      const response = await fetch(`${BASE_URL}/stock/entrepot`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Entrepôts:', data);
        setEntrepotCount(data.length);
      }
    } catch (error) {
      console.error('Erreur chargement entrepôts:', error);
    }
  };

  const handleRefresh = () => {
    if (token) {
      setVisibleCount(PRODUCTS_PER_PAGE);
      dispatch(fetchProducts(token));
    }
  };

  const categories = useMemo(() => {
    const unique = new Set(products.map(p => p.type).filter(Boolean));
    return Array.from(unique).sort();
  }, [products]);

  const stats = useMemo(() => {
    const total = products.length;
    const low = products.filter(p => p.quantite > 0 && p.quantite < 10).length;
    const out = products.filter(p => p.quantite === 0).length;
    const inStock = products.filter(p => p.quantite >= 10).length;
    const totalValue = products.reduce((sum, p) => sum + (p.prixAchat * p.quantite), 0);
    const potentialRevenue = products.reduce((sum, p) => sum + (p.prixVente * p.quantite), 0);
    
    return { 
      total, 
      low, 
      out, 
      inStock,
      totalValue,
      potentialRevenue,
      categories: categories.length 
    };
  }, [products, categories]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (activeFilter === 'low') list = list.filter(p => p.quantite > 0 && p.quantite < 10);
    if (activeFilter === 'out') list = list.filter(p => p.quantite === 0);
    if (activeFilter === 'in-stock') list = list.filter(p => p.quantite >= 10);

    if (activeCategory) list = list.filter(p => p.type === activeCategory);

    if (searchValue.trim()) {
      const term = searchValue.toLowerCase().trim();
      list = list.filter(p => 
        p.nom.toLowerCase().includes(term) || 
        p.numero.toLowerCase().includes(term) ||
        p.type?.toLowerCase().includes(term)
      );
    }

    if (sortBy !== 'none') {
      list.sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') comparison = a.nom.localeCompare(b.nom);
        if (sortBy === 'price') comparison = a.prixVente - b.prixVente;
        if (sortBy === 'stock') comparison = a.quantite - b.quantite;
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    return list;
  }, [products, activeFilter, activeCategory, searchValue, sortBy, sortOrder]);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const loadMore = () => {
    setVisibleCount(prev => prev + PRODUCTS_PER_PAGE);
  };

  const hasMore = visibleCount < filteredProducts.length;

  const getStockStatus = (stock: Stock[]) => {
    let quantite = 0
    stock.map(s=>quantite+=s.quantite)
    if (quantite === 0) return { label: 'Rupture', className: 'status-badge danger', icon: FaExclamationTriangle };
    if (quantite < 10) return { label: 'Stock bas', className: 'status-badge warning', icon: FaHourglassHalf };
    return { label: 'En stock', className: 'status-badge success', icon: FaCheckCircle };
  };

  const getStockProgress = (stock: Stock[]) => {
    const max = 50;
    let quantite = 0
    stock.map(s=>quantite+=s.quantite)
    return Math.min((quantite / max) * 100, 100);
  };

  const toggleProductSelection = (productId: number) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const selectAll = () => {
    if (selectedProducts.length === displayedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(displayedProducts.map(p => p.id));
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <FaBoxes className="spinner-icon" />
        </div>
        <p className="loading-text">Chargement de votre stock...</p>
      </div>
    );
  }

  return (
    <div className="stock-container">
      <header className="stock-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-icon">
              <FaBoxes />
            </div>
            <div className="header-title">
              <h1>Gestion de Stock</h1>
              <p className="header-subtitle">
                {filteredProducts.length} produit{filteredProducts.length > 1 ? 's' : ''} • 
                Dernière mise à jour il y a 5 min
              </p>
            </div>
          </div>
          
          <div className="header-actions">
            <button 
              className="action-btn"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              title={viewMode === 'grid' ? 'Vue liste' : 'Vue grille'}
            >
              {viewMode === 'grid' ? <FaBoxes /> : <FaChartLine />}
            </button>
            
            <button 
              className="action-btn"
              onClick={handleRefresh}
              title="Rafraîchir"
            >
              <FaSyncAlt className={loading ? 'spin' : ''} />
            </button>

            <button className="action-btn" title="Exporter">
              <FaDownload />
            </button>

            <button className="action-btn" title="Importer">
              <FaUpload />
            </button>
          </div>
        </div>
      </header>

      <div className="stock-content">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">Total produits</span>
              <span className="stat-value">{stats.total}</span>
              <span className="stat-footer">
                <FaBoxOpen className="stat-icon-small" />
                {stats.categories} catégories
              </span>
            </div>
            <div className="stat-icon-wrapper primary">
              <FaBoxOpen />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">En stock</span>
              <span className="stat-value success">{stats.inStock}</span>
              <span className="stat-footer">
                <FaArrowUp className="stat-icon-small success" />
                +12% ce mois
              </span>
            </div>
            <div className="stat-icon-wrapper success">
              <FaCheckCircle />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">Stock bas</span>
              <span className="stat-value warning">{stats.low}</span>
              <span className="stat-footer">
                <FaHourglassHalf className="stat-icon-small warning" />
                {stats.low > 0 ? 'À réapprovisionner' : 'Aucune alerte'}
              </span>
            </div>
            <div className="stat-icon-wrapper warning">
              <FaHourglassHalf />
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-info">
              <span className="stat-label">Ruptures</span>
              <span className="stat-value danger">{stats.out}</span>
              <span className="stat-footer">
                <FaArrowDown className="stat-icon-small danger" />
                -5% vs hier
              </span>
            </div>
            <div className="stat-icon-wrapper danger">
              <FaExclamationTriangle />
            </div>
          </div>

          {/* Nouvelle carte Entrepôts */}
          <div 
            className="stat-card" 
            style={{ cursor: 'pointer' }}
            onClick={() => navigate('/stock/entrepots')}
          >
            <div className="stat-info">
              <span className="stat-label">Entrepôts</span>
              <span className="stat-value">{entrepotCount}</span>
              <span className="stat-footer">
                <FaWarehouse className="stat-icon-small" />
                Sites de stockage
              </span>
            </div>
            <div className="stat-icon-wrapper primary">
              <FaWarehouse />
            </div>
          </div>
        </div>

        {/* Valeur du stock */}
        <div className="value-card">
          <div className="value-row">
            <div className="value-item">
              <div className="value-icon">
                <FaChartLine />
              </div>
              <div className="value-info">
                <span className="value-label">Valeur totale du stock</span>
                <span className="value-number">{stats.totalValue.toLocaleString()} Ar</span>
              </div>
            </div>
            <div className="value-item">
              <div className="value-icon">
                <FaTag />
              </div>
              <div className="value-info">
                <span className="value-label">Chiffre d'affaires potentiel</span>
                <span className="value-number">{stats.potentialRevenue.toLocaleString()} Ar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="filters-section">
          <div className="search-bar">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Rechercher un produit (nom, réf, catégorie)..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="search-input"
            />
            {searchValue && (
              <FaTimes
                className="clear-search"
                onClick={() => setSearchValue('')}
              />
            )}
          </div>

          <div className="filter-actions">
            <div className="filter-buttons">
              <button
                className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                Tous
              </button>
              <button
                className={`filter-btn ${activeFilter === 'in-stock' ? 'active' : ''}`}
                onClick={() => setActiveFilter('in-stock')}
              >
                En stock
              </button>
              <button
                className={`filter-btn ${activeFilter === 'low' ? 'active' : ''}`}
                onClick={() => setActiveFilter('low')}
              >
                Stock bas
              </button>
              <button
                className={`filter-btn ${activeFilter === 'out' ? 'active' : ''}`}
                onClick={() => setActiveFilter('out')}
              >
                Rupture
              </button>
            </div>

            <div className="dropdown-container">
              <button
                className="dropdown-btn"
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              >
                <FaFilter />
                {activeCategory || 'Catégories'}
              </button>
              {showCategoryMenu && (
                <div className="dropdown-menu">
                  <button
                    className="dropdown-item"
                    onClick={() => {
                      setActiveCategory(null);
                      setShowCategoryMenu(false);
                    }}
                  >
                    Toutes les catégories
                  </button>
                  {categories.map(cat => (
                    <button
                      key={cat}
                      className="dropdown-item"
                      onClick={() => {
                        setActiveCategory(cat);
                        setShowCategoryMenu(false);
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="dropdown-container">
              <button
                className="dropdown-btn"
                onClick={() => setShowSortMenu(!showSortMenu)}
              >
                <FaArrowUp className={sortOrder === 'desc' ? 'desc' : ''} />
                Trier par
              </button>
              {showSortMenu && (
                <div className="dropdown-menu">
                  <button
                    className={`dropdown-item ${sortBy === 'name' ? 'active' : ''}`}
                    onClick={() => {
                      setSortBy('name');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      setShowSortMenu(false);
                    }}
                  >
                    Nom {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                  <button
                    className={`dropdown-item ${sortBy === 'price' ? 'active' : ''}`}
                    onClick={() => {
                      setSortBy('price');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      setShowSortMenu(false);
                    }}
                  >
                    Prix {sortBy === 'price' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                  <button
                    className={`dropdown-item ${sortBy === 'stock' ? 'active' : ''}`}
                    onClick={() => {
                      setSortBy('stock');
                      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      setShowSortMenu(false);
                    }}
                  >
                    Stock {sortBy === 'stock' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selection bar */}
        {selectedProducts.length > 0 && (
          <div className="selection-bar">
            <span>{selectedProducts.length} produit(s) sélectionné(s)</span>
            <div className="selection-actions">
              <button className="selection-btn" onClick={selectAll}>
                {selectedProducts.length === displayedProducts.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
              <button className="selection-btn">
                <FaEdit /> Modifier
              </button>
              <button className="selection-btn danger">
                <FaTrash /> Supprimer
              </button>
            </div>
          </div>
        )}

        {/* Produits Grid/List */}
        {displayedProducts.length > 0 ? (
          <>
            <div className={viewMode === 'grid' ? 'products-grid' : 'products-list'}>
              {displayedProducts.map(product => {
                const status = getStockStatus(product.Stock);
                const StatusIcon = status.icon;
                const progress = getStockProgress(product.Stock);
                const isSelected = selectedProducts.includes(product.id);

                return viewMode === 'grid' ? (
                  <div 
                    key={product.id} 
                    className={`product-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => navigate(`/stock/${product.id}`)}
                  >
                    <div className="product-card-header">
                      <div className="product-checkbox" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleProductSelection(product.id)}
                        />
                      </div>
                      <button className="product-menu" onClick={(e) => e.stopPropagation()}>
                        <FaEllipsisV />
                      </button>
                    </div>

                    <div className="product-avatar">
                      <FaBoxOpen />
                    </div>

                    <div className="product-info">
                      <h3 className="product-name">{product.nom}</h3>
                      <p className="product-ref">
                        <FaBarcode className="ref-icon" />
                        {product.numero}
                      </p>
                    </div>

                    <div className="product-category">
                      <FaTag className="category-icon" />
                      {product.type}
                    </div>

                    <div className="product-prices">
                      <div className="price-item">
                        <span className="price-label">Achat</span>
                        <span className="price-value">{product.prixAchat.toLocaleString()} Ar</span>
                      </div>
                      <div className="price-item">
                        <span className="price-label">Vente</span>
                        <span className="price-value">{product.prixVente.toLocaleString()} Ar</span>
                      </div>
                    </div>

                    <div className="product-stock">
                      <div className="stock-header">
                        <span className="stock-label">Stock</span>
                        <span className={`stock-value ${status.className}`}>
                          <StatusIcon className="stock-icon" />
                          {product.quantite}
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${progress}%`,
                            backgroundColor: product.quantite === 0 ? '#E05A5A' : product.quantite < 10 ? '#D97706' : '#1B8A5A'
                          }}
                        />
                      </div>
                    </div>

                    <div className="product-footer">
                      <span className={status.className}>
                        <StatusIcon />
                        {status.label}
                      </span>
                      <FaChevronRight className="product-arrow" />
                    </div>
                  </div>
                ) : (
                  <div 
                    key={product.id} 
                    className={`product-list-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => navigate(`/stock/${product.id}`)}
                  >
                    <div className="list-checkbox" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleProductSelection(product.id)}
                      />
                    </div>
                    
                    <div className="list-avatar">
                      <FaBoxOpen />
                    </div>

                    <div className="list-info">
                      <div className="list-name-row">
                        <h4 className="list-name">{product.nom}</h4>
                        <span className="list-ref">{product.numero}</span>
                      </div>
                      <div className="list-category">
                        <FaTag />
                        {product.type}
                      </div>
                    </div>

                    <div className="list-prices">
                      <div className="list-price">
                        <span>Achat:</span>
                        <strong>{product.prixAchat.toLocaleString()} Ar</strong>
                      </div>
                      <div className="list-price">
                        <span>Vente:</span>
                        <strong>{product.prixVente.toLocaleString()} Ar</strong>
                      </div>
                    </div>

                    <div className="list-stock">
                      <div className="list-stock-info">
                        <StatusIcon className={`stock-icon ${status.className}`} />
                        <span className={`stock-number ${status.className}`}>
                          {product.quantite}
                        </span>
                      </div>
                      <span className={`status-badge ${status.className}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="list-actions">
                      <button className="list-action" onClick={(e) => e.stopPropagation()}>
                        <FaEye />
                      </button>
                      <button className="list-action" onClick={(e) => e.stopPropagation()}>
                        <FaEdit />
                      </button>
                      <button className="list-action danger" onClick={(e) => e.stopPropagation()}>
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {hasMore && (
              <button className="load-more-btn" onClick={loadMore}>
                Charger plus de produits
              </button>
            )}
          </>
        ) : (
          <div className="empty-state">
            <FaBoxOpen className="empty-icon" />
            <h3>Aucun produit trouvé</h3>
            <p>Essayez de modifier vos filtres ou d'ajouter un nouveau produit</p>
            <button className="empty-action" onClick={() => navigate('/stock/add')}>
              <FaPlus /> Ajouter un produit
            </button>
          </div>
        )}
      </div>

      <button
        className="fab-button"
        onClick={() => navigate('/stock/add')}
      >
        <FaPlus />
      </button>
    </div>
  );
}