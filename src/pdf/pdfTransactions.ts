// src/pdf/pdfTransactions.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Transaction } from '../models/index';

function formatAr(value: number): string {
  return `${value.toLocaleString('fr-MG')} Ar`;
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function drawHeader(doc: jsPDF, count: number) {
  // Dark header
  doc.setFillColor(20, 28, 48);
  doc.rect(0, 0, 210, 42, 'F');

  // Accent stripe
  doc.setFillColor(232, 168, 56);
  doc.rect(0, 0, 6, 42, 'F');
  doc.setFillColor(255, 200, 80);
  doc.rect(6, 0, 2, 42, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(21);
  doc.text('Relevé de Transactions', 22, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(200, 200, 200);
  doc.text(`${count} transaction${count > 1 ? 's' : ''} au total`, 22, 28);

  doc.setFontSize(8);
  doc.setTextColor(160, 160, 160);
  doc.text(
    `Extrait généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    22,
    36,
  );
}

function drawKPI(
  doc: jsPDF,
  label: string,
  value: string,
  x: number,
  y: number,
  color: [number, number, number],
  bg: [number, number, number],
) {
  doc.setFillColor(...bg);
  doc.roundedRect(x, y, 56, 18, 3, 3, 'F');
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(label, x + 4, y + 6);
  doc.setTextColor(...color);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(value, x + 4, y + 14);
}

export function generateTransactionsPDF(transactions: Transaction[]): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const entrees = transactions.filter((t) => t.type === 'ENTREE');
  const sorties = transactions.filter((t) => t.type === 'SORTIE');
  const totalEntrees = entrees.reduce((s, t) => s + t.quantite * t.prixUnitaire, 0);
  const totalSorties = sorties.reduce((s, t) => s + t.quantite * t.prixUnitaire, 0);
  const solde = totalSorties - totalEntrees; // sorties = ventes = argent entrant

  drawHeader(doc, transactions.length);

  let y = 52;

  // ── KPIs ──
  drawKPI(doc, 'Total entrées (achats)', formatAr(totalEntrees), 14, y, [200, 50, 50], [255, 240, 240]);
  drawKPI(doc, 'Total sorties (ventes)', formatAr(totalSorties), 77, y, [21, 120, 60], [235, 255, 242]);
  drawKPI(doc, 'Flux net', formatAr(solde), 140, y, solde >= 0 ? [21, 120, 60] : [180, 40, 40], solde >= 0 ? [235, 255, 242] : [255, 235, 235]);

  y += 26;

  // ── TABLE ──
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Réf.', 'Type', 'Qté', 'P.U.', 'Montant', 'Date']],
    body: transactions.map((tx) => [
      tx.ref,
      tx.type,
      String(tx.quantite),
      formatAr(tx.prixUnitaire),
      formatAr(tx.quantite * tx.prixUnitaire),
      formatDate(tx.date),
    ]),
    headStyles: {
      fillColor: [20, 28, 48],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8.5,
    },
    bodyStyles: { fontSize: 8.5, textColor: [30, 30, 30] },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 12, halign: 'center' },
      3: { halign: 'right' },
      4: { halign: 'right', fontStyle: 'bold' },
      5: { cellWidth: 24, halign: 'center' },
    },
    alternateRowStyles: { fillColor: [248, 248, 252] },
    theme: 'grid',
    didParseCell(data) {
      if (data.column.index === 1 && data.section === 'body') {
        if (data.cell.raw === 'ENTREE') {
          data.cell.styles.textColor = [180, 40, 40];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [21, 120, 60];
          data.cell.styles.fontStyle = 'bold';
        }
      }
      if (data.column.index === 4 && data.section === 'body') {
        const row = data.row.raw as string[];
        const type = row[1];
        data.cell.styles.textColor = type === 'ENTREE' ? [180, 40, 40] : [21, 120, 60];
      }
    },
  });

  const tableEndY = (doc as any).lastAutoTable.finalY + 4;

  // ── RÉCAPITULATIF FINAL ──
  autoTable(doc, {
    startY: tableEndY,
    margin: { left: 14, right: 14 },
    head: [['Récapitulatif', 'Nb opérations', 'Montant total']],
    body: [
      ['Entrées (achats)', String(entrees.length), formatAr(totalEntrees)],
      ['Sorties (ventes)', String(sorties.length), formatAr(totalSorties)],
    ],
    headStyles: { fillColor: [232, 168, 56], textColor: [20, 28, 48], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right', fontStyle: 'bold' },
    },
    theme: 'grid',
    didParseCell(data) {
      if (data.column.index === 2 && data.section === 'body') {
        data.cell.styles.textColor = data.row.index === 0 ? [180, 40, 40] : [21, 120, 60];
      }
    },
  });

  // ── FOOTER ──
  doc.setFillColor(20, 28, 48);
  doc.rect(0, 280, 210, 17, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Document généré automatiquement — My Business', 105, 290, { align: 'center' });
  doc.setTextColor(180, 180, 180);
  doc.text(`${transactions.length} transaction(s) exportée(s)`, 105, 294, { align: 'center' });

  doc.save(`Transactions_${Date.now()}.pdf`);
}