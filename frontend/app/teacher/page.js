'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '../../components/dashboard/TopBar';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';

const today=()=>new Date().toISOString().slice(0,10);

export default function TeacherPage(){
  const router=useRouter(); const {user,loading,logout}=useAuth();
  const [workspace,setWorkspace]=useState(null); const [error,setError]=useState(''); const [message,setMessage]=useState('');
  const [tab,setTab]=useState('overview'); const [busy,setBusy]=useState(false);
  const [form,setForm]=useState({student_id:'',date:today(),status:'present',subject:'',marks:'',schedule_date:today()});

  useEffect(()=>{if(!loading&&!user)router.replace('/login'); if(!loading&&user&&user.role!=='teacher'&&user.role!=='staff')router.replace(user.role==='admin'?'/admin':'/student');},[loading,user,router]);
  async function refresh(){
    if(!(user?.role==='teacher'||user?.role==='staff'))return;
    try{
      setError('');
      const data=await api.teacherWorkspace();
      setWorkspace(data);
      setForm(v=>({...v,student_id:v.student_id||(data.students?.[0]?.id?String(data.students[0].id):'')}));
    }catch(e){setError(e.message||'Unable to load teacher workspace.');}
  }
  useEffect(()=>{refresh();},[user]);
  function update(k){return e=>setForm(v=>({...v,[k]:e.target.value}));}
  async function save(kind){
    if(!user?.school_id||!form.student_id)return;
    setBusy(true);setError('');setMessage('');
    try{
      const body=kind==='attendance'
        ? {student_id:Number(form.student_id),date:form.date,status:form.status}
        : {student_id:Number(form.student_id),subject:form.subject,marks:form.marks,schedule_date:form.schedule_date};
      const result=kind==='attendance'
        ? await api.recordAttendance(user.school_id,body)
        : await api.recordExam(user.school_id,body);
      setMessage(result.message||'Saved.');
      if(kind==='exam')setForm(v=>({...v,marks:''}));
      await refresh();
    }catch(e){setError(e.message||'Could not save record.');}finally{setBusy(false);}
  }

  if(loading||!user)return <main className="login-wrap"><span className="status"><span className="dot"/>Loading teacher workspace…</span></main>;
  if(user.role!=='teacher'&&user.role!=='staff')return null;

  return <div className="page">
    <TopBar user={user} onLogout={()=>{logout();router.replace('/login')}}/>
    <main className="shell section">
      <div className="hero" style={{paddingBottom:20}}>
        <span className="eyebrow">teacher workspace</span>
        <h1 style={{fontSize:42,marginTop:14}}>Teach from one campus workspace.</h1>
        <p style={{marginTop:10}}>See assigned classes, students, homework and school notices in one place.</p>
        <div className="actions">
          <button className="btn" onClick={()=>setTab('overview')}>Overview</button>
          <button className="btn btn-primary" onClick={()=>setTab('attendance')}>Attendance</button>
          <button className="btn" onClick={()=>setTab('exam')}>Exam records</button>
          <button className="btn" onClick={()=>router.push('/ai')}>AI workspace</button>
          <button className="btn" onClick={refresh}>Refresh</button>
        </div>
      </div>

      {message?<div className="card" role="status" style={{marginBottom:14}}>{message}</div>:null}
      {error?<div className="alert" role="alert" style={{marginBottom:14}}>{error}</div>:null}

      {tab==='overview'?<>
        <div className="grid grid-3">
          <div className="card"><div className="label">students</div><div className="stat" style={{marginTop:8}}>{workspace?.students?.length||0}</div></div>
          <div className="card"><div className="label">assignments</div><div className="stat" style={{marginTop:8}}>{workspace?.assignments?.length||0}</div></div>
          <div className="card"><div className="label">published homework</div><div className="stat" style={{marginTop:8}}>{workspace?.homework?.length||0}</div></div>
        </div>
        <section className="section">
          <div className="grid grid-2">
            <div className="card"><div className="label">my teaching assignments</div>{workspace?.assignments?.length?workspace.assignments.map(a=><p key={a.id} style={{marginTop:10}}><strong>{a.subject||'General'}</strong> · {a.class_name||'All classes'} {a.section||''}</p>):<p className="muted" style={{marginTop:10}}>No assignments configured.</p>}</div>
            <div className="card"><div className="label">school notices</div>{workspace?.circulars?.slice(0,6).map(c=><p key={c.id} style={{marginTop:10}}><strong>{c.title}</strong><br/><span className="muted">{c.timestamp||''}</span></p>)}</div>
          </div>
        </section>
        <section className="section">
          <h2 style={{marginBottom:12}}>Students</h2>
          {workspace?.students?.length?<div className="card" style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Name</th><th>Class</th><th>Roll</th></tr></thead><tbody>{workspace.students.map(s=><tr key={s.id}><td>{s.name}</td><td>{s.class_name||'—'} {s.section||''}</td><td>{s.roll_no||'—'}</td></tr>)}</tbody></table></div>:<div className="empty">No students found.</div>}
        </section>
      </>:<section className="card form">
        <span className="eyebrow">{tab==='attendance'?'attendance':'exam records'}</span>
        <h2>{tab==='attendance'?'Record attendance':'Record exam marks'}</h2>
        <p className="muted">Only students covered by your teaching assignment can be changed.</p>
        <div className="field"><label>Student</label><select value={form.student_id} onChange={update('student_id')} required><option value="">Select student</option>{(workspace?.students||[]).map(s=><option key={s.id} value={s.id}>{s.name} · {s.class_name||'class'} {s.section||''}</option>)}</select></div>
        {tab==='attendance'?<>
          <div className="grid grid-2">
            <div className="field"><label>Date</label><input type="date" value={form.date} onChange={update('date')}/></div>
            <div className="field"><label>Status</label><select value={form.status} onChange={update('status')}><option value="present">Present</option><option value="absent">Absent</option><option value="late">Late</option><option value="leave">Leave</option></select></div>
          </div>
          <button className="btn btn-primary" disabled={busy||!form.student_id} onClick={()=>save('attendance')}>{busy?'Saving…':'Save attendance'}</button>
        </>:<>
          <div className="grid grid-2">
            <div className="field"><label>Subject</label><input value={form.subject} onChange={update('subject')} required/></div>
            <div className="field"><label>Marks / 100</label><input type="number" min="0" max="100" step="0.01" value={form.marks} onChange={update('marks')}/></div>
          </div>
          <div className="field"><label>Exam date</label><input type="date" value={form.schedule_date} onChange={update('schedule_date')}/></div>
          <button className="btn btn-primary" disabled={busy||!form.student_id||!form.subject} onClick={()=>save('exam')}>{busy?'Saving…':'Save exam record'}</button>
        </>}
      </section>}
    </main>
  </div>;
}