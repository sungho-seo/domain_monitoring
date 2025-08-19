import { simplifyByText, categorize, riskLevel, recommend } from './classify.js';

export function parseCSV(text){
  const rows=[]; let row=[]; let cur=""; let i=0; let inQ=false;
  const endCell=()=>{row.push(cur);cur="";}; const endRow=()=>{rows.push(row);row=[];};
  while(i<text.length){
    const ch=text[i];
    if(inQ){
      if(ch==='\"'){ if(text[i+1]==='\"'){cur+='\"';i+=2;continue;} inQ=false;i++;continue; }
      cur+=ch;i++;continue;
    }else{
      if(ch==='\"'){inQ=true;i++;continue;}
      if(ch===','){endCell();i++;continue;}
      if(ch==='\r'){i++;continue;}
      if(ch==='\n'){endCell();endRow();i++;continue;}
      cur+=ch;i++;
    }
  }
  endCell();endRow();
  const header=rows.shift()||[];
  return rows.filter(r=>r.length>1||(r[0]&&r[0].trim()!=="")).map(r=>{
    const obj={}; header.forEach((h,idx)=>{obj[h]=(r[idx]??"");}); return obj;
  });
}

const normKey = k => String(k||'').trim().toLowerCase();
const pick = (obj, keys) => {
  for(const key of keys){ for(const k in obj){ if(normKey(k)===normKey(key)) return obj[k]; } }
  return '';
};
const normalizeUrl = (u)=>{ if(!u) return ''; if(/^https?:\/\//i.test(u)) return u; return 'https://'+String(u).replace(/^\/+/, ''); };

function normalizeRow(row){
  const norm=(v)=>{ if(v==null) return ""; let s=String(v).trim(); if(s==="'"||s.toLowerCase()==="none") s=""; return s; };
  const urlRaw=norm(pick(row,['Url','URL','Domain','Host']));
  const response=norm(pick(row,['Response','Error','Message','응답','오류']));
  const status=norm(pick(row,['Status','Manual','Label']));
  const errorType=norm(pick(row,['Error_Type','ErrorType']));
  const errorCode=norm(pick(row,['Error_Code','ErrorCode','Code']));
  const causeCode=norm(pick(row,['Cause_Code','CauseCode']));
  const certDNS=norm(pick(row,['Cert_DNS','Cert','Cert_SAN']));
  const url=normalizeUrl(urlRaw);
  return {url,response,status,errorType,errorCode,causeCode,certDNS,_raw:row};
}

function simplifyRow(r){
  let simp=simplifyByText([r.response,r.errorType,r.errorCode,r.causeCode,r.certDNS].filter(Boolean).join(' '));
  const pool=[r.causeCode,r.errorCode,r.errorType,r.response,r.certDNS].map(x=>String(x||'')).join(' ').toUpperCase();
  if(/CERT_HAS_EXPIRED/.test(pool))      simp='Cert Expired';
  else if(/ERR_TLS_CERT_ALTNAME_INVALID|COMMON_NAME_INVALID/.test(pool)) simp='Cert CN Mismatch';
  else if(/UNABLE_TO_VERIFY_LEAF_SIGNATURE|SELF-?SIGNED/.test(pool) && simp==='SSL Issue') simp='Cert Verify Fail';
  else if(/CERT_NOT_YET_VALID/.test(pool))  simp='Cert Not Valid Yet';
  return simp;
}

const getHostFromUrl = (u)=>{
  try{ return new URL(u).hostname.toLowerCase(); }
  catch(e){ return String(u||'').replace(/^https?:\/\//,'').split('/')[0].toLowerCase(); }
};

export function buildView(rows){
  return rows.map((raw,i)=>{
    const r=normalizeRow(raw);
    const simplified=simplifyRow(r);
    const risk=riskLevel(simplified);
    const advice=recommend(simplified);
    const manual=(r.status||'').toLowerCase();
    const manualAbn=manual==='invalid';
    const autoAbn=risk!=='normal';
    const mismatch=manual ? (manualAbn!==autoAbn) : false;
    return {
      _id:i, url:r.url, host:getHostFromUrl(r.url), _manualStatus:r.status,
      simplified, category:categorize(simplified), _risk:risk, advice, _mismatch:mismatch, _raw:r._raw
    };
  });
}
