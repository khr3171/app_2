import json,re,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
p=ROOT/'data/corpus.json';c=json.loads(p.read_text(encoding='utf8'))
t=(ROOT/'data/doc-1.txt').read_text(encoding='utf8')
toc=[]
for line in t[:16000].splitlines():
 m=re.match(r'^\s*\d+\.\s*(.+?)\s+-[-\s]+(\d+)\s*$',line)
 if m:toc.append((int(m[2]),re.sub(r'\s+',' ',m[1]).strip()))
toc.sort()
for x in c['chunks']:
 if x['docId']=='doc-1':
  page=x['page']-8
  names=[name for start,name in toc if start<=page]
  x['ruleTitle']=names[-1] if names else '규정집 표지·목차'
  x['printedPage']=page if page>0 else None
  # Ordinance included in the compilation is external legislation, not an internal rule.
  if '조례' in x['ruleTitle']: x['kind']='legislation'
  if x['ruleTitle']=='위원회 관리 규정':x['effective']='2024-05-31'
  if x['ruleTitle']=='회의수당 지급 내규':x['effective']='시행일 원문 부칙 확인 · 최종 개정 2024-06-11'
c['toc']=[{'page':p,'title':n} for p,n in toc]
c['quality']={'status':'검수 진행 필요','notes':['PDF 768쪽과 HWP 본문 4개 구역을 텍스트 추출했습니다.','이미지·스캔·표 병합 셀의 의미는 텍스트만으로 완전 검증되지 않았습니다.','사업비 결의서 매뉴얼의 화면 캡처는 원본 HWP에서 확인해야 합니다.','규정집 수록 조례는 내부규정과 구분합니다.','시행일 미확인 자료는 검색 결과에서 원문 확인 필요로 표시합니다.']}
p.write_text(json.dumps(c,ensure_ascii=False),encoding='utf8')
print('TOC entries:',len(toc))
