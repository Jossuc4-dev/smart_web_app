// src/pdf/pdfBilan.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { BilanComptable } from '../models/interfaces';
import { formatAr } from '../utils/formatCurrency';

function drawHeader(doc: jsPDF, annee: string) {
  // Deep teal gradient simulation via layered rects
  doc.setFillColor(15, 76, 92);
  doc.rect(0, 0, 210, 42, 'F');
  doc.setFillColor(2, 146, 122);
  doc.rect(0, 0, 6, 42, 'F');
  doc.setFillColor(0, 196, 162);
  doc.rect(6, 0, 3, 42, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('Bilan Comptable', 22, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Exercice ${annee}`, 22, 28);

  doc.setFontSize(8);
  doc.setTextColor(180, 240, 230);
  doc.text(
    `Édité le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    22, 36
  );
}

function sectionBadge(doc: jsPDF, label: string, color: [number, number, number], y: number): number {
  doc.setFillColor(...color);
  doc.roundedRect(14, y, 182, 9, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(label.toUpperCase(), 18, y + 6);
  return y + 14;
}

export function generateBilanPDF(data: BilanComptable): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  drawHeader(doc, data.annee);

  let y = 52;

  // ══════════════════════════════════════════
  //  ACTIF
  // ══════════════════════════════════════════
  y = sectionBadge(doc, '— ACTIF', [2, 100, 80], y);

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Poste d\'actif', 'Montant (Ar)']],
    body: [
      ['Trésorerie', formatAr(data.actif.tresorerie)],
      ['Stock valorisé', formatAr(data.actif.stockValorise)],
      ['Créances clients', formatAr(data.actif.creancesClients)],
      ...(data.actif.creancesClientsDetail.totalEnRetard > 0
        ? [['  ↳ dont créances en retard', formatAr(data.actif.creancesClientsDetail.totalEnRetard)]]
        : []),
    ],
    headStyles: { fillColor: [2, 146, 122], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 30, 30] },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { halign: 'right' },
    },
    alternateRowStyles: { fillColor: [240, 250, 248] },
    theme: 'grid',
    didParseCell(data) {
      // Style "en retard" row in red
      if (data.row.index > 0 && String(data.cell.raw).includes('retard')) {
        data.cell.styles.textColor = [180, 40, 40];
        data.cell.styles.fontStyle = 'italic';
      }
    },
  });
  y = (doc as any).lastAutoTable.finalY + 2;

  // Total actif highlight
  doc.setFillColor(212, 237, 218);
  doc.roundedRect(14, y, 182, 13, 2, 2, 'F');
  doc.setDrawColor(21, 87, 36);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, y, 182, 13, 2, 2, 'S');
  doc.setTextColor(21, 87, 36);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL ACTIF', 18, y + 8.5);
  const totalActifStr = formatAr(data.actif.totalActif);
  doc.text(totalActifStr, 196 - doc.getTextWidth(totalActifStr), y + 8.5);

  y += 20;

  // ══════════════════════════════════════════
  //  PASSIF
  // ══════════════════════════════════════════
  y = sectionBadge(doc, '— PASSIF', [15, 76, 92], y);

  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Poste de passif', 'Montant (Ar)']],
    body: [
      ['Dettes fournisseurs', formatAr(data.passif.dettesFournisseurs)],
      ['Capitaux propres', formatAr(data.passif.capitauxPropres)],
    ],
    headStyles: { fillColor: [15, 76, 92], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 30, 30] },
    columnStyles: {
      0: { cellWidth: 130 },
      1: { halign: 'right' },
    },
    alternateRowStyles: { fillColor: [240, 244, 250] },
    theme: 'grid',
    didParseCell(data) {
      if (data.column.index === 1 && data.section === 'body') {
        const raw = String(data.cell.raw);
        if (data.row.index === 0) {
          data.cell.styles.textColor = [180, 40, 40]; // dettes = rouge
        } else {
          data.cell.styles.textColor = [2, 100, 80]; // capitaux = vert
        }
      }
    },
  });
  y = (doc as any).lastAutoTable.finalY + 2;

  // Total passif highlight
  doc.setFillColor(207, 226, 255);
  doc.roundedRect(14, y, 182, 13, 2, 2, 'F');
  doc.setDrawColor(15, 76, 92);
  doc.setLineWidth(0.4);
  doc.roundedRect(14, y, 182, 13, 2, 2, 'S');
  doc.setTextColor(15, 76, 92);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TOTAL PASSIF', 18, y + 8.5);
  const totalPassifStr = formatAr(data.passif.totalPassif);
  doc.text(totalPassifStr, 196 - doc.getTextWidth(totalPassifStr), y + 8.5);

  y += 20;

  // ── Équilibre bilan ──
  const balanced = data.actif.totalActif === data.passif.totalPassif;
  const balanceBg: [number, number, number] = balanced ? [212, 237, 218] : [248, 215, 218];
  const balanceText: [number, number, number] = balanced ? [21, 87, 36] : [114, 28, 36];
  const balanceMsg = balanced
    ? '✓  Bilan équilibré — Actif = Passif'
    : `⚠  Écart détecté : ${formatAr(Math.abs(data.actif.totalActif - data.passif.totalPassif))}`;

  doc.setFillColor(...balanceBg);
  doc.roundedRect(14, y, 182, 11, 2, 2, 'F');
  doc.setTextColor(...balanceText);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.text(balanceMsg, 105, y + 7, { align: 'center' });

  // ── FOOTER ──
  doc.setFillColor(15, 76, 92);
  doc.rect(0, 280, 210, 17, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Document généré automatiquement — My Business', 105, 290, { align: 'center' });
  doc.text(`Bilan comptable — Exercice ${data.annee}`, 105, 294, { align: 'center' });

  doc.save(`Bilan_Comptable_${data.annee}_${Date.now()}.pdf`);
}