import { useEffect, useState } from 'react';
import { Locale, readLocale, translate, UIKey } from './core';

export function useLocale() {
  const [locale, setLocale] = useState<Locale>(() => readLocale(
    typeof window !== 'undefined' ? window.localStorage : null,
    typeof navigator !== 'undefined' ? navigator.language : 'en'
  ));
  useEffect(() => {
    document.documentElement.lang = locale;
    try { window.localStorage.setItem('tritype.ui.locale', locale); } catch { /* guest privacy mode */ }
  }, [locale]);
  return { locale, setLocale, t: (key: UIKey) => translate(locale, key) };
}
