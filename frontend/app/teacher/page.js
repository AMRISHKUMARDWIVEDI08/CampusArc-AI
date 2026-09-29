'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '../../components/dashboard/TopBar';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';

export default function TeacherPage(){
  const router=useRouter(); const {user,loading,logout}=useAuth(); const [workspace,setWorkspace]=useState(null); const [error,setError]=useState('');
  useEffect(()=>{if(!loading&&!user)router.replace('/login'); if(!loading&&user&&user.role!=='teacher'&&user.role!=='staff')router.replace(user.role==='admin'?'/admin':'/student');},[loading,user,router]);
  useEffect(()=>{if(user&&(user.role==='teacher'||user.role==='staff'))api.teacherWorkspace().then(setWorkspace).catch(e=>setError(e.message||'Unable to load teacher workspace.'));},[user]);
  if(loading||!user)return <main className="login-wrap"><span className="status"><span className="dot"/>Loading teacher workspace…</span></main>;
  if(user.role!=='teacher'&&user.role!=='staff')return null;
  return <div className="page"><TopBar user={user} onLogout={()=>{logout();router.replace('/login')}}/><main className="shell section">
    <div className="hero" style={{paddingBottom:20}}><span className="eyebrow">teacher workspace</span><h1 style={{fontSize:42,marginTop:14}}>Teach from one campus workspace.</h1><p style={{marginTop:10}}>See assigned classes, students, homework and school notices in one place.</p></div>
    {error?<div className="alert" role="alert">{error}</div>:null}
    <div className="grid grid-3"><div className="card"><div className="label">students</div><div className="stat" style={{marginTop:8}}>{workspace?.students?.length||0}</div></div><div className="card"><div className="label">assignments</div><div className="stat" style={{marginTop:8}}>{workspace?.assignments?.length||0}</div></div><div className="card"><div className="label">published homework</div><div className="stat" style={{marginTop:8}}>{workspace?.homework?.length||0}</div></div></div>
    <section className="section"><div className="grid grid-2"><div className="card"><div className="label">my teaching assignments</div>{workspace?.assignments?.length?workspace.assignments.map(a=><p key={a.id} style={{marginTop:10}}><strong>{a.subject||'General'}</strong> · {a.class_name||'All classes'} {a.section||''}</p>):<p className="muted" style={{marginTop:10}}>No assignments configured.</p>}</div><div className="card"><div className="label">school notices</div>{workspace?.circulars?.slice(0,6).map(c=><p key={c.id} style={{marginTop:10}}><strong>{c.title}</strong><br/><span className="muted">{c.timestamp||''}</span></p>)}</div></div></section>
    <section className="section"><h2 style={{marginBottom:12}}>Students</h2>{workspace?.students?.length?<div className="card" style={{overflowX:'auto'}}><table className="table"><thead><tr><th>Name</th><th>Class</th><th>Roll</th></tr></thead><tbody>{workspace.students.map(s=><tr key={s.id}><td>{s.name}</td><td>{s.class_name||'—'} {s.section||''}</td><td>{s.roll_no||'—'}</td></tr>)}</tbody></table></div>:<div className="empty">No students found.</div>}</section>
  </main></div>;
}