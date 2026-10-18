# -*- coding: utf-8 -*-
"""단답·서술·R 코드 은행 검증 및 메인 HTML/문제·해설 MD 재생성."""
from pathlib import Path
from collections import Counter
import json,re
BASE=Path(__file__).resolve().parent
EXAM=BASE.parent

def build():
 assert all((EXAM/'assets'/n).is_file() for n in ['study-math.js','study-math.css','mathjax/tex-svg-3.2.2.js'])
 questions=json.loads((BASE/'questions.json').read_text());concepts=json.loads((EXAM/'multiple-choice/concepts.json').read_text());terms=json.loads((BASE/'english-terms.json').read_text());ids={c['id'] for c in concepts};covered=set()
 assert len({q['id'] for q in questions})==len(questions)
 for q in questions:
  assert q['type'] in ['short','essay','code'] and q['prompt'] and q['answer']
  assert q['explanation'] and q['commonMistakes'] and q['rubric']
  assert q['points']==sum(r['points'] for r in q['rubric']) and all(r['points']>0 for r in q['rubric'])
  assert set(q['conceptIds'])<=ids and q['conceptIds'];covered.update(q['conceptIds'])
  assert all(t in {x['term'] for x in terms} for t in q['englishTerms'])
  if q['type']=='code':
   assert q.get('modelCode') and q.get('codeTemplate') and q.get('codeBlanks')
   if q.get('codeSetup'):assert q.get('inputDescription') and '{{' not in q['codeSetup']
   blanks=q['codeBlanks'];keys=[b['id'] for b in blanks]
   assert keys==[str(i) for i in range(1,len(blanks)+1)]
   assert re.findall(r'\{\{(\d+)\}\}',q['codeTemplate'])==keys
   assert all(b['answer'].strip() and b['explanation'].strip() for b in blanks)
   completed=re.sub(r'\{\{(\d+)\}\}',lambda m:next(b['answer'] for b in blanks if b['id']==m[1]),q['codeTemplate'])
   assert completed==q['modelCode'] and '{{' not in completed
   assert '빈칸' in q['prompt']

 assert covered==ids,sorted(ids-covered)
 assert all(t['sources'] for t in terms)
 html=(BASE/'main-template.html').read_text()
 html=re.sub(r'(<style id="writtenStyles">)[\s\S]*?(</style>)',lambda m:m[1]+'\n'+(BASE/'style.css').read_text()+'\n'+m[2],html,count=1)
 html=re.sub(r'/\* WRITTEN_RUNTIME_START \*/[\s\S]*?/\* WRITTEN_RUNTIME_END \*/',lambda m:'/* WRITTEN_RUNTIME_START */\n'+(BASE/'app.js').read_text()+'\n    /* WRITTEN_RUNTIME_END */',html,count=1)
 a=html.index('<section id="problems"');b=html.index('<section id="mistakes"',a);html=html[:a]+(BASE/'section.html').read_text()+'\n\n      '+html[b:]
 html=html.replace('__WRITTEN_DATA__',json.dumps(questions,ensure_ascii=False).replace('</','<\\/')).replace('__WRITTEN_CONCEPTS__',json.dumps(concepts,ensure_ascii=False))
 assert '__WRITTEN_' not in html
 (EXAM/'index.html').write_text(html);(EXAM/'인터랙티브심리학_중간고사_Notion.html').write_text(html)
 counts=Counter(q['type'] for q in questions);types={'short':'단답형','essay':'서술형','code':'R 코드 작성'}
 lines=['# 인터랙티브심리학 중간고사 · 단답형·서술형·R 코드 작성 문제','', '작성·검증일: 2026-10-18','',f"총 {len(questions)}문항: 단답형 {counts['short']} · 서술형 {counts['essay']} · R 코드 {counts['code']}.",'','1~6주차에 대해 기존 OX001–OX188 개념 목록과 대조한 자체 제작 문제은행이다. 이 전체 분량을 120분 실제 시험 한 회분으로 간주하지 않는다. 기출형 예상시험은 별도 120분·32문항·100점의 5회분으로 제공한다.','', '**답안 언어:** 교안에 영어로 제시한 용어의 명칭을 요구한 부분만 영문으로 쓴다. 정의·이유·계산·해석을 억지로 영어로 번역하지 않는다. 한글 명칭을 인정하는 문항은 문제에 표시했다. R 문법·함수·객체명은 제시 조건대로 작성한다.','', '**R 문항:** 실제 R 코드의 번호별 빈칸에 들어갈 코드를 작성한다. 출력·해석을 추가로 요구하는 경우 별도 답안에 작성한다. 빈칸별 해설과 완성 코드는 정답 문서에서 확인한다.','', '**풀이:** 모범답안은 [04_정답과_해설.md](04_정답과_해설.md)에 분리했다. 웹에서는 답안을 먼저 작성한 뒤 정답·채점 기준을 열고 항목별 부분점수와 이해도를 직접 체크한다.','']
 for q in questions:
  lines += [f"## {q['id']} · {types[q['type']]} · {q['chapter']} · {q['points']}점",'',q['prompt'],'',f"답안 표기: {q['language']}",'']
  if q.get('visual'):lines += [q['visual'].replace('../assets/','assets/'),'']
  if q.get('recallBlanks'):lines += ['| 빈칸 | 답안 |','|---|---|']+[f"| {b['label']} | __________ |" for b in q['recallBlanks']]+['']
  if q.get('codeSetup'):lines += ['### 분석자료 · 준비 코드','',q['inputDescription'],'','```r',q['codeSetup'],'```','']
  if q['type']=='code':
   lines += ['```r',re.sub(r'\{\{(\d+)\}\}',lambda m:'____('+m[1]+')____',q['codeTemplate']),'```','']
   if q['followUp']:lines += ['추가 답안: '+q['followUp'],'']
  lines += [f"[웹에서 이 문항 풀기](index.html?view=problems&question={q['id']})",'']
 (EXAM/'03_예상문제.md').write_text('\n'.join(lines)+'\n')
 lines=['# 단답형·서술형·R 코드 작성 · 모범답안·상세 해설·채점 기준','', '작성·검증일: 2026-10-18','', '[문제집](03_예상문제.md) · [개념 대응표](10_서술단답_R_개념대응표.md) · [교안 영문 용어 기준](11_강의영문용어_작성기준.md)','', '채점은 연습용 기준이다. 항목별 점수를 합산하며 요구한 수식·단위·조건의 누락만 해당 항목에서 감점한다. 표현이 달라도 핵심 의미가 같으면 인정한다. R 코드는 대입 기호·인자 순서·동등한 부분집합 선택 등 유효한 대안을 인정하며 문자열 단순 일치로 판정하지 않는다.','']
 for q in questions:
  lines += [f"## {q['id']} · {types[q['type']]} · {q['points']}점",'',q['prompt'],'','### 모범답안','']
  if q['type']=='code':
   if q['followUp']:lines += ['추가 답안: '+q['followUp'],'']
   if q.get('codeSetup'):lines += ['### 분석자료 · 준비 코드','',q['inputDescription'],'','```r',q['codeSetup'],'```','']
   lines += ['### 빈칸별 정답·해설','','| 빈칸 | 들어갈 코드 | 해설 |','|---|---|---|']
   lines += [f"| ({b['id']}) | `{b['answer']}` | {b['explanation']} |" for b in q['codeBlanks']]
   lines += ['','### 완성 코드','']
  if q.get('modelCode'):lines += ['```r',q['modelCode'],'```','']
  lines += [q['answer'],'','### 상세 해설','']+[f'{i}. {t}' for i,t in enumerate(q['explanation'],1)]+['','### 채점 기준','', '| 배점 | 충족할 내용 |','|---:|---|']
  lines += [f"| {r['points']} | {r['criterion'].replace('|','&#124;')} |" for r in q['rubric']]
  lines += ['',f"합계 **{q['points']}점**. {q['accepted']}",'']
  if q['englishTerms']:lines += ['요구된 교안 영문 용어: '+', '.join(q['englishTerms'])+'. 일반 대소문자·하이픈/공백 차이는 의미가 같으면 인정한다. 코드의 대소문자 오류는 실행 결과에 따라 감점한다.','']
  lines += ['### 오답·감점 주의','']+['- '+t for t in q['commonMistakes']]+['',f"근거: {q['source']}  ",'개념 대응: '+', '.join(q['conceptIds']),'']
 (EXAM/'04_정답과_해설.md').write_text('\n'.join(lines)+'\n')
 lines=['# 단답·서술·R 코드 작성 · 개념 대응 및 제작 기준','', '검증일: 2026-10-18','', f"기존 188개 원자 개념 중 {len(covered)}개 대응, 누락 {len(ids-covered)}개. 총 {len(questions)}문항. 원본 전체에 대한 새 전수 감사를 의미하지 않으며 기존 목록을 기준으로 지문·답안·해설을 대조했다.",'','| 단원 | 단답 | 서술 | R 코드 | 합계 |','|---|---:|---:|---:|---:|']
 for c in dict.fromkeys(c['chapter'] for c in concepts):
  n=Counter(q['type'] for q in questions if q['chapter']==c);lines.append(f"| {c} | {n['short']} | {n['essay']} | {n['code']} | {sum(n.values())} |")
 lines += ['','## 출제·채점 방향','', '- 단답은 영문 명칭·R 표기·수치·단위·공식의 직접 인출을 평가한다. 기존 188개 개념군의 세부 표·그림·옵션도 별도 빈칸으로 점검한다. 새 빈칸별 근거는 final-audit/detail-recall-objectives.json에 기록하며, 큰 개념 ID 대응만으로 세부 인출 평가까지 완료됐다고 보지 않는다. 한글 설명을 임의로 영어 용어화하지 않는다.','- 서술은 사례→개념 판별→근거→조건·한계의 순서로 평가한다. 단순 정의 나열만으로 적용·한계 항목의 점수를 주지 않는다.','- 계산은 로그 변환, 분모·자유도, 단위 환산, 잔차 부호, 표본 수 올림 등 실제 오개념이 드러나도록 구성했다.','- R 코드 20문항은 실제 R 구문 속 번호별 빈칸 61개에 코드를 입력하는 형식이다. 함수·인자·조건식·포뮬러를 강의 수준에서 묻고 출력·해석은 별도 답안으로 받는다. 정답은 빈칸별 해설·완성 코드·부분점수 기준으로 제공한다. 실제 R 스크립트의 다중 행 함수 호출에 2칸 들여쓰기를 적용하고 웹에서는 줄 번호·문법 색상이 있는 Source 편집창으로 표시한다. 분석에 필요한 열 정의·입력 자료는 제공하되, RC017·RC018에서 채우도록 한 함수명·식은 지문에 미리 쓰지 않는다.','- 모든 문항에 모범답안·상세 해설·오류 분석·합산 가능한 배점 기준이 있다. 자기채점이며 의미 이해나 코드 실행을 자동 판정한다고 표시하지 않는다.',f"- 문제 전체 조건을 묶은 그림·표 {sum('visual' in q for q in questions)}개를 수록했다.",'','## 원문 대조와 조건 보완','', '- 손잡이 보충논문 원문의 네 번째 단계명은 “제품 설계 적용”이다. 기존 요약의 “시제품 평가”와 구분해 ES006에서 적용 후 평가의 관계를 설명했다. 보충논문의 특정 세부 항목이 실제 출제된다고 단정하지 않는다.','- 내부/외부 타당도는 교안 Validity 제목 아래 Internal/External 표기를 연결했다. 정보처리 도식의 단어는 다단·줄바꿈을 복원했으며 임의의 영문 번역을 만들지 않았다.','- Sternberg 도식의 설명과 모든 탐색의 보편 결론, 시각적 현저성과 Shannon 엔트로피, 비기각과 증명, R²와 미래 정확도를 구별했다.','- 원본의 코 pressure(N)는 힘 단위임을 함께 적었다. 생리 단계의 주어진 숫자 합150~170 ms와 교안 대표 범위150~180 ms도 구별했다.','', '## 개념별 대응','', '| 개념 | 주제 | 문항 |','|---|---|---|']
 for c in concepts:lines.append(f"| {c['id']} | {c['chapter']} · {c['kind']} | {', '.join(q['id'] for q in questions if c['id'] in q['conceptIds'])} |")
 lines += ['', '## 재생성','', '`python3 written/build.py`를 중간 시험대비 폴더에서 실행한다. questions.json·english-terms.json·section.html·app.js·style.css가 원본이며 메인 두 HTML과 03·04·10·11 문서를 재생성한다. 이전 30문항의 03·04 문서는 written/archive에 보관했다.','']
 (EXAM/'10_서술단답_R_개념대응표.md').write_text('\n'.join(lines))
 lines=['# 교안 영문 용어와 답안 언어 기준','', '기준일: 2026-10-18 · 사용자 최신 지시 반영','', '**강의자료에서 영어로 쓴 용어를 영어로 쓰라는 의미다.** 설명·계산까지 영어로 바꾸거나 한글 개념을 임의로 영문화하지 않는다. 문제의 “교안 영문 명칭” 부분만 아래 근거 표기를 요구한다. 기타 단답은 한글·수식·단위를 허용하고 R 문법은 실행 가능한 표기로 쓴다.','', f'영문 용어 {len(terms)}개의 교안 페이지 근거를 확인했다. 대소문자·일반 하이픈·공백은 의미가 같으면 인정하되 철자로 다른 용어가 되면 감점한다. R 함수·객체·문자열의 철자와 대소문자는 실행에 영향을 준다.','', '| 요구 용어 | 교안·페이지 근거 |','|---|---|']
 for t in terms:
  refs=t['sources'][:3];lines.append('| '+t['term']+' | '+'; '.join(x['file']+' p.'+x['page']+(' — '+x.get('note','') if x.get('note') else '') for x in refs)+' |')
 (EXAM/'11_강의영문용어_작성기준.md').write_text('\n'.join(lines)+'\n')
 (BASE/'index.html').write_text('<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=../index.html?view=problems"><title>단답형·서술형·R 코드 작성</title><a href="../index.html?view=problems">단답형·서술형·R 코드 작성 문제 열기</a></html>')
 print(json.dumps({'questions':len(questions),'types':dict(counts),'concepts':len(covered),'missing':sorted(ids-covered),'points':sum(q['points'] for q in questions),'rubricItems':sum(len(q['rubric']) for q in questions),'codeBlanks':sum(len(q.get('codeBlanks',[])) for q in questions),'englishTerms':len(terms)},ensure_ascii=False))
if __name__=='__main__':build()
