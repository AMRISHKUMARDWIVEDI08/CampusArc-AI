'use client';

import Link from 'next/link';

export default function TopBar({ user, onLogout }) {
  return (
    <header className="topbar">
      <div className="shell topbar-inner">
        <Link href="/" className="brand" aria-label="CampusArc AI home">
          <span className="brand-mark" aria-hidden="true">CA</span>
          <span>CampusArc AI</span>
        </Link>
        <div className="top-actions">
          <span className="status"><span className="dot" aria-hidden="true" />{user?.role ?? 'guest'}</span>
          {user ? <button className="btn" onClick={onLogout}>Sign out</button> : null}
        </div>
      </div>
    </header>
  );
}
