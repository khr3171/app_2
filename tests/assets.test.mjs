import test from 'node:test';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
import {packAsset,unpackAsset,PART_BYTES,MAX_BYTES} from '../lib/private-assets.mjs';
test('Firestore parts stay below document limit and round-trip binary originals',()=>{const raw=randomBytes(PART_BYTES*2+19);const a=packAsset(raw);assert.ok(a.parts.length>=3);assert.ok(a.parts.every(p=>p.length<=PART_BYTES));assert.deepEqual(unpackAsset({...a,count:a.parts.length},a.parts),raw);});
test('corrupt or missing parts fail closed',()=>{const a=packAsset('가상 자료');const meta={...a,count:a.parts.length};assert.throws(()=>unpackAsset(meta,[]));assert.throws(()=>unpackAsset({...meta,hash:'0'.repeat(64)},a.parts));assert.throws(()=>unpackAsset({...meta,bytes:MAX_BYTES+1},a.parts));});
