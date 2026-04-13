'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { dictionaries, Locale, getNestedTranslation } from '@/lib/i18n/dictionaries';

type LanguageContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load preference from localStorage on mount
    const savedLocale = localStorage.getItem('wayscan-locale') as Locale;
    if (savedLocale && dictionaries[savedLocale]) {
      setLocaleState(savedLocale);
    }
    setMounted(true);
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('wayscan-locale', newLocale);
  };

  const t = (key: string, replacements?: Record<string, string | number>) => {
    const dictionary = dictionaries[locale];
    let translation = getNestedTranslation(dictionary, key, key);
    
    if (replacements && translation !== key) {
      Object.entries(replacements).forEach(([k, v]) => {
        translation = translation.replace(`{${k}}`, String(v));
      });
    }
    
    return translation;
  };

  // Avoid hydration mismatch by waiting to render styles optimally, 
  // but we MUST provide the context to children during SSR
  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      <div style={{ visibility: mounted ? 'visible' : 'hidden', display: 'contents' }}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
