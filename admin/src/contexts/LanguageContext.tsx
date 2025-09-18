import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { translations, TranslationKey, Language } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const useTranslation = () => {
  const { t } = useLanguage();
  return t;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Try to get language from localStorage, fallback to browser language
    const saved = localStorage.getItem('admin_language') as Language;
    if (saved && (saved === 'en' || saved === 'ar')) {
      return saved;
    }

    // Detect browser language
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('ar')) {
      return 'ar';
    }
    return 'en';
  });

  const isRTL = language === 'ar';

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let translation = translations[language][key] || translations.en[key] || key;

    // Replace parameters in translation
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        translation = translation.replace(`{${paramKey}}`, String(value));
      });
    }

    return translation;
  };

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('admin_language', lang);

    // Update document attributes for RTL support
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  };

  useEffect(() => {
    // Set initial document attributes
    document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', language);
  }, [language, isRTL]);

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage: handleSetLanguage,
      t,
      isRTL
    }}>
      {children}
    </LanguageContext.Provider>);

};