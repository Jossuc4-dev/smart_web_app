// src/contexts/LanguageContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import i18n from '../i18n/i18n'; // ← adapte le chemin si nécessaire

// ─── Types ────────────────────────────────────────────────────────────────────
interface LanguageContextType {
  /** Langue actuellement active (ex: 'fr', 'en', 'mg') */
  currentLanguage: string;
  /** Change la langue et met à jour i18next + localStorage */
  changeLanguage: (lng: string) => Promise<void>;
  /** Liste des langues supportées (identique à i18n.supportedLngs) */
  supportedLanguages: string[];
}

// Valeur par défaut pour éviter les erreurs de typage
const defaultLanguageContext: LanguageContextType = {
  currentLanguage: 'fr',
  changeLanguage: async () => {},
  supportedLanguages: ['fr', 'en', 'mg'],
};

const LanguageContext = createContext<LanguageContextType>(defaultLanguageContext);

// ─── Hook personnalisé ────────────────────────────────────────────────────────
export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage doit être utilisé à l'intérieur de LanguageProvider");
  }
  return context;
};

// ─── Provider ─────────────────────────────────────────────────────────────────
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // Synchronise avec l'état actuel de i18next au montage
  const [currentLanguage, setCurrentLanguage] = useState<string>(i18n.language || 'fr');

  /**
   * Change la langue via i18next
   * - Met à jour l'état local
   * - i18next gère automatiquement le localStorage via le LanguageDetector
   */
  const changeLanguage = useCallback(async (lng: string) => {
    // Sécurité : on ne change que vers une langue supportée
    if (!['fr', 'en', 'mg'].includes(lng)) {
      console.warn(`Langue non supportée : ${lng}`);
      return;
    }

    try {
      await i18n.changeLanguage(lng);
      // Le listener 'languageChanged' ci-dessous mettra à jour l'état
    } catch (error) {
      console.error('Erreur lors du changement de langue :', error);
    }
  }, []);

  // ── Synchronisation bidirectionnelle avec i18next ─────────────────────────
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      setCurrentLanguage(lng);
    };

    // Écoute les changements de langue (que ce soit via changeLanguage ou via le détecteur)
    i18n.on('languageChanged', handleLanguageChanged);

    // Synchronisation initiale (au cas où le détecteur aurait déjà changé la langue)
    if (i18n.language) {
      setCurrentLanguage(i18n.language);
    }

    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  const value: LanguageContextType = {
    currentLanguage,
    changeLanguage,
    supportedLanguages: ['fr', 'en', 'mg'],
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};