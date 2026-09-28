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
        <optgroup label="India">
          {SUPPORTED_LOCALES.filter((item) => item.code === 'en' || [
            'as','bn','brx','doi','gu','hi','kn','ks','kok','mai','ml','mni','mr','ne','or','pa','sa','sat','sd','ta','te','ur'
          ].includes(item.code)).map((item) => (
            <option key={item.code} value={item.code}>{item.nativeName}</option>
          ))}
        </optgroup>
        <optgroup label="International">
          {SUPPORTED_LOCALES.filter((item) => ['es','fr','de','pt','ar','ja','ko'].includes(item.code)).map((item) => (
            <option key={item.code} value={item.code}>{item.nativeName}</option>
          ))}
        </optgroup>
      </select>
    </label>
  );
}
