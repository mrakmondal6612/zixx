import React, { createContext, useContext, useState, ReactNode } from 'react';
import enTranslations from '../translations/en.json';

export interface Language {
  code: string;
  name: string;
  flag: string;
}

// Only English is supported now
export const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇺🇸' }
];

interface LanguageContextType {
  currentLanguage: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  languages: Language[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

// Simple English-only provider: no dynamic loading, switching is a no-op
export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [currentLanguage] = useState<Language>(languages[0]);

  const translations = enTranslations as Record<string, any>;

  const setLanguage = (_language: Language) => {
    // intentionally noop: language switching disabled (English-only)
    try { localStorage.setItem('selectedLanguage', 'en'); } catch (_) {}
    document.documentElement.dir = 'ltr';
    document.documentElement.lang = 'en';
  };

  const t = (key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let value: any = translations;
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) break;
    }
    if (typeof value !== 'string') {
      // return the key as fallback
      return key;
    }
    if (params) {
      return Object.entries(params).reduce((text, [param, val]) => {
        return text.replace(new RegExp(`{{${param}}}`, 'g'), String(val));
      }, value);
    }
    return value;
  };

  return (
    <LanguageContext.Provider value={{ currentLanguage, setLanguage, t, languages }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
