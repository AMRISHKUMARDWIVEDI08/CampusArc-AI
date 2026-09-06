'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '../../components/dashboard/TopBar';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';

export default function AIPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState('gemini');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (loading) return <main className="login-wrap"><span className="status"><span className="dot" />Loading AI workspace…</span></main>;
  if (!user) { if (typeof window !== 'undefined') router.replace('/login'); return null; }

  async function ask(event) {
    event.preventDefault();
    setError(''); setAnswer('');
    if (!prompt.trim()) { setError('Enter a question first.'); return; }
    setBusy(true);
    try {
      const result = await api.aiAssistant({ prompt: prompt.trim(), provider });
      setAnswer(result.answer || 'No answer was returned.');
    } catch (e) { setError(e.message || 'AI request failed.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="page">
      <TopBar user={user} onLogout={() => { logout(); router.replace('/login'); }} />
      <main className="shell section">
        <div className="hero" style={{ paddingBottom: 26 }}>
          <span className="eyebrow">campus ai</span>
          <h1 style={{ fontSize: 44, marginTop: 14 }}>Ask. Learn. Explore.</h1>
          <p style={{ marginTop: 10 }}>A real provider-backed assistant boundary. When no key is configured, CampusArc AI reports that honestly instead of showing fake answers.</p>
        </div>
        <form className="card form" onSubmit={ask}>
          <div className="field"><label htmlFor="provider">AI provider</label><select id="provider" value={provider} onChange={(e) => setProvider(e.target.value)}><option value="gemini">Gemini</option><option value="claude">Claude</option></select></div>
          <div className="field"><label htmlFor="prompt">Your question</label><textarea id="prompt" rows={6} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask an academic or campus question…" /></div>
          {error ? <div className="alert" role="alert">{error}</div> : null}
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Thinking…' : 'Ask CampusArc AI'}</button>
        </form>
        {answer ? <section className="card" style={{ marginTop: 16 }} aria-live="polite"><div className="label">answer</div><p style={{ marginTop: 10, whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{answer}</p></section> : null}
      </main>
    </div>
  );
}
