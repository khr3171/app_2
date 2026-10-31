import fs from 'node:fs';
const corpus=JSON.parse(fs.readFileSync(new URL('../data/corpus.json',import.meta.url),'utf8'));
const compact=s=>s.normalize('NFKC').toLowerCase().replace(/\s/g,'');
const synonyms={심사수당:['심사','심의','위원수당','위원회','수당'],회의수당:['회의','참석수당','위원회','수당'],강사료:['강사수당','강의','강사'],원고료:['원고','집필'],출장비:['여비','출장'],식비:['급량비','식사','식비'],연차:['연가','휴가','연차']};
const indexed=corpus.chunks.map(c=>({...c,norm:compact(c.text)}));
export const documents=corpus.documents;
export const quality=corpus.quality;
export function search(query,{year=2026,limit=12}={}){
 const q=query.trim();if(!q||q.length>200)throw new Error('검색어는 1~200자로 입력해주세요.');
 const words=q.split(/\s+/).map(w=>w.replace(/(에대해|알려줘|얼마인가요|인가요|해주세요|에대한)$/g,'')).filter(w=>w.length>1);
 const normalized=compact(q);const expanded=Object.entries(synonyms).filter(([key])=>normalized.includes(key)).flatMap(([,v])=>v);
 const hits=indexed.map(c=>{
  const doc=documents.find(d=>d.id===c.docId);if(doc.year&&doc.year!==Number(year))return null;
  if(c.ruleTitle==='규정집 표지·목차')return null;
  if(normalized.includes('심사수당')&&!(c.docId==='doc-1'&&[218,220,221,375,376].includes(c.page))&&!(c.norm.includes('심사')&&c.norm.includes('수당')))return null;
  let score=c.norm.includes(normalized)?100:0;
  if(normalized.includes('심사수당')&&c.docId==='doc-1'&&[218,220,221,375,376].includes(c.page))score+=150;
  for(const w of words){const t=compact(w);if(c.norm.includes(t))score+=25;}
  for(const w of expanded)if(c.norm.includes(w))score+=7;
  if(!score||(!c.norm.includes(normalized)&&score<14))return null;
  const terms=[normalized,...words.map(compact),...expanded];
  const direct=c.norm.includes(normalized)||words.some(w=>c.norm.includes(compact(w)));
  const {norm,...rest}=c;
  return {...rest,document:doc,score,direct,terms};
 }).filter(Boolean).sort((a,b)=>b.score-a.score);
 function unique(list){const seen=new Set();return list.filter(h=>{const k=h.docId+'-'+h.location+'-'+Math.floor(h.offset/2000);if(seen.has(k))return false;seen.add(k);return true;}).slice(0,limit);}
 const internal=unique(hits.filter(h=>h.kind==='internal').sort((a,b)=>Number(b.direct)-Number(a.direct)||b.score-a.score));
 const external=unique(hits.filter(h=>h.kind!=='internal'));
 const answer=normalized.includes('심사수당')?{
 title:'서면심사 수당은 건당 10,000원, 1회 상한 100,000원입니다.',
 scope:'위원회 서면심사 기준입니다. 대면심사·채용심사 등 모든 심사 업무의 동일 단가로 확대 적용하지 마세요.',
 facts:[{label:'기준 단가',value:'10,000원',unit:'안건 1건당'},{label:'지급 상한',value:'100,000원',unit:'위원회 서면심사 1회 기준'}],
 paragraphs:['위원회 관리 규정 제9조는 소속 임직원을 제외한 위원 및 관계 전문가에게 예산 범위에서 별표 기준으로 지급할 수 있도록 정합니다. 소관 업무와 직접 관련하여 회의에 출석하는 공무원인 위원은 제외됩니다.','같은 규정 별표 제3항은 위원회 서면심사를 1건 10,000원, 1회 최대 100,000원으로 정합니다. 별표 하단에는 규정 또는 다른 지침, 사전 계획에 따라 예산 범위에서 지급 가능하다는 주석이 있습니다.','회의수당 지급 내규 제2조 제4호는 외부 연구평가(서면심사)를 지급범위에 포함하며, 제4조 및 별표 1 제4항은 안건 1건당 10,000원, 상한 100,000원을 제시합니다. 제4조의 원장 승인 조정 규정은 개별 사안의 적용 범위를 확인해야 합니다.'],
 references:[{title:'위원회 관리 규정 제2조',page:218},{title:'위원회 관리 규정 제9조',page:220},{title:'위원회 관리 규정 별표 제3항',page:221},{title:'회의수당 지급 내규 제2조·제4조',page:375},{title:'회의수당 지급 내규 별표 1 제4항',page:376}],
 cautions:['위원회 관리 규정 제2조의 특별규정 여부, 해당 사업의 사전 계획과 예산 편성을 함께 확인하세요.','지급대상자별 산정 단위·안건 수·증빙을 확인한 후 지출결의하세요. 단순 계산 결과는 지급 승인이나 세후 실수령액이 아닙니다.','예산편성지침에서 동일 단가가 별도로 확인되지 않아도 내부기준의 적용 여부를 독립적으로 검토해야 합니다.']
 }:null;
 return {query:q,year:Number(year),internal,external,answer,total:hits.length,mode:'원문 근거 검색',missing:!internal.length,notice:'검색 우선순위는 법적 효력의 우선순위를 의미하지 않습니다. 강행법규와 직접 적용되는 상위 법령에 위반되는 내부규정은 우선 적용할 수 없습니다.'};
}
