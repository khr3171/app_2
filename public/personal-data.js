import {search} from './search-engine.js';
let active;
const NAME='busan-pass-personal-v1';
function database(){return new Promise((resolve,reject)=>{const r=indexedDB.open(NAME,1);r.onupgradeneeded=()=>r.result.createObjectStore('packs');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function loadPersonalData(){const db=await database();try{active=await new Promise((resolve,reject)=>{const tx=db.transaction('packs');const req=tx.objectStore('packs').get('active');req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});return active;}finally{db.close();}}
export async function validatePack(pack){
 if(pack?.format!=='busan-pass-personal-v1'||!Array.isArray(pack.corpus?.documents)||!Array.isArray(pack.corpus?.chunks)||!pack.originals)throw new Error('올바른 개인용 자료 파일(.rulespack)을 선택해주세요.');
 const ids=new Set();
 for(const d of pack.corpus.documents){
  if(typeof d.id!=='string'||ids.has(d.id)||!/^doc-\d+\.(pdf|hwp)$/.test(d.file))throw new Error('자료 목록 형식 오류');ids.add(d.id);
  const original=pack.originals[d.id];if(!original||typeof original.base64!=='string')throw new Error('원본 파일이 누락되었습니다.');
  const bytes=Uint8Array.from(atob(original.base64),c=>c.charCodeAt(0));
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  if(hash!==d.sha256)throw new Error('원본 파일 검증에 실패했습니다: '+d.name);
 }
 for(const c of pack.corpus.chunks)if(!ids.has(c.docId)||typeof c.text!=='string')throw new Error('검색 색인 형식 오류');
 return pack;
}
export async function importPersonalData(file){
 if(file.size>80*1024*1024)throw new Error('자료 파일은 80MB 이하여야 합니다.');
 const pack=await validatePack(JSON.parse(await file.text()));const db=await database();
 try{await new Promise((resolve,reject)=>{const tx=db.transaction('packs','readwrite');tx.objectStore('packs').put(pack,'active');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('저장이 취소되었습니다.'));});active=pack;}finally{db.close();}
 return pack.corpus.documents.length;
}
export async function personalRequest(path){
 if(!active)throw new Error('이 브라우저에 자료를 한 번 등록해주세요. 상단 ‘등록 자료’에서 개인용 자료 파일을 선택할 수 있습니다.');
 const url=new URL(path,'https://local.invalid/');const route=url.pathname.slice(1);const c=active.corpus;
 if(route==='documents')return Response.json({documents:c.documents,quality:c.quality});
 if(route==='search')return Response.json({...search(url.searchParams.get('q')||'',{year:Number(url.searchParams.get('year')||2026)},c),web:{status:'local',items:[],message:'개인용 모드에서는 등록된 외부 지침만 검색합니다. 실시간 외부 법령 검색과 최신성 검토는 연결되지 않았습니다.'}});
 if(route==='source'){
  const d=c.documents.find(d=>d.id===url.searchParams.get('id'));if(!d)throw new Error('원본을 찾을 수 없습니다.');
  return new Response(Uint8Array.from(atob(active.originals[d.id].base64),c=>c.charCodeAt(0)),{headers:{'Content-Type':d.file.endsWith('.pdf')?'application/pdf':'application/octet-stream'}});
 }
 throw new Error('지원하지 않는 요청입니다.');
}
