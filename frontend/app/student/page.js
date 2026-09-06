'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '../../components/dashboard/TopBar';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';

export default function StudentPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [fees, setFees] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.replace('/login?role=student');
    if (!loading && user && user.role !== 'student') router.replace('/admin');
  }, [loading, user, router]);

  useEffect(() => {
    if (!user?.student_id) return;
    api.fees(user.student_id).then((r) => setFees(Array.isArray(r.fees) ? r.fees : Array.isArray(r) ? r : [])).catch((e) => setError(e.message));
  }, [user?.student_id]);

  async function pay(feeId) {
    setBusyId(feeId); setMessage(''); setError('');
    try {
      const r = await api.payFee(feeId);
      setMessage(r.message || 'Payment flow submitted. Wait for verified confirmation before treating it as complete.');
      const refreshed = await api.fees(user.student_id);
      setFees(Array.isArray(refreshed.fees) ? refreshed.fees : []);
    } catch (e) { setError(e.message || 'Payment failed.'); } finally { setBusyId(null); }
  }

  if (loading || !user) return <main className="login-wrap"><span className="status"><span className="dot" />Loading student portal…</span></main>;
  if (user.role !== 'student') return null;

  return (
    <div className="page">
      <TopBar user={user} onLogout={() => { logout(); router.replace('/login'); }} />
      <main className="shell section">
        <div className="hero" style={{ paddingBottom: 24 }}>
          <span className="eyebrow">student portal</span>
          <h1 style={{ fontSize: 42, marginTop: 14 }}>Welcome back, {user.username}.</h1>
          <p style={{ marginTop: 10 }}>Your campus activity, fees and verified payment state in one place.</p>
        </div>
        <div className="grid grid-3">
          <div className="card"><div className="label">school</div><div className="stat" style={{ marginTop: 8 }}>#{user.school_id ?? '—'}</div></div>
          <div className="card"><div className="label">student id</div><div className="stat" style={{ marginTop: 8 }}>#{user.student_id ?? '—'}</div></div>
          <div className="card"><div className="label">network</div><div className="stat" style={{ marginTop: 8, fontSize: 18 }}>Arc</div><div className="muted">USDC payments</div></div>
        </div>
        <section className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}><h2>Fee ledger</h2><button className="btn" onClick={() => router.push('/help')}>Help</button></div>
          {message ? <div className="card" role="status" style={{ marginBottom: 12 }}>{message}</div> : null}
          {error ? <div className="alert" role="alert" style={{ marginBottom: 12 }}>{error}</div> : null}
          {!fees.length ? <div className="empty">No fee records are available for this student.</div> : (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="table"><thead><tr><th>Fee</th><th>Due</th><th>Status</th><th>Action</th></tr></thead><tbody>
                {fees.map((fee) => <tr key={fee.id}><td>#{fee.id}</td><td>{fee.due_amount ?? '—'} USDC</td><td>{fee.status}</td><td>{fee.status === 'pending' ? <button className="btn btn-primary" disabled={busyId === fee.id} onClick={() => pay(fee.id)}>{busyId === fee.id ? 'Processing…' : 'Pay fee'}</button> : <span className="muted">No action</span>}</td></tr>)}
              </tbody></table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
