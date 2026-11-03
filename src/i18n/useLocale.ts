import { useEffect, useState } from 'react';
import { Locale, readLocale, translate, UIKey } from './core';

export function useLocale() {
  const [locale, setLocale] = useState<Locale>(() => {
    const language = typeof navigator !== 'undefined' ? navigator.language : 'en';
    try {
      return readLocale(typeof window !== 'undefined' ? window.localStorage : null, language);
    } catch {
      // Accessing the localStorage property itself can fail in restricted contexts.
      return readLocale(null, language);
    }
  });
  useEffect(() => {
    document.documentElement.lang = locale;
    try { window.localStorage.setItem('tritype.ui.locale', locale); } catch { /* guest privacy mode */ }
  }, [locale]);
  return { locale, setLocale, t: (key: UIKey) => translate(locale, key) };
}
