'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '../../components/dashboard/TopBar';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { connectWallet, sendUsdcTransfer } from '../../lib/wallet';

export default function StudentPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [school, setSchool] = useState(null);
  const [fees, setFees] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
    if (!loading && user && user.role !== 'student') router.replace('/admin');
  }, [loading, user, router]);

  async function refreshPortal() {
    if (!user?.student_id) return;
    setError('');
    try {
      const [feeResponse, txResponse, schoolResponse] = await Promise.all([
        api.fees(user.student_id),
        api.transactions(user.student_id),
        user.school_id ? api.school(user.school_id) : Promise.resolve({ school: null }),
      ]);
      setFees(Array.isArray(feeResponse?.fees) ? feeResponse.fees : []);
      setTransactions(Array.isArray(txResponse?.transactions) ? txResponse.transactions : []);
      setSchool(schoolResponse?.school ?? null);
    } catch (err) {
      setError(err.message || 'Unable to load your campus data.');
    }
  }

  useEffect(() => { refreshPortal(); }, [user?.student_id, user?.school_id]);

  const pendingFees = useMemo(() => fees.filter((f) => f.status === 'pending'), [fees]);
  const paidFees = useMemo(() => fees.filter((f) => f.status === 'paid'), [fees]);

  async function pay(feeId) {
    setBusyId(feeId);
    setMessage('');
    setError('');
    try {
      const connected = await connectWallet();
      setWalletAddress(connected.address);
      const prepared = await api.payFee(feeId, connected.address);
      if (!prepared.paymentRequired) {
        setMessage(`Payment status: ${prepared.status}.`);
        await refreshPortal();
        return;
      }
      setMessage('Payment request is ready. Confirm the transaction in your wallet.');
      const txHash = await sendUsdcTransfer({
        provider: connected.provider,
        from: connected.address,
        tokenAddress: prepared.tokenAddress,
        destinationAddress: prepared.destinationAddress,
        amountBaseUnits: prepared.amountBaseUnits,
      });
      const confirmation = await api.confirmFeePayment(feeId, txHash, connected.address);
      setMessage(confirmation.message || 'Payment verified on Arc.');
      await refreshPortal();
    } catch (err) {
      setError(err?.message || 'Payment failed. No fee was marked paid unless Arc verification succeeded.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading || !user) return <main className="login-wrap"><span className="status"><span className="dot" />Loading student portal…</span></main>;
  if (user.role !== 'student') return null;

  return (
    <div className="page">
      <TopBar user={user} onLogout={() => { logout(); router.replace('/login'); }} />
      <main className="shell section">
        <div className="hero" style={{ paddingBottom: 20 }}>
          <span className="eyebrow">student portal</span>
          <h1 style={{ fontSize: 42, marginTop: 14 }}>Welcome back, {user.username}.</h1>
          <p style={{ marginTop: 10 }}>{school?.school_name || 'Your campus'} · academics, fees and verified payments in one place.</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 18 }}>
            <button className="btn btn-primary" onClick={() => router.push('/ai')}>Ask CampusArc AI</button>
            <button className="btn" onClick={() => router.push('/help')}>Help Center</button>
            <button className="btn" onClick={refreshPortal}>Refresh</button>
          </div>
        </div>

        {message ? <div className="card" role="status" style={{ marginBottom: 14 }}>{message}</div> : null}
        {error ? <div className="alert" role="alert" style={{ marginBottom: 14 }}>{error}</div> : null}

        <div className="grid grid-3">
          <div className="card"><div className="label">pending fees</div><div className="stat" style={{ marginTop: 8 }}>{pendingFees.length}</div><div className="muted">Needs attention</div></div>
          <div className="card"><div className="label">paid fees</div><div className="stat" style={{ marginTop: 8 }}>{paidFees.length}</div><div className="muted">Verified records</div></div>
          <div className="card"><div className="label">wallet</div><div className="stat" style={{ marginTop: 8, fontSize: 14 }}>{walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : 'Not connected'}</div><div className="muted">Arc Testnet</div></div>
        </div>

        <section className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <h2>Fee ledger</h2><span className="muted">{fees.length} record{fees.length === 1 ? '' : 's'}</span>
          </div>
          {!fees.length ? <div className="empty">No fee records are available for this student.</div> : (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="table"><thead><tr><th>Fee</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>
                {fees.map((fee) => <tr key={fee.id}><td>Fee #{fee.id}</td><td>{fee.due_amount ?? '—'} USDC</td><td>{fee.status}</td><td>{fee.status === 'pending' ? <button className="btn btn-primary" disabled={busyId === fee.id} onClick={() => pay(fee.id)}>{busyId === fee.id ? 'Processing…' : 'Pay with wallet'}</button> : <span className="muted">No action</span>}</td></tr>)}
              </tbody></table>
            </div>
          )}
        </section>

        <section className="section">
          <h2 style={{ marginBottom: 12 }}>Recent payment activity</h2>
          {!transactions.length ? <div className="empty">No payment transactions yet.</div> : (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="table"><thead><tr><th>Amount</th><th>Status</th><th>Transaction</th></tr></thead><tbody>
                {transactions.slice(0, 8).map((tx) => <tr key={tx.id}><td>{tx.amount} {tx.currency}</td><td>{tx.status}</td><td>{tx.tx_hash ? `${tx.tx_hash.slice(0, 10)}…${tx.tx_hash.slice(-6)}` : 'Awaiting verification'}</td></tr>)}
              </tbody></table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
