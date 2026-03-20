// src/pages/dashboard/index.tsx (version modifiée)
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Icônes...
import {
  LuActivity,
  LuPackage,
  LuReceiptText,
  LuShoppingCart,
  LuTriangleAlert,
  LuTrendingDown,
  LuTrendingUp,
} from "react-icons/lu";

// Recharts...
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import "./index.css";
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';

// Fonctions utilitaires (inchangées)
function isToday(dateStr: string | Date) {
  const d = new Date(dateStr);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

function fmtAr(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

// Types...
interface DashboardData {
  revenusHebdo:   number;
  ventesJour:     number;
  totalProduits:  number;
  alertesStock:   number;
  totalCommandes: number;
  variation:      string;
}

interface CaJour {
  jour: string;
  ca:   number;
}

interface CaData {
  mois:      string;
  totalMois: number;
  jours:     CaJour[];
}

// Custom Tooltip (inchangé)
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      backgroundColor: "#0f1117",
      border: "1px solid rgba(74,222,128,0.25)",
      borderRadius: "10px",
      padding: "12px",
    }}>
      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", margin: "0 0 4px 0" }}>
        Jour {label}
      </p>
      <p style={{ 
        color: "#4ade80", 
        fontSize: "13px", 
        fontWeight: "600", 
        margin: 0,
        fontFamily: "'DM Mono', monospace"
      }}>
        {payload[0].value.toLocaleString("fr-FR")} Ar
      </p>
    </div>
  );
};

// CaLineChart (inchangé)
function CaLineChart({ jours }: { jours: CaJour[] }) {
  const chartData = jours.map((d) => ({
    jour: d.jour,
    revenu: d.ca,
  }));

  return (
    <div className="chart-card__chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4ade80" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#4ade80" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid 
            horizontal={true} 
            vertical={false} 
            stroke="rgba(255,255,255,0.05)" 
          />
          <XAxis 
            dataKey="jour" 
            axisLine={false} 
            tickLine={false} 
            tick={{ 
              fontSize: 10, 
              fill: "rgba(255,255,255,0.3)",
              fontFamily: "'DM Mono', monospace"
            }}
            interval="preserveStartEnd"
            tickMargin={5}
          />
          <YAxis 
            hide={false}
            axisLine={false}
            tickLine={false}
            tick={{ 
              fontSize: 10, 
              fill: "rgba(255,255,255,0.25)",
              fontFamily: "'DM Mono', monospace"
            }}
            tickFormatter={fmtAr}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="revenu" 
            stroke="#4ade80" 
            strokeWidth={2.5}
            fill="url(#revenueGradient)" 
            dot={{ 
              r: 3, 
              fill: "#4ade80", 
              stroke: "#0a1a10", 
              strokeWidth: 2 
            }}
            activeDot={{ 
              r: 6, 
              fill: "#4ade80", 
              stroke: "#0a1a10", 
              strokeWidth: 2 
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// KpiCard (inchangé)
interface KpiCardProps {
  title:          string;
  value:          string | number;
  icon:           React.ElementType;
  accent:         string;
  variation?:     string;
  variationType?: "positive" | "negative" | "neutral";
  onClick?:       () => void;
}

function KpiCard({ title, value, icon: Icon, accent, variation, variationType, onClick }: KpiCardProps) {
  const isPos = variationType === "positive";
  const isNeg = variationType === "negative";

  return (
    <div
      className={`kpi-card${onClick ? " kpi-card--clickable" : ""}`}
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
      onClick={onClick}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${accent}44`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; }}
    >
      <div
        className="kpi-card__glow"
        style={{ background: `${accent}18` }}
      />

      <div className="kpi-card__header">
        <span className="kpi-card__label">{title}</span>
        <div
          className="kpi-card__icon"
          style={{ background: `${accent}18`, color: accent }}
        >
          <Icon size={18} />
        </div>
      </div>

      <div className="kpi-card__value">{value}</div>

      {variation && (
        <span
          className={`kpi-card__variation kpi-card__variation--${
            isPos ? "positive" : isNeg ? "negative" : "neutral"
          }`}
        >
          {isPos ? <LuTrendingUp size={12} /> : isNeg ? <LuTrendingDown size={12} /> : null}
          {variation}
        </span>
      )}
    </div>
  );
}

// Dashboard principal avec useApi
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { get } = useApi();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const [data, setData] = useState<DashboardData>({
    revenusHebdo: 0, ventesJour: 0, totalProduits: 0,
    alertesStock: 0, totalCommandes: 0, variation: "",
  });

  const [caData, setCaData] = useState<CaData>({
    mois: "", totalMois: 0, jours: [],
  });

  const fetchDashboard = useCallback(async () => {
    setError(null);
    setSessionExpired(false);
    try {
      // Utilisation du hook useApi qui gère automatiquement le 401
      const [alertes, produits, commandes, bilan, mouvements, caJournalier] = await Promise.all([
        get<any[]>('stock/produit/alerts/'),      // 1. Alertes stock
        get<any[]>('stock/produit'),              // 2. Produits
        get<any[]>('vente/commande'),             // 3. Commandes
        get<any>('finance/bilan/hebdo'),          // 4. Bilan hebdo
        get<any[]>('stock/mouvement'),            // 5. Mouvements
        get<any>('finance/ca-journalier-mois'),   // 6. CA du mois
      ]);

      const ventes = mouvements.filter((v: any) => 
        v.type?.toString() === "SORTIE" && isToday(v.date)
      );
      const sommeVente = ventes.reduce((s: number, v: any) => 
        s + (v.prixUnitaire || 0) * (v.quantite || 0), 0
      );

      setData({
        revenusHebdo: bilan?.current?.ventes || 0,
        ventesJour: sommeVente,
        totalProduits: produits.length,
        alertesStock: alertes.length,
        totalCommandes: commandes.length,
        variation: bilan?.variation?.ca || "",
      });

      setCaData(caJournalier);
    } catch (err) {
      console.error('Erreur lors du chargement du dashboard:', err);
      
      // Vérifier si c'est une erreur de session
      if (err instanceof Error && err.message.includes('Session expirée')) {
        setSessionExpired(true);
      } else {
        setError("Impossible de charger les données. Utilisation des données de démonstration.");
        // Mock data comme fallback
        setData({
          revenusHebdo: 14_800_000,
          ventesJour: 3_250_000,
          totalProduits: 148,
          alertesStock: 7,
          totalCommandes: 64,
          variation: "+12.4%",
        });
        setCaData({
          mois: "Février 2026",
          totalMois: 87_500_000,
          jours: Array.from({ length: 28 }, (_, i) => ({
            jour: `${i + 1}`,
            ca: Math.round(Math.random() * 4_000_000 + 1_500_000),
          })),
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [get]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Redirection si session expirée
  const {logout} = useAuth()
  useEffect(() => {

    if (sessionExpired) {
      logout()
    }
  }, [sessionExpired, navigate]);

  const vt =
    data.variation?.startsWith("+") ? "positive" :
    data.variation?.startsWith("-") ? "negative" : "neutral";

  const kpis: KpiCardProps[] = [
    {
      title: "Ventes du jour",
      value: `${data.ventesJour.toLocaleString("fr-FR")} Ar`,
      icon: LuReceiptText, accent: "#4ade80",
      variation: data.variation || undefined, variationType: vt,
      onClick: () => navigate("/vente"),
    },
    {
      title: "Commandes",
      value: data.totalCommandes.toLocaleString("fr-FR"),
      icon: LuShoppingCart, accent: "#60a5fa",
      onClick: () => navigate("/vente"),
    },
    {
      title: "Produits en stock",
      value: data.totalProduits.toLocaleString("fr-FR"),
      icon: LuPackage, accent: "#a78bfa",
      onClick: () => navigate("/stock"),
    },
    {
      title: "Alertes stock",
      value: data.alertesStock,
      icon: LuTriangleAlert,
      accent: data.alertesStock > 0 ? "#f87171" : "#6b7280",
      variation: data.alertesStock > 0 ? `${data.alertesStock} produit(s)` : "Tout est OK",
      variationType: data.alertesStock > 0 ? "negative" : "neutral",
      onClick: () => navigate("/stock"),
    },
  ];

  const stockItems = [
    { label: "Produits actifs", value: data.totalProduits, color: "#4ade80", pct: 85 },
    { 
      label: "Alertes critiques", 
      value: data.alertesStock, 
      color: "#f87171", 
      pct: data.totalProduits > 0 ? Math.round((data.alertesStock / data.totalProduits) * 100) : 0 
    },
    { label: "Commandes en cours", value: data.totalCommandes, color: "#60a5fa", pct: 70 },
  ];

  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-loading__spinner" />
        <p className="dash-loading__text">Chargement du tableau de bord…</p>
      </div>
    );
  }

  if (sessionExpired) {
    return (
      <div className="dash-session-expired">
        <div className="session-expired-card">
          <LuTriangleAlert size={48} color="#f87171" />
          <h2>Session expirée</h2>
          <p>Votre session a expiré. Vous allez être redirigé vers la page de connexion.</p>
          <div className="redirect-spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-content">
      {error && (
        <div className="dashboard-warning">
          <LuTriangleAlert size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Grid */}
      <div className="kpi-grid">
        {kpis.map((card) => (
          <KpiCard key={card.title} {...card} />
        ))}
      </div>

      {/* CA Chart Card */}
      <div className="chart-card">
        <div className="chart-card__glow-top" />
        <div className="chart-card__glow-bottom" />

        <div className="chart-card__header">
          <div className="chart-card__title-group">
            <div className="chart-card__dot-row">
              <div className="chart-card__dot" />
              <span className="chart-card__label">Chiffre d'affaires</span>
            </div>
            <span className="chart-card__subtitle">
              Revenus journaliers — {caData.mois}
            </span>
          </div>
          <div className="chart-card__live-badge">
            <LuActivity size={14} />
            Live
          </div>
        </div>

        <div className="chart-card__amount">
          <span className="chart-card__amount-value">
            {caData.totalMois.toLocaleString("fr-FR")}
          </span>
          <span className="chart-card__amount-unit">Ar</span>
          <div className="chart-card__stats-row">
            <span className="chart-card__stat">
              ↑ Max {fmtAr(Math.max(...caData.jours.map((d) => d.ca), 1))} Ar
            </span>
            <span className="chart-card__stat">
              ~ Moy {fmtAr(Math.round(caData.totalMois / Math.max(caData.jours.length, 1)))} Ar
            </span>
          </div>
        </div>

        <CaLineChart jours={caData.jours} />
      </div>

      {/* Bottom row */}
      <div className="bottom-row">
        {/* Revenus hebdo */}
        <div className="bottom-card">
          <div className="bottom-card__title">Revenus hebdomadaires</div>
          <div className="hebdo-card__amount">
            {data.revenusHebdo.toLocaleString("fr-FR")}
            <span className="hebdo-card__amount-unit">Ar</span>
          </div>
          <div className="hebdo-card__bar-track">
            <div 
              className="hebdo-card__bar-fill" 
              style={{ width: '65%' }}
            />
          </div>
          <div className="hebdo-card__caption">65% de l'objectif mensuel</div>
        </div>

        {/* Stock status */}
        <div className="bottom-card">
          <div className="bottom-card__title stock-card__title">Statut du stock</div>
          {stockItems.map((item) => (
            <div key={item.label} className="stock-item">
              <div className="stock-item__row">
                <span className="stock-item__label">{item.label}</span>
                <span className="stock-item__value" style={{ color: item.color }}>
                  {item.value}
                </span>
              </div>
              <div className="stock-item__bar-track">
                <div
                  className="stock-item__bar-fill"
                  style={{
                    width: `${Math.min(item.pct, 100)}%`,
                    background: item.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}