"""Lecture-style R input and full-line construction audit (native execution required)."""
from pathlib import Path
from collections import Counter
import json,re,hashlib
E=Path(__file__).resolve().parent.parent;A=E/'final-audit'
W=json.loads((E/'written/questions.json').read_text());M=json.loads((E/'mock-exam/questions.json').read_text())
T=json.loads((A/'r-line-revision.json').read_text());X=json.loads((A/'r-execution/results.json').read_text());Q={q['id']:q for q in W+M};checks=[]
def check(v,label):
 assert v,label
 checks.append(label)
def sha(q):return hashlib.sha256(json.dumps(q,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
check(len(W)==191 and len(M)==160,'191 written and160 mock')
check(Counter(q['type'] for q in W)==Counter(short=75,essay=70,code=46),'written type inventory')
check([q['id'] for q in W if q.get('codeMode')=='line']==[f'RC{i:03}' for i in range(21,47)],'26 stable new full-line IDs')
check(sum(q.get('codeMode')=='line' for q in M)==10,'ten timed full-line questions')
check(X['questions']==X['passed']==66 and X['blanks']==125,'all66 code questions and125 input fields executed in actual R')
native={r['id']:r for r in X['results']}
for t in T['writtenChanges']+T['mockChanges']:
 q=Q[t['id']];check(q==t['after'],q['id']+' complete current trace')
 check(q['codeRevision']==T['revision'] and q['codeMode'] in ['blank','line'],q['id']+' explicit input mode and revision')
 check(sum(r['points'] for r in q['rubric'])==q['points'],q['id']+' scoring sums to total')
 filled=re.sub(r'\{\{(\d+)\}\}',lambda m:next(b['answer'] for b in q['codeBlanks'] if b['id']==m[1]),q['codeTemplate'])
 check(filled==q['modelCode'],q['id']+' completed input equals executable model')
 check(native[q['id']]['status']=='pass' and native[q['id']]['codeSha256']==hashlib.sha256(filled.encode()).hexdigest(),q['id']+' current answer actually executed')
 check(native[q['id']]['setupSha256']==hashlib.sha256(q.get('codeSetup','').encode()).hexdigest(),q['id']+' executed data equal visible problem data')
 lines=[(i+1,l) for i,l in enumerate(q['modelCode'].splitlines()) if l.strip()]
 check([(x['line'],x['code']) for x in q['lineExplanations']]==lines,q['id']+' every code line has matching explanation')
 check(all(len(x['explanation'])>15 for x in q['lineExplanations']),q['id']+' substantive line-by-line explanation')
 check(not any(l.lstrip().startswith('>') for l in q['modelCode'].splitlines()),q['id']+' console prompt excluded from executable code')
 if q['codeMode']=='line':
  check(q['codeTemplate']=='{{1}}' and len(q['codeBlanks'])==1 and '\n' not in q['modelCode'],q['id']+' entire one-line expression is hidden, not function fragments')
  check(q['targetResult'] and '한 줄 전체' in q['prompt'],q['id']+' clear desired result and whole-line request')
  check('lineValidation' in q and native[q['id']]['metrics']['targetKind']==q['lineValidation']['kind'],q['id']+' intended operation verified')
 if t['before'] and q['id'].startswith('ME'):
  for k in ['set','number','minutes','points']:check(q[k]==t['before'][k],q['id']+' stable exam '+k)

def norm(s):return re.sub(r'\s+','',s)
check(norm(Q['RC010']['modelCode'])=='t.test(data=datat,height~group,var.equal=TRUE)','lecture data-first pooled t-test')
check(Q['RC011']['modelCode'].splitlines()==['datadiff = datat2$after - datat2$before','shapiro.test(datadiff)','t.test(datadiff)'],'lecture paired difference workflow including implicit mu0')
check('datat[datat$group' in Q['RC036']['modelCode'] and 'mu = 150' in Q['RC036']['modelCode'],'one-sample selection matches blue lecture input')
check('mu = 160' in Q['ME1-Q30']['modelCode'] and '160' in ''.join(Q['ME1-Q30']['explanation']) and '150' not in ''.join(Q['ME1-Q30']['explanation']),'full-line variant explanation and reference mean agree')
check('location = "mean"' in Q['RC038']['modelCode'],'Levene mean is quoted string')
check('sort(' in Q['RC023']['modelCode'] and Q['RC023']['modelCode'].endswith('[3]'),'third-order statistic from actual blue input is covered')
for n in range(1,6):
 qs=[q for q in M if q['set']==n]
 check(len(qs)==32 and sum(q['points'] for q in qs)==100 and sum(q['minutes'] for q in qs)+10==120,f'set{n} 32/100/120')
 check(sum(q['type']=='code' for q in qs)==4 and any(q.get('codeMode')=='line' for q in qs),f'set{n} four codes with whole-line practice')
 for q in qs:
  if q['type']=='code' and not q['variant']:
   src=Q[q['originId']]
   for k in ['prompt','modelCode','codeSetup','codeBlanks','lineExplanations','targetResult','codeMode']:
    check(q.get(k)==src.get(k),q['id']+' source synchronized '+k)
ids={c['id'] for c in json.loads((E/'multiple-choice/concepts.json').read_text())}
for b,qs in [('written',W),('mock',M)]:check({c for q in qs for c in q['conceptIds']}==ids,b+' 188/188 concept groups')
# Explicit stable hashes for every unaffected essay, short, objective and OX item.
S=json.loads((A/'r-line-stable-baseline.json').read_text())
for b,qs in [('written',W),('mock-exam',M)]:
 for q in qs:
  if q['type']!='code':check(sha(q)==S[b][q['id']],q['id']+' unrelated content preserved')
for q in json.loads((E/'multiple-choice/questions.json').read_text()):check(sha(q)==S['multiple-choice'][q['id']],q['id']+' choices unchanged')
check(hashlib.sha256((E/'ox/index.html').read_bytes()).hexdigest()==S['ox'],'OX unchanged')
versions=json.loads((E/'assets/r-line-exam-versions.json').read_text())
for t in T['mockChanges']:check(versions[T['previousRevision']][t['id']]==t['before'],t['id']+' previous focused-version exam snapshot exact')
check((E/'04_정답과_해설.md').read_text().count('### 코드 한 문장씩 해설')==46 and (E/'14_기출형예상_정답과해설.md').read_text().count('### 코드 한 문장씩 해설')==20,'written and mock MD contain every statement explanation')
check(set(versions)=={'unversioned','hand-calc-2026-10-18','midterm-review-2026-10-18','focused-essay-2026-10-18'},'all four earlier exam versions retained')
out={'status':'pass','checksPassed':len(checks),'newWholeLine':26,'writtenR':46,'mockR':20,'mockWholeLine':10,'RExecuted':66,'RExecutionChecks':X['checks'],'codeInputFields':125,'partialBlankFields':89,'wholeLineFields':36,'writtenCount':191,'totalQuestions':674,'coverage':188,'scope':'Lecture blue input syntax/one statement per call, full-line target construction, per-line explanation, native R, scoring, unchanged non-code content and previous exam snapshots. No push.'}
(A/'r-line-source-results.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out,ensure_ascii=False))
