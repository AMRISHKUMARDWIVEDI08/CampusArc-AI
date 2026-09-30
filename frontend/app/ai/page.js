'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TopBar from '../../components/dashboard/TopBar';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../lib/api';
import { getLocale } from '../../lib/i18n';

const MODES=[
  ['tutor','AI Tutor','Learn a concept step by step.'],
  ['study_plan','Study Plan','Turn a goal into a practical study schedule.'],
  ['campus_help','Campus Help','Understand school workflows and next steps.'],
  ['research','Research','Structure research questions and separate facts from uncertainty.'],
];

export default function AIPage(){
  const router=useRouter(); const {user,loading,logout}=useAuth();
  const [prompt,setPrompt]=useState(''); const [mode,setMode]=useState('tutor'); const [provider,setProvider]=useState('gemini');
  const [answer,setAnswer]=useState(''); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  if(loading)return <main className="login-wrap"><span className="status"><span className="dot"/>Loading AI workspace…</span></main>;
  if(!user){if(typeof window!=='undefined')router.replace('/login');return null;}
  async function ask(event){
    event.preventDefault();setError('');setAnswer('');
    if(!prompt.trim()){setError('Enter a question first.');return;}
    setBusy(true);
    try{const result=await api.aiAssistant({prompt:prompt.trim(),mode,provider,locale:getLocale()});setAnswer(result.answer||'No answer was returned.');}
    catch(e){setError(e.message||'AI request failed.');}finally{setBusy(false);}
  }
  return <div className="page">
    <TopBar user={user} onLogout={()=>{logout();router.replace('/login')}}/>
    <main className="shell section">
      <div className="hero" style={{paddingBottom:26}}><span className="eyebrow">campus ai</span><h1 style={{fontSize:44,marginTop:14}}>Ask. Learn. Explore.</h1><p style={{marginTop:10}}>Choose an AI workflow. CampusArc never presents an unconfigured provider as if it were working.</p></div>
      <div className="grid grid-2" style={{marginBottom:16}}>{MODES.map(([id,title,description])=><button key={id} className={mode===id?'card btn-primary':'card'} style={{textAlign:'left'}} onClick={()=>setMode(id)}><strong>{title}</strong><p style={{marginTop:7}}>{description}</p></button>)}</div>
      <form className="card form" onSubmit={ask}>
        <div className="grid grid-2"><div className="field"><label htmlFor="provider">AI provider</label><select id="provider" value={provider} onChange={e=>setProvider(e.target.value)}><option value="gemini">Gemini</option><option value="claude">Claude</option></select></div><div className="field"><label>Selected workflow</label><input value={MODES.find(item=>item[0]===mode)?.[1]||'AI Tutor'} readOnly/></div></div>
        <div className="field"><label htmlFor="prompt">Your question</label><textarea id="prompt" rows={6} value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Ask an academic or campus question…"/></div>
        {error?<div className="alert" role="alert">{error}</div>:null}<button className="btn btn-primary" type="submit" disabled={busy}>{busy?'Thinking…':'Run CampusArc AI'}</button>
      </form>
      {answer?<section className="card" style={{marginTop:16}} aria-live="polite"><div className="label">answer · {MODES.find(item=>item[0]===mode)?.[1]}</div><p style={{marginTop:10,whiteSpace:'pre-wrap',lineHeight:1.65}}>{answer}</p></section>:null}
    </main>
  </div>;
}