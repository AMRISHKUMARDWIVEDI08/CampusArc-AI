'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '../../components/dashboard/TopBar';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';

export default function AdminPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [school, setSchool] = useState(null);
  const [rules, setRules] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.replace('/login?role=admin');
    if (!loading && user && user.role !== 'admin') router.replace('/student');
  }, [loading, user, router]);

  async function refresh() {
    if (!user?.school_id) return;
    setError('');
    try {
      const [schoolResponse, rulesResponse, transactionResponse] = await Promise.all([
        api.school(user.school_id),
        api.scholarshipRules(),
        api.schoolTransactions(user.school_id)
      ]);
      setSchool(schoolResponse.school ?? null);
      setRules(Array.isArray(rulesResponse.rules) ? rulesResponse.rules : []);
      setTransactions(Array.isArray(transactionResponse.transactions) ? transactionResponse.transactions : []);
    } catch (e) {
      setError(e.message || 'Unable to load admin data.');
    }
  }

  useEffect(() => { refresh(); }, [user?.school_id]);

  const verifiedCount = useMemo(() => transactions.filter((tx) => tx.status === 'completed' || tx.status === 'paid').length, [transactions]);
  const pendingCount = useMemo(() => transactions.filter((tx) => tx.status === 'pending' || tx.status === 'processing' || tx.status === 'under_review').length, [transactions]);
  const activeRules = useMemo(() => rules.filter((rule) => rule.is_active).length, [rules]);

  if (loading || !user) return <main className="login-wrap"><span className="status"><span className="dot" />Loading admin console…</span></main>;
  if (user.role !== 'admin') return null;

  return (
    <div className="page">
      <TopBar user={user} onLogout={() => { logout(); router.replace('/login'); }} />
      <main className="shell section">
        <div className="hero" style={{ paddingBottom: 20 }}>
          <span className="eyebrow">school admin</span>
          <h1 style={{ fontSize: 42, marginTop: 14 }}>Campus control center.</h1>
          <p style={{ marginTop: 10 }}>{school?.school_name || 'Your school'} · monitor payments, scholarships and the AI workspace.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
            <button className="btn btn-primary" onClick={() => router.push('/ai')}>Open AI workspace</button>
            <button className="btn" onClick={refresh}>Refresh data</button>
            <button className="btn" onClick={() => router.push('/help')}>Help Center</button>
          </div>
        </div>
        {error ? <div className="alert" role="alert" style={{ marginBottom: 16 }}>{error}</div> : null}

        <div className="grid grid-3">
          <section className="card"><div className="label">verified payments</div><div className="stat" style={{ marginTop: 8 }}>{verifiedCount}</div><p className="muted">On-chain verified records</p></section>
          <section className="card"><div className="label">awaiting review</div><div className="stat" style={{ marginTop: 8 }}>{pendingCount}</div><p className="muted">Pending or processing</p></section>
          <section className="card"><div className="label">active scholarship rules</div><div className="stat" style={{ marginTop: 8 }}>{activeRules}</div><p className="muted">Currently enabled</p></section>
        </div>

        <section className="section">
          <div className="grid grid-3">
            <section className="card"><div className="label">school</div><h2 style={{ marginTop: 8 }}>{school?.school_name ?? 'School not loaded'}</h2><p style={{ marginTop: 8 }}>School ID: {school?.id ?? user.school_id ?? '—'}</p></section>
            <section className="card"><div className="label">Arc payment wallet</div><h2 style={{ marginTop: 8 }}>{school?.wallet_address ? `${school.wallet_address.slice(0, 8)}…${school.wallet_address.slice(-6)}` : 'Not configured'}</h2><p style={{ marginTop: 8 }}>Student wallets pay this school-controlled EVM address directly on Arc Testnet.</p></section>
            <section className="card"><div className="label">demo status</div><h2 style={{ marginTop: 8 }}>Arc-only</h2><p style={{ marginTop: 8 }}>No Circle API is required for the payment flow.</p></section>
          </div>
        </section>

        <section className="section">
          <h2 style={{ marginBottom: 12 }}>Payment history</h2>
          {!transactions.length ? <div className="empty">No campus transactions yet.</div> : <div className="card" style={{ overflowX: 'auto', marginBottom: 20 }}><table className="table"><thead><tr><th>Student</th><th>Amount</th><th>Status</th><th>Tx</th></tr></thead><tbody>{transactions.map((tx) => <tr key={tx.id}><td>{tx.student_name || tx.student_id}</td><td>{tx.amount} {tx.currency}</td><td>{tx.status}</td><td>{tx.tx_hash ? `${tx.tx_hash.slice(0, 8)}…${tx.tx_hash.slice(-6)}` : '—'}</td></tr>)}</tbody></table></div>}
        </section>

        <section className="section">
          <h2 style={{ marginBottom: 12 }}>Scholarship rules</h2>
          {!rules.length ? <div className="empty">No scholarship rules have been created yet.</div> : <div className="card" style={{ overflowX: 'auto' }}><table className="table"><thead><tr><th>Rule</th><th>Type</th><th>Threshold</th><th>Active</th></tr></thead><tbody>{rules.map((rule) => <tr key={rule.id}><td>{rule.rule_name}</td><td>{rule.rule_type}</td><td>{rule.threshold_value}</td><td>{rule.is_active ? 'Yes' : 'No'}</td></tr>)}</tbody></table></div>}
        </section>
      </main>
    </div>
  );
}
