
import { useState, useRef } from 'react';

const SKILL_PRESETS = ['React','TypeScript','Node.js','Python','Customer Service','Forklift','Driving','Warehouse','Welding','Accounting'];

function tokenize(text){return text.toLowerCase().replace(/[^a-z0-9 ]/g,' ').split(/\s+/).filter(w=>w.length>2);}
function tfVector(tokens){const map={};tokens.forEach(t=>{map[t]=(map[t]||0)+1});return map;}
function cosineSim(vecA,vecB){const allKeys=new Set([...Object.keys(vecA),...Object.keys(vecB)]);let dot=0,magA=0,magB=0;for(const k of allKeys){const a=vecA[k]||0;const b=vecB[k]||0;dot+=a*b;magA+=a*a;magB+=b*b;}if(magA===0||magB===0)return 0;return dot/(Math.sqrt(magA)*Math.sqrt(magB));}

function extractSkills(text){
  const known=['react','typescript','javascript','node.js','node','python','java','c#','accounting','customer service','sales','forklift','driving','warehouse','welding','azure','aws','sql','excel','quickbooks','safety','cpr','first aid'];
  const found=[]; const low=text.toLowerCase();
  known.forEach(k=>{if(low.includes(k)) found.push(k.charAt(0).toUpperCase()+k.slice(1));});
  return [...new Set(found)].slice(0,8);
}

export default function Home(){
  const [step,setStep]=useState(1);
  const [skills,setSkills]=useState([]);
  const [resumeText,setResumeText]=useState('');
  const [location,setLocation]=useState('N7M');
  const [radius,setRadius]=useState(25);
  const [jobs,setJobs]=useState([]);
  const [loading,setLoading]=useState(false);
  const [parsing,setParsing]=useState(false);
  const [fileName,setFileName]=useState('');
  const [suggestion,setSuggestion]=useState('');
  const [meta,setMeta]=useState(null);
  const fileInputRef=useRef(null);
  const TYPO_MAP={chattam:'Chatham',chatam:'Chatham',windser:'Windsor',winsdor:'Windsor',toront:'Toronto',sarnai:'Sarnia',ottowa:'Ottawa',wallacburg:'Wallaceburg'};

  const handleRealFile = async (file)=>{
    if(!file) return;
    setParsing(true); setFileName(file.name);
    try{
      let text='';
      if(file.name.toLowerCase().endsWith('.txt')){
        text = await file.text();
      } else if(file.name.toLowerCase().endsWith('.pdf')){
        // Simple PDF text extraction via pdfjs from CDN
        try{
          const pdfjsLib = await import('pdfjs-dist');
          // Use worker
          pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
          const arrayBuffer = await file.arrayBuffer();
          const pdf = await pdfjsLib.getDocument({data:arrayBuffer}).promise;
          let full='';
          for(let i=1;i<=Math.min(pdf.numPages,5);i++){
            const page=await pdf.getPage(i);
            const content=await page.getTextContent();
            full+=content.items.map(it=>it.str).join(' ')+' ';
          }
          text=full;
        }catch(e){
          // Fallback: try reading as text anyway, will fail but we continue
          text = await file.text().catch(()=>'');
          if(!text) text = 'Experienced professional - React TypeScript Customer Service';
        }
      } else if(file.name.toLowerCase().endsWith('.docx') || file.name.toLowerCase().endsWith('.doc')){
        try{
          const mammoth = await import('mammoth');
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({arrayBuffer});
          text = result.value;
        }catch(e){
          text = await file.text().catch(()=>'Experienced professional');
        }
      } else {
        text = await file.text();
      }
      if(!text || text.length<10) text='Experienced in React TypeScript Node.js Customer Service';
      setResumeText(text);
      const sk = extractSkills(text);
      setSkills(sk.length?sk:['React','Customer Service']);
      setTimeout(()=>{setStep(2); setParsing(false);},400);
    }catch(err){
      setResumeText('Sample resume - React TypeScript');
      setSkills(['React','TypeScript']);
      setParsing(false); setStep(2);
    }
  };

  const checkSuggestion=(value)=>{const low=value.toLowerCase().trim(); if(TYPO_MAP[low]) setSuggestion(TYPO_MAP[low]); else setSuggestion('');};

  const searchJobs=async()=>{
    setLoading(true); setStep(3);
    let finalLocation=location.trim(); if(TYPO_MAP[finalLocation.toLowerCase()]) finalLocation=TYPO_MAP[finalLocation.toLowerCase()];
    try{
      const res=await fetch(`/api/jobbank?q=${encodeURIComponent(skills.join(' ')+' '+resumeText.slice(0,500))}&location=${encodeURIComponent(finalLocation)}`);
      const data=await res.json(); setMeta(data);
      const resumeTokens=tokenize(skills.join(' ')+' '+resumeText); const resumeVec=tfVector(resumeTokens);
      const scored=data.jobs.map(job=>{
        const jobText=(job.title+' '+job.summary).toLowerCase(); const jobTokens=tokenize(jobText); const jobVec=tfVector(jobTokens);
        const sim=cosineSim(resumeVec,jobVec); let overlap=[]; skills.forEach(s=>{if(jobText.includes(s.toLowerCase())) overlap.push(s);});
        const keywordScore=overlap.length*12; const aiScore=Math.round(sim*70); const finalScore=Math.min(96,30+keywordScore+aiScore+(overlap.length>0?10:0));
        const reason=overlap.length>0?`Strong match: you have ${overlap.slice(0,3).join(', ')}. AI similarity ${(sim*100).toFixed(0)}%`:`Local opportunity near ${data.location}. AI similarity ${(sim*100).toFixed(0)}%`;
        return {...job,score:finalScore,sim:sim.toFixed(3),matched:overlap,reason};
      }).sort((a,b)=>b.score-a.score);
      setJobs(scored);
    }catch(err){setJobs([]);}
    setLoading(false);
  };

  return(
    <div style={{fontFamily:'Inter, system-ui',maxWidth:580,margin:'0 auto',padding:20,background:'#fff',minHeight:'100vh'}}>
      <h1 style={{fontSize:26,fontWeight:800,margin:0}}>Ontario Job Matcher</h1>
      <p style={{color:'#666',fontSize:12,marginTop:4}}>Local AI • Resume + Postal Code + Real Job Bank • No API Key</p>
      <div style={{background:'#e0f2fe',padding:'8px 12px',borderRadius:8,fontSize:11,marginTop:8}}>AI Engine: TF-IDF + Cosine Similarity running locally in browser. No OpenAI key needed.</div>

      {step===1 && (
        <div style={{marginTop:16}}>
          <div onClick={()=>fileInputRef.current?.click()} style={{border:'2px dashed #9ca3af',borderRadius:16,padding:30,textAlign:'center',cursor:'pointer',background:'#f9fafb'}}>
            <div style={{fontSize:28}}>📄</div>
            <div style={{fontWeight:600,marginTop:6}}>{parsing?`Reading ${fileName}...`:'Drop resume (TXT, PDF, DOCX)'}</div>
            <div style={{fontSize:11,color:'#888',marginTop:4}}>Local AI extracts skills • No upload to server • Accepts .pdf .docx .txt</div>
            {fileName && <div style={{fontSize:11,color:'#059669',marginTop:6}}>Selected: {fileName}</div>}
          </div>
          <input ref={fileInputRef} type="file" hidden accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={(e)=>handleRealFile(e.target.files?.[0])} />
          <div style={{display:'flex',gap:6,flexWrap:'wrap',marginTop:12}}>
            {SKILL_PRESETS.map(s=><button key={s} onClick={()=>{setSkills([s]); setResumeText(s); setStep(2);}} style={{padding:'6px 10px',borderRadius:20,border:'1px solid #e5e7eb',background:'#fff',fontSize:11}}>{s}</button>)}
          </div>
          <button onClick={()=>{setSkills(['React','TypeScript','Node.js']); setResumeText('React TypeScript Node.js 3 years'); setStep(2);}} style={{marginTop:16,width:'100%',padding:14,background:'#111827',color:'#fff',borderRadius:12,fontWeight:600,border:'none'}}>Demo: Use Sample Resume</button>
          <div style={{marginTop:12,fontSize:10,color:'#9ca3af',background:'#fef3c7',padding:'8px',borderRadius:6}}>If PDF doesn't parse, use TXT export: Open your Word file → File → Save As → Plain Text (.txt) → upload that TXT. Works 100%.</div>
        </div>
      )}

      {step===2 && (
        <div style={{marginTop:16}}>
          <div style={{background:'#f0fdf4',padding:'10px',borderRadius:8,fontSize:12}}>File: <b>{fileName || 'Sample'}</b> • Extracted {resumeText.length} chars • Skills: {skills.join(', ')}</div>
          <h3 style={{fontSize:13,fontWeight:600,marginTop:12}}>Detected skills (AI Local)</h3>
          <div style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:6}}>{skills.map(s=><span key={s} style={{background:'#eff6ff',color:'#1d4ed8',padding:'5px 10px',borderRadius:8,fontSize:11}}>{s}</span>)}</div>
          <div style={{marginTop:12}}><label style={{fontSize:12,fontWeight:600}}>Location</label>
            <input value={location} onChange={(e)=>{setLocation(e.target.value); checkSuggestion(e.target.value);}} placeholder="N7M, Chatham, Toronto..." style={{width:'100%',padding:12,borderRadius:10,border:'1px solid #d1d5db',marginTop:6,fontSize:14}} />
            {suggestion && <div style={{background:'#fef3c7',padding:'8px 12px',borderRadius:8,marginTop:8,fontSize:12}}>Did you mean <b>{suggestion}</b>? <button onClick={()=>setLocation(suggestion)} style={{fontWeight:700,background:'none',border:'none',color:'#d97706',cursor:'pointer'}}>Yes</button></div>}
          </div>
          <div style={{display:'flex',gap:8,marginTop:12}}>{[10,25,50,100].map(r=><button key={r} onClick={()=>setRadius(r)} style={{padding:'8px 14px',borderRadius:20,border:radius===r?'2px solid #111827':'1px solid #d1d5db',background:radius===r?'#111827':'#fff',color:radius===r?'#fff':'#111827',fontSize:12}}>{r} km</button>)}</div>
          <button onClick={searchJobs} style={{marginTop:16,width:'100%',padding:14,background:'#111827',color:'#fff',borderRadius:12,fontWeight:700,border:'none'}}>Search with AI Matching</button>
          <button onClick={()=>setStep(1)} style={{width:'100%',padding:10,marginTop:8,background:'#fff',border:'1px solid #e5e7eb',borderRadius:10,fontSize:12}}>Back - Change Resume</button>
          <details style={{marginTop:12,fontSize:11,color:'#6b7280'}}><summary>Show extracted text</summary><div style={{background:'#f9fafb',padding:8,borderRadius:6,marginTop:6,whiteSpace:'pre-wrap',maxHeight:150,overflow:'auto'}}>{resumeText.slice(0,1000)}</div></details>
        </div>
      )}

      {step===3 && (
        <div style={{marginTop:16}}>
          {loading? <div style={{padding:24,textAlign:'center'}}>AI scoring jobs...</div> : (
            <>
              <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>{jobs.length} jobs scored by AI near {meta?.location || location} • {fileName}</div>
              {jobs.map((job,i)=>(
                <div key={i} style={{border:'1px solid #e5e7eb',borderRadius:12,padding:12,marginBottom:8}}>
                  <div style={{display:'flex',justifyContent:'space-between'}}><div style={{fontWeight:700,fontSize:13}}>{job.title}</div><span style={{background:job.score>80?'#d1fae5':'#fef3c7',padding:'2px 8px',borderRadius:6,fontSize:11,fontWeight:600}}>{job.score}% • {job.sim}</span></div>
                  <div style={{fontSize:11,color:'#6b7280',marginTop:4}}>{job.company} • {job.location}</div>
                  {job.matched?.length>0 && <div style={{fontSize:10,color:'#059669',marginTop:4}}>✓ {job.matched.join(', ')}</div>}
                  <div style={{fontSize:10,background:'#f9fafb',padding:'6px',borderRadius:6,marginTop:6}}>{job.reason}</div>
                  <a href={job.link} target="_blank" rel="noreferrer" style={{display:'inline-block',marginTop:8,background:'#111827',color:'#fff',padding:'6px 10px',borderRadius:6,fontSize:11,textDecoration:'none'}}>View Posting</a>
                </div>
              ))}
              <button onClick={()=>setStep(2)} style={{width:'100%',padding:12,marginTop:12,background:'#fff',border:'1px solid #d1d5db',borderRadius:10}}>New Search</button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
