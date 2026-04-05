// src/pages/stock/add/AddProductScreen.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { addProduct, fetchProducts, resetAddSuccess } from '../../redux/slices/stockSlice';
import { selectAddSuccess, selectAddStatus, selectIsAdding, selectStockError } from '../../redux/selectors/stock.selector';
import { useAuth } from '../../contexts/AuthContext';
import { FaSave, FaTimes, FaEuroSign, FaTruck, FaUser, FaPhone, FaIdCard, FaEnvelope, FaWarehouse, FaMapMarkerAlt } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './add.css';

export default function AddProductScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, token } = useAuth();

  const addSuccess = useAppSelector(selectAddSuccess);
  const addStatus = useAppSelector(selectAddStatus);
  const isAdding = useAppSelector(selectIsAdding);
  const addError = useAppSelector(selectStockError);

  const [fpMode, setFpMode] = useState(true);
  const [salesMode, setSalesMode] = useState(false);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CREDIT' | 'BANK' | 'MOBILE_MONEY' | 'CHECK'>('CASH');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [form, setForm] = useState({
    numero: '',
    nom: '',
    type: '',
    prix: '',
    vente: '',
    quantite: '',
    transport: '0',
    // Entrepôt — NOUVEAU : requis par l'API
    ville_entrepot: '',
    zone_entrepot: '',
    // Fournisseur
    nom_fournisseur: '',
    telephone_fournisseur: '',
    nif: '',
    stat: '',
    email_fournisseur: '',
  });

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () =>
    form.numero.trim() &&
    form.nom.trim() &&
    form.type.trim() &&
    form.prix.trim() &&
    form.quantite.trim() &&
    form.ville_entrepot.trim() &&   // requis
    form.zone_entrepot.trim() &&    // requis
    form.nom_fournisseur.trim() &&
    form.telephone_fournisseur.trim() &&
    form.nif.trim() &&
    form.stat.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      setAlertMessage('Veuillez remplir tous les champs obligatoires');
      setShowAlert(true);
      return;
    }

    if (!token) {
      setAlertMessage("Erreur d'authentification");
      setShowAlert(true);
      return;
    }

    const data = {
      numero: form.numero,
      nom: form.nom,
      type: form.type,
      prix: Number(form.prix),
      vente: Number(form.vente) || 0,
      quantite: Number(form.quantite),
      transport: Number(form.transport) || 0,
      idEntreprise: user?.profession.idEntreprise!,
      method: paymentMode,
      finalite: fpMode ? 'VENTE' : 'MATIERE_PREMIERE',
      // Entrepôt
      ville_entrepot: form.ville_entrepot,
      zone_entrepot: form.zone_entrepot,
      // Fournisseur
      nom_fournisseur: form.nom_fournisseur,
      telephone_fournisseur: form.telephone_fournisseur,
      nif: form.nif,
      stat: form.stat,
      email_fournisseur: form.email_fournisseur,
    };

    dispatch(addProduct({ data, token }));
  };

  useEffect(() => {
    if (addSuccess) {
      generatePdf();
      setAlertMessage('Produit ajouté avec succès !');
      setShowAlert(true);
      dispatch(fetchProducts(token || ''));
      dispatch(resetAddSuccess());
      setTimeout(() => {
        setShowAlert(false);
        navigate('/stock');
      }, 2000);
    }
  }, [addSuccess, dispatch, navigate, token]);

  useEffect(() => {
    if (addError && addStatus === 'failed') {
      setAlertMessage(`Erreur : ${addError}`);
      setShowAlert(true);
    }
  }, [addError, addStatus]);

  const generatePdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Bon de Commande', 20, 20);
    autoTable(doc, {
      head: [['Champ', 'Valeur']],
      body: [
        ['Numéro', form.numero],
        ['Nom', form.nom],
        ['Catégorie', form.type],
        ["Prix d'achat", form.prix],
        ['Prix de vente', form.vente],
        ['Quantité', form.quantite],
        ['Transport', form.transport],
        ['Ville entrepôt', form.ville_entrepot],
        ['Zone entrepôt', form.zone_entrepot],
        ['Fournisseur', form.nom_fournisseur],
        ['Téléphone', form.telephone_fournisseur],
        ['NIF', form.nif],
        ['STAT', form.stat],
        ['Email', form.email_fournisseur],
        ['Paiement', paymentMode],
        ['Finalité', fpMode ? 'Produit à vendre' : 'Matière première'],
      ],
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [4, 149, 125] },
    });
    doc.save('bon-commande.pdf');
  };

  const PAYMENT_OPTIONS: { value: typeof paymentMode; label: string }[] = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CREDIT', label: 'Crédit' },
    { value: 'BANK', label: 'Virement' },
    { value: 'MOBILE_MONEY', label: 'Mobile Money' },
    { value: 'CHECK', label: 'Chèque' },
  ];

  return (
    <div className="add-product-page">
      <header className="header">
        <h1>Ajouter un Produit</h1>
        <button className="close-btn" onClick={() => navigate('/stock')}>
          <FaTimes />
        </button>
      </header>

      <form className="form" onSubmit={handleSubmit}>

        {/* ── Informations produit ── */}
        <h2>Informations produit</h2>

        <div className="input-group">
          <label>Numéro *</label>
          <input type="text" value={form.numero} onChange={e => handleChange('numero', e.target.value)} placeholder="Numéro du produit" required />
        </div>

        <div className="input-group">
          <label>Nom *</label>
          <input type="text" value={form.nom} onChange={e => handleChange('nom', e.target.value)} placeholder="Nom du produit" required />
        </div>

        <div className="input-group">
          <label>Catégorie *</label>
          <input type="text" value={form.type} onChange={e => handleChange('type', e.target.value)} placeholder="Catégorie" required />
        </div>

        <div className="input-group">
          <label>Prix d'achat <FaEuroSign /> *</label>
          <input type="number" min="0" value={form.prix} onChange={e => handleChange('prix', e.target.value)} placeholder="Prix d'achat" required />
        </div>

        <div className="input-group">
          <label>Prix de vente <FaEuroSign /></label>
          <input type="number" min="0" value={form.vente} onChange={e => handleChange('vente', e.target.value)} placeholder="Prix de vente (optionnel)" />
        </div>

        <div className="input-group">
          <label>Quantité *</label>
          <input type="number" min="0" value={form.quantite} onChange={e => handleChange('quantite', e.target.value)} placeholder="Quantité initiale" required />
        </div>

        <div className="input-group">
          <label>Transport <FaTruck /></label>
          <input type="number" min="0" value={form.transport} onChange={e => handleChange('transport', e.target.value)} placeholder="Frais de transport" />
        </div>

        {/* Finalité */}
        <div className="switch-group">
          <label className="switch-label">
            <span>Matière première</span>
            <div className="switch">
              <input type="radio" checked={salesMode} onChange={e => { setSalesMode(e.target.checked); setFpMode(!e.target.checked); }} />
              <span className="switch-slider" />
            </div>
          </label>
          <label className="switch-label">
            <span>Produit à vendre</span>
            <div className="switch">
              <input type="radio" checked={fpMode} onChange={e => { setSalesMode(!e.target.checked); setFpMode(e.target.checked); }} />
              <span className="switch-slider" />
            </div>
          </label>
        </div>

        {/* ── Entrepôt (NOUVEAU) ── */}
        <h2><FaWarehouse /> Entrepôt de destination</h2>

        <div className="input-group">
          <label><FaMapMarkerAlt /> Ville *</label>
          <input
            type="text"
            value={form.ville_entrepot}
            onChange={e => handleChange('ville_entrepot', e.target.value)}
            placeholder="Ex : Antananarivo"
            required
          />
        </div>

        <div className="input-group">
          <label><FaMapMarkerAlt /> Zone *</label>
          <input
            type="text"
            value={form.zone_entrepot}
            onChange={e => handleChange('zone_entrepot', e.target.value)}
            placeholder="Ex : Zone industrielle"
            required
          />
        </div>

        {/* ── Fournisseur ── */}
        <h2>Fournisseur</h2>

        <div className="input-group">
          <label>Nom <FaUser /> *</label>
          <input type="text" value={form.nom_fournisseur} onChange={e => handleChange('nom_fournisseur', e.target.value)} placeholder="Nom du fournisseur" required />
        </div>

        <div className="input-group">
          <label>Téléphone <FaPhone /> *</label>
          <input type="text" value={form.telephone_fournisseur} onChange={e => handleChange('telephone_fournisseur', e.target.value)} placeholder="Téléphone" required />
        </div>

        <div className="input-group">
          <label>NIF <FaIdCard /> *</label>
          <input type="text" value={form.nif} onChange={e => handleChange('nif', e.target.value)} placeholder="NIF" required />
        </div>

        <div className="input-group">
          <label>STAT <FaIdCard /> *</label>
          <input type="text" value={form.stat} onChange={e => handleChange('stat', e.target.value)} placeholder="STAT" required />
        </div>

        <div className="input-group">
          <label>Email <FaEnvelope /></label>
          <input type="email" value={form.email_fournisseur} onChange={e => handleChange('email_fournisseur', e.target.value)} placeholder="Email (optionnel)" />
        </div>

        {/* ── Mode de paiement ── */}
        <h2>Mode de paiement</h2>
        <div className="payment-options">
          {PAYMENT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              type="button"
              className={`payment-btn ${paymentMode === opt.value ? 'active' : ''}`}
              onClick={() => setPaymentMode(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button type="submit" className="submit-btn" disabled={isAdding}>
          <FaSave /> {isAdding ? 'Ajout en cours...' : 'Ajouter'}
        </button>
      </form>

      {showAlert && (
        <div className="alert-modal">
          <p>{alertMessage}</p>
          <button onClick={() => setShowAlert(false)}>OK</button>
        </div>
      )}
    </div>
  );
}
