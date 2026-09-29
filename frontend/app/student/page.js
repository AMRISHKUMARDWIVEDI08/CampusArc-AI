'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '../../components/dashboard/TopBar';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { connectWallet, discoverWallets, getWalletLabel, rememberWallet, sendUsdcTransfer, signWalletChallenge, ARC_EXPLORER } from '../../lib/wallet';

export default function StudentPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [school, setSchool] = useState(null);
  const [fees, setFees] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [academics, setAcademics] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [walletProviders, setWalletProviders] = useState([]);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletBusy, setWalletBusy] = useState(false);
  const [pendingWalletAction, setPendingWalletAction] = useState(null);
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
      const [feeResponse, txResponse, academicResponse, schoolResponse] = await Promise.all([
        api.fees(user.student_id),
        api.transactions(user.student_id),
        api.academicOverview(user.student_id),
        user.school_id ? api.school(user.school_id) : Promise.resolve({ school: null }),
      ]);
      setFees(Array.isArray(feeResponse?.fees) ? feeResponse.fees : []);
      setTransactions(Array.isArray(txResponse?.transactions) ? txResponse.transactions : []);
      setAcademics(academicResponse || null);
      setSchool(schoolResponse?.school ?? null);
    } catch (err) {
      setError(err.message || 'Unable to load your campus data.');
    }
  }

  useEffect(() => { refreshPortal(); }, [user?.student_id, user?.school_id]);

  useEffect(() => {
    discoverWallets().then(setWalletProviders).catch(() => setWalletProviders([]));
  }, []);

  const pendingFees = useMemo(() => fees.filter((f) => f.status === 'pending'), [fees]);
  const paidFees = useMemo(() => fees.filter((f) => f.status === 'paid'), [fees]);

  async function openWalletChooser(action = null) {
    setError('');
    const wallets = await discoverWallets();
    setWalletProviders(wallets);
    setPendingWalletAction(action);
    if (wallets.length === 1) {
      await selectWallet(wallets[0], action);
      return;
    }
    setWalletModalOpen(true);
  }

  async function selectWallet(detail, action = pendingWalletAction) {
    setWalletBusy(true);
    setError('');
    try {
      const connected = await connectWallet(detail?.provider);
      rememberWallet(detail);
      setWalletAddress(connected.address);
      setWalletModalOpen(false);
      setMessage(`${getWalletLabel(detail)} connected to CampusArc.`);
      if (action?.type === 'link') await finishWalletLink(connected);
      if (action?.type === 'pay') await executePayment(action.feeId, connected);
    } catch (err) {
      setError(err?.message || 'Wallet connection failed.');
    } finally {
      setWalletBusy(false);
      setPendingWalletAction(null);
    }
  }

  async function finishWalletLink(connected) {
    const challenge = await api.walletChallenge(connected.address);
    const signature = await signWalletChallenge(connected.provider, challenge.message);
    const response = await api.linkWallet({ walletAddress: connected.address, nonce: challenge.nonce, signature });
    setWalletAddress(response.user?.wallet_address || connected.address);
    setMessage('Wallet linked securely to your CampusArc account.');
  }

  async function linkWallet() {
    await openWalletChooser({ type: 'link' });
  }

  async function executePayment(feeId, connected) {
    setBusyId(feeId);
    setMessage('');
    setError('');
    try {
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

  async function pay(feeId) {
    setMessage('');
    setError('');
    if (!walletAddress) {
      await openWalletChooser({ type: 'pay', feeId });
      return;
    }
    try {
      const wallets = await discoverWallets();
      const preferred = typeof window !== 'undefined' ? window.localStorage.getItem('campusarc-selected-wallet-rdns') : null;
      const selected = wallets.find((item) => preferred && item.info?.rdns === preferred) || wallets[0];
      if (!selected) {
        await openWalletChooser({ type: 'pay', feeId });
        return;
      }
      const connected = await connectWallet(selected.provider);
      setWalletAddress(connected.address);
      await executePayment(feeId, connected);
    } catch (err) {
      setError(err?.message || 'Wallet payment could not be started.');
    }
  }

  function payWithPaytmDemo() {
    setMessage('Paytm is the second payment rail. Demo mode only — no INR payment is processed yet.');
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
            <button className="btn" onClick={linkWallet}>Connect wallet</button>
            <button className="btn" onClick={() => router.push('/help')}>Help Center</button>
            <button className="btn" onClick={refreshPortal}>Refresh</button>
          </div>
        </div>

        {message ? <div className="card" role="status" style={{ marginBottom: 14 }}>{message}</div> : null}
        {error ? <div className="alert" role="alert" style={{ marginBottom: 14 }}>{error}</div> : null}

        <section className="card wallet-panel" style={{ marginBottom: 18 }}>
          <div>
            <span className="eyebrow">arc wallet</span>
            <h2 style={{ marginTop: 8 }}>Wallet-first payments</h2>
            <p className="muted" style={{ marginTop: 7 }}>Connect the wallet you already use. CampusArc is not locked to MetaMask.</p>
          </div>
          <div className="wallet-panel-grid">
            <div className="wallet-status-card">
              <span className="label">connected wallet</span>
              <strong>{walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : 'Not connected'}</strong>
              <span className="muted">Arc network</span>
            </div>
            <div className="wallet-status-card">
              <span className="label">wallet discovery</span>
              <strong>{walletProviders.length ? `${walletProviders.length} wallet${walletProviders.length === 1 ? '' : 's'} detected` : 'Ready to detect wallets'}</strong>
              <span className="muted">Extensions + wallet-app browsers</span>
            </div>
          </div>
        </section>

        <div className="grid grid-3">
          <div className="card"><div className="label">pending fees</div><div className="stat" style={{ marginTop: 8 }}>{pendingFees.length}</div><div className="muted">Needs attention</div></div>
          <div className="card"><div className="label">paid fees</div><div className="stat" style={{ marginTop: 8 }}>{paidFees.length}</div><div className="muted">Verified records</div></div>
          <div className="card"><div className="label">wallet</div><div className="stat" style={{ marginTop: 8, fontSize: 14 }}>{walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : 'Not connected'}</div><div className="muted">configured Arc network</div></div>
        </div>

        <section className="section">
          <h2 style={{ marginBottom: 12 }}>Academic center</h2>
          <div className="grid grid-3">
            <div className="card"><div className="label">attendance</div><div className="stat" style={{ marginTop: 8 }}>{academics?.summary?.attendanceRate == null ? '—' : `${academics.summary.attendanceRate}%`}</div><div className="muted">Based on recent records</div></div>
            <div className="card"><div className="label">homework</div><div className="stat" style={{ marginTop: 8 }}>{academics?.homework?.length ?? '—'}</div><div className="muted">Recent campus tasks</div></div>
            <div className="card"><div className="label">exams</div><div className="stat" style={{ marginTop: 8 }}>{academics?.exams?.length ?? '—'}</div><div className="muted">Scheduled / recorded</div></div>
          </div>
          {academics?.homework?.length ? <div className="card" style={{ marginTop: 14, overflowX: 'auto' }}><table className="table"><thead><tr><th>Homework</th><th>Date</th><th>Details</th></tr></thead><tbody>{academics.homework.slice(0, 6).map((item) => <tr key={item.id}><td>{item.title}</td><td>{item.date || '—'}</td><td>{item.content || 'No additional details.'}</td></tr>)}</tbody></table></div> : <div className="empty" style={{ marginTop: 14 }}>No homework has been published yet.</div>}
        </section>

        <section className="section">
          <h2 style={{ marginBottom: 12 }}>Campus updates</h2>
          <div className="grid grid-2">
            <section className="card">
              <div className="label">circulars & notices</div>
              {!academics?.circulars?.length ? <p className="muted" style={{ marginTop: 10 }}>No campus notices have been published yet.</p> :
                <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                  {academics.circulars.slice(0, 6).map(item => <article key={item.id} style={{ paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                    <strong>{item.title}</strong><div className="muted" style={{ marginTop: 4, fontSize: 12 }}>{item.timestamp || ''}</div><p style={{ marginTop: 6 }}>{item.content_hash || 'Notice published by your school.'}</p>
                  </article>)}
                </div>}
            </section>
            <section className="card">
              <div className="label">notifications</div>
              {!academics?.notifications?.length ? <p className="muted" style={{ marginTop: 10 }}>No notifications.</p> :
                <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
                  {academics.notifications.slice(0, 6).map(item => <div key={item.id} style={{ paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                    <strong>{item.message}</strong><div className="muted" style={{ marginTop: 4, fontSize: 12 }}>{item.type} · {item.timestamp}</div>
                  </div>)}
                </div>}
            </section>
          </div>
        </section>

        <section className="section">
          <h2 style={{ marginBottom: 12 }}>Exam report</h2>
          {!academics?.exams?.length ? <div className="empty">No exam records are available yet.</div> :
            <div className="card" style={{ overflowX: 'auto' }}><table className="table"><thead><tr><th>Subject</th><th>Marks</th><th>Date</th><th>Result</th></tr></thead><tbody>
              {academics.exams.map(item => <tr key={item.id}><td>{item.subject}</td><td>{item.marks == null ? 'Scheduled' : item.marks + ' / 100'}</td><td>{item.schedule_date || '—'}</td><td>{item.marks == null ? 'Upcoming' : Number(item.marks) >= 40 ? 'Recorded' : 'Needs support'}</td></tr>)}
            </tbody></table></div>}
        </section>

        <section className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <h2>Fee ledger</h2><span className="muted">{fees.length} record{fees.length === 1 ? '' : 's'}</span>
          </div>
          {!fees.length ? <div className="empty">No fee records are available for this student.</div> : (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="table"><thead><tr><th>Fee</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead><tbody>
                {fees.map((fee) => <tr key={fee.id}><td>Fee #{fee.id}</td><td>{fee.due_amount ?? '—'} USDC</td><td>{fee.status}</td><td>{fee.status === 'pending' ? <div className="payment-actions"><button className="btn btn-primary" disabled={busyId === fee.id} onClick={() => pay(fee.id)}>{busyId === fee.id ? 'Processing…' : '1 · Pay with wallet'}</button><button className="btn paytm-demo-btn" onClick={payWithPaytmDemo}>2 · Paytm <span>Demo</span></button></div> : <span className="muted">No action</span>}</td></tr>)}
              </tbody></table>
            </div>
          )}
        </section>

        <section className="section">
          <h2 style={{ marginBottom: 12 }}>Recent payment activity</h2>
          {!transactions.length ? <div className="empty">No payment transactions yet.</div> : (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="table"><thead><tr><th>Amount</th><th>Status</th><th>Transaction</th></tr></thead><tbody>
                {transactions.slice(0, 8).map((tx) => <tr key={tx.id}><td>{tx.amount} {tx.currency}</td><td>{tx.status}</td><td>{tx.tx_hash ? <a href={`${ARC_EXPLORER}/tx/${tx.tx_hash}`} target="_blank" rel="noreferrer" className="mono" style={{ color: 'var(--teal)' }}>{tx.tx_hash.slice(0, 10)}…{tx.tx_hash.slice(-6)}</a> : 'Awaiting verification'}</td></tr>)}
              </tbody></table>
            </div>
          )}
        </section>
      </main>

      {walletModalOpen ? (
        <div className="wallet-modal-backdrop" role="dialog" aria-modal="true" aria-label="Choose a wallet" onClick={() => setWalletModalOpen(false)}>
          <div className="wallet-modal card" onClick={(event) => event.stopPropagation()}>
            <div className="wallet-modal-head">
              <div>
                <span className="eyebrow">wallet connection</span>
                <h2 style={{ marginTop: 7 }}>Choose your wallet</h2>
                <p className="muted" style={{ marginTop: 7 }}>CampusArc uses standard wallet discovery instead of assuming MetaMask.</p>
              </div>
              <button className="btn" onClick={() => setWalletModalOpen(false)} aria-label="Close wallet chooser">Close</button>
            </div>
            <div className="wallet-list">
              {walletProviders.map((detail) => (
                <button className="wallet-option" key={detail.info.uuid} disabled={walletBusy} onClick={() => selectWallet(detail)}>
                  {detail.info.icon ? <img src={detail.info.icon} alt="" width="40" height="40" /> : <span className="wallet-icon">{getWalletLabel(detail).slice(0, 1)}</span>}
                  <span><strong>{getWalletLabel(detail)}</strong><small>Connect to Arc</small></span>
                </button>
              ))}
              {!walletProviders.length ? <div className="empty">No injected wallet was detected. On Android/iOS, open CampusArc AI from your wallet app's built-in browser.</div> : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
