import {search,documents,quality} from '../lib/search.mjs';
import {authorize,localOnly} from '../lib/auth.mjs';
import {externalSearch} from '../lib/external.mjs';
import fs from 'node:fs';
const send=(res,status,data)=>{res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.end(JSON.stringify(data));};
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 const url=new URL(req.url,'http://localhost');const route=url.searchParams.get('route')||url.pathname.replace('/api/','');
 try{
 if(req.method!=='GET')return send(res,405,{error:'허용되지 않는 요청입니다.'});
 if(route==='config')return send(res,200,{local:localOnly(req),firebase:JSON.parse(process.env.FIREBASE_WEB_CONFIG||'null'),externalConnected:Boolean(process.env.TAVILY_API_KEY)});
 await authorize(req);
 if(route==='documents')return send(res,200,{documents,quality});
 if(route==='search'){
 const year=Number(url.searchParams.get('year')||2026);if(![2026,2027].includes(year))return send(res,400,{error:'지원하지 않는 기준연도입니다.'});
 const q=url.searchParams.get('q')||'';if(!q.trim()||q.length>200)return send(res,400,{error:'검색어는 1~200자로 입력해주세요.'});
 const result=search(q,{year});result.web=await externalSearch(q);return send(res,200,result);
 }
 if(route==='source'){
 const doc=documents.find(d=>d.id===url.searchParams.get('id'));if(!doc)return send(res,404,{error:'자료를 찾을 수 없습니다.'});
 res.setHeader('Content-Type',doc.file.endsWith('.pdf')?'application/pdf':'application/octet-stream');
 res.setHeader('Content-Disposition',`inline; filename="${doc.file}"; filename*=UTF-8''${encodeURIComponent(doc.name)}`);
 return res.end(fs.readFileSync(new URL('../data/originals/'+doc.file,import.meta.url)));
 }
 return send(res,404,{error:'요청을 찾을 수 없습니다.'});
 }catch(e){return send(res,e.status||500,{error:e.status?e.message:'처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'});}
}
