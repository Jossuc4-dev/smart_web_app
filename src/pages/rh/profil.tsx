// src/pages/rh/staff/ProfileStaff.tsx
import { useEffect, useState, type JSX } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import BASE_URL from '../../config/ApiConfig';
import {
  FaArrowLeft, FaEdit, FaCheck, FaTimes, FaUser,
  FaEnvelope, FaPhone, FaIdCard, FaCalendarAlt,
  FaBriefcase, FaHistory, FaShieldAlt, FaUmbrellaBeach
} from 'react-icons/fa';
import { MdWork, MdSchedule } from 'react-icons/md';

// ── Types ────────────────────────────────────────────────────────────────────

interface Profession {
  id: number;
  poste: string;
}

interface Activity {
  id: number;
  date: string;
  action: { type: string; data?: any } | string;
}

interface UserProfile {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  cin?: string;
  sexe?: 'HOMME' | 'FEMME';
  situation?: 'MARIE' | 'CELIBATAIRE';
  enfants?: number;
  role: 'ADMIN' | 'USER';
  dateEmbauche?: string;
  boolcnaps?: boolean;
  numeroCnaps?: string;
  actif: boolean;
  salaire:number;
  profession: Profession;
  activities: Activity[];
}

type TabType = 'infos' | 'conges' | 'cnaps' | 'activites';

// ── Helpers ──────────────────────────────────────────────────────────────────

const initials = (nom: string) =>
  nom.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const activityIcon: Record<string, string> = {
  vente: '🛒', Approvisionnement: '🚚', congé: '🏖️',
  Validation: '✅', Annulation: '❌',
};
const getIcon = (type: string) =>
  Object.entries(activityIcon).find(([k]) => type.includes(k))?.[1] ?? '✏️';

// ── Composant principal ───────────────────────────────────────────────────────

export default function ProfileStaff() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabType>('infos');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<UserProfile>>({});
  const [error, setError] = useState('');

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const loadProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/rh/staff/profile/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data: UserProfile = await res.json();
      data.activities = data.activities.map(act => ({
        ...act,
        action: typeof act.action === 'string' ? JSON.parse(act.action) : act.action,
      })).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setUser(data);
      setForm(data);
    } catch {
      setError('Impossible de charger le profil.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (id) loadProfile(); }, [id]);

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${BASE_URL}/rh/staff/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setUser({ ...user!, ...updated });
      setEditing(false);
    } catch {
      setError('Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  // ── Loading / Error ────────────────────────────────────────────────────────

  if (loading) return (
    <div style={s.center}>
      <div style={s.spinner} />
      <p style={{ color: '#04957d', marginTop: 16, fontFamily: 'DM Sans, sans-serif' }}>
        Chargement du profil...
      </p>
    </div>
  );

  if (error || !user) return (
    <div style={s.center}>
      <span style={{ fontSize: 48 }}>⚠️</span>
      <p style={{ color: '#ef4444', marginTop: 12, fontFamily: 'DM Sans, sans-serif' }}>
        {error || 'Utilisateur introuvable'}
      </p>
    </div>
  );

  const tabs: { key: TabType; label: string; icon: JSX.Element }[] = [
    { key: 'infos',    label: 'Infos',      icon: <FaUser size={13} /> },
    { key: 'conges',   label: 'Congés',     icon: <FaUmbrellaBeach size={13} /> },
    { key: 'cnaps',    label: 'CNAPS',      icon: <FaShieldAlt size={13} /> },
    { key: 'activites',label: 'Activités',  icon: <FaHistory size={13} /> },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f0f4f3; }
        .profile-tab { transition: all .2s ease; cursor: pointer; }
        .profile-tab:hover { opacity: .85; }
        .profile-field input, .profile-field select {
          width: 100%; padding: 10px 14px; border: 1.5px solid #e0e0e0;
          border-radius: 10px; font-family: 'DM Sans', sans-serif;
          font-size: 14px; color: #1a1a2e; outline: none;
          transition: border-color .2s;
        }
        .profile-field input:focus, .profile-field select:focus {
          border-color: #04957d;
        }
        .profile-field input:disabled, .profile-field select:disabled {
          background: #f9f9f9; color: #666; cursor: default;
        }
        .act-card { transition: transform .15s; }
        .act-card:hover { transform: translateX(4px); }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp .35s ease forwards; }
      `}</style>

      <div style={{ fontFamily: 'DM Sans, sans-serif', minHeight: '100vh', background: '#f0f4f3' }}>

        {/* ── HEADER ─────────────────────────────────────────────────── */}
        <div style={s.header}>
          {/* Motif déco */}
          <div style={s.headerDeco1} />
          <div style={s.headerDeco2} />

          <button style={s.backBtn} onClick={() => navigate(-1)}>
            <FaArrowLeft size={16} color="#fff" />
          </button>

          {/* Avatar */}
          <div style={s.avatarRing}>
            <div style={s.avatar}>
              <span style={s.avatarText}>{initials(user.nom)}</span>
            </div>
          </div>

          <h1 style={s.headerName}>{user.nom}</h1>
          <p style={s.headerRole}>{user.profession.poste}</p>

          <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center' }}>
            <span style={{
              ...s.badge,
              background: user.actif ? 'rgba(255,255,255,0.2)' : 'rgba(239,68,68,0.3)',
            }}>
              {user.actif ? '● Actif' : '● Inactif'}
            </span>
            <span style={s.badge}>{user.role}</span>
          </div>

          {/* Bouton modifier */}
          {!editing ? (
            <button style={s.editBtn} onClick={() => setEditing(true)}>
              <FaEdit size={14} />
              <span>Modifier</span>
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button style={{ ...s.editBtn, background: 'rgba(255,255,255,0.25)' }}
                onClick={() => { setEditing(false); setForm(user); }}>
                <FaTimes size={14} /><span>Annuler</span>
              </button>
              <button style={{ ...s.editBtn, background: '#fff', color: '#04957d' }}
                onClick={handleSave} disabled={saving}>
                {saving ? <div style={{ ...s.spinner, width: 14, height: 14, borderWidth: 2 }} /> : <FaCheck size={14} />}
                <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
              </button>
            </div>
          )}
        </div>

        {/* ── ONGLETS ─────────────────────────────────────────────────── */}
        <div style={s.tabBar}>
          {tabs.map(t => (
            <button
              key={t.key}
              className="profile-tab"
              style={{ ...s.tabBtn, ...(tab === t.key ? s.tabActive : {}) }}
              onClick={() => setTab(t.key)}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── CONTENU ─────────────────────────────────────────────────── */}
        <div style={s.content} className="fade-up">

          {/* ── INFOS ── */}
          {tab === 'infos' && (
            <div style={s.card}>
              <h3 style={s.cardTitle}><FaUser size={15} color="#04957d" /> Informations personnelles</h3>
              <div style={s.grid2}>
                <Field icon={<FaUser />}        label="Nom complet"     field="nom"         form={form} setForm={setForm} editing={editing} />
                <Field icon={<FaEnvelope />}    label="Email"           field="email"       form={form} setForm={setForm} editing={editing} type="email" />
                <Field icon={<FaPhone />}       label="Téléphone"       field="telephone"   form={form} setForm={setForm} editing={editing} />
                <Field icon={<FaIdCard />}      label="CIN"             field="cin"         form={form} setForm={setForm} editing={editing} />
                <Field icon={<MdWork />}        label="Rôle"            field="role"        form={form} setForm={setForm} editing={editing}
                  type="select" options={['ADMIN', 'USER']} />
                <Field icon={<FaUser />}        label="Sexe"            field="sexe"        form={form} setForm={setForm} editing={editing}
                  type="select" options={['HOMME', 'FEMME']} />
                <Field icon={<FaUser />}        label="Situation"       field="situation"   form={form} setForm={setForm} editing={editing}
                  type="select" options={['MARIE', 'CELIBATAIRE']} />
                <Field icon={<FaUser />}        label="Enfants"         field="enfants"     form={form} setForm={setForm} editing={editing} type="number" />
                <Field icon={<FaCalendarAlt />} label="Date d'embauche" field="dateEmbauche" form={form} setForm={setForm} editing={editing} type="date" />
              </div>

              <div style={{ marginTop: 24, padding: '16px 20px', background: '#f0faf7', borderRadius: 12, display: 'flex', gap: 24 }}>
                <div>
                  <p style={s.statLabel}>Poste</p>
                  <p style={s.statValue}>{user.profession.poste}</p>
                </div>
                <div style={{ width: 1, background: '#d0ede7' }} />
                <div>
                  <p style={s.statLabel}>Salaire de base</p>
                  <p style={s.statValue}>{user.salaire.toLocaleString()} Ar</p>
                </div>
              </div>
            </div>
          )}

          {/* ── CONGÉS ── */}
          {tab === 'conges' && (
            <div style={s.card}>
              <h3 style={s.cardTitle}><FaUmbrellaBeach size={15} color="#04957d" /> Congés</h3>
              <div style={s.emptyBox}>
                <FaUmbrellaBeach size={40} color="#cce8e3" />
                <p style={{ color: '#aaa', marginTop: 12, fontSize: 14 }}>
                  Données de congés non disponibles pour le moment.
                </p>
              </div>
            </div>
          )}

          {/* ── CNAPS ── */}
          {tab === 'cnaps' && (
            <div style={s.card}>
              <h3 style={s.cardTitle}><FaShieldAlt size={15} color="#04957d" /> CNAPS</h3>
              {user.boolcnaps ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <InfoRow icon="🪪" label="Numéro CNAPS" value={user.numeroCnaps || 'Non renseigné'} />
                  <InfoRow icon="✅" label="Enregistré CNAPS" value="Oui" color="#04957d" />
                  {editing && (
                    <div className="profile-field" style={{ marginTop: 8 }}>
                      <label style={s.fieldLabel}>Numéro CNAPS</label>
                      <input
                        value={(form.numeroCnaps as string) ?? ''}
                        onChange={e => setForm(f => ({ ...f, numeroCnaps: e.target.value }))}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div style={s.emptyBox}>
                  <FaShieldAlt size={40} color="#cce8e3" />
                  <p style={{ color: '#aaa', marginTop: 12, fontSize: 14 }}>
                    Cet employé n'est pas enregistré sur CNAPS.
                  </p>
                  {editing && (
                    <button
                      style={{ ...s.editBtn, marginTop: 16, background: '#04957d' }}
                      onClick={() => setForm(f => ({ ...f, boolcnaps: true }))}
                    >
                      <FaCheck size={13} /><span>Enregistrer sur CNAPS</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── ACTIVITÉS ── */}
          {tab === 'activites' && (
            <div style={s.card}>
              <h3 style={s.cardTitle}><FaHistory size={15} color="#04957d" /> Activité récente</h3>
              {user.activities.length === 0 ? (
                <div style={s.emptyBox}>
                  <FaHistory size={40} color="#cce8e3" />
                  <p style={{ color: '#aaa', marginTop: 12, fontSize: 14 }}>Aucune activité récente.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {user.activities.map(act => {
                    const action = act.action as { type: string; data?: any };
                    const type = action.type || 'Action';
                    const data = action.data
                      ? typeof action.data === 'object' ? JSON.stringify(action.data) : action.data
                      : null;
                    return (
                      <div key={act.id} className="act-card" style={s.actCard}>
                        <div style={s.actIcon}>{getIcon(type)}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={s.actType}>{type}</p>
                          {data && <p style={s.actData}>{data}</p>}
                        </div>
                        <span style={s.actDate}>
                          {new Date(act.date).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short',
                            hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </>
  );
}

// ── Sous-composants ───────────────────────────────────────────────────────────

function Field({ icon, label, field, form, setForm, editing, type = 'text', options }: {
  icon: JSX.Element; label: string; field: string;
  form: any; setForm: any; editing: boolean;
  type?: string; options?: string[];
}) {
  const value = form[field] ?? '';
  return (
    <div className="profile-field" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={s.fieldLabel}>
        <span style={{ color: '#04957d', marginRight: 6 }}>{icon}</span>
        {label}
      </label>
      {type === 'select' ? (
        <select value={value} disabled={!editing}
          onChange={e => setForm((f: any) => ({ ...f, [field]: e.target.value }))}>
          <option value="">— Sélectionner —</option>
          {options!.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input
          type={type}
          value={type === 'date' && value ? value.split('T')[0] : value}
          disabled={!editing}
          onChange={e => setForm((f: any) => ({ ...f, [field]: e.target.value }))}
        />
      )}
    </div>
  );
}

function InfoRow({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid #f0f0f0' }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 12, color: '#999', marginBottom: 2 }}>{label}</p>
        <p style={{ fontSize: 16, fontWeight: 700, color: color || '#1a1a2e' }}>{value}</p>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  center: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: '100vh',
  },
  spinner: {
    width: 40, height: 40, borderRadius: '50%',
    border: '3px solid #cce8e3', borderTopColor: '#04957d',
    animation: 'spin 0.8s linear infinite',
  },
  header: {
    background: 'linear-gradient(135deg, #04957d 0%, #037a68 100%)',
    padding: '60px 24px 36px',
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    position: 'relative', overflow: 'hidden',
  },
  headerDeco1: {
    position: 'absolute', top: -60, right: -60,
    width: 200, height: 200, borderRadius: '50%',
    background: 'rgba(255,255,255,0.07)',
  },
  headerDeco2: {
    position: 'absolute', bottom: -40, left: -40,
    width: 160, height: 160, borderRadius: '50%',
    background: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    position: 'absolute', top: 20, left: 20,
    background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%',
    width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
  avatarRing: {
    width: 108, height: 108, borderRadius: '50%',
    background: 'rgba(255,255,255,0.25)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 90, height: 90, borderRadius: '50%',
    background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: 800, color: '#04957d', fontFamily: 'Syne, sans-serif' },
  headerName: { fontSize: 26, fontWeight: 800, color: '#fff', fontFamily: 'Syne, sans-serif', textAlign: 'center' },
  headerRole: { fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  badge: {
    fontSize: 12, fontWeight: 600, color: '#fff',
    background: 'rgba(255,255,255,0.2)', padding: '4px 12px',
    borderRadius: 20, letterSpacing: '0.5px',
  },
  editBtn: {
    marginTop: 16, display: 'flex', alignItems: 'center', gap: 8,
    background: 'rgba(255,255,255,0.2)', border: '1.5px solid rgba(255,255,255,0.4)',
    color: '#fff', padding: '10px 24px', borderRadius: 30,
    cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 14,
  },
  tabBar: {
    display: 'flex', gap: 8, padding: '14px 20px',
    background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    overflowX: 'auto',
  },
  tabBtn: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '9px 18px', borderRadius: 30, border: 'none',
    background: '#f0f4f3', color: '#666',
    fontFamily: 'DM Sans, sans-serif', fontWeight: 600, fontSize: 13,
    cursor: 'pointer', whiteSpace: 'nowrap',
  },
  tabActive: {
    background: '#04957d', color: '#fff',
    boxShadow: '0 4px 12px rgba(4,149,125,0.3)',
  },
  content: { maxWidth: 760, margin: '24px auto', padding: '0 20px 40px' },
  card: {
    background: '#fff', borderRadius: 20,
    padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
  },
  cardTitle: {
    fontSize: 16, fontWeight: 700, color: '#1a1a2e',
    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24,
    fontFamily: 'Syne, sans-serif',
  },
  grid2: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 },
  fieldLabel: { fontSize: 12, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '0.5px' },
  statLabel: { fontSize: 11, color: '#999', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 },
  statValue: { fontSize: 16, fontWeight: 700, color: '#04957d' },
  emptyBox: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '48px 20px', background: '#f9fffe', borderRadius: 14,
  },
  actCard: {
    display: 'flex', alignItems: 'center', gap: 14,
    background: '#f9fffe', borderRadius: 14, padding: '14px 16px',
    border: '1px solid #e8f5f2',
  },
  actIcon: {
    width: 44, height: 44, borderRadius: '50%',
    background: '#fff8e1', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 20, flexShrink: 0,
  },
  actType: { fontWeight: 600, color: '#1a1a2e', fontSize: 14 },
  actData: { color: '#888', fontSize: 12, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  actDate: { fontSize: 11, color: '#aaa', whiteSpace: 'nowrap', flexShrink: 0 },
};