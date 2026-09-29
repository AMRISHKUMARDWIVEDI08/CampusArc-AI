'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '../../components/dashboard/TopBar';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';

const today = () => new Date().toISOString().slice(0, 10);

export default function AdminPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();
  const [school, setSchool] = useState(null);
  const [overview, setOverview] = useState(null);
  const [students, setStudents] = useState([]);
  const [tab, setTab] = useState('overview');
  const [type, setType] = useState('homework');
  const [form, setForm] = useState({ title:'', content:'', date:today(), student_id:'', amount:'', subject:'', marks:'', status:'present', schedule_date:today() });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [accountRole, setAccountRole] = useState('parent');
  const [accountForm, setAccountForm] = useState({username:'',email:'',password:'',student_id:'',relationship:'guardian',subject:'',class_name:'',section:''});

  useEffect(() => {
    if (!loading && !user) router.replace('/login?role=admin');
    if (!loading && user && user.role !== 'admin') router.replace('/student');
  }, [loading, user, router]);

  async function refresh() {
    if (!user?.school_id) return;
    setError(''); setMessage('');
    try {
      const [schoolResponse, overviewResponse, studentsResponse] = await Promise.all([
        api.school(user.school_id),
        api.campusSchoolOverview(user.school_id),
        api.campusStudents(user.school_id)
      ]);
      setSchool(schoolResponse.school ?? null);
      setOverview(overviewResponse ?? null);
      setStudents(Array.isArray(studentsResponse?.students) ? studentsResponse.students : []);
      if (!form.student_id && studentsResponse?.students?.[0]) setForm(v => ({...v,student_id:String(studentsResponse.students[0].id)}));
    } catch (e) { setError(e.message || 'Unable to load school data.'); }
  }

  useEffect(() => { refresh(); }, [user?.school_id]);

  function update(key) { return e => setForm(v => ({...v,[key]:e.target.value})); }
  function updateAccount(key) { return e => setAccountForm(v => ({...v,[key]:e.target.value})); }
  async function createAccount(e){
    e.preventDefault(); setBusy(true); setError(''); setMessage('');
    try { const result=await api.createCampusAccount(user.school_id,{role:accountRole,...accountForm,student_id:accountRole==='parent'?Number(accountForm.student_id):undefined}); setMessage(result.message||'Account created.'); setAccountForm(v=>({...v,username:'',email:'',password:''})); }
    catch(e){setError(e.message||'Could not create account.')} finally{setBusy(false)}
  }

  async function submit(e) {
    e.preventDefault();
    if (!user?.school_id) return;
    setBusy(true); setError(''); setMessage('');
    try {
      let result;
      const sid = Number(form.student_id);
      if (type === 'homework') result = await api.publishHomework(user.school_id,{title:form.title,content:form.content,date:form.date});
      if (type === 'circular') result = await api.publishCircular(user.school_id,{title:form.title,content:form.content});
      if (type === 'fee') result = await api.addFee(user.school_id,{student_id:sid,amount:Number(form.amount)});
      if (type === 'attendance') result = await api.recordAttendance(user.school_id,{student_id:sid,date:form.date,status:form.status});
      if (type === 'exam') result = await api.recordExam(user.school_id,{student_id:sid,subject:form.subject,marks:form.marks,schedule_date:form.schedule_date});
      setMessage(result?.message || 'Saved successfully.');
      setForm(v => ({...v,title:'',content:'',amount:'',subject:'',marks:''}));
      await refresh();
    } catch (e) { setError(e.message || 'Could not save this record.'); }
    finally { setBusy(false); }
  }

  if (loading || !user) return <main className="login-wrap"><span className="status"><span className="dot" />Loading school control center…</span></main>;
  if (user.role !== 'admin') return null;

  const summary=overview?.summary||{};
  return (
    <div className="page">
      <TopBar user={user} onLogout={() => { logout(); router.replace('/login'); }} />
      <main className="shell section">
        <div className="hero" style={{ paddingBottom: 20 }}>
          <span className="eyebrow">school operations</span>
          <h1 style={{ fontSize: 42, marginTop: 14 }}>{school?.school_name || 'School'} control center.</h1>
          <p style={{ marginTop: 10 }}>Manage students, publish academic information, maintain attendance and create fee records from one workspace.</p>
          <div className="actions">
            <button className="btn" onClick={() => setTab('overview')}>Overview</button>
            <button className="btn" onClick={() => setTab('manage')}>Manage campus</button>
            <button className="btn btn-primary" onClick={() => router.push('/ai')}>AI workspace</button>
            <button className="btn" onClick={refresh}>Refresh</button>
          </div>
        </div>
        {message ? <div className="card" role="status" style={{ marginBottom: 14 }}>{message}</div> : null}
        {error ? <div className="alert" role="alert" style={{ marginBottom: 14 }}>{error}</div> : null}

        {tab === 'overview' ? (
          <>
            <div className="grid grid-3">
              <section className="card"><div className="label">students</div><div className="stat" style={{marginTop:8}}>{summary.students ?? 0}</div><p className="muted">Active campus records</p></section>
              <section className="card"><div className="label">fee records</div><div className="stat" style={{marginTop:8}}>{summary.feeRecords ?? 0}</div><p className="muted">Pending {summary.pendingFees ?? 0} · Paid {summary.paidFees ?? 0}</p></section>
              <section className="card"><div className="label">amount due</div><div className="stat" style={{marginTop:8}}>{Number(summary.amountDue || 0).toFixed(2)} USDC</div><p className="muted">Ledger balance</p></section>
            </div>
            <section className="section">
              <div className="grid grid-2">
                <div className="card"><div className="label">Arc school wallet</div><div className="mono" style={{marginTop:8}}>{school?.wallet_address || 'Not configured'}</div><p className="muted" style={{marginTop:8}}>Direct student-wallet USDC destination.</p></div>
                <div className="card"><div className="label">student join code</div><div className="mono" style={{fontSize:22,marginTop:8}}>{school?.join_code || '—'}</div><p className="muted" style={{marginTop:8}}>Give this code only to enrolled students.</p></div>
              </div>
            </section>
            <section className="section">
              <h2 style={{marginBottom:12}}>Recent published homework</h2>
              {!overview?.homework?.length ? <div className="empty">No homework published yet.</div> : <div className="card" style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Title</th><th>Date</th><th>Content</th></tr></thead><tbody>{overview.homework.slice(0,10).map(x=><tr key={x.id}><td>{x.title}</td><td>{x.date}</td><td>{x.content || '—'}</td></tr>)}</tbody></table></div>}
            </section>
          </>
        ) : (
          <>
            <section className="card" style={{marginBottom:16}}>
              <span className="eyebrow">people & access</span>
              <h2 style={{marginTop:8}}>Create parent or teacher access</h2>
              <p className="muted" style={{marginTop:6}}>Accounts are linked to this school. Parent access is linked to one student; teacher access stores teaching assignment details.</p>
              <form className="form" style={{marginTop:14}} onSubmit={createAccount}>
                <div className="field"><label>Role</label><select value={accountRole} onChange={e=>setAccountRole(e.target.value)}><option value="parent">Parent</option><option value="teacher">Teacher</option></select></div>
                <div className="grid grid-2"><div className="field"><label>Username</label><input value={accountForm.username} onChange={updateAccount('username')} required/></div><div className="field"><label>Email</label><input type="email" value={accountForm.email} onChange={updateAccount('email')}/></div></div>
                <div className="field"><label>Initial password</label><input type="password" value={accountForm.password} onChange={updateAccount('password')} minLength={8} required/></div>
                {accountRole==='parent'?<div className="grid grid-2"><div className="field"><label>Child</label><select value={accountForm.student_id} onChange={updateAccount('student_id')} required><option value="">Select student</option>{students.map(s=><option key={s.id} value={s.id}>{s.name} · {s.class_name||'class'} {s.section||''}</option>)}</select></div><div className="field"><label>Relationship</label><input value={accountForm.relationship} onChange={updateAccount('relationship')} placeholder="guardian"/></div></div>:<div className="grid grid-3"><div className="field"><label>Subject</label><input value={accountForm.subject} onChange={updateAccount('subject')}/></div><div className="field"><label>Class</label><input value={accountForm.class_name} onChange={updateAccount('class_name')}/></div><div className="field"><label>Section</label><input value={accountForm.section} onChange={updateAccount('section')}/></div></div>}
                <button className="btn btn-primary" disabled={busy}>{busy?'Creating…':'Create account'}</button>
              </form>
            </section>
            <section className="card" style={{marginBottom:16}}>
              <span className="eyebrow">publish / record</span>
              <h2 style={{marginTop:8}}>Run a real campus operation</h2>
              <div className="field" style={{marginTop:14}}><label>Operation</label><select value={type} onChange={e=>setType(e.target.value)}>
                <option value="homework">Homework</option><option value="circular">Circular / Notice</option><option value="fee">Fee due</option><option value="attendance">Attendance</option><option value="exam">Exam / Marks</option>
              </select></div>
              <form className="form" style={{marginTop:14}} onSubmit={submit}>
                {(type==='homework'||type==='circular') ? <><div className="field"><label>Title</label><input value={form.title} onChange={update('title')} required/></div><div className="field"><label>{type==='homework'?'Homework details':'Notice content'}</label><textarea rows={5} value={form.content} onChange={update('content')} required/></div>{type==='homework'?<div className="field"><label>Date</label><input type="date" value={form.date} onChange={update('date')} required/></div>:null}</> : null}
                {type==='fee' ? <><div className="field"><label>Student</label><select value={form.student_id} onChange={update('student_id')} required>{students.map(s=><option key={s.id} value={s.id}>{s.name} · {s.class_name||'class'} {s.section||''} · #{s.id}</option>)}</select></div><div className="field"><label>Amount (USDC)</label><input inputMode="decimal" type="number" min="0.01" step="0.01" value={form.amount} onChange={update('amount')} required/></div></> : null}
                {type==='attendance' ? <><div className="grid grid-2"><div className="field"><label>Student</label><select value={form.student_id} onChange={update('student_id')} required>{students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div><div className="field"><label>Date</label><input type="date" value={form.date} onChange={update('date')} required/></div></div><div className="field"><label>Status</label><select value={form.status} onChange={update('status')}><option>present</option><option>absent</option><option>late</option><option>leave</option></select></div></> : null}
                {type==='exam' ? <><div className="field"><label>Student</label><select value={form.student_id} onChange={update('student_id')} required>{students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div><div className="grid grid-2"><div className="field"><label>Subject</label><input value={form.subject} onChange={update('subject')} required/></div><div className="field"><label>Marks / 100</label><input type="number" min="0" max="100" step="0.01" value={form.marks} onChange={update('marks')}/></div></div><div className="field"><label>Exam date</label><input type="date" value={form.schedule_date} onChange={update('schedule_date')}/></div></> : null}
                <button className="btn btn-primary" disabled={busy||!students.length}>{busy?'Saving…':'Save / Publish'}</button>
              </form>
            </section>
            <section className="section">
              <h2 style={{marginBottom:12}}>Students</h2>
              {!students.length?<div className="empty">No students have joined this school yet.</div>:<div className="card" style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Name</th><th>Class</th><th>Parent</th><th>Contact</th><th>Status</th></tr></thead><tbody>{students.map(s=><tr key={s.id}><td>{s.name}<div className="muted mono">#{s.roll_no||s.id}</div></td><td>{s.class_name||'—'} {s.section||''}</td><td>{s.guardian_name||'—'}</td><td>{s.phone||s.guardian_email||s.email||'—'}</td><td>{s.is_active?'Active':'Inactive'}</td></tr>)}</tbody></table></div>}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
