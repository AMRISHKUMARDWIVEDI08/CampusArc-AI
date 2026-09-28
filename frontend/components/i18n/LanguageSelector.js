'use client';

import { useEffect, useState } from 'react';
import { getLocale, getLocaleMeta, getTranslations, SUPPORTED_LOCALES } from '../../lib/i18n';

export default function LanguageSelector() {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    setLocale(getLocale());
  }, []);

  function changeLanguage(next) {
    setLocale(next);
    window.localStorage.setItem('campusarc-locale', next);
    const meta = getLocaleMeta(next);
    document.documentElement.lang = next;
    document.documentElement.dir = meta.dir;
    window.dispatchEvent(new CustomEvent('campusarc:language-change', { detail: next }));
  }

  const t = getTranslations(locale);

  return (
    <label className="language-selector">
      <span className="sr-only">{t.language}</span>
      <select aria-label={t.language} value={locale} onChange={(e) => changeLanguage(e.target.value)}>
        {SUPPORTED_LOCALES.map((item) => <option key={item.code} value={item.code}>{item.nativeName}</option>)}
      </select>
    </label>
  );
}
