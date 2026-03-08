// src/pdf/pdfResultat.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CompteResultat } from '../models/interfaces';

const PRIMARY = '#02927a';
const DARK = '#1a2a2a';
const LIGHT_BG = '#f0faf8';

function drawHeader(doc: jsPDF, title: string, subtitle: string) {
  // Background header band
  doc.setFillColor(2, 146, 122);
  doc.rect(0, 0, 210, 40, 'F');

  // Decorative accent
  doc.setFillColor(0, 212, 180);
  doc.rect(0, 0, 8, 40, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text(title, 20, 16);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(subtitle, 20, 26);

  // Date
  doc.setFontSize(9);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`, 20, 34);
}

function drawSectionTitle(doc: jsPDF, text: string, y: number) {
  doc.setFillColor(240, 250, 248);
  doc.roundedRect(14, y - 5, 182, 10, 2, 2, 'F');
  doc.setTextColor(2, 146, 122);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(text.toUpperCase(), 18, y + 1);
  return y + 10;
}

function formatAr(value: number): string {
  return `${value.toLocaleString('fr-MG')} Ar`;
}

export function generateResultatPDF(data: CompteResultat): void {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  drawHeader(doc, 'Compte de Résultat', `Exercice ${data.annee}`);

  let y = 50;

  // ── PRODUITS ──
  y = drawSectionTitle(doc, '01 — Produits d\'exploitation', y);
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Désignation', 'Montant']],
    body: [
      ['Chiffre d\'affaires (ventes de marchandises)', formatAr(data.chiffreAffaires)],
    ],
    headStyles: { fillColor: [2, 146, 122], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
    columnStyles: { 1: { halign: 'right', textColor: [40, 160, 80] } },
    alternateRowStyles: { fillColor: [248, 255, 252] },
    theme: 'grid',
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // ── CHARGES ──
  y = drawSectionTitle(doc, '02 — Charges d\'exploitation', y);
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Désignation', 'Montant']],
    body: [
      ['Achats de marchandises', formatAr(data.depenses.achats)],
      ['Frais de transport', formatAr(data.depenses.transport)],
    ],
    headStyles: { fillColor: [2, 146, 122], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
    columnStyles: { 1: { halign: 'right', textColor: [200, 50, 50] } },
    alternateRowStyles: { fillColor: [255, 248, 248] },
    theme: 'grid',
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // ── SOLDES INTERMÉDIAIRES ──
  y = drawSectionTitle(doc, '03 — Soldes intermédiaires de gestion', y);
  autoTable(doc, {
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Indicateur', 'Valeur', 'Info']],
    body: [
      ['Marge brute', formatAr(data.margeBrute), data.margeBrutePourcentage],
      ['Valeur ajoutée', formatAr(data.valeurAjoutee), ''],
      ['EBE (Excédent Brut d\'Exploitation)', formatAr(data.ebe), ''],
      ['Résultat d\'exploitation', formatAr(data.resultatExploitation), ''],
    ],
    headStyles: { fillColor: [2, 146, 122], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [40, 40, 40] },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'center', textColor: [120, 120, 120], fontStyle: 'italic' },
    },
    alternateRowStyles: { fillColor: [240, 250, 248] },
    theme: 'grid',
  });
  y = (doc as any).lastAutoTable.finalY + 6;

  // ── RÉSULTAT NET — highlighted ──
  const isPositive = data.resultatNet >= 0;
  const netColor: [number, number, number] = isPositive ? [21, 87, 36] : [114, 28, 36];
  const netBg: [number, number, number] = isPositive ? [212, 237, 218] : [248, 215, 218];

  doc.setFillColor(...netBg);
  doc.roundedRect(14, y, 182, 16, 3, 3, 'F');
  doc.setDrawColor(...netColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(14, y, 182, 16, 3, 3, 'S');

  doc.setTextColor(...netColor);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('RÉSULTAT NET', 20, y + 10);
  doc.text(formatAr(data.resultatNet), 196 - doc.getTextWidth(formatAr(data.resultatNet)), y + 10);

  y += 24;

  // ── FOOTER ──
  doc.setFillColor(2, 146, 122);
  doc.rect(0, 280, 210, 17, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Document généré automatiquement — My Business', 105, 290, { align: 'center' });
  doc.text(`Exercice ${data.annee}`, 105, 294, { align: 'center' });

  doc.save(`Compte_Resultat_${data.annee}_${Date.now()}.pdf`);
}