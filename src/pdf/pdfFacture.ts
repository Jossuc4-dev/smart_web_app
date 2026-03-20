import autoTable from "jspdf-autotable";
import type { CommandeResponse } from "../models/interfaces";
import jsPDF from "jspdf";
import { formatAr } from "../utils/formatCurrency";

// Génération PDF pour une commande
const generateInvoicePdf = (command: CommandeResponse, errorFunction: () => void): Blob | null => {
  try {
    const doc = new jsPDF();
    let yOffset = 20;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.setTextColor(4, 149, 125);
    doc.text('RAPPORT DES VENTES', pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 10;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 20;

    // En-tête facture
    doc.setFontSize(16);
    doc.setTextColor(4, 149, 125);
    doc.text(`FACTURE ${command.reference || 'N°' + command.id}`, pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 10;

    // Infos client
    doc.setFontSize(11);
    doc.setTextColor(50);
    doc.text(`Client: ${command.client.nom}`, 20, yOffset);
    doc.text(`Date: ${new Date(command.date).toLocaleDateString('fr-FR')}`, 120, yOffset);
    yOffset += 7;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Email: ${command.client.email || '—'}`, 20, yOffset);
    doc.text(`Tél: ${command.client.telephone || '—'}`, 120, yOffset);
    yOffset += 15;

    // Tableau produit
    autoTable(doc, {
      startY: yOffset,
      head: [['Produit', 'Qté', 'Prix unitaire', 'Total']],
      body: [[
        command.produit.nom,
        command.quantite.toString(),
        formatAr(command.produit.prixVente),
        formatAr(command.quantite * command.produit.prixVente)
      ]],
      theme: 'grid',
      headStyles: { fillColor: [4, 149, 125] },
      styles: { fontSize: 10 },
    });

    yOffset = (doc as any).lastAutoTable.finalY + 10;

    // Total et statut
    doc.setFontSize(11);
    doc.setFont("", 'bold');
    doc.text('TOTAL:', 140, yOffset);
    doc.text(formatAr(command.quantite * command.produit.prixVente), 190, yOffset, { align: 'right' });
    yOffset += 7;

    doc.setFontSize(10);
    doc.setFont("", 'normal');
    doc.text(`Statut: ${command.valide ? 'PAYÉ' : 'EN ATTENTE'}`, 20, yOffset);
    const typePaiement = command.typePaiement === 'CASH' ? 'Espèces' :
      command.typePaiement === 'CARTE' ? 'Carte' :
        command.typePaiement === 'MOBILE_MONEY' ? 'Mobile Money' : 'Non spécifié';
    doc.text(`Paiement: ${typePaiement}`, 120, yOffset);

    // doc.save(`rapport-commandes.pdf`);
    return doc.output('blob');
  } catch (error) {
    console.log("Erreur lors de la génération du PDF:", error);
    errorFunction()
    return null
  }
};

const generateMultiplePdf = (commands: CommandeResponse[], errorFunction: () => void) => {
  try {
    const doc = new jsPDF();
    let yOffset = 20;
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.setTextColor(4, 149, 125);
    doc.text('RAPPORT DES VENTES', pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 10;

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth / 2, yOffset, { align: 'center' });
    yOffset += 20;

    commands.forEach((command, index) => {
      if (index > 0) {
        doc.addPage();
        yOffset = 20;
      }

      // En-tête facture
      doc.setFontSize(16);
      doc.setTextColor(4, 149, 125);
      doc.text(`FACTURE ${command.reference || 'N°' + command.id}`, pageWidth / 2, yOffset, { align: 'center' });
      yOffset += 10;

      // Infos client
      doc.setFontSize(11);
      doc.setTextColor(50);
      doc.text(`Client: ${command.client.nom}`, 20, yOffset);
      doc.text(`Date: ${new Date(command.date).toLocaleDateString('fr-FR')}`, 120, yOffset);
      yOffset += 7;

      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Email: ${command.client.email || '—'}`, 20, yOffset);
      doc.text(`Tél: ${command.client.telephone || '—'}`, 120, yOffset);
      yOffset += 15;

      // Tableau produit
      autoTable(doc, {
        startY: yOffset,
        head: [['Produit', 'Qté', 'Prix unitaire', 'Total']],
        body: [[
          command.produit.nom,
          command.quantite.toString(),
          command.produit.prixVente.toLocaleString() + ' Ar',
          (command.quantite * command.produit.prixVente).toLocaleString() + ' Ar'
        ]],
        theme: 'grid',
        headStyles: { fillColor: [4, 149, 125] },
        styles: { fontSize: 10 },
      });

      yOffset = (doc as any).lastAutoTable.finalY + 10;

      // Total et statut
      doc.setFontSize(11);
      doc.setFont("", 'bold');
      doc.text('TOTAL:', 140, yOffset);
      doc.text((command.quantite * command.produit.prixVente).toLocaleString() + ' Ar', 190, yOffset, { align: 'right' });
      yOffset += 7;

      doc.setFontSize(10);
      doc.setFont("", 'normal');
      doc.text(`Statut: ${command.valide ? 'PAYÉ' : 'EN ATTENTE'}`, 20, yOffset);
      const typePaiement = command.typePaiement === 'CASH' ? 'Espèces' :
        command.typePaiement === 'CARTE' ? 'Carte' :
          command.typePaiement === 'MOBILE_MONEY' ? 'Mobile Money' : 'Non spécifié';
      doc.text(`Paiement: ${typePaiement}`, 120, yOffset);
    });

    doc.save(`rapport-${commands.length}-commandes.pdf`);
  } catch (error) {
    errorFunction()
  }
};

export { generateInvoicePdf, generateMultiplePdf };  