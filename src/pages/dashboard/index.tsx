// src/pages/dashboard/index.tsx
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';

import {
  LuActivity,
  LuPackage,
  LuReceiptText,
  LuShoppingCart,
  LuTriangleAlert,
  LuTrendingDown,
  LuTrendingUp,
} from "react-icons/lu";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import "./index.css";
import { useAuth } from '../../contexts/AuthContext';
import { useApi } from '../../hooks/useApi';

// ── Types ────────────────────────────────────────────────────────────────────
interface DashboardData {
  revenusHebdo: number;
  ventesJour: number;
  totalProduits: number;
  alertesStock: number;
  totalCommandes: number;
  variation: string;
}

interface CaJour {
  jour: string;
  ca: number;
}

interface CaData {
  mois: string;
  totalMois: number;
  jours: CaJour[];
}

// ── Palette Smart Business ───────────────────────────────────────────────────
const SB = {
  blue: "#2E86AB",
  cyan: "#17A8B8",
  teal: "#1B8A5A",
  red: "#E05A5A",
  text1: "#1a2940",
  text2: "#3d5a73",
  text3: "#7a95aa",
  surface: "#ffffff",
};

// ── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div style={{
      backgroundColor: SB.surface,
      border: `1px solid rgba(46,134,171,0.22)`,
      borderRadius: "10px",
      padding: "12px",
      boxShadow: "0 4px 16px rgba(46,134,171,0.14)",
    }}>
      <p style={{ color: SB.text3, fontSize: "11px", margin: "0 0 4px 0" }}>
        Jour {label}
      </p>
      <p style={{
        color: SB.cyan,
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

// ── CaLineChart Component ────────────────────────────────────────────────────
function CaLineChart({ jours }: { jours: CaJour[] }) {
  const chartData = jours.map((d) => ({ jour: d.jour, revenu: d.ca }));

  return (
    <div className="chart-card__chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SB.cyan} stopOpacity={0.22} />
              <stop offset="100%" stopColor={SB.cyan} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid
            horizontal={true}
            vertical={false}
            stroke="rgba(46,134,171,0.08)"
          />
          <XAxis
            dataKey="jour"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: SB.text3, fontFamily: "'DM Mono', monospace" }}
            interval="preserveStartEnd"
            tickMargin={5}
          />
          <YAxis
            hide={false}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: SB.text3, fontFamily: "'DM Mono', monospace" }}
            tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenu"
            stroke={SB.cyan}
            strokeWidth={2.5}
            fill="url(#revenueGradient)"
            dot={{ r: 3, fill: SB.cyan, stroke: SB.surface, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: SB.cyan, stroke: SB.surface, strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── KpiCard Component ────────────────────────────────────────────────────────
interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
  variation?: string;
  variationType?: "positive" | "negative" | "neutral";
  onClick?: () => void;
}

function KpiCard({ 
  title, 
  value, 
  icon: Icon, 
  accent, 
  variation, 
  variationType, 
  onClick 
}: KpiCardProps) {
  const isPos = variationType === "positive";
  const isNeg = variationType === "negative";

  return (
    <div
      className={`kpi-card${onClick ? " kpi-card--clickable" : ""}`}
      style={{ borderColor: "rgba(46,134,171,0.14)" }}
      onClick={onClick}
      onMouseEnter={(e) => { 
        (e.currentTarget as HTMLElement).style.borderColor = `${accent}55`; 
      }}
      onMouseLeave={(e) => { 
        (e.currentTarget as HTMLElement).style.borderColor = "rgba(46,134,171,0.14)"; 
      }}
    >
      <div
        className="kpi-card__glow"
        style={{ background: `${accent}18` }}
      />

      <div className="kpi-card__header">
        <span className="kpi-card__label">{title}</span>
        <div
          className="kpi-card__icon"
          style={{ background: `${accent}14`, color: accent }}
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

// ── Main Dashboard Component ─────────────────────────────────────────────────
export default function Dashboard() {
  const { t } = useTranslation(['dashboard', 'common']);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { get } = useApi();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  const [data, setData] = useState<DashboardData>({
    revenusHebdo: 0,
    ventesJour: 0,
    totalProduits: 0,
    alertesStock: 0,
    totalCommandes: 0,
    variation: "",
  });

  const [caData, setCaData] = useState<CaData>({
    mois: "",
    totalMois: 0,
    jours: [],
  });

  // ── Fetch Dashboard Data ───────────────────────────────────────────────────
  const fetchDashboard = useCallback(async () => {
    setError(null);
    setSessionExpired(false);

    try {
      const [alertes, produits, commandes, bilan, mouvements, caJournalier] = await Promise.all([
        get<any[]>('stock/produit/alerts/'),
        get<any[]>('stock/produit'),
        get<any[]>('vente/commande'),
        get<any>('finance/bilan/hebdo'),
        get<any[]>('stock/mouvement'),
        get<any>('finance/ca-journalier-mois'),
      ]);

      const ventesAujourdHui = mouvements.filter((v: any) =>
        v.type?.toString() === "SORTIE" &&
        new Date(v.date).toDateString() === new Date().toDateString()
      );

      const sommeVentesJour = ventesAujourdHui.reduce((s: number, v: any) =>
        s + (v.prixUnitaire || 0) * (v.quantite || 0), 0
      );

      setData({
        revenusHebdo: bilan?.current?.ventes || 0,
        ventesJour: sommeVentesJour,
        totalProduits: produits.length,
        alertesStock: alertes.length,
        totalCommandes: commandes.length,
        variation: bilan?.variation?.ca || "",
      });

      setCaData(caJournalier || { mois: "", totalMois: 0, jours: [] });
    } catch (err: any) {
      console.error('Erreur lors du chargement du dashboard:', err);

      if (err.message?.includes('Session expirée') || err.status === 401) {
        setSessionExpired(true);
      } else {
        setError(t('dashboard:error'));
        // Données de démonstration
        setData({
          revenusHebdo: 14800000,
          ventesJour: 3250000,
          totalProduits: 148,
          alertesStock: 7,
          totalCommandes: 64,
          variation: "+12.4%",
        });
        setCaData({
          mois: "Février 2026",
          totalMois: 87500000,
          jours: Array.from({ length: 28 }, (_, i) => ({
            jour: `${i + 1}`,
            ca: Math.round(Math.random() * 4000000 + 1500000),
          })),
        });
      }
    } finally {
      setLoading(false);
    }
  }, [get, t]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const { logout } = useAuth();
  useEffect(() => {
    if (sessionExpired) logout();
  }, [sessionExpired, logout]);

  const variationType = data.variation?.startsWith("+") 
    ? "positive" 
    : data.variation?.startsWith("-") 
      ? "negative" 
      : "neutral";

  const kpis: KpiCardProps[] = [
    {
      title: t('dashboard:kpi.sales_today'),
      value: `${data.ventesJour.toLocaleString("fr-FR")} Ar`,
      icon: LuReceiptText,
      accent: "#1B8A5A",
      variation: data.variation || undefined,
      variationType,
      onClick: () => navigate("/vente"),
    },
    {
      title: t('dashboard:kpi.orders'),
      value: data.totalCommandes.toLocaleString("fr-FR"),
      icon: LuShoppingCart,
      accent: "#2E86AB",
      onClick: () => navigate("/vente"),
    },
    {
      title: t('dashboard:kpi.products_in_stock'),
      value: data.totalProduits.toLocaleString("fr-FR"),
      icon: LuPackage,
      accent: "#17A8B8",
      onClick: () => navigate("/stock"),
    },
    {
      title: t('dashboard:kpi.stock_alerts'),
      value: data.alertesStock,
      icon: LuTriangleAlert,
      accent: data.alertesStock > 0 ? "#E05A5A" : "#7a95aa",
      variation: data.alertesStock > 0 
        ? `${data.alertesStock} produit(s)` 
        : t('dashboard:variation.all_good'),
      variationType: data.alertesStock > 0 ? "negative" : "neutral",
      onClick: () => navigate("/stock"),
    },
  ];

  const stockItems = [
    {
      label: t('dashboard:stock_status.active_products'),
      value: data.totalProduits,
      color: "#1B8A5A",
      pct: 85,
    },
    {
      label: t('dashboard:stock_status.critical_alerts'),
      value: data.alertesStock,
      color: "#E05A5A",
      pct: data.totalProduits > 0 ? Math.round((data.alertesStock / data.totalProduits) * 100) : 0,
    },
    {
      label: t('dashboard:stock_status.ongoing_orders'),
      value: data.totalCommandes,
      color: "#2E86AB",
      pct: 70,
    },
  ];

  // Loading State
  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-loading__spinner" />
        <p className="dash-loading__text">{t('dashboard:loading')}</p>
      </div>
    );
  }

  // Session Expired
  if (sessionExpired) {
    return (
      <div className="dash-session-expired">
        <div className="session-expired-card">
          <LuTriangleAlert size={48} color="#E05A5A" />
          <h2>{t('dashboard:session_expired.title')}</h2>
          <p>{t('dashboard:session_expired.message')}</p>
          <div className="redirect-spinner" />
        </div>
      </div>
    );
  }

  // Main Render
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
        {kpis.map((card, index) => (
          <KpiCard key={index} {...card} />
        ))}
      </div>

      {/* Chiffre d'affaires Chart */}
      <div className="chart-card">
        <div className="chart-card__glow-top" />
        <div className="chart-card__glow-bottom" />

        <div className="chart-card__header">
          <div className="chart-card__title-group">
            <div className="chart-card__dot-row">
              <div className="chart-card__dot" />
              <span className="chart-card__label">{t('dashboard:chart.revenue')}</span>
            </div>
            <span className="chart-card__subtitle">
              {t('dashboard:chart.daily_revenue', { month: caData.mois || 'Ce mois' })}
            </span>
          </div>
          <div className="chart-card__live-badge">
            <LuActivity size={14} />
            {t('dashboard:chart.live')}
          </div>
        </div>

        <div className="chart-card__amount">
          <span className="chart-card__amount-value">
            {caData.totalMois.toLocaleString("fr-FR")}
          </span>
          <span className="chart-card__amount-unit"> Ar</span>
          <div className="chart-card__stats-row">
            <span className="chart-card__stat">
              ↑ {t('dashboard:chart.max')} {Math.max(...caData.jours.map((d) => d.ca), 0).toLocaleString("fr-FR")} Ar
            </span>
            <span className="chart-card__stat">
              ~ {t('dashboard:chart.avg')} {Math.round(caData.totalMois / Math.max(caData.jours.length, 1)).toLocaleString("fr-FR")} Ar
            </span>
          </div>
        </div>

        <CaLineChart jours={caData.jours} />
      </div>

      {/* Bottom Row */}
      <div className="bottom-row">
        {/* Revenus Hebdomadaires */}
        <div className="bottom-card">
          <div className="bottom-card__title">{t('dashboard:weekly_revenue.title')}</div>
          <div className="hebdo-card__amount">
            {data.revenusHebdo.toLocaleString("fr-FR")}
            <span className="hebdo-card__amount-unit"> Ar</span>
          </div>
          <div className="hebdo-card__bar-track">
            <div className="hebdo-card__bar-fill" style={{ width: '65%' }} />
          </div>
          <div className="hebdo-card__caption">{t('dashboard:weekly_revenue.goal')}</div>
        </div>

        {/* Statut du Stock */}
        <div className="bottom-card">
          <div className="bottom-card__title stock-card__title">
            {t('dashboard:stock_status.title')}
          </div>
          {stockItems.map((item, index) => (
            <div key={index} className="stock-item">
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
                    background: item.color 
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