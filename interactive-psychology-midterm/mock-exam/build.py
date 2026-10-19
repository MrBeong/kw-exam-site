# -*- coding: utf-8 -*-
"""120분 기출형 예상시험 데이터 검증·오프라인 HTML·문제/해설/개념표 생성."""
from pathlib import Path
from collections import Counter
import json,re,math
B=Path(__file__).resolve().parent
E=B.parent

def build():
 assert all((E/'assets'/n).is_file() for n in ['study-math.js','study-math.css','mathjax/tex-svg-3.2.2.js'])
 qs=json.loads((B/'questions.json').read_text());meta=json.loads((B/'exam.json').read_text());cs=json.loads((E/'multiple-choice/concepts.json').read_text());ids={c['id'] for c in cs}
 assert len(qs)==250 and len({q['id'] for q in qs})==250
 covered=set()
 for q in qs:
  assert set(q['conceptIds'])<=ids and q['conceptIds'];covered.update(q['conceptIds'])
  assert q['source'] and q['prompt'] and q['originId']
  if q['type'] in ['single','multi']:
   assert len(q['options'])==4 and len({x['text'] for x in q['options']})==4 and len({x['explanation'] for x in q['options']})==4 and all(x['text'] and x['explanation'] for x in q['options'])
   n=sum(x['correct'] for x in q['options']);assert n==1 if q['type']=='single' else 1<n<4
  elif q['type']=='tf':assert len(q['statements'])==2 and all(isinstance(x['correct'],bool) and x['explanation'] for x in q['statements'])
  else:
   assert q['answer'] and q['explanation'] and q['rubric'] and q['commonMistakes']
   assert sum(r['points'] for r in q['rubric'])==q['points'] and all(r['points']>0 for r in q['rubric'])
  if q['type']=='code':
   keys=[b['id'] for b in q['codeBlanks']];assert re.findall(r'\{\{(\d+)\}\}',q['codeTemplate'])==keys
   assert re.sub(r'\{\{(\d+)\}\}',lambda m:next(b['answer'] for b in q['codeBlanks'] if b['id']==m[1]),q['codeTemplate'])==q['modelCode']
   assert all((len(l)-len(l.lstrip(' ')))%2==0 and '\t' not in l for l in q['modelCode'].splitlines())
 assert covered==ids,sorted(ids-covered)
 for n in range(1,6):
  packet=[q for q in qs if q['set']==n];assert len(packet)==50 and math.isclose(sum(q['points'] for q in packet),100) and math.isclose(sum(q['minutes'] for q in packet)+10,120)
  assert Counter(q['type'] for q in packet)==Counter(single=20,multi=6,tf=4,short=10,essay=5,code=5)
  assert set(meta['chapterNames'])<=set(q['chapter'] for q in packet)
  assert any(q.get('visual') for q in packet)
  assert Counter(next(i for i,o in enumerate(q['options']) if o['correct']) for q in packet if q['type']=='single')==Counter({0:5,1:5,2:5,3:5})
 runtime=(E/'written/app.js').read_text();renderer=runtime[runtime.index('    const blankWidth='):runtime.index('    function renderCodeQuestion')]
 replacements={'__BASE_STYLE__':(B/'base.css').read_text(),'__WRITTEN_STYLE__':(E/'written/style.css').read_text(),'__MOCK_STYLE__':(B/'style.css').read_text(),'__MOCK_DATA__':json.dumps(qs,ensure_ascii=False).replace('</','<\\/'),'__MOCK_META__':json.dumps(meta,ensure_ascii=False),'__R_RENDERER__':renderer,'__MOCK_APP__':(B/'app.js').read_text()}
 html=(B/'template.html').read_text()
 for key,val in replacements.items():html=html.replace(key,val)
 assert '__MOCK_' not in html
 (B/'index.html').write_text(html)
 names={'single':'단일선택','multi':'복수선택','tf':'O/X 진술 묶음','short':'단답형','essay':'서술·계산형','code':'R 코드 빈칸'}
 header=['# 인터랙티브심리학 중간고사 · 기출형 예상시험 5회분','','제작·검증일: 2026-10-18','','**자체 제작 예상문제다.** 실제 기출 원문을 재현한 자료가 아니다. 실제 시험은 2026-10-19(월) 18:00–20:00, 새빛관 102호, 1~6주차 전체 범위다. 공지 유형은 객관식·주관식·서술식·간단한 코드 작성이며 준비물은 연필·지우개다. 실제 문항 수·배점·계산기 허용 여부는 공지에서 확인되지 않았다.','','실제 문항 수가 없어 120분 기준으로 회당 50개 대문항·100점(5회분 총 250문항)을 설계했다. 권장 풀이 110분과 검토 10분이다. 기존 검증 은행에서 시험에 맞게 선별·재구성하고 일부 수치·사례를 변형했다. 5세트 전체에 188개 개념이 모두 대응하며 각 회차에는 7개 단원이 포함된다. 한 회차에 188개 개념 전부를 억지로 넣어 2시간 분량을 초과하지 않는다.','','단답에서 교안 영문 명칭을 요구한 부분만 영어로 답한다. 정의·이유·계산·해석은 한글·수식·단위를 사용한다. R은 실제 문법·2칸 들여쓰기·코드 빈칸 형식을 유지한다. 필요한 로그 근삿값은 문제에 제공한다.','','[웹 시험](mock-exam/index.html) · [정답·해설](14_기출형예상_정답과해설.md) · [출제 설계·개념 대응](15_기출형예상_출제설계와개념대응.md)','','| 유형 | 회당 문항 | 배점 | 권장 시간 |','|---|---:|---:|---:|']
 header += [f"| {t['label']} | {t['count']} | {t['points']} | {t['minutes']}분 |" for t in meta['blueprint']]+['| 검토 | — | — | 10분 |','']
 lines=header[:]
 for n in range(1,6):
  lines += [f'\n# {n}세트 · 120분 · 100점','']
  for q in (q for q in qs if q['set']==n):
   lines += [f"## {q['number']}번 · {names[q['type']]} · {q['points']}점",'',q['prompt'],'']
   if q.get('language'):lines += [f"답안 표기: {q['language']}",'']
   if q.get('visual'):lines += [q['visual'].replace('../assets/','assets/'),'']
   if q.get('recallBlanks'):lines += ['| 빈칸 | 답안 |','|---|---|']+[f"| {b['label']} | __________ |" for b in q['recallBlanks']]+['']
   if q.get('codeSetup'):lines += ['### 분석자료 · 준비 코드','',q.get('inputDescription', '문항 실행을 위해 사전 로드된 R 데이터 객체이다.'),'','```r',q['codeSetup'],'```','']
   if q['type'] in ['single','multi']:lines += [f"{i}. {o['text']}" for i,o in enumerate(q['options'],1)]+['']
   if q['type']=='tf':lines += [f"({'가' if i==0 else '나'}) {s['text']} — O / X" for i,s in enumerate(q['statements'])]+['']
   if q['type']=='code':
    lines += ['```r',re.sub(r'\{\{(\d+)\}\}',lambda m:'____('+m[1]+')____',q['codeTemplate']),'```','']
    if q.get('followUp'):lines += ['추가 답안: '+q['followUp'],'']
   lines += [f"[웹에서 풀기](mock-exam/index.html?set={n}&mode=practice&question={q['id']})",'']
 (E/'13_기출형예상_문제.md').write_text('\n'.join(lines)+'\n')
 lines=['# 기출형 예상시험 · 정답·상세 해설·채점 기준','','검증일: 2026-10-18','','[문제집](13_기출형예상_문제.md) · [웹 시험](mock-exam/index.html)','','객관식은 자동 채점한다. 단일선택은 정답 1개에 2점, 복수선택은 정답 집합과 정확히 일치해야 2점(부분점수 없음), O/X는 진술당 1점이다. 단답·서술·R 50점은 아래 기준으로 직접 채점한다. 제시 배점은 연습용이며 실제 교수의 배점이 아니다.','','주관식은 0.25점 단위까지 배분한 항목별 점수를 합산한다. 요구한 조건·단위·부호를 충족하면 같은 의미의 다른 표현도 인정한다. R 함수·객체·문자열은 정확히 쓰고, 제시 틀에서 같은 결과를 내는 유효한 대안은 인정한다. 코드는 실행하거나 문자열 일치로 자동 채점하지 않는다.','']
 for n in range(1,6):
  lines += [f'# {n}세트','','## 빠른 정답표','','| 번호 | 유형 | 정답 |','|---:|---|---|']
  for q in (q for q in qs if q['set']==n):
   ans=q.get('answer','') if q['type'] in ['single','multi','short'] else ' · '.join(('가' if i==0 else '나')+':'+('O' if s['correct'] else 'X') for i,s in enumerate(q['statements'])) if q['type']=='tf' else '아래 모범답안·채점 기준 참조'
   lines.append(f"| {q['number']} | {names[q['type']]} | {ans.replace('|','&#124;')} |")
  lines += ['']
  for q in (q for q in qs if q['set']==n):
   lines += [f"## {q['number']}번 · {names[q['type']]} · {q['points']}점",'',q['prompt'],'']
   if q.get('followUp'):lines += ['추가 답안: '+q['followUp'],'']
   if q['type'] in ['single','multi']:
    lines += ['정답: **'+q['answer']+'**','']
    for i,o in enumerate(q['options'],1):lines += [f"- {'✓' if o['correct'] else '×'} {i}번: {o['text']}  ",f"  해설: {o['explanation']}"]
    lines += ['', '채점: '+('정답 하나를 선택하면 1.5점, 오답·미응답 0점.' if q['type']=='single' else '정답 집합과 정확히 일치하면 2점, 일부만 선택하거나 오답을 추가하면 0점.'),'']
   elif q['type']=='tf':
    for i,s in enumerate(q['statements']):lines += [f"- ({'가' if i==0 else '나'}) **{'O' if s['correct'] else 'X'}** — {s['explanation']}"]
    lines += ['','채점: 진술별 1점, 총 2점.','']
   else:
    if q.get('codeSetup'):lines += ['### 분석자료 · 준비 코드','',q.get('inputDescription', '문항 실행을 위해 사전 로드된 R 데이터 객체이다.'),'','```r',q['codeSetup'],'```','']
    if q['type']=='code':
     lines += ['### 빈칸별 정답·해설','','| 번호 | 코드 | 이유 |','|---|---|---|']+[f"| ({b['id']}) | `{b['answer']}` | {b['explanation']} |" for b in q['codeBlanks']]+['','### 완성 코드','','```r',q['modelCode'],'```','']
    lines += ['### 모범 답안','',q['answer'],'','### 상세 해설','']+[f'{i}. {x}' for i,x in enumerate(q['explanation'],1)]+['','### 채점 기준','','| 배점 | 충족할 내용 |','|---:|---|']+[f"| {r['points']:g} | {r['criterion'].replace('|','&#124;')} |" for r in q['rubric']]+['',f"합계 **{q['points']}점**. {q['accepted']}",'','오답·감점 주의:']+['- '+x for x in q['commonMistakes']]+['']
   lines += [f"근거: {q['source']} · 재구성 원문 {q['originId']}",'개념 대응: '+', '.join(q['conceptIds']),'']
 (E/'14_기출형예상_정답과해설.md').write_text('\n'.join(lines)+'\n')
 lines=['# 기출형 예상시험 · 출제 설계와 개념 대응','','검증일: 2026-10-18','','## 공지와 설계 가정','','- 확정: 2026-10-19(월) 18~20시, 1~6주차 전체, 객관식·주관식·서술식·간단한 코드 작성, 연필·지우개. 교안 영문 명칭만 영어 답안으로 요구한다.','- 미공지: 실제 문항 수·유형별 비율·배점·계산기 허용 여부(공식 공지). 사용자는 2026-10-18 계산기 미사용을 확인했다. 50개 대문항·100점은 120분에 맞춘 자체 설계이며 확정 출제 구조라고 주장하지 않는다.','- 기존 MD의 5세트 구조를 적용했다. 총250개 대문항이며 회차 사이 동일 원문 문항을 중복 사용하지 않았다. 수치·사례 및 세부 빈칸 변형 21개를 포함한다. 검증된 선행 은행에서 선별·재구성한 출처를 originId로 추적한다.','- 회차당 7개 단원을 모두 포함한다. 무누락은 5회분 전체의 기존188개 개념 목록에 대한 대응이다. 개별 회차가188개 전부를 시험한다는 뜻이 아니다. 원본 교안 전체를 새로 재감사한 것으로 표시하지 않는다.','','## 시간·배점','','단일20분 + 복수9분 + O/X6분 + 단답15분 + 서술35분 + R25분 = 풀이110분. 검토10분을 더해120분이다. 난이도는 용어 인출·조건 판별·표/그래프 판독·연쇄 계산·한계 해석을 섞은 학부 수준이다. 실제 학생 응시로 측정한 소요시간은 아니므로 시간 배분은 권장치다.','','총점100=객관식50(30문항)+주관식50(20문항)이다. 객관식은 확정 채점, 주관식20문항은 기준 체크 후 채점 완료를 직접 확정한다. 미채점이 남으면 최종 총점으로 표시하지 않는다.','','## 단원 배분·시각 자료','','| 세트 | 대문항 | 점수 | 분 | 개념 수 | 그림·표 |','|---|---:|---:|---:|---:|---:|']
 for n in range(1,6):
  packet=[q for q in qs if q['set']==n];lines.append(f"| {n} | 50 | 100 | 120 | {len({c for q in packet for c in q['conceptIds']})} | {sum(bool(q.get('visual')) for q in packet)} |")
 lines += ['','| 단원 | 1세트 | 2세트 | 3세트 | 4세트 | 5세트 |','|---|---:|---:|---:|---:|---:|']
 for ch in meta['chapterNames']:lines.append('| '+ch+' | '+' | '.join(str(sum(q['chapter']==ch and q['set']==n for q in qs)) for n in range(1,6))+' |')
 lines += ['','## 변별력·보완 조건','','- 보기마다 정오 이유와 올바른 조건·계산을 기록했다. 단일선택의 정답 위치는 세트마다1~4번 각5회로 균등 분산했다. 복수선택은2~3개 정답을 독립적으로 판별하도록 했다.','- p값 비기각과 가설 증명, R²와 미래 정확도, 신뢰도와 타당도, 모호도와 잡음, 자극 식별과 반응 선택, ISO형 +1 위치, 표본분산 분모·단위, 회귀 잔차 부호를 구별한다.','- 혼동행렬·OLS 관측표·회귀 출력 등은 문항 전체의 입력 조건을 포괄한다. 5세트 모두 그림·표가 포함된다.','- R은 직전 단계의 Source 편집창 렌더러와 스타일을 재사용한다. 함수 인자2칸 들여쓰기·문법 색상·줄 번호·코드 빈칸을 유지한다.','- 시험 모드는7200초 종료시각을 저장해 새로고침 후에도 시간이 계속 흐른다. 제출·시간 종료 전에는 해설 UI를 제공하지 않는다. 주관식은 의미·R 실행을 자동 채점하지 않는다.','','## 188개 개념별 실제 문항 대응','','| 개념 | 주제 | 기출형 문항 | 원문 근거 |','|---|---|---|---|']
 for c in cs:
  matches=[q for q in qs if c['id'] in q['conceptIds']];assert matches
  lines.append(f"| {c['id']} | {c['chapter']} · {c['kind']} | {', '.join(q['id'] for q in matches)} | {c['source']} |")
 lines += ['','## 재생성','','`python3 mock-exam/build.py`는 데이터·회차별 유형 수·100점·120분·7단원·시각자료·188개 대응·빈칸/완성 코드 일치를 검증하고 HTML과13~15 문서를 재생성한다. R 편집창은 written/app.js와written/style.css를 가져온다. 이후 `python3 written/build.py`로 메인 두 HTML의 진입 링크를 재생성한다.','']
 (E/'15_기출형예상_출제설계와개념대응.md').write_text('\n'.join(lines)+'\n')
 audit={'questions':len(qs),'sets':5,'durationSeconds':7200,'concepts':len(covered),'missing':sorted(ids-covered),'pointsPerSet':100,'rQuestions':sum(q['type']=='code' for q in qs),'rBlanks':sum(len(q.get('codeBlanks',[])) for q in qs),'optionsExplained':sum(len(q.get('options',[])) for q in qs),'tfStatements':sum(len(q.get('statements',[])) for q in qs),'writtenRubrics':sum(len(q.get('rubric',[])) for q in qs),'variants':sum(q['variant'] for q in qs)}
 (B/'qa').mkdir(exist_ok=True);(B/'qa/data-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n');print(json.dumps(audit,ensure_ascii=False))
if __name__=='__main__':build()
