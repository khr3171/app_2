import test from 'node:test';
import assert from 'node:assert/strict';
import {search} from '../lib/search.mjs';
import handler from '../api/index.mjs';
const corpus={documents:[{id:'a',kind:'internal'},{id:'b',kind:'guideline',year:2026},{id:'c',kind:'guideline',year:2027}],chunks:[{id:'1',docId:'a',kind:'internal',text:'가상테스트 항목 규정',location:'시험 1',offset:0},{id:'2',docId:'b',kind:'guideline',text:'가상테스트 항목 지침',location:'시험 2',offset:0},{id:'3',docId:'c',kind:'guideline',text:'가상테스트 항목 지침',location:'시험 3',offset:0}]};
test('public fixture separates internal and fiscal guidance',()=>{for(const year of [2026,2027]){const r=search('가상테스트',{year},corpus);assert.equal(r.internal[0].docId,'a');assert.equal(r.external.length,1);assert.equal(r.external[0].document.year,year);assert.equal(r.answer,null);}});
test('server config can load without any private corpus file',async()=>{const response={setHeader(){},end(body){this.body=JSON.parse(body);}};await handler({url:'/api/config',method:'GET',headers:{}},response);assert.equal(response.statusCode,200);assert.ok(!('documents' in response.body));});
