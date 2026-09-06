'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import Spinner from '../components/ui/Spinner';

export default function HomePage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) router.replace(user.role === 'admin' ? '/admin' : '/student');
  }, [loading, user, router]);

  if (loading || user) return <main className="login-wrap"><Spinner label="Opening CampusArc AI…" /></main>;

  return (
    <main className="page">
      <div className="shell hero">
        <span className="eyebrow">campus operations · learning · payments</span>
        <h1>Welcome to CampusArc AI.</h1>
        <p>A global, mobile-first campus platform for students and schools—bringing academics, AI assistance and verifiable USDC payments together on Arc.</p>
        <div className="actions">
          <button className="btn btn-primary" onClick={() => router.push('/login?role=student')}>Student sign in</button>
          <button className="btn" onClick={() => router.push('/login?role=admin')}>School admin</button>
        </div>
      </div>
      <section className="shell section">
        <div className="grid grid-3">
          <article className="card"><h3>Study + research</h3><p>Ask academic questions and build toward source-backed research flows without pretending an external model is available.</p></article>
          <article className="card"><h3>Campus finance</h3><p>Keep fee records, payment states and receipts separate from final blockchain confirmation.</p></article>
          <article className="card"><h3>Built for every screen</h3><p>Responsive layouts are designed for touch-first phones as well as larger screens and keyboard navigation.</p></article>
        </div>
      </section>
      <div className="shell footer">English-first interface · Hindi intentionally excluded from the product language set</div>
    </main>
  );
}
