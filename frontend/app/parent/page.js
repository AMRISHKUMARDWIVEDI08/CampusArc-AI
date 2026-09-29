'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '../../components/dashboard/TopBar';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';

export default function ParentPage(){
  const router=useRouter(); const {user,loading,logout}=useAuth();
  const [children,setChildren]=useState([]); const [selected,setSelected]=useState(null); const [data,setData]=useState(null); const [error,setError]=useState('');
  useEffect(()=>{if(!loading&&!user)router.replace('/login'); if(!loading&&user&&user.role!=='parent')router.replace(user.role==='admin'?'/admin':'/student');},[loading,user,router]);
  useEffect(()=>{if(user?.role==='parent')api.parentFamily().then(r=>{setChildren(r.students||[]);setSelected(r.students?.[0]||null)}).catch(e=>setError(e.message||'Unable to load family records.'));},[user?.role]);
  useEffect(()=>{if(selected)api.academicOverview(selected.id).then(setData).catch(e=>setError(e.message||'Unable to load child data.'));},[selected]);
  if(loading||!user)return <main className="login-wrap"><span className="status"><span className="dot"/>Loading parent portal…</span></main>;
  if(user.role!=='parent')return null;
  return <div className="page"><TopBar user={user} onLogout={()=>{logout();router.replace('/login')}}/><main className="shell section">
    <div className="hero" style={{paddingBottom:20}}><span className="eyebrow">parent portal</span><h1 style={{fontSize:42,marginTop:14}}>Family campus view.</h1><p style={{marginTop:10}}>Monitor your child's attendance, homework, exams, notices and campus payments from one account.</p></div>
    {error?<div className="alert" role="alert" style={{marginBottom:14}}>{error}</div>:null}
    <section className="card" style={{marginBottom:16}}><div className="field"><label>Child</label><select value={selected?.id||''} onChange={e=>setSelected(children.find(x=>String(x.id)===e.target.value)||null)}>{children.map(c=><option key={c.id} value={c.id}>{c.name} · {c.class_name||'class'} {c.section||''}</option>)}</select></div></section>
    {selected?<><div className="grid grid-3"><div className="card"><div className="label">attendance</div><div className="stat" style={{marginTop:8}}>{data?.summary?.attendanceRate==null?'—':data.summary.attendanceRate+'%'}</div></div><div className="card"><div className="label">homework</div><div className="stat" style={{marginTop:8}}>{data?.homework?.length||0}</div></div><div className="card"><div className="label">exams</div><div className="stat" style={{marginTop:8}}>{data?.exams?.length||0}</div></div></div>
    <section className="section"><h2 style={{marginBottom:12}}>Latest campus information</h2><div className="grid grid-2"><div className="card"><div className="label">homework</div>{(data?.homework||[]).slice(0,5).map(x=><p key={x.id} style={{marginTop:9}}><strong>{x.title}</strong><br/><span className="muted">{x.date}</span></p>)||<p className="muted">No homework.</p>}</div><div className="card"><div className="label">exam report</div>{(data?.exams||[]).slice(0,5).map(x=><p key={x.id} style={{marginTop:9}}><strong>{x.subject}</strong> · {x.marks==null?'Scheduled':x.marks+'/100'}<br/><span className="muted">{x.schedule_date||''}</span></p>)}</div></div></section></>:<div className="empty">No child is linked to this parent account yet.</div>}
  </main></div>;
}