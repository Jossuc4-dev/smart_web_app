// src/pdf/pdfWallet.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatAr } from '../utils/formatCurrency';

interface WalletPDFData {
  solde: number;
  totalDepots: number;
  totalRetraits: number;
  transactions: any[];
}

const PRIMARY = '#2E86AB';
const GREEN = '#1B8A5A';
const RED = '#E05A5A';
const DARK = '#2d3748';
const GRAY = '#718096';

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

export function generateWalletPDF(data: WalletPDFData): void {
  const { solde, totalDepots, totalRetraits, transactions } = data;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentW = pageW - margin * 2;

  // ── Header banner ──
  const [pr, pg, pb] = hexToRgb(PRIMARY);
  doc.setFillColor(pr, pg, pb);
  doc.rect(0, 0, pageW, 40, 'F');

  // Accent stripe
  doc.setFillColor(23, 168, 184); // #17A8B8
  doc.rect(0, 36, pageW, 4, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('💳 Portefeuille', margin, 20);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const now = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  doc.text(`Rapport généré le ${now}`, margin, 31);

  let y = 52;

  // ── Summary cards ──
  const cards = [
    { label: 'Solde actuel', value: formatAr(solde), color: PRIMARY },
    { label: 'Total dépôts', value: formatAr(totalDepots), color: GREEN },
    { label: 'Total retraits', value: formatAr(totalRetraits), color: RED },
  ];

  const cardW = (contentW - 8) / 3;

  cards.forEach((card, i) => {
    const x = margin + i * (cardW + 4);
    const [cr, cg, cb] = hexToRgb(card.color);

    // Card background
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, cardW, 28, 3, 3, 'F');

    // Left accent bar
    doc.setFillColor(cr, cg, cb);
    doc.roundedRect(x, y, 3, 28, 1, 1, 'F');

    // Label
    doc.setTextColor(...hexToRgb(GRAY));
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(card.label, x + 8, y + 10);

    // Value
    doc.setTextColor(cr, cg, cb);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(card.value, x + 8, y + 21);
  });

  y += 38;

  // ── Section title ──
  doc.setTextColor(...hexToRgb(DARK));
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('Historique des transactions', margin, y);

  // Underline
  doc.setDrawColor(...hexToRgb(PRIMARY));
  doc.setLineWidth(0.5);
  doc.line(margin, y + 2, margin + 70, y + 2);

  y += 10;

  // ── Transactions table ──
  const walletTx = transactions.filter(
    (tx) => tx.type === 'depot' || tx.type === 'retrait'
  );

  if (walletTx.length === 0) {
    doc.setTextColor(...hexToRgb(GRAY));
    doc.setFontSize(11);
    doc.setFont('helvetica', 'italic');
    doc.text('Aucune transaction de portefeuille disponible.', margin, y + 10);
  } else {
    const tableRows = walletTx.map((tx) => {
      const montant = tx.quantite * tx.prixUnitaire || 0;
      const isDepot = tx.type === 'depot';
      return [
        new Date(tx.date).toLocaleDateString('fr-FR'),
        isDepot ? 'Dépôt' : 'Retrait',
        tx.motif || '—',
        isDepot ? `+ ${formatAr(montant)}` : `- ${formatAr(montant)}`,
      ];
    });

    autoTable(doc, {
      startY: y,
      head: [['Date', 'Type', 'Motif', 'Montant']],
      body: tableRows,
      theme: 'grid',
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: hexToRgb(PRIMARY),
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
        halign: 'center',
      },
      bodyStyles: {
        fontSize: 10,
        textColor: hexToRgb(DARK),
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 30 },
        1: { halign: 'center', cellWidth: 28 },
        2: { halign: 'left' },
        3: { halign: 'right', cellWidth: 45 },
      },
      didParseCell(hookData) {
        if (hookData.section === 'body' && hookData.column.index === 3) {
          const val = String(hookData.cell.raw ?? '');
          if (val.startsWith('+')) {
            hookData.cell.styles.textColor = hexToRgb(GREEN);
            hookData.cell.styles.fontStyle = 'bold';
          } else if (val.startsWith('-')) {
            hookData.cell.styles.textColor = hexToRgb(RED);
            hookData.cell.styles.fontStyle = 'bold';
          }
        }
        // Zebra stripes
        if (hookData.section === 'body' && hookData.row.index % 2 === 0) {
          hookData.cell.styles.fillColor = [247, 250, 252];
        }
      },
      alternateRowStyles: { fillColor: [255, 255, 255] },
    });
  }

  // ── Footer ──
  const footerY = pageH - 12;
  doc.setDrawColor(...hexToRgb('#e2e8f0'));
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 4, pageW - margin, footerY - 4);

  doc.setTextColor(...hexToRgb(GRAY));
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Document généré automatiquement – Confidentiel', margin, footerY);
  doc.text(`Page 1`, pageW - margin, footerY, { align: 'right' });

  doc.save(`portefeuille_${new Date().toISOString().slice(0, 10)}.pdf`);
}