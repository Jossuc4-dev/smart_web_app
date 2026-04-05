// src/pages/stock/[id].tsx
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LuPackage, LuArrowLeft, LuTrash2, LuShoppingCart,
  LuTrendingUp, LuTrendingDown, LuCalendar, LuDollarSign,
  LuBox, LuTruck, LuRefreshCw, LuCircleAlert, LuCirclePlus,
  LuPen, LuCircleCheck, LuCircleX, LuChartBar,
  LuArrowUp, LuArrowDown, LuWarehouse
} from 'react-icons/lu';
import {
  AreaChart, Area, CartesianGrid, ResponsiveContainer,
  Tooltip, XAxis, YAxis, BarChart, Bar, Legend
} from 'recharts';
import BASE_URL from '../../config/ApiConfig';
import './id.css';

// ─── Types alignés avec le schéma Prisma ─────────────────────────────────────

interface StockLine {
  quantite: number;
  transport: number;
  dateDepot: string;
  entrepot: {
    id: number;
    ville: string;
    zone: string;
  };
}

interface Transaction {
  id: number;
  type: 'ENTREE' | 'SORTIE';
  quantite: number;
  date: string;
  prixUnitaire: number;
  transport: number | null;
  ref: string;
  // ✅ `montant` n'existe pas en base → calculé ici
}

interface Commande {
  id: number;
  quantite: number;
  date: string;
  valide: boolean;
}

interface Product {
  id: number;
  numero: string;
  nom: string;
  type: string;
  quantite: number;
  prixAchat: number;
  prixVente: number;
  finalite: 'VENTE' | 'MATIERE_PREMIERE';
  seuilAlerte?: number;
  commandes?: Commande[];
  transactions?: Transaction[];
  Stock?: StockLine[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Montant d'une transaction = quantite × (prixUnitaire + transport/quantite) */
const getMontant = (t: Transaction): number =>
  t.quantite * t.prixUnitaire + (t.transport ?? 0);

// ─── Tooltip ─────────────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const formattedDate = new Date(label).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  return (
    <div className="chart-tooltip">
      <p className="tooltip-date">{formattedDate}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="tooltip-entry">
          <div className="tooltip-color" style={{ backgroundColor: entry.color }} />
          <div className="tooltip-content">
            <span className="tooltip-label">{entry.name}</span>
            <span className="tooltip-value">{entry.value.toLocaleString('fr-FR')} Ar</span>
            {entry.payload.quantite && (
              <span className="tooltip-quantite">
                ({entry.payload.quantite} unité{entry.payload.quantite > 1 ? 's' : ''})
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Composant ───────────────────────────────────────────────────────────────

export default function ProductDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'mouvements' | 'commandes' | 'stocks'>('overview');
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chartType, setChartType] = useState<'area' | 'bar'>('area');

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  const fetchProduct = async () => {
    if (!token || !id) return;
    try {
      setRefreshing(true);
      const res = await fetch(`${BASE_URL}/stock/produit/${id}`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Erreur lors du chargement du produit');
      const data = await res.json();
      setProduct(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchProduct(); }, [id, token]);

  const handleDelete = async () => {
    if (!token || !id) return;
    try {
      const res = await fetch(`${BASE_URL}/stock/produit/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Erreur lors de la suppression');
      navigate('/stock', { state: { message: 'Produit supprimé avec succès' } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      setShowDeleteModal(false);
    }
  };

  const handleValidateCommande = async (commandeId: number) => {
    if (!token) return;
    try {
      const res = await fetch(`${BASE_URL}/vente/commande/valid/${commandeId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setProduct(prev => prev ? {
          ...prev,
          commandes: prev.commandes?.map(cmd =>
            cmd.id === commandeId ? { ...cmd, valide: true } : cmd
          ),
        } : prev);
      }
    } catch (err) {
      console.error('Erreur validation commande:', err);
    }
  };

  // ── Données graphique ──
  // ✅ `montant` calculé localement (pas de champ `montant` en base)
  const chartData = product?.transactions
    ?.slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(t => ({
      date: t.date,
      entree: t.type === 'ENTREE' ? getMontant(t) : 0,
      sortie: t.type === 'SORTIE' ? getMontant(t) : 0,
      quantite: t.quantite,
    })) || [];

  const aggregatedData = chartData.reduce((acc: any[], curr) => {
    const dateKey = new Date(curr.date).toLocaleDateString('fr-FR');
    const existing = acc.find(i => i.dateKey === dateKey);
    if (existing) {
      existing.entree += curr.entree;
      existing.sortie += curr.sortie;
      existing.quantite += curr.quantite;
    } else {
      acc.push({ dateKey, date: curr.date, entree: curr.entree, sortie: curr.sortie, quantite: curr.quantite });
    }
    return acc;
  }, []);

  // ── Stats ──
  const totalEntrees = product?.transactions?.filter(t => t.type === 'ENTREE').reduce((s, t) => s + t.quantite, 0) || 0;
  const totalSorties = product?.transactions?.filter(t => t.type === 'SORTIE').reduce((s, t) => s + t.quantite, 0) || 0;
  const totalMontantEntrees = product?.transactions?.filter(t => t.type === 'ENTREE').reduce((s, t) => s + getMontant(t), 0) || 0;
  const totalMontantSorties = product?.transactions?.filter(t => t.type === 'SORTIE').reduce((s, t) => s + getMontant(t), 0) || 0;
  const commandesEnAttente = product?.commandes?.filter(c => !c.valide).length || 0;
  const seuilAlerte = product?.seuilAlerte || 10;
  const isLowStock = (product?.quantite || 0) <= seuilAlerte;

  // ── Stock total depuis les lignes (source de vérité) ──
  const stockFromLines = product?.Stock?.reduce((s, l) => s + l.quantite, 0) ?? product?.quantite ?? 0;

  if (loading) return (
    <div className="product-detail-loading"><div className="spinner" /><p>Chargement du produit...</p></div>
  );

  if (error || !product) return (
    <div className="product-detail-error">
      <LuCircleAlert size={48} />
      <h2>Erreur</h2>
      <p>{error || 'Produit non trouvé'}</p>
      <button onClick={() => navigate('/stock')} className="back-to-list">Retour à la liste</button>
    </div>
  );

  return (
    <div className="product-detail-container">
      {/* Header */}
      <div className="product-detail-header">
        <div className="header-left">
          <button className="back-button" onClick={() => navigate('/stock')}>
            <LuArrowLeft size={20} /> Retour
          </button>
          <div className="header-title">
            <h1>{product.nom}</h1>
            <span className="product-ref">Réf : {product.numero} — {product.type}</span>
          </div>
        </div>
        <div className="header-actions">
          <button className="refresh-button" onClick={fetchProduct} disabled={refreshing}>
            <LuRefreshCw className={refreshing ? 'spinning' : ''} size={18} /> Actualiser
          </button>
          <button className="restock-button" onClick={() => navigate(`/stock/reapprovisionner/${id}`)}>
            <LuCirclePlus size={18} /> Réapprovisionner
          </button>
          {isAdmin && (
            <>
              <button className="edit-button" onClick={() => navigate(`/stock/update/${id}`)}>
                <LuPen size={18} /> Modifier
              </button>
              <button className="delete-button" onClick={() => setShowDeleteModal(true)}>
                <LuTrash2 size={18} /> Supprimer
              </button>
            </>
          )}
        </div>
      </div>

      {/* Alerte stock bas */}
      {isLowStock && (
        <div className="stock-alert-banner">
          <LuCircleAlert size={24} />
          <div className="alert-content">
            <strong>Stock critique</strong>
            <p>Ce produit est en dessous du seuil d'alerte ({seuilAlerte} unités).</p>
          </div>
          <button className="alert-action" onClick={() => navigate(`/stock/reapprovisionner/${id}`)}>
            Réapprovisionner
          </button>
        </div>
      )}

      {/* KPI */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(5,170,101,0.1)', color: '#05aa65' }}><LuPackage /></div>
          <div className="kpi-content">
            <span className="kpi-label">Stock actuel</span>
            <span className="kpi-value">{stockFromLines.toLocaleString()}</span>
            <span className="kpi-unit">unités</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(52,152,219,0.1)', color: '#3498db' }}><LuDollarSign /></div>
          <div className="kpi-content">
            <span className="kpi-label">Prix de vente</span>
            <span className="kpi-value">{product.prixVente.toLocaleString()}</span>
            <span className="kpi-unit">Ar</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(155,89,182,0.1)', color: '#9b59b6' }}><LuTruck /></div>
          <div className="kpi-content">
            <span className="kpi-label">Prix d'achat</span>
            <span className="kpi-value">{product.prixAchat.toLocaleString()}</span>
            <span className="kpi-unit">Ar</span>
          </div>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: 'rgba(241,196,15,0.1)', color: '#f1c40f' }}><LuShoppingCart /></div>
          <div className="kpi-content">
            <span className="kpi-label">Commandes en attente</span>
            <span className="kpi-value">{commandesEnAttente}</span>
            <span className="kpi-unit">{commandesEnAttente > 1 ? 'commandes' : 'commande'}</span>
          </div>
        </div>
      </div>

      {/* Stats entrées / sorties */}
      <div className="stats-row">
        <div className="stat-card-small">
          <LuTrendingUp className="stat-icon-success" />
          <div>
            <span className="stat-label-small">Total entrées</span>
            <span className="stat-value-small">{totalEntrees.toLocaleString()} unités</span>
            <span className="stat-sub">{totalMontantEntrees.toLocaleString()} Ar</span>
          </div>
        </div>
        <div className="stat-card-small">
          <LuTrendingDown className="stat-icon-danger" />
          <div>
            <span className="stat-label-small">Total sorties</span>
            <span className="stat-value-small">{totalSorties.toLocaleString()} unités</span>
            <span className="stat-sub">{totalMontantSorties.toLocaleString()} Ar</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="detail-tabs">
        {(['overview', 'mouvements', 'commandes', 'stocks'] as const).map(tab => (
          <button
            key={tab}
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'overview' ? 'Aperçu' : tab === 'mouvements' ? 'Mouvements' : tab === 'commandes' ? 'Commandes' : 'Stocks / Entrepôts'}
          </button>
        ))}
      </div>

      <div className="tab-content">

        {/* ── Aperçu ── */}
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="chart-card">
              <div className="chart-header">
                <h3>Évolution des mouvements financiers</h3>
                <div className="chart-controls">
                  <div className="chart-type-toggle">
                    {(['area', 'bar'] as const).map(t => (
                      <button key={t} className={`chart-type-btn ${chartType === t ? 'active' : ''}`} onClick={() => setChartType(t)}>
                        <LuChartBar size={16} /> {t === 'area' ? 'Aire' : 'Barres'}
                      </button>
                    ))}
                  </div>
                  <div className="chart-legend">
                    <span className="legend-item"><span className="legend-dot" style={{ background: '#05aa65' }} /> Entrées</span>
                    <span className="legend-item"><span className="legend-dot" style={{ background: '#e74c3c' }} /> Sorties</span>
                  </div>
                </div>
              </div>
              <div className="chart-container">
                {aggregatedData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    {chartType === 'area' ? (
                      <AreaChart data={aggregatedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="entreeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#05aa65" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#05aa65" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="sortieGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#e74c3c" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#e74c3c" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid horizontal vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="dateKey" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#666' }} interval="preserveStartEnd" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#666' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="entree" name="Entrées" stroke="#05aa65" strokeWidth={2} fill="url(#entreeGradient)" />
                        <Area type="monotone" dataKey="sortie" name="Sorties" stroke="#e74c3c" strokeWidth={2} fill="url(#sortieGradient)" />
                      </AreaChart>
                    ) : (
                      <BarChart data={aggregatedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid horizontal vertical={false} stroke="rgba(0,0,0,0.05)" />
                        <XAxis dataKey="dateKey" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#666' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#666' }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="entree" name="Entrées" fill="#05aa65" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="sortie" name="Sorties" fill="#e74c3c" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                ) : (
                  <div className="no-chart-data">
                    <LuBox size={48} />
                    <p>Aucune donnée à afficher</p>
                    <button className="restock-button" onClick={() => navigate(`/stock/reapprovisionner/${id}`)}>
                      Ajouter un mouvement
                    </button>
                  </div>
                )}
              </div>
              <div className="stats-detailed">
                {[
                  { icon: <LuArrowUp className="stat-icon-success" />, label: 'Total entrées (quantité)', value: totalEntrees.toLocaleString() },
                  { icon: <LuArrowDown className="stat-icon-danger" />, label: 'Total sorties (quantité)', value: totalSorties.toLocaleString() },
                  { icon: <LuDollarSign className="stat-icon-success" />, label: 'Valeur totale des entrées', value: `${totalMontantEntrees.toLocaleString()} Ar` },
                  { icon: <LuDollarSign className="stat-icon-danger" />, label: 'Valeur totale des sorties', value: `${totalMontantSorties.toLocaleString()} Ar` },
                ].map(s => (
                  <div key={s.label} className="stat-detailed-item">
                    {s.icon}
                    <div>
                      <span className="stat-label-detailed">{s.label}</span>
                      <span className="stat-value-detailed">{s.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="info-card">
              <h3>Informations produit</h3>
              <div className="info-grid">
                <div className="info-row"><span className="info-label">Catégorie</span><span className="info-value">{product.type}</span></div>
                <div className="info-row"><span className="info-label">Finalité</span><span className="info-value">{product.finalite === 'VENTE' ? 'Produit à vendre' : 'Matière première'}</span></div>
                <div className="info-row"><span className="info-label">Seuil d'alerte</span><span className="info-value">{product.seuilAlerte || 'Non défini'}</span></div>
                <div className="info-row">
                  <span className="info-label">Dernier mouvement</span>
                  <span className="info-value">
                    {product.transactions?.length
                      ? new Date(product.transactions[0].date).toLocaleDateString('fr-FR')
                      : 'Aucun'}
                  </span>
                </div>
                <div className="info-row">
                  <span className="info-label">Entrepôts</span>
                  <span className="info-value">{product.Stock?.length || 0} ligne{(product.Stock?.length || 0) > 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="stock-progress">
                <div className="progress-header">
                  <span>Niveau de stock</span>
                  <span>{Math.min(100, Math.round((product.quantite / Math.max(product.quantite + totalSorties, 1)) * 100))}%</span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, Math.round((product.quantite / Math.max(product.quantite + totalSorties, 1)) * 100))}%`,
                      background: isLowStock ? '#e74c3c' : '#05aa65',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Mouvements ── */}
        {activeTab === 'mouvements' && (
          <div className="mouvements-tab">
            <div className="transactions-list">
              {product.transactions?.length ? (
                product.transactions.map((t, i) => {
                  const montant = getMontant(t); // ✅ calculé
                  return (
                    <div key={i} className="transaction-item">
                      <div className="transaction-icon">
                        {t.type === 'ENTREE'
                          ? <LuTrendingUp style={{ color: '#05aa65' }} size={24} />
                          : <LuTrendingDown style={{ color: '#e74c3c' }} size={24} />}
                      </div>
                      <div className="transaction-details">
                        <div className="transaction-header">
                          <span className="transaction-type">
                            {t.type === 'ENTREE' ? 'Réapprovisionnement' : 'Vente'}
                          </span>
                          <span className="transaction-date">
                            <LuCalendar size={14} />
                            {new Date(t.date).toLocaleDateString('fr-FR', {
                              day: 'numeric', month: 'long', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="transaction-stats">
                          <span className="transaction-quantite">Quantité : {t.quantite} unités</span>
                          <span className="transaction-prix">Prix unitaire : {t.prixUnitaire.toLocaleString()} Ar</span>
                          {(t.transport ?? 0) > 0 && (
                            <span className="transaction-prix">Transport : {(t.transport ?? 0).toLocaleString()} Ar</span>
                          )}
                          <span className="transaction-montant">Montant total : {montant.toLocaleString()} Ar</span>
                          <span className="transaction-prix" style={{ color: '#95a5a6' }}>Réf : {t.ref}</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  <LuBox size={64} />
                  <h3>Aucun mouvement</h3>
                  <p>Ce produit n'a pas encore de mouvements enregistrés.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Stocks / Entrepôts (NOUVEL ONGLET) ── */}
        {activeTab === 'stocks' && (
          <div className="mouvements-tab">
            <div className="transactions-list">
              {product.Stock?.length ? (
                product.Stock.map((line, i) => (
                  <div key={i} className="transaction-item">
                    <div className="transaction-icon">
                      <LuWarehouse style={{ color: '#05aa65' }} size={24} />
                    </div>
                    <div className="transaction-details">
                      <div className="transaction-header">
                        <span className="transaction-type">
                          {line.entrepot.ville} — {line.entrepot.zone}
                        </span>
                        <span className="transaction-date">
                          <LuCalendar size={14} />
                          {new Date(line.dateDepot).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                      <div className="transaction-stats">
                        <span className="transaction-quantite">Quantité : {line.quantite} unités</span>
                        {line.transport > 0 && (
                          <span className="transaction-prix">Transport unitaire : {line.transport.toLocaleString()} Ar</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <LuWarehouse size={64} />
                  <h3>Aucune ligne de stock</h3>
                  <p>Réapprovisionnez le produit pour créer une entrée en stock.</p>
                  <button className="restock-button" onClick={() => navigate(`/stock/reapprovisionner/${id}`)}>
                    Réapprovisionner
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Commandes ── */}
        {activeTab === 'commandes' && (
          <div className="commandes-tab">
            <div className="commandes-header">
              <h3>Commandes en cours</h3>
              <button className="new-commande-btn" onClick={() => navigate(`/commande/add/${id}`)}>
                <LuCircleAlert size={18} /> Nouvelle commande
              </button>
            </div>
            <div className="commandes-list">
              {product.commandes?.length ? (
                product.commandes.map(cmd => (
                  <div key={cmd.id} className="commande-item">
                    <div className="commande-status">
                      {cmd.valide
                        ? <LuCircleCheck className="status-icon success" size={24} />
                        : <LuCircleX className="status-icon pending" size={24} />}
                    </div>
                    <div className="commande-details">
                      <div className="commande-header">
                        <span className="commande-quantite">{cmd.quantite} unités</span>
                        <span className={`commande-badge ${cmd.valide ? 'valide' : 'en-attente'}`}>
                          {cmd.valide ? 'Livrée' : 'En attente'}
                        </span>
                      </div>
                      <div className="commande-footer">
                        <span className="commande-date">
                          <LuCalendar size={14} />
                          {new Date(cmd.date).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>
                    {!cmd.valide && (
                      <button className="validate-commande-btn" onClick={() => handleValidateCommande(cmd.id)}>
                        Valider
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <LuShoppingCart size={64} />
                  <h3>Aucune commande</h3>
                  <p>Ce produit n'a pas encore de commandes.</p>
                  <button className="create-commande-btn" onClick={() => navigate(`/commande/add/${id}`)}>
                    Créer une commande
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal suppression */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="delete-modal">
            <LuCircleAlert size={48} color="#e74c3c" />
            <h2>Confirmer la suppression</h2>
            <p>Êtes-vous sûr de vouloir supprimer <strong>"{product.nom}"</strong> ? Cette action est irréversible.</p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteModal(false)}>Annuler</button>
              <button className="confirm-delete-btn" onClick={handleDelete}>Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
