'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '../../components/dashboard/TopBar';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { connectWallet, discoverWallets, getWalletLabel, sendUsdcTransfer } from '../../lib/wallet';

export default function ParentPage(){
  const router=useRouter(); const {user,loading,logout}=useAuth();
  const [children,setChildren]=useState([]); const [selected,setSelected]=useState(null); const [data,setData]=useState(null); const [fees,setFees]=useState([]); const [error,setError]=useState(''); const [paying,setPaying]=useState(null);
  useEffect(()=>{if(!loading&&!user)router.replace('/login'); if(!loading&&user&&user.role!=='parent')router.replace(user.role==='admin'?'/admin':'/student');},[loading,user,router]);
  useEffect(()=>{if(user?.role==='parent')api.parentFamily().then(r=>{setChildren(r.students||[]);setSelected(r.students?.[0]||null)}).catch(e=>setError(e.message||'Unable to load family records.'));},[user?.role]);
  useEffect(()=>{if(selected){setError(''); Promise.all([api.academicOverview(selected.id),api.fees(selected.id)]).then(([academic,feeData])=>{setData(academic);setFees(feeData.fees||feeData||[]);}).catch(e=>setError(e.message||'Unable to load child data.'));}},[selected]);
  if(loading||!user)return <main className="login-wrap"><span className="status"><span className="dot"/>Loading parent portal…</span></main>;
  async function payFee(feeId){
    setPaying(feeId); setError('');
    try{
      const wallets=await discoverWallets();
      if(!wallets.length) throw new Error('No compatible wallet found. Open CampusArc AI inside your mobile wallet browser or install a supported wallet.');
      const detail=wallets[0];
      const connected=await connectWallet(detail.provider);
      const prepared=await api.payFee(feeId,connected.address);
      if(!prepared.paymentRequired){setError('');return;}
      const txHash=await sendUsdcTransfer({provider:connected.provider,from:connected.address,tokenAddress:prepared.tokenAddress,destinationAddress:prepared.destinationAddress,amountBaseUnits:prepared.amountBaseUnits});
      await api.confirmFeePayment(feeId,txHash,connected.address);
      const feeData=await api.fees(selected.id); setFees(feeData.fees||feeData||[]);
    }catch(e){setError(e?.message||'Payment could not be completed.');}
    finally{setPaying(null);}
  }

  if(user.role!=='parent')return null;
  return <div className="page"><TopBar user={user} onLogout={()=>{logout();router.replace('/login')}}/><main className="shell section">
    <div className="hero" style={{paddingBottom:20}}><span className="eyebrow">parent portal</span><h1 style={{fontSize:42,marginTop:14}}>Family campus view.</h1><p style={{marginTop:10}}>Monitor your child's attendance, homework, exams, notices and campus payments from one account.</p></div>
    {error?<div className="alert" role="alert" style={{marginBottom:14}}>{error}</div>:null}
    <section className="card" style={{marginBottom:16}}><div className="field"><label>Child</label><select value={selected?.id||''} onChange={e=>setSelected(children.find(x=>String(x.id)===e.target.value)||null)}>{children.map(c=><option key={c.id} value={c.id}>{c.name} · {c.class_name||'class'} {c.section||''}</option>)}</select></div></section>
    {selected?<><div className="grid grid-3"><div className="card"><div className="label">attendance</div><div className="stat" style={{marginTop:8}}>{data?.summary?.attendanceRate==null?'—':data.summary.attendanceRate+'%'}</div></div><div className="card"><div className="label">homework</div><div className="stat" style={{marginTop:8}}>{data?.homework?.length||0}</div></div><div className="card"><div className="label">exams</div><div className="stat" style={{marginTop:8}}>{data?.exams?.length||0}</div></div></div>
    <section className="section"><h2 style={{marginBottom:12}}>Fee ledger</h2><div className="card" style={{overflowX:'auto'}}>{fees.length?<table className="table"><thead><tr><th>Fee</th><th>Due</th><th>Status</th><th>Action</th></tr></thead><tbody>{fees.slice(0,12).map(f=><tr key={f.id}><td>Fee #{f.id}</td><td>{f.due_amount ?? '—'} USDC</td><td>{f.status||'pending'}</td><td>{f.status==='pending'?<button className="btn btn-primary" disabled={paying===f.id} onClick={()=>payFee(f.id)}>{paying===f.id?'Processing…':'Pay with Arc USDC'}</button>:'—'}</td></tr>)}</tbody></table>:<p className="muted">No fee records available.</p>}</div></section>
    <section className="section"><h2 style={{marginBottom:12}}>Latest campus information</h2><div className="grid grid-2"><div className="card"><div className="label">homework</div>{(data?.homework||[]).slice(0,5).map(x=><p key={x.id} style={{marginTop:9}}><strong>{x.title}</strong><br/><span className="muted">{x.date}</span></p>)||<p className="muted">No homework.</p>}</div><div className="card"><div className="label">exam report</div>{(data?.exams||[]).slice(0,5).map(x=><p key={x.id} style={{marginTop:9}}><strong>{x.subject}</strong> · {x.marks==null?'Scheduled':x.marks+'/100'}<br/><span className="muted">{x.schedule_date||''}</span></p>)}</div></div></section></>:<div className="empty">No child is linked to this parent account yet.</div>}
  </main></div>;
}