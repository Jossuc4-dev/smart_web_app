import autoTable from "jspdf-autotable";
import type { CommandeResponse } from "../models/interfaces";
import jsPDF from "jspdf";

  // Génération PDF pour une commande
  const generateInvoicePdf = (command: CommandeResponse, errorFunction:()=>void) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const dateFacture = new Date().toLocaleDateString('fr-FR');
      
      // En-tête
      doc.setFontSize(22);
      doc.setTextColor(4, 149, 125);
      doc.text('FACTURE', pageWidth / 2, 20, { align: 'center' });
      
      // Informations entreprise
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text('SMART BUSINESS', 20, 35);
      doc.text('UNFOLDING INITIATION', 20, 40);
      doc.text('contact@smartbusiness.com', 20, 45);
      doc.text('+261 34 00 000 00', 20, 50);
      
      // Informations facture
      doc.setFontSize(12);
      doc.setTextColor(50);
      doc.text(`Facture N°: ${command.reference || 'FACT-' + command.id}`, 140, 35);
      doc.text(`Date d'émission: ${dateFacture}`, 140, 42);
      doc.text(`Date commande: ${new Date(command.date).toLocaleDateString('fr-FR')}`, 140, 49);
      
      // Statut
      doc.setFontSize(11);
      doc.setTextColor(command.valide ? 5 : 220, command.valide ? 170 : 53, command.valide ? 101 : 69);
      doc.text(`Statut: ${command.valide ? 'PAYÉE' : 'EN ATTENTE'}`, 140, 56);
      
      // Informations client
      doc.setFontSize(11);
      doc.setTextColor(80);
      doc.text('Client:', 20, 70);
      doc.setFontSize(12);
      doc.setFont("Arial", 'bold');
      doc.text(command.client.nom, 20, 77);
      doc.setFont("Arial", 'normal');
      doc.setFontSize(10);
      doc.text(command.client.email || 'Email non renseigné', 20, 84);
      doc.text(command.client.telephone || 'Téléphone non renseigné', 20, 91);
      
      // Ligne de séparation
      doc.setDrawColor(200);
      doc.line(20, 100, pageWidth - 20, 100);
      
      // Tableau des produits
      autoTable(doc, {
        startY: 105,
        head: [['Produit', 'Référence', 'Quantité', 'Prix unitaire', 'Total']],
        body: [[
          command.produit.nom,
          command.produit.numero || '—',
          command.quantite.toString(),
          command.produit.prixVente.toLocaleString() + ' Ar',
          (command.quantite * command.produit.prixVente).toLocaleString() + ' Ar'
        ]],
        theme: 'striped',
        headStyles: { fillColor: [4, 149, 125], textColor: [255, 255, 255] },
        styles: { fontSize: 10 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 30 },
          2: { cellWidth: 20, halign: 'center' },
          3: { cellWidth: 35, halign: 'right' },
          4: { cellWidth: 35, halign: 'right' }
        }
      });
      
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      // Total
      doc.setFontSize(14);
      doc.setFont("Arial", 'bold');
      doc.setTextColor(4, 149, 125);
      doc.text('TOTAL TTC:', 140, finalY);
      doc.text((command.quantite * command.produit.prixVente).toLocaleString() + ' Ar', pageWidth - 20, finalY, { align: 'right' });
      
      // Mode de paiement
      doc.setFontSize(10);
      doc.setFont("Arial", 'normal');
      doc.setTextColor(80);
      const typePaiement = command.typePaiement === 'CASH' ? 'Espèces' :
                           command.typePaiement === 'CARTE' ? 'Carte bancaire' :
                           command.typePaiement === 'MOBILE_MONEY' ? 'Mobile Money' :
                           command.typePaiement === 'CREDIT' ? 'Crédit' : 'Non spécifié';
      
      doc.text(`Mode de paiement: ${typePaiement}`, 20, finalY + 10);
      
      // Pied de page
      doc.setFontSize(8);
      doc.setTextColor(150);
      const footerY = finalY + 40;
      doc.text('Merci de votre confiance !', pageWidth / 2, footerY, { align: 'center' });
      doc.text('Cette facture est générée automatiquement et a valeur officielle.', pageWidth / 2, footerY + 5, { align: 'center' });
      
      doc.save(`facture-${command.reference || command.id}.pdf`);
    } catch (error) {
      errorFunction()
    }
  };

  const generateMultiplePdf = (commands: CommandeResponse[] ,errorFunction: () => void) => {
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