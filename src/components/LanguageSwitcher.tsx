import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher: React.FC = () => {
  const { currentLanguage, changeLanguage, supportedLanguages } = useLanguage();
  const { t } = useTranslation('common');

  const languages = [
    { code: 'fr', label: '🇫🇷 FR' },
    { code: 'en', label: '🇬🇧 EN' },
    { code: 'mg', label: '🇲🇬 MG' },
  ];

  return (
    <div className="language-switcher" style={{
      position: 'absolute',
      top: '20px',
      right: '30px',
      zIndex: 1000,
      display: 'flex',
      gap: '8px',
      background: 'rgba(255,255,255,0.95)',
      padding: '6px 10px',
      borderRadius: '30px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #eaf4f8'
    }}>
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => changeLanguage(lang.code)}
          className={`lang-btn ${currentLanguage === lang.code ? 'active' : ''}`}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            border: 'none',
            background: currentLanguage === lang.code ? '#2E86AB' : 'transparent',
            color: currentLanguage === lang.code ? 'white' : '#3d5a73',
            fontWeight: currentLanguage === lang.code ? '600' : '500',
            fontSize: '0.9rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title={t(`language.${lang.code}`) || lang.label}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;