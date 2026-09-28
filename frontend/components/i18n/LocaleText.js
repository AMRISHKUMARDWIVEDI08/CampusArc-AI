'use client';

import { useEffect, useState } from 'react';
import { getLocale, getTranslations } from '../../lib/i18n';

export default function LocaleText({ k, fallback }) {
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    const update = () => setLocale(getLocale());
    update();
    window.addEventListener('campusarc:language-change', update);
    return () => window.removeEventListener('campusarc:language-change', update);
  }, []);

  return getTranslations(locale)[k] || fallback || k;
}
