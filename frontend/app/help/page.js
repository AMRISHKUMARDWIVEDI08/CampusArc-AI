'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const items = [
  ['Getting started', 'Choose Student or School Admin, then sign in with your campus credentials.'],
  ['Payments', 'A fee can only become completed after the backend receives and verifies the payment result.'],
  ['Wallets', 'Wallet connection is separate from authentication. Never share a seed phrase or private key.'],
  ['AI', 'AI features will clearly show whether they are connected to a real model or unavailable.'],
  ['Language', 'The app is designed with internationalization support; Hindi is intentionally excluded from the product language set.'],
  ['Voice', 'Important confirmations can use the device/browser speech capability where supported. Core text controls always remain available.'],
];

export default function HelpPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const filtered = items.filter(([title, text]) => `${title} ${text}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <main className="page">
      <div className="shell hero" style={{ paddingBottom: 26 }}>
        <button className="btn" onClick={() => router.back()}>← Back</button>
        <div style={{ marginTop: 28 }}><span className="eyebrow">help desk</span><h1 style={{ fontSize: 44, marginTop: 12 }}>Learn how CampusArc AI works.</h1><p style={{ marginTop: 10 }}>A simple guide for first-time users. Core actions remain understandable without blockchain knowledge.</p></div>
      </div>
      <section className="shell section"><div className="field"><label htmlFor="help-search">Search help</label><input id="help-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="payments, wallet, AI…" /></div></section>
      <section className="shell section"><div className="grid grid-2">{filtered.map(([title, text]) => <article className="card" key={title}><h3>{title}</h3><p>{text}</p></article>)}</div>{filtered.length === 0 ? <div className="empty" style={{ marginTop: 16 }}>No matching help article.</div> : null}</section>
    </main>
  );
}
