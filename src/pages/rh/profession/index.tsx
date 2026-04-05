// src/pages/rh/professions/ProfessionScreen.tsx
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import {
    FaArrowLeft,
    FaBriefcase,
    FaEdit,
    FaToggleOn,
    FaToggleOff,
    FaUsers,
    FaMoneyBillWave,
    FaSyncAlt,
    FaTimes,
    FaCheck,
    FaPlus,
} from 'react-icons/fa';
import './index.css';
import BASE_URL from '../../../config/ApiConfig';

interface Profession {
    id: number;
    idEntreprise: number;
    poste: string;
    reference: string;
    actif?: boolean; // Ajout de la propriété actif
    utilisateurs: {
        email: string
        nom: string
        role: "ADMIN" | "SUPERADMIN" | "USER"
    }[]
}

interface ProfessionFormData {
    poste: string;
}

export default function ProfessionScreen() {
    const navigate = useNavigate();
    const { token, user } = useAuth();

    const [professions, setProfessions] = useState<Profession[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state for add/edit
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [editTarget, setEditTarget] = useState<Profession | null>(null);
    const [form, setForm] = useState<ProfessionFormData>({ poste: '' });
    const [formError, setFormError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Confirm deactivation
    const [confirmId, setConfirmId] = useState<number | null>(null);
    const [deactivating, setDeactivating] = useState(false);

    // ── GET /rh/profession ────────────────────────────────────────────────────
    const fetchProfessions = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${BASE_URL}/rh/profession`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error('Erreur lors du chargement des professions');
            const data: Profession[] = await res.json();
            // Ajouter un champ actif si non présent (par défaut true)
            const dataWithActif = data.map(p => ({ ...p, actif: p.actif !== undefined ? p.actif : true }));
            setProfessions(dataWithActif);
        } catch (e: any) {
            setError(e.message || 'Erreur inconnue');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchProfessions(); }, [fetchProfessions]);

    // ── Open add modal ───────────────────────────────────────────────────────
    const openAdd = () => {
        setModalMode('add');
        setEditTarget(null);
        setForm({ poste: ''});
        setFormError(null);
        setModalOpen(true);
    };

    // ── Open edit modal ───────────────────────────────────────────────────────
    const openEdit = (p: Profession) => {
        setModalMode('edit');
        setEditTarget(p);
        setForm({ poste: p.poste });
        setFormError(null);
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditTarget(null);
        setFormError(null);
    };

    // ── POST /rh/profession (ajout) ───────────────────────────────────────────
    const handleAdd = async () => {
        if (!form.poste.trim()) {
            setFormError('Le poste et un salaire valide (> 0) sont requis.');
            return;
        }
        if (!token || !user) return;
        setSaving(true);
        setFormError(null);
        try {
            const res = await fetch(`${BASE_URL}/rh/profession`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ 
                    poste: form.poste.trim(),
                    idEntreprise: user.profession.idEntreprise 
                }),
            });
            if (!res.ok) throw new Error('Échec de l\'ajout');
            closeModal();
            await fetchProfessions();
        } catch (e: any) {
            setFormError(e.message || 'Erreur lors de l\'ajout');
        } finally {
            setSaving(false);
        }
    };

    // ── PUT /rh/profession/:id (modification) ─────────────────────────────────
    const handleEdit = async () => {
        if (!form.poste.trim()) {
            setFormError('Le poste est requis.');
            return;
        }
        if (!editTarget || !token) return;
        setSaving(true);
        setFormError(null);
        try {
            const res = await fetch(`${BASE_URL}/rh/profession/${editTarget.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ poste: form.poste.trim() }),
            });
            if (!res.ok) throw new Error('Échec de la mise à jour');
            closeModal();
            await fetchProfessions();
        } catch (e: any) {
            setFormError(e.message || 'Erreur lors de la sauvegarde');
        } finally {
            setSaving(false);
        }
    };

    const handleSave = () => {
        if (modalMode === 'add') {
            handleAdd();
        } else {
            handleEdit();
        }
    };

    // ── DELETE /rh/profession/:id (désactivation) ─────────────────────────────
    const handleDeactivate = async (id: number) => {
        if (!token || !user) return;
        setDeactivating(true);
        try {
            const res = await fetch(`${BASE_URL}/rh/profession/${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ idUser: user.id, token }),
            });
            if (!res.ok) throw new Error('Échec de la désactivation');
            setConfirmId(null);
            await fetchProfessions();
        } catch (e: any) {
            setError(e.message || 'Erreur lors de la désactivation');
        } finally {
            setDeactivating(false);
        }
    };

    // ── Réactiver une profession (si le backend supporte) ─────────────────────
    const handleReactivate = async (id: number) => {
        // Note: Cette fonction nécessite un endpoint de réactivation
        // Si votre backend n'a pas d'endpoint de réactivation, vous pouvez commenter cette fonction
        if (!token) return;
        setDeactivating(true);
        try {
            // Hypothetical endpoint - adjust according to your backend
            const res = await fetch(`${BASE_URL}/rh/profession/${id}/reactivate`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error('Échec de la réactivation');
            await fetchProfessions();
        } catch (e: any) {
            setError(e.message || 'Erreur lors de la réactivation');
        } finally {
            setDeactivating(false);
        }
    };

    const totalSalaires = 0
    const totalPersonnel = professions.reduce((s, p) => s + (p.utilisateurs?.length || 0), 0);

    return (
        <div className="prof-page">
            {/* Header */}
            <header className="prof-header">
                <div className="prof-header-left">
                    <button className="btn-back" onClick={() => navigate('/rh')}>
                        <FaArrowLeft />
                    </button>
                    <div>
                        <h1 className="prof-title">Postes & Professions</h1>
                        <p className="prof-subtitle">Gérez les postes de votre entreprise</p>
                    </div>
                </div>
                <div className="prof-header-actions" style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-icon-refresh" onClick={fetchProfessions} title="Rafraîchir">
                        <FaSyncAlt />
                    </button>
                    <button className="btn-add" onClick={openAdd} title="Ajouter un poste" style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        background: 'linear-gradient(135deg, var(--accent), var(--primary-dark))',
                        color: 'white',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: 'var(--shadow-sm)'
                    }}>
                        <FaPlus />
                    </button>
                </div>
            </header>

            {/* Summary */}
            <div className="prof-summary">
                <div className="summary-item">
                    <FaBriefcase className="summary-icon accent" />
                    <div>
                        <span className="summary-value">{professions.length}</span>
                        <span className="summary-label">Postes</span>
                    </div>
                </div>
                <div className="summary-item">
                    <FaUsers className="summary-icon primary" />
                    <div>
                        <span className="summary-value">{totalPersonnel}</span>
                        <span className="summary-label">Employés assignés</span>
                    </div>
                </div>
                <div className="summary-item">
                    <FaMoneyBillWave className="summary-icon success" />
                    <div>
                        <span className="summary-value">{totalSalaires.toLocaleString()} Ar</span>
                        <span className="summary-label">Salaires cumulés</span>
                    </div>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="prof-error">
                    <span>{error}</span>
                    <button onClick={() => setError(null)}><FaTimes /></button>
                </div>
            )}

            {/* Content */}
            {loading ? (
                <div className="prof-loading">
                    <div className="spinner" />
                    <p>Chargement des postes...</p>
                </div>
            ) : professions.length === 0 ? (
                <div className="empty-state">
                    <FaBriefcase className="empty-icon" />
                    <h3>Aucun poste trouvé</h3>
                    <p>Aucun poste n'est encore enregistré dans l'entreprise.</p>
                    <button className="btn-primary" onClick={openAdd} style={{ marginTop: '24px' }}>
                        <FaPlus style={{ marginRight: '8px' }} /> Ajouter un poste
                    </button>
                </div>
            ) : (
                <div className="prof-list">
                    {professions.map((p) => (
                        <div
                            key={p.id}
                            className={`prof-card ${p.actif === false ? 'prof-card--inactive' : ''}`}
                        >
                            <div className="prof-card-left">
                                <div className="prof-icon-wrapper"><FaBriefcase /></div>
                                <div className="prof-card-info">
                                    <h3 className="prof-card-title">{p.poste}</h3>
                                    <div className="prof-card-meta">
                                        {p.utilisateurs?.length !== undefined && (
                                            <span className="meta-chip">
                                                <FaUsers /> {p.utilisateurs.length} employé{p.utilisateurs.length > 1 ? 's' : ''}
                                            </span>
                                        )}
                                        {p.actif === false && (
                                            <span className="meta-chip meta-chip--inactive">Désactivé</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="prof-card-right">

                                <div className="prof-actions">
                                    <button
                                        className="prof-btn prof-btn--edit"
                                        onClick={() => openEdit(p)}
                                        title="Modifier"
                                    >
                                        <FaEdit /><span>Modifier</span>
                                    </button>

                                    {confirmId === p.id ? (
                                        <div className="confirm-inline">
                                            <span className="confirm-text">
                                                {p.actif === false ? 'Réactiver ?' : 'Désactiver ?'}
                                            </span>
                                            <button
                                                className="prof-btn prof-btn--confirm-yes"
                                                onClick={() => p.actif === false ? handleReactivate(p.id) : handleDeactivate(p.id)}
                                                disabled={deactivating}
                                            >
                                                {deactivating ? <div className="btn-spinner" style={{ width: '12px', height: '12px' }} /> : <FaCheck />}
                                            </button>
                                            <button
                                                className="prof-btn prof-btn--confirm-no"
                                                onClick={() => setConfirmId(null)}
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            className={`prof-btn ${p.actif === false ? 'prof-btn--activate' : 'prof-btn--deactivate'}`}
                                            onClick={() => setConfirmId(p.id)}
                                            title={p.actif === false ? 'Réactiver' : 'Désactiver'}
                                            disabled={deactivating}
                                        >
                                            {p.actif === false ? <FaToggleOff /> : <FaToggleOn />}
                                            <span>{p.actif === false ? 'Réactiver' : 'Désactiver'}</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Modal Ajout / Modification ──────────────────────────────────────────────── */}
            {modalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">
                                {modalMode === 'add' ? <FaPlus className="modal-title-icon" /> : <FaEdit className="modal-title-icon" />}
                                {modalMode === 'add' ? 'Ajouter un poste' : 'Modifier le poste'}
                            </h2>
                            <button className="modal-close" onClick={closeModal}><FaTimes /></button>
                        </div>

                        <div className="modal-body">
                            {formError && <div className="modal-error">{formError}</div>}

                            <div className="form-group">
                                <label htmlFor="poste" className="form-label">
                                    Intitulé du poste <span className="required">*</span>
                                </label>
                                <input
                                    id="poste"
                                    type="text"
                                    className="form-input"
                                    placeholder="Ex : Développeur Senior"
                                    value={form.poste}
                                    onChange={(e) => setForm((f) => ({ ...f, poste: e.target.value }))}
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={closeModal} disabled={saving}>
                                Annuler
                            </button>
                            <button className="btn-save" onClick={handleSave} disabled={saving}>
                                {saving ? (
                                    <><span className="btn-spinner" /> {modalMode === 'add' ? 'Ajout...' : 'Enregistrement...'}</>
                                ) : (
                                    <><FaCheck /> {modalMode === 'add' ? 'Ajouter' : 'Enregistrer'}</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}