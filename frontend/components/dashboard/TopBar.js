'use client';

import Link from 'next/link';
import LanguageSelector from '../i18n/LanguageSelector';
import LocaleText from '../i18n/LocaleText';

export default function TopBar({ user, onLogout }) {
  return (
    <header className="topbar">
      <div className="shell topbar-inner">
        <Link href="/" className="brand" aria-label="CampusArc AI home">
          <span className="brand-mark" aria-hidden="true">CA</span>
          <span>CampusArc AI</span>
        </Link>
        <div className="top-actions">
          <span className="status"><span className="dot" aria-hidden="true" /><LocaleText k={user?.role ?? 'guest'} fallback={user?.role ?? 'guest'} /></span>
          <LanguageSelector />{user ? <button className="btn" onClick={onLogout}><LocaleText k="signOut" fallback="Sign out" /></button> : null}
        </div>
      </div>
    </header>
  );
}
