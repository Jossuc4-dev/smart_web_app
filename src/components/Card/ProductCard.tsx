// src/components/ProductCard/index.tsx
import React from 'react';
import { type Produit } from '../../models';
import './productcard.css';

interface ProductCardProps {
  produit: Produit;
}

export default function ProductCard({ produit }: ProductCardProps) {
  return (
    <div className="product-card">
      <div className="product-card-image">
          <div className="product-card-placeholder">📦</div>
      </div>
      <div className="product-card-info">
        <h3 className="product-card-title">{produit.nom}</h3>
        {produit.numero && (
          <p className="product-card-ref">Réf: {produit.numero}</p>
        )}
        <p className="product-card-price">{produit.prixVente.toLocaleString()} Ar</p>
        <p className="product-card-stock">Stock: {produit.quantite}</p>
      </div>
    </div>
  );
}