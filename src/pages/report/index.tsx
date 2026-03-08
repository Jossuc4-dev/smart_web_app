// app/report/ReportPage.tsx
// Librairies: react, react-router-dom, react-icons (déjà dans package.json)
import { useEffect, useRef, useState } from "react";
import {
  FiAlertTriangle,
  FiArrowLeft,
  FiBookOpen,
  FiCheckCircle,
  FiCreditCard,
  FiSend,
  FiX,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import BASE_URL from "../../config/ApiConfig";
import "./index.css";

/* ─────────────────────────── types ─────────────────────────── */
type ApiType = "FORMATION" | "ABONNEMENT" | "SIGNALEMENT";

interface Topic {
  id: string;
  apiType: ApiType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

interface Report {
  id: number;
  typeReport: string;
  message: string;
  sent_at: string;
}

/* ─────────────────────────── data ──────────────────────────── */
const TOPICS: Topic[] = [
  {
    id: "1",
    apiType: "FORMATION",
    label: "Demande de formation",
    description: "Nouvelle formation ou module spécifique",
    icon: <FiBookOpen size={22} />,
    color: "#2563eb",
    bg: "#eff6ff",
  },
  {
    id: "2",
    apiType: "ABONNEMENT",
    label: "Conseils abonnement",
    description: "Plans, upgrades ou facturation",
    icon: <FiCreditCard size={22} />,
    color: "#0891b2",
    bg: "#ecfeff",
  },
  {
    id: "3",
    apiType: "SIGNALEMENT",
    label: "Signalement",
    description: "Bug, problème ou suggestion",
    icon: <FiAlertTriangle size={22} />,
    color: "#d97706",
    bg: "#fffbeb",
  },
];

/* ─────────────────────────── helpers ───────────────────────── */
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ─────────────────────────── component ─────────────────────── */
export default function ReportPage() {
  const navigate = useNavigate();
  const { user,token } = useAuth();

  const [selected, setSelected] = useState<Topic | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /* scroll to bottom when reports update */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [reports]);

  /* load reports when topic changes */
  useEffect(() => {
    if (!selected) { setReports([]); return; }
    loadReports();
  }, [selected]);

  /* toast auto-hide */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(false), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* auto-resize textarea */
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 140) + "px";
  };

  /* ── GET /report/category/:type ── */
  const loadReports = async () => {
    if (!user || !selected) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${BASE_URL}/report/category/${selected.apiType.toLowerCase()}`,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      if (!res.ok) throw new Error((await res.json()).message ?? `Erreur ${res.status}`);
      const data = await res.json();
      setReports(data.data ?? []);
    } catch (err: any) {
      setError(err.message ?? "Impossible de charger les reports");
    } finally {
      setLoading(false);
    }
  };

  /* ── POST /report/ ── */
  const handleSend = async () => {
    if (!selected || !message.trim() || sending) return;
    setSending(true);
    setError("");
    try {
      const res = await fetch(`${BASE_URL}/report/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ typeReport: selected.apiType, message: message.trim() }),
      });
      if (!res.ok) throw new Error((await res.json()).message ?? `Erreur ${res.status}`);
      const json = await res.json();
      if (json.success) {
        setReports((prev) => [...prev, json.data]);
        setMessage("");
        if (textareaRef.current) textareaRef.current.style.height = "auto";
        setToast(true);
      } else {
        throw new Error(json.message ?? "Échec de l'envoi");
      }
    } catch (err: any) {
      setError(err.message ?? "Impossible d'envoyer");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const activeTopic = TOPICS.find((t) => t.id === selected?.id) ?? null;

  /* ── render ── */
  return (
    <>
      {/* Toast */}
      <div className={`rp-toast ${toast ? "rp-toast--show" : ""}`}>
        <FiCheckCircle size={18} />
        <span>Message envoyé avec succès</span>
      </div>

      <div className="rp-root">
        {/* ── LEFT PANEL ── */}
        <aside className="rp-sidebar">
          <div className="rp-sidebar-top">
            <button className="rp-back" onClick={() => navigate(-1)}>
              <FiArrowLeft size={18} />
              <span>Retour</span>
            </button>
            <h1 className="rp-title">Support</h1>
            <p className="rp-subtitle">Comment pouvons-nous vous aider ?</p>
          </div>

          <nav className="rp-topics">
            {TOPICS.map((t) => {
              const isActive = selected?.id === t.id;
              return (
                <button
                  key={t.id}
                  className={`rp-topic ${isActive ? "rp-topic--active" : ""}`}
                  style={isActive ? ({ "--tc": t.color, "--tbg": t.bg } as any) : undefined}
                  onClick={() => setSelected(isActive ? null : t)}
                >
                  <span className="rp-topic-icon" style={{ background: t.bg, color: t.color }}>
                    {t.icon}
                  </span>
                  <span className="rp-topic-text">
                    <span className="rp-topic-label">{t.label}</span>
                    <span className="rp-topic-desc">{t.description}</span>
                  </span>
                  {isActive && (
                    <span className="rp-topic-badge" style={{ background: t.color }}>
                      {reports.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="rp-sidebar-footer">
            <div className="rp-info-box">
              <FiCheckCircle size={16} color="#16a34a" />
              <span>Notre équipe répond sous 24h</span>
            </div>
          </div>
        </aside>

        {/* ── MAIN PANEL ── */}
        <main className="rp-main">
          {!selected ? (
            <div className="rp-empty">
              <div className="rp-empty-icon">
                <FiSend size={36} />
              </div>
              <h2>Sélectionnez un sujet</h2>
              <p>Choisissez une catégorie dans le panneau gauche pour commencer.</p>
            </div>
          ) : (
            <div className="rp-chat">
              {/* Chat header */}
              <div className="rp-chat-header" style={{ "--tc": activeTopic!.color } as any}>
                <span className="rp-chat-icon" style={{ background: activeTopic!.bg, color: activeTopic!.color }}>
                  {activeTopic!.icon}
                </span>
                <div>
                  <div className="rp-chat-name">{activeTopic!.label}</div>
                  <div className="rp-chat-count">
                    {loading ? "Chargement…" : `${reports.length} message${reports.length !== 1 ? "s" : ""}`}
                  </div>
                </div>
                <button className="rp-chat-close" onClick={() => setSelected(null)}>
                  <FiX size={18} />
                </button>
              </div>

              {/* Messages */}
              <div className="rp-messages">
                {/* System message */}
                <div className="rp-system-msg">
                  <p>Décrivez votre demande en détail. Notre équipe vous répondra sous 24h.</p>
                </div>

                {loading ? (
                  <div className="rp-loader">
                    <div className="rp-spinner" style={{ borderTopColor: activeTopic!.color }} />
                  </div>
                ) : error ? (
                  <div className="rp-error">{error}</div>
                ) : reports.length === 0 ? (
                  <div className="rp-no-msgs">Aucun message pour cette catégorie.</div>
                ) : (
                  reports.map((r) => (
                    <div key={r.id} className="rp-bubble-wrap">
                      <div className="rp-bubble" style={{ background: activeTopic!.color }}>
                        <p className="rp-bubble-text">{r.message}</p>
                        <span className="rp-bubble-time">{formatDate(r.sent_at)}</span>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div className="rp-input-area">
                {error && !loading && (
                  <div className="rp-input-error">{error}</div>
                )}
                <div className="rp-input-row">
                  <textarea
                    ref={textareaRef}
                    className="rp-textarea"
                    placeholder="Écrivez votre message… (Entrée pour envoyer)"
                    value={message}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    disabled={sending}
                  />
                  <button
                    className="rp-send"
                    style={
                      message.trim() && !sending
                        ? { background: activeTopic!.color }
                        : undefined
                    }
                    onClick={handleSend}
                    disabled={!message.trim() || sending}
                    aria-label="Envoyer"
                  >
                    {sending ? (
                      <div className="rp-spinner rp-spinner--sm" />
                    ) : (
                      <FiSend size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </>
  );
}
