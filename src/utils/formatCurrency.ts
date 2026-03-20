/**
 * Formatte un montant en Ariary avec espace comme séparateur de milliers
 * Exemple : 1234567 → "1 234 567 Ar"
 * Gère les nombres négatifs
 */
export function formatAr(value: number): string {
  if (isNaN(value)) return "0 Ar";

  const absValue = Math.abs(value);
  const integerPart = Math.floor(absValue).toString();
  
  // Séparateur de milliers = espace
  const formatted = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  
  const sign = value < 0 ? "-" : "";
  return `${sign}${formatted} Ar`;
}