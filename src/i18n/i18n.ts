import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';

i18n
    .use(Backend)                    // charge les JSON depuis /locales
    .use(LanguageDetector)           // détecte la langue automatiquement
    .use(initReactI18next)           // passe i18n à React
    .init({
        fallbackLng: 'fr',                     // langue par défaut
        supportedLngs: ['fr', 'en', 'mg'],     // langues supportées

        defaultNS: 'common',
        ns: ['common', 'error', 'formation', 'auth', 'stock', 'rh', 'sidebar', 'dashboard', 'sales', 'finance', 'reports', 'help', 'subscriptions'],

        backend: {
            loadPath: '/locales/{{lng}}/{{ns}}.json',   // chemin public
        },

        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            caches: ['localStorage'],                   // sauvegarde le choix de l'utilisateur
        },

        interpolation: {
            escapeValue: false,   // React gère déjà l'échappement
        },

        react: {
            useSuspense: false,   // désactive si tu as des problèmes avec le SSR ou lazy loading
        },

        saveMissing: true,           // ← ajoute cette ligne
        debug: true,

        // debug: import.meta.env.DEV,
    });

export default i18n;