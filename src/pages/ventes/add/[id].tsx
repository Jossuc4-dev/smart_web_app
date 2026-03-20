// src/pages/ventes/add/[id].tsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../../redux/store';
import { fetchProducts } from '../../../redux/slices/stockSlice';
import { useAuth } from '../../../contexts/AuthContext';
import {
  FaArrowLeft,
  FaShoppingCart,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPlus,
  FaTimes,
  FaCheck,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaCreditCard,
  FaMobileAlt
} from 'react-icons/fa';
import './form.css';
import BASE_URL from '../../../config/ApiConfig';
import { generateInvoicePdf, generateMultiplePdf } from '../../../pdf/pdfFacture';
import type { CommandeResponse } from '../../../models/interfaces';

interface Client {
  id: number;
  nom: string;
  email: string;
  telephone: string;
  adresse?: string;
}

// Type pour la création de vente
interface CreateVenteRequest {
  idProduit: number;
  quantite: number;
  client: {
    nom: string;
    email: string;
    telephone: string;
  };
  datePaiement: string; // Format: YYYY-MM-DD
  typePaiement: 'CASH' | 'CARTE' | 'MOBILE_MONEY' | 'CREDIT';
}

interface NewClientData {
  nom: string;
  email: string;
  telephone: string;
  adresse?: string;
}

export default function AddCommandeForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { token, logout } = useAuth();

  const produit = useAppSelector(state =>
    state.stock.products.find(p => p.id === Number(id))
  );

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);

  // État pour le client (soit existant, soit nouveau)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClient, setNewClient] = useState<NewClientData>({
    nom: '',
    email: '',
    telephone: '',
    adresse: ''
  });
  const [newClientErrors, setNewClientErrors] = useState<Record<string, string>>({});

  // État pour la commande
  const [quantite, setQuantite] = useState<number>(1);
  const [datePaiement, setDatePaiement] = useState<string>(
    new Date().toISOString().split('T')[0] // Date du jour au format YYYY-MM-DD
  );
  const [typePaiement, setTypePaiement] = useState<'CASH' | 'CARTE' | 'MOBILE_MONEY' | 'CREDIT'>('CASH');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Gestion de la session expirée
  useEffect(() => {
    if (sessionExpired) {
      const timer = setTimeout(() => {
        logout();
        navigate('/', { replace: true });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [sessionExpired, logout, navigate]);

  useEffect(() => {
    if (token && !sessionExpired) {
      if (!produit) {
        dispatch(fetchProducts(token));
      }
    }
  }, [token, produit, dispatch, sessionExpired]);

  const validateNewClient = (): boolean => {
    const errors: Record<string, string> = {};

    if (!newClient.nom.trim()) {
      errors.nom = 'Le nom est requis';
    }

    if (!newClient.email.trim()) {
      errors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newClient.email)) {
      errors.email = 'Email invalide';
    }

    if (!newClient.telephone.trim()) {
      errors.telephone = 'Le téléphone est requis';
    } else if (!/^[0-9+\-\s]{8,}$/.test(newClient.telephone)) {
      errors.telephone = 'Numéro de téléphone invalide';
    }

    setNewClientErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedClient && !showNewClientForm) {
      newErrors.client = 'Veuillez sélectionner un client';
    }

    if (showNewClientForm && !validateNewClient()) {
      return false;
    }

    if (quantite <= 0) {
      newErrors.quantite = 'La quantité doit être supérieure à 0';
    }

    if (quantite > (produit?.quantite || 0)) {
      newErrors.quantite = `Stock insuffisant (${produit?.quantite} disponible${produit?.quantite || 0 > 1 ? 's' : ''})`;
    }

    if (!datePaiement) {
      newErrors.datePaiement = 'La date de paiement est requise';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || sessionExpired) return;

    setSubmitting(true);
    try {
      // Construire la requête selon le format attendu
      const venteData: CreateVenteRequest = {
        idProduit: Number(id),
        quantite: quantite,
        client: showNewClientForm ? {
          nom: newClient.nom,
          email: newClient.email,
          telephone: newClient.telephone
        } : {
          nom: selectedClient!.nom,
          email: selectedClient!.email,
          telephone: selectedClient!.telephone
        },
        datePaiement: datePaiement,
        typePaiement: typePaiement
      };

      console.log('Données envoyées:', venteData);

      const response = await fetch(`${BASE_URL}/vente/commande`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(venteData),
      });

      if (response.status === 401) {
        setSessionExpired(true);
        return;
      }


      if (response.ok) {
        const data: { success: boolean, data: CommandeResponse } = await response.json();
        const commandeResponse = data.data;
        console.log('Réponse du serveur:', commandeResponse);
        const blobPDf = generateInvoicePdf(commandeResponse, () => {
          alert("Generation de pdf échouée. Veuillez réessayer.");
        });

        console.log(blobPDf)

        if (blobPDf) {
          const formData = new FormData();
          formData.append(
            'facture',                                              // nom du champ fichier
            blobPDf,
            `facture-${commandeResponse.reference || commandeResponse.id}.pdf`
          );
          formData.append('email', commandeResponse.client.email); // mail du client

          // 3. Envoyer au backend
          const sendFacture = await fetch(`${BASE_URL}/vente/facture/send`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              // ⚠️ PAS de Content-Type ici : fetch le génère automatiquement avec le boundary
            },
            body: formData,
          });

          console.log('Réponse envoi facture:', sendFacture);
        }

        navigate('/ventes', {
          state: {
            success: true,
            message: 'Vente créée avec succès',
            vente: commandeResponse,
          }
        });
      } else {
        const error = await response.json();
        setErrors({ submit: error.message || 'Erreur lors de la création' });
      }
    } catch (error) {
      console.error('Erreur:', error);
      setErrors({ submit: 'Erreur de connexion au serveur' });
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = (produit?.prixVente || 0) * quantite;

  if (sessionExpired) {
    return (
      <div className="session-expired-container">
        <div className="session-expired-card">
          <FaExclamationTriangle size={48} color="#f87171" />
          <h2>Session expirée</h2>
          <p>Votre session a expiré. Vous allez être redirigé vers la page de connexion.</p>
          <div className="redirect-spinner" />
        </div>
      </div>
    );
  }

  if (loading && !produit) {
    return (
      <div className="form-loading-container">
        <div className="spinner" />
        <p>Chargement...</p>
      </div>
    );
  }

  if (!produit) {
    return (
      <div className="form-error-container">
        <h2>Produit non trouvé</h2>
        <button onClick={() => navigate('/ventes/add')} className="back-to-products">
          Retour à la sélection
        </button>
      </div>
    );
  }

  return (
    <div className="commande-form-container">
      <div className="form-header">
        <button className="back-btn" onClick={() => navigate('/ventes/add')}>
          <FaArrowLeft />
        </button>
        <h1>Nouvelle vente</h1>
      </div>

      <div className="form-content">
        {/* Résumé produit */}
        <div className="product-summary">
          <div className="product-image">
            <div className="product-placeholder">
              <FaShoppingCart />
            </div>
          </div>
          <div className="product-details">
            <h2>{produit.nom}</h2>
            <p className="product-reference">Réf: {produit.numero || '—'}</p>
            <p className="product-price">{produit.prixVente.toLocaleString()} Ar</p>
            <p className="product-stock">Stock: {produit.quantite} disponible(s)</p>
          </div>
        </div>

        {/* Sélection client */}
        <div className="form-section">
          <div className="section-header">
            <h3>Client</h3>
            {!showNewClientForm && !selectedClient && (
              <button
                type="button"
                className="add-client-btn"
                onClick={() => setShowNewClientForm(true)}
              >
                <FaPlus /> Nouveau client
              </button>
            )}
          </div>

          {!showNewClientForm && !selectedClient && (
            <div>
              <div className="client-search-wrapper">
                <FaUser className="input-icon" />
                <input
                  type="text"
                  placeholder="Nom du client"
                  value={newClient.nom}
                  onChange={(e) => {
                    setShowNewClientForm(true);
                    setNewClient({ ...newClient, nom: e.target.value });
                  }}
                  className={`client-search-input ${errors.client ? 'error' : ''}`}
                />
              </div>
              {errors.client && <span className="error-message">{errors.client}</span>}
            </div>
          )}

          {showNewClientForm && (
            <div className="new-client-form">
              <div className="form-header">
                <h4>Informations client</h4>
                <button
                  className="close-btn"
                  onClick={() => {
                    setShowNewClientForm(false);
                    setNewClient({ nom: '', email: '', telephone: '', adresse: '' });
                    setNewClientErrors({});
                  }}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="form-group">
                <label htmlFor="client-nom">Nom *</label>
                <div className="input-wrapper">
                  <FaUser className="input-icon" />
                  <input
                    id="client-nom"
                    type="text"
                    value={newClient.nom}
                    onChange={(e) => setNewClient({ ...newClient, nom: e.target.value })}
                    className={newClientErrors.nom ? 'error' : ''}
                    placeholder="Nom du client"
                  />
                </div>
                {newClientErrors.nom && <span className="error-message">{newClientErrors.nom}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="client-email">Email *</label>
                <div className="input-wrapper">
                  <FaEnvelope className="input-icon" />
                  <input
                    id="client-email"
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                    className={newClientErrors.email ? 'error' : ''}
                    placeholder="email@exemple.com"
                  />
                </div>
                {newClientErrors.email && <span className="error-message">{newClientErrors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="client-telephone">Téléphone *</label>
                <div className="input-wrapper">
                  <FaPhone className="input-icon" />
                  <input
                    id="client-telephone"
                    type="tel"
                    value={newClient.telephone}
                    onChange={(e) => setNewClient({ ...newClient, telephone: e.target.value })}
                    className={newClientErrors.telephone ? 'error' : ''}
                    placeholder="+261 34 00 000 00"
                  />
                </div>
                {newClientErrors.telephone && <span className="error-message">{newClientErrors.telephone}</span>}
              </div>
            </div>
          )}
        </div>

        {/* Quantité */}
        <div className="form-section">
          <h3>Quantité</h3>
          <div className="quantity-control">
            <button
              type="button"
              className="quantity-btn"
              onClick={() => setQuantite(Math.max(1, quantite - 1))}
              disabled={quantite <= 1}
            >
              −
            </button>
            <input
              type="number"
              min="1"
              max={produit.quantite}
              value={quantite}
              onChange={(e) => setQuantite(Math.min(produit.quantite, parseInt(e.target.value) || 1))}
              className={`quantity-input ${errors.quantite ? 'error' : ''}`}
            />
            <button
              type="button"
              className="quantity-btn"
              onClick={() => setQuantite(Math.min(produit.quantite, quantite + 1))}
              disabled={quantite >= produit.quantite}
            >
              +
            </button>
          </div>
          {errors.quantite && <span className="error-message">{errors.quantite}</span>}
        </div>

        {/* Mode de paiement */}
        <div className="form-section">
          <h3>Mode de paiement</h3>
          <div className="payment-options">
            <label className={`payment-option ${typePaiement === 'CASH' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="typePaiement"
                value="CASH"
                checked={typePaiement === 'CASH'}
                onChange={(e) => setTypePaiement(e.target.value as 'CASH')}
              />
              <FaMoneyBillWave className="payment-icon" />
              <span>Espèces</span>
            </label>

            <label className={`payment-option ${typePaiement === 'CARTE' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="typePaiement"
                value="CARTE"
                checked={typePaiement === 'CARTE'}
                onChange={(e) => setTypePaiement(e.target.value as 'CARTE')}
              />
              <FaCreditCard className="payment-icon" />
              <span>Carte bancaire</span>
            </label>

            <label className={`payment-option ${typePaiement === 'MOBILE_MONEY' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="typePaiement"
                value="MOBILE_MONEY"
                checked={typePaiement === 'MOBILE_MONEY'}
                onChange={(e) => setTypePaiement(e.target.value as 'MOBILE_MONEY')}
              />
              <FaMobileAlt className="payment-icon" />
              <span>Mobile Money</span>
            </label>

            <label className={`payment-option ${typePaiement === 'CREDIT' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="typePaiement"
                value="CREDIT"
                checked={typePaiement === 'CREDIT'}
                onChange={(e) => setTypePaiement(e.target.value as 'CREDIT')}
              />
              <FaCreditCard className="payment-icon" />
              <span>Crédit</span>
            </label>
          </div>
        </div>

        {/* Date de paiement */}
        <div className="form-section">
          <h3>Date de paiement</h3>
          <div className="input-wrapper">
            <FaCalendarAlt className="input-icon" />
            <input
              type="date"
              value={datePaiement}
              onChange={(e) => setDatePaiement(e.target.value)}
              className={`date-input ${errors.datePaiement ? 'error' : ''}`}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          {errors.datePaiement && <span className="error-message">{errors.datePaiement}</span>}
        </div>

        {/* Récapitulatif */}
        <div className="order-summary">
          <h3>Récapitulatif</h3>
          <div className="summary-row">
            <span>Produit:</span>
            <span>{produit.nom}</span>
          </div>
          <div className="summary-row">
            <span>Prix unitaire:</span>
            <span>{produit.prixVente.toLocaleString()} Ar</span>
          </div>
          <div className="summary-row">
            <span>Quantité:</span>
            <span>{quantite}</span>
          </div>
          <div className="summary-row">
            <span>Mode de paiement:</span>
            <span className="payment-summary">
              {typePaiement === 'CASH' && 'Espèces'}
              {typePaiement === 'CARTE' && 'Carte bancaire'}
              {typePaiement === 'MOBILE_MONEY' && 'Mobile Money'}
              {typePaiement === 'CREDIT' && 'Crédit'}
            </span>
          </div>
          <div className="summary-row total">
            <span>Total:</span>
            <span>{totalAmount.toLocaleString()} Ar</span>
          </div>
        </div>

        {errors.submit && (
          <div className="submit-error">
            {errors.submit}
          </div>
        )}

        <div className="form-actions">
          <button
            className="cancel-btn"
            onClick={() => navigate('/ventes/add')}
          >
            Annuler
          </button>
          <button
            className="submit-btn"
            onClick={handleSubmit}
            disabled={submitting || (!selectedClient && !showNewClientForm)}
          >
            {submitting ? (
              <>
                <span className="spinner-small" />
                Création...
              </>
            ) : (
              'Créer la vente'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}