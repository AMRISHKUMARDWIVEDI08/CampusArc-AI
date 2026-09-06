'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!loginValue.trim() || !password) {
      setError('Enter your username/email and password.');
      return;
    }
    setBusy(true);
    try {
      const user = await login({ login: loginValue.trim(), password });
      router.replace(user.role === 'admin' ? '/admin' : '/student');
    } catch (err) {
      setError(err?.message || 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-wrap">
      <section className="card login-card" aria-labelledby="login-title">
        <span className="eyebrow">secure campus access</span>
        <h1 id="login-title" style={{ marginTop: 12, fontSize: 30 }}>Sign in to CampusArc AI</h1>
        <p className="muted" style={{ marginTop: 8, lineHeight: 1.5 }}>Use your campus username or email. Wallet signing will be added separately; connecting a wallet alone will never authenticate a user.</p>
        <form className="form" style={{ marginTop: 20 }} onSubmit={submit}>
          <div className="field"><label htmlFor="login">Username or email</label><input id="login" value={loginValue} onChange={(e) => setLoginValue(e.target.value)} autoComplete="username" /></div>
          <div className="field"><label htmlFor="password">Password</label><input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></div>
          {error ? <div className="alert" role="alert">{error}</div> : null}
          <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </section>
    </main>
  );
}
