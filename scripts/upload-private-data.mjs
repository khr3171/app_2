// Spark-only workflow: no Storage, Functions, billing linkage, or paid upgrade.
import fs from 'node:fs/promises';
import {firebaseApp} from '../lib/auth.mjs';
import {getFirestore} from 'firebase-admin/firestore';
import {packAsset} from '../lib/private-assets.mjs';
const corpusBytes=await fs.readFile(new URL('../data/corpus.json',import.meta.url));
const corpus=JSON.parse(corpusBytes.toString('utf8'));
const assets=[];
for(const doc of corpus.documents){
 if(!/^doc-\d+\.(pdf|hwp)$/.test(doc.file))throw new Error('Invalid document filename');
 assets.push({name:doc.file,...packAsset(await fs.readFile(new URL('../data/originals/'+doc.file,import.meta.url)))});
}
assets.push({name:'corpus',...packAsset(corpusBytes)});
const total=assets.reduce((n,a)=>n+a.parts.reduce((m,p)=>m+p.length,0),0);
if(total>100*1024*1024)throw new Error('무료 운영 자체 제한: 등록 자료 총량 100 MiB 초과');
if(process.argv.includes('--dry-run')){
 console.log(JSON.stringify({compressedBytes:total,partDocuments:assets.reduce((n,a)=>n+a.parts.length,0),objects:assets.length}));
}else{
 if(process.env.FIREBASE_SPARK_CONFIRMED!=='true')throw new Error('콘솔에서 결제 미연결 Spark 상태를 확인한 후 FIREBASE_SPARK_CONFIRMED=true로 실행하세요. 이 값은 클라우드 결제 상태를 자동 검증하지 않습니다.');
 const database=getFirestore(await firebaseApp());const manifest={originals:{},updatedAt:new Date().toISOString()};
 for(const asset of assets){
  for(let start=0;start<asset.parts.length;start+=10){
   const batch=database.batch();
   for(let i=start;i<Math.min(start+10,asset.parts.length);i++)batch.set(database.doc(`privateAssets/${asset.hash}/parts/${String(i).padStart(4,'0')}`),{payload:asset.parts[i]});
   await batch.commit();
  }
  const meta={hash:asset.hash,bytes:asset.bytes,count:asset.parts.length};
  if(asset.name==='corpus')manifest.corpus=meta;else manifest.originals[asset.name]=meta;
 }
 // Switch active data only after all immutable parts have been uploaded successfully.
 await database.doc('privateData/current').set(manifest);
 console.log('Private Firestore data uploaded. No Storage bucket or billing setting changed.');
}
