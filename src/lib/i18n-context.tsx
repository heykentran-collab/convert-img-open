'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { en, vi, LocaleDict, SupportedLocale } from '@/locales';

interface I18nContextValue {
  locale: SupportedLocale;
  setLocale: (loc: SupportedLocale) => void;
  t: LocaleDict;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'volticen_user_locale';

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Default to English ('en')
  const [locale, setLocaleState] = useState<SupportedLocale>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLocale | null;
      if (saved && (saved === 'en' || saved === 'vi')) {
        setLocaleState(saved);
      } else {
        // Detect browser language
        const browserLang = navigator.language.toLowerCase();
        if (browserLang.startsWith('vi')) {
          setLocaleState('vi');
        }
      }
    } catch {}
  }, []);

  const setLocale = (loc: SupportedLocale) => {
    setLocaleState(loc);
    try {
      localStorage.setItem(STORAGE_KEY, loc);
    } catch {}
  };

  const t = useMemo(() => {
    return locale === 'vi' ? vi : en;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
