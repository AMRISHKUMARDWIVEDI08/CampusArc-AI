'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '../../components/dashboard/TopBar';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';

export default function AdminPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [school, setSchool] = useState(null);
  const [circle, setCircle] = useState(null);
  const [rules, setRules] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.replace('/login?role=admin');
    if (!loading && user && user.role !== 'admin') router.replace('/student');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user?.school_id) return;
    Promise.all([
      api.school(user.school_id),
      api.scholarshipRules(user.school_id),
      api.circleStatus(user.school_id)
    ]).then(([s, r, c]) => {
      setSchool(s.school ?? null);
      setRules(Array.isArray(r.rules) ? r.rules : []);
      setCircle(c);
    }).catch((e) => setError(e.message || 'Unable to load admin data.'));
  }, [user?.school_id]);

  if (loading || !user) return <main className="login-wrap"><span className="status"><span className="dot" />Loading admin console…</span></main>;
  if (user.role !== 'admin') return null;

  return (
    <div className="page">
      <TopBar user={user} onLogout={() => { logout(); router.replace('/login'); }} />
      <main className="shell section">
        <div className="hero" style={{ paddingBottom: 24 }}>
          <span className="eyebrow">school admin</span>
          <h1 style={{ fontSize: 42, marginTop: 14 }}>Campus control center.</h1>
          <p style={{ marginTop: 10 }}>Manage school configuration and scholarship rules now. Payment/AI credentials remain optional until the real integrations are configured.</p>
        </div>
        {error ? <div className="alert" role="alert" style={{ marginBottom: 16 }}>{error}</div> : null}
        <div className="grid grid-2">
          <section className="card"><div className="label">school</div><h2 style={{ marginTop: 8 }}>{school?.school_name ?? 'School not loaded'}</h2><p style={{ marginTop: 8 }}>School ID: {school?.id ?? user.school_id ?? '—'}</p></section>
          <section className="card"><div className="label">circle configuration</div><h2 style={{ marginTop: 8 }}>{circle?.config?.apiKeyConfigured ? 'Configured' : 'Not configured'}</h2><p style={{ marginTop: 8 }}>No fake health metric is shown. Real status appears only when the integration can be verified.</p></section>
        </div>
        <section className="section">
          <h2 style={{ marginBottom: 12 }}>Scholarship rules</h2>
          {!rules.length ? <div className="empty">No scholarship rules have been created yet.</div> : <div className="card" style={{ overflowX: 'auto' }}><table className="table"><thead><tr><th>Rule</th><th>Type</th><th>Threshold</th><th>Active</th></tr></thead><tbody>{rules.map((r) => <tr key={r.id}><td>{r.rule_name}</td><td>{r.rule_type}</td><td>{r.threshold_value}</td><td>{r.is_active ? 'Yes' : 'No'}</td></tr>)}</tbody></table></div>}
        </section>
      </main>
    </div>
  );
}
