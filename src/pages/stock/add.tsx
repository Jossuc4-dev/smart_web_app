// src/pages/stock/add/AddProductScreen.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../redux/store';
import { addProduct, fetchProducts, resetAddSuccess } from '../../redux/slices/stockSlice';
import { selectAddSuccess, selectAddStatus, selectIsAdding, selectStockError } from '../../redux/selectors/stock.selector';
import { useAuth } from '../../contexts/AuthContext';
import { FaSave, FaTimes, FaEuroSign, FaTruck, FaUser, FaPhone, FaIdCard, FaEnvelope } from 'react-icons/fa';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './add.css';
import type { BonCommandeData } from '../../models/interfaces';

export default function AddProductScreen() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user,token } = useAuth();

  // Utilisation des selecteurs
  const addSuccess = useAppSelector(selectAddSuccess);
  const addStatus = useAppSelector(selectAddStatus);
  const isAdding = useAppSelector(selectIsAdding);
  const addError = useAppSelector(selectStockError);

  const [form, setForm] = useState({
    numero: '',
    nom: '',
    type: '',
    prix: '',
    vente: '',
    quantite: '',
    transport: '0',
    nom_fournisseur: '',
    telephone_fournisseur: '',
    nif: '',
    stat: '',
    email_fournisseur: '',
  });

  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CREDIT'>('CASH');
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleChange = (field: keyof typeof form, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return (
      form.numero.trim() &&
      form.nom.trim() &&
      form.type.trim() &&
      form.prix.trim() &&
      form.vente.trim() &&
      form.quantite.trim() &&
      form.nom_fournisseur.trim() &&
      form.telephone_fournisseur.trim() &&
      form.nif.trim() &&
      form.stat.trim()
    );
  };

  const handleSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      setAlertMessage('Veuillez remplir tous les champs obligatoires');
      setShowAlert(true);
      return;
    }

    if (!token) {
      setAlertMessage('Erreur d\'authentification');
      setShowAlert(true);
      return;
    }

    const data = {
      numero: form.numero,
      nom: form.nom,
      type: form.type,
      prix: Number(form.prix),
      vente: Number(form.vente),
      quantite: Number(form.quantite),
      idEntreprise: user?.id!,
      nom_fournisseur: form.nom_fournisseur,
      telephone_fournisseur: form.telephone_fournisseur,
      nif: form.nif,
      stat: form.stat,
      email_fournisseur: form.email_fournisseur,
      method: paymentMode,
      transport: Number(form.transport),
    };

    console.log({data})

    dispatch(addProduct({ data, token }));
  };

  useEffect(() => {
    if (addSuccess) {
      setAlertMessage('Produit ajouté avec succès !');
      setShowAlert(true);
      generatePdf(); // Generate PDF on success
      dispatch(fetchProducts(token || '')); // Refresh products
      dispatch(resetAddSuccess()); // Reset success flag

      setTimeout(() => {
        setShowAlert(false);
        navigate('/stock');
      }, 2000);
    }
  }, [addSuccess, dispatch, navigate, token]);

  useEffect(() => {
    if (addError && addStatus === 'failed') {
      setAlertMessage(`Erreur: ${addError}`);
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
        ['Prix d\'achat', form.prix],
        ['Prix de vente', form.vente],
        ['Quantité', form.quantite],
        ['Transport', form.transport],
        ['Fournisseur', form.nom_fournisseur],
        ['Téléphone', form.telephone_fournisseur],
        ['NIF', form.nif],
        ['STAT', form.stat],
        ['Email', form.email_fournisseur],
        ['Paiement', paymentMode],
      ],
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [4, 149, 125] },
    });

    doc.save('bon-commande.pdf');
  };

  return (
    <div className="add-product-page">
      <header className="header">
        <h1>Ajouter un Produit</h1>
        <button className="close-btn" onClick={() => navigate('/stock')}>
          <FaTimes />
        </button>
      </header>

      <form className="form" onSubmit={handleSubmit}>
        <div className="input-group">
          <label>Numéro</label>
          <input
            type="text"
            value={form.numero}
            onChange={e => handleChange('numero', e.target.value)}
            placeholder="Numéro du produit"
            required
          />
        </div>

        <div className="input-group">
          <label>Nom</label>
          <input
            type="text"
            value={form.nom}
            onChange={e => handleChange('nom', e.target.value)}
            placeholder="Nom du produit"
            required
          />
        </div>

        <div className="input-group">
          <label>Catégorie</label>
          <input
            type="text"
            value={form.type}
            onChange={e => handleChange('type', e.target.value)}
            placeholder="Catégorie"
            required
          />
        </div>

        <div className="input-group">
          <label>Prix d'achat <FaEuroSign /></label>
          <input
            type="number"
            value={form.prix}
            onChange={e => handleChange('prix', e.target.value)}
            placeholder="Prix d'achat"
            required
          />
        </div>

        <div className="input-group">
          <label>Prix de vente <FaEuroSign /></label>
          <input
            type="number"
            value={form.vente}
            onChange={e => handleChange('vente', e.target.value)}
            placeholder="Prix de vente"
            required
          />
        </div>

        <div className="input-group">
          <label>Quantité</label>
          <input
            type="number"
            value={form.quantite}
            onChange={e => handleChange('quantite', e.target.value)}
            placeholder="Quantité"
            required
          />
        </div>

        <div className="input-group">
          <label>Transport <FaTruck /></label>
          <input
            type="number"
            value={form.transport}
            onChange={e => handleChange('transport', e.target.value)}
            placeholder="Coût transport"
          />
        </div>

        <h2>Fournisseur</h2>

        <div className="input-group">
          <label>Nom <FaUser /></label>
          <input
            type="text"
            value={form.nom_fournisseur}
            onChange={e => handleChange('nom_fournisseur', e.target.value)}
            placeholder="Nom du fournisseur"
            required
          />
        </div>

        <div className="input-group">
          <label>Téléphone <FaPhone /></label>
          <input
            type="text"
            value={form.telephone_fournisseur}
            onChange={e => handleChange('telephone_fournisseur', e.target.value)}
            placeholder="Téléphone"
            required
          />
        </div>

        <div className="input-group">
          <label>NIF <FaIdCard /></label>
          <input
            type="text"
            value={form.nif}
            onChange={e => handleChange('nif', e.target.value)}
            placeholder="NIF"
            required
          />
        </div>

        <div className="input-group">
          <label>STAT <FaIdCard /></label>
          <input
            type="text"
            value={form.stat}
            onChange={e => handleChange('stat', e.target.value)}
            placeholder="STAT"
            required
          />
        </div>

        <div className="input-group">
          <label>Email <FaEnvelope /></label>
          <input
            type="email"
            value={form.email_fournisseur}
            onChange={e => handleChange('email_fournisseur', e.target.value)}
            placeholder="Email (optionnel)"
          />
        </div>

        <h2>Mode de paiement</h2>
        <div className="payment-options">
          <button
            type="button"
            className={`payment-btn ${paymentMode === 'CASH' ? 'active' : ''}`}
            onClick={() => setPaymentMode('CASH')}
          >
            Cash
          </button>
          <button
            type="button"
            className={`payment-btn ${paymentMode === 'CREDIT' ? 'active' : ''}`}
            onClick={() => setPaymentMode('CREDIT')}
          >
            Crédit
          </button>
        </div>

        <button
          type="submit"
          className="submit-btn"
          disabled={isAdding}
        >
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