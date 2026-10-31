"""Extract supplied PDF/HWP sources; never execute document contents."""
import sys, pathlib, json, re, struct, zlib, hashlib, shutil
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.python-packages'))
import olefile
from pypdf import PdfReader
SOURCE=pathlib.Path('C:/Users/user/Desktop/사서원 규정')
OUT=ROOT/'data'
OUT.mkdir(exist_ok=True)
(OUT/'originals').mkdir(exist_ok=True)
files=[('internal','★(최종)부산시사회서비스원 규정집(260929).pdf'),('guideline','2027년도 지방출자·출연기관 예산편성지침.pdf'),('guideline','2026년도 지방출자·출연기관 예산편성지침(통보).hwp'),('guideline','[부산광역시 인재개발원 전문교육과] 강사수당 및 원고료 지급기준(2025.3.6.시행).hwp'),('manual','사업비 결의서 작성 매뉴얼260127.hwp')]
docs=[]; chunks=[]
for idx,(kind,name) in enumerate(files):
 p=SOURCE/name; ident=f'doc-{idx+1}'; parts=[]
 if p.suffix=='.pdf':
  reader=PdfReader(p)
  for n,page in enumerate(reader.pages): parts.append((f'PDF {n+1}쪽',page.extract_text(extraction_mode='layout'),n+1))
 else:
  with olefile.OleFileIO(p) as ole:
   header=ole.openstream('FileHeader').read(); flags=struct.unpack_from('<I',header,36)[0]
   if flags & 2: raise ValueError('Encrypted HWP: '+name)
   sections=sorted([v for v in ole.listdir() if v[0]=='BodyText' and v[-1].startswith('Section')],key=lambda v:int(v[-1][7:]))
   for sec in sections:
    data=ole.openstream(sec).read()
    if flags&1: data=zlib.decompress(data,-15)
    pos=0; texts=[]
    while pos+4<=len(data):
     rec=struct.unpack_from('<I',data,pos)[0]; pos+=4; tag=rec&1023; size=rec>>20
     if size==4095: size=struct.unpack_from('<I',data,pos)[0]; pos+=4
     raw=data[pos:pos+size]; pos+=size
     if tag==67:
      units=list(struct.unpack('<'+'H'*(len(raw)//2),raw[:len(raw)//2*2])); cleaned=[]; j=0
      while j<len(units):
       c=units[j]
       if c in [1,2,3,4,5,6,7,8,9,11,12,14,15,16,17,18,19,20,21,22,23]:
        cleaned.append(32); j+=8
       else:
        if c>=32 or c in (10,13): cleaned.append(c)
        j+=1
      texts.append(struct.pack('<'+'H'*len(cleaned),*cleaned).decode('utf-16le','replace'))
    parts.append((f'HWP 본문 {int(sec[-1][7:])+1}', '\n'.join(texts),None))
 full='\n\n'.join(t for _,t,_ in parts)
 (OUT/(ident+'.txt')).write_text(full,encoding='utf-8')
 shutil.copy2(p,OUT/'originals'/(ident+p.suffix))
 docs.append({'id':ident,'name':name,'kind':kind,'units':len(parts),'characters':len(full),'emptyUnits':[loc for loc,t,_ in parts if len(t.strip())<30],'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'file':ident+p.suffix,'extraction':'PDF 페이지별 텍스트' if p.suffix=='.pdf' else 'HWP 본문 레코드 추출 · 표 셀 순서 원문 대조 필요','effective':'2025-03-06' if idx==3 else None,'year':2027 if idx==1 else 2026 if idx==2 else None})
 for loc,txt,page in parts:
  # Keep every extracted character; overlap preserves adjacent table context.
  for start in range(0,len(txt),1400):
   body=txt[max(0,start-250):start+1650]
   if not body.strip(): continue
   articles=re.findall(r'제\s*\d+\s*조(?:의\s*\d+)?\s*[（(][^）)\n]+[）)]',body)
   chunks.append({'id':f'{ident}-{len(chunks)+1}','docId':ident,'kind':kind,'location':loc,'page':page,'text':body,'articles':articles,'offset':start})
(OUT/'corpus.json').write_text(json.dumps({'documents':docs,'chunks':chunks},ensure_ascii=False),encoding='utf-8')
print(json.dumps({'documents':docs,'chunks':len(chunks)},ensure_ascii=False,indent=2))
