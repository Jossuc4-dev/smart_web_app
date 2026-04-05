// src/pages/dashboard/index.tsx — Smart Business · Thème Blanc
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

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
import { useApi, useApiFetch } from '../../hooks/useApi';

// ── Utilitaires ──────────────────────────────────────────────────────────────
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

// ── Types ────────────────────────────────────────────────────────────────────
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

// ── Palette Smart Business ───────────────────────────────────────────────────
const SB = {
  blue:    "#2E86AB",
  cyan:    "#17A8B8",
  teal:    "#1B8A5A",
  red:     "#E05A5A",
  text1:   "#1a2940",
  text2:   "#3d5a73",
  text3:   "#7a95aa",
  bg:      "#f4f7fa",
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

// ── CaLineChart ──────────────────────────────────────────────────────────────
function CaLineChart({ jours }: { jours: CaJour[] }) {
  const chartData = jours.map((d) => ({ jour: d.jour, revenu: d.ca }));

  return (
    <div className="chart-card__chart">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor={SB.cyan} stopOpacity={0.22} />
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
            tickFormatter={fmtAr}
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

// ── KpiCard ──────────────────────────────────────────────────────────────────
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
      style={{ borderColor: "rgba(46,134,171,0.14)" }}
      onClick={onClick}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = `${accent}55`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(46,134,171,0.14)"; }}
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

// ── Dashboard principal ──────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { get } = useApi();
  

  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [error, setError]                   = useState<string | null>(null);
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
      const [alertes, produits, commandes, bilan, mouvements, caJournalier] = await Promise.all([
        get<any[]>('stock/produit/alerts/'),
        get<any[]>('stock/produit'),
        get<any[]>('vente/commande'),
        get<any>('finance/bilan/hebdo'),
        get<any[]>('stock/mouvement'),
        get<any>('finance/ca-journalier-mois'),
      ]);

      const ventes = mouvements.filter((v: any) =>
        v.type?.toString() === "SORTIE" && isToday(v.date)
      );
      const sommeVente = ventes.reduce((s: number, v: any) =>
        s + (v.prixUnitaire || 0) * (v.quantite || 0), 0
      );

      setData({
        revenusHebdo:   bilan?.current?.ventes || 0,
        ventesJour:     sommeVente,
        totalProduits:  produits.length,
        alertesStock:   alertes.length,
        totalCommandes: commandes.length,
        variation:      bilan?.variation?.ca || "",
      });

      setCaData(caJournalier);
    } catch (err) {
      console.error('Erreur lors du chargement du dashboard:', err);

      if (err instanceof Error && err.message.includes('Session expirée')) {
        setSessionExpired(true);
      } else {
        setError("Impossible de charger les données. Utilisation des données de démonstration.");
        setData({
          revenusHebdo: 14_800_000, ventesJour: 3_250_000, totalProduits: 148,
          alertesStock: 7, totalCommandes: 64, variation: "+12.4%",
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

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const { logout } = useAuth();
  useEffect(() => {
    if (sessionExpired) logout();
  }, [sessionExpired, navigate]);

  const vt =
    data.variation?.startsWith("+") ? "positive" :
    data.variation?.startsWith("-") ? "negative" : "neutral";

  const kpis: KpiCardProps[] = [
    {
      title: "Ventes du jour",
      value: `${data.ventesJour.toLocaleString("fr-FR")} Ar`,
      icon: LuReceiptText, accent: SB.teal,
      variation: data.variation || undefined, variationType: vt,
      onClick: () => navigate("/vente"),
    },
    {
      title: "Commandes",
      value: data.totalCommandes.toLocaleString("fr-FR"),
      icon: LuShoppingCart, accent: SB.blue,
      onClick: () => navigate("/vente"),
    },
    {
      title: "Produits en stock",
      value: data.totalProduits.toLocaleString("fr-FR"),
      icon: LuPackage, accent: SB.cyan,
      onClick: () => navigate("/stock"),
    },
    {
      title: "Alertes stock",
      value: data.alertesStock,
      icon: LuTriangleAlert,
      accent: data.alertesStock > 0 ? SB.red : SB.text3,
      variation: data.alertesStock > 0 ? `${data.alertesStock} produit(s)` : "Tout est OK",
      variationType: data.alertesStock > 0 ? "negative" : "neutral",
      onClick: () => navigate("/stock"),
    },
  ];

  const stockItems = [
    { label: "Produits actifs",        value: data.totalProduits,  color: SB.teal, pct: 85 },
    {
      label: "Alertes critiques",
      value: data.alertesStock,
      color: SB.red,
      pct: data.totalProduits > 0 ? Math.round((data.alertesStock / data.totalProduits) * 100) : 0,
    },
    { label: "Commandes en cours", value: data.totalCommandes, color: SB.blue, pct: 70 },
  ];

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="dash-loading">
        <div className="dash-loading__spinner" />
        <p className="dash-loading__text">Chargement du tableau de bord…</p>
      </div>
    );
  }

  // ── Session expirée ──────────────────────────────────────────────────────
  if (sessionExpired) {
    return (
      <div className="dash-session-expired">
        <div className="session-expired-card">
          <LuTriangleAlert size={48} color={SB.red} />
          <h2>Session expirée</h2>
          <p>Votre session a expiré. Vous allez être redirigé vers la page de connexion.</p>
          <div className="redirect-spinner" />
        </div>
      </div>
    );
  }

  // ── Rendu principal ──────────────────────────────────────────────────────
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
            <div className="hebdo-card__bar-fill" style={{ width: '65%' }} />
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
                  style={{ width: `${Math.min(item.pct, 100)}%`, background: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}