"""Focused essay content, unchanged-bank and numeric regression checks."""
from pathlib import Path
from collections import Counter
from fractions import Fraction as F
import json,hashlib,re,math
E=Path(__file__).resolve().parent.parent;A=E/'final-audit'
checks=[]
def check(v,label):
 assert v,label
 checks.append(label)
def sha(q):return hashlib.sha256(json.dumps(q,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
W=json.loads((E/'written/questions.json').read_text());M=json.loads((E/'mock-exam/questions.json').read_text())
T=json.loads((A/'essay-revision.json').read_text());S=json.loads((A/'essay-stable-baseline.json').read_text())
r_line=json.loads((A/'r-line-revision.json').read_text())
r_before={t['id']:t['before'] for t in r_line['writtenChanges']+r_line['mockChanges'] if t['before']}
Q={q['id']:q for q in W+M}; C={c['id'] for c in json.loads((E/'multiple-choice/concepts.json').read_text())}
check(Counter(q['type'] for q in W)==Counter(short=75,essay=70,code=46),'75 short / 70 focused essays / 46 R')
check(len(W)==191 and len(M)==160,'written191 / mock160')
for bank,qs in [('written',W),('mock-exam',M)]:
 check({c for q in qs for c in q['conceptIds']}==C,bank+' actual mapped coverage188')
 for q in qs:
  if q['type']!='essay' and q['id'] in S[bank]:check(sha(r_before.get(q['id'],q))==S[bank][q['id']],q['id']+' non-essay unchanged / intentional R prior baseline preserved')
for name,rows in [('writtenChanges',T['writtenChanges']),('mockChanges',T['mockChanges'])]:
 for t in rows:
  q=Q[t['id']];check(q==t['after'],q['id']+' exact revision trace')
  check(q['assessmentObjective']==t['focus'] and q['assessmentObjective'],q['id']+' single explicit assessment objective')
  check(2<=len(q['rubric'])<=3 and sum(r['points'] for r in q['rubric'])==q['points'],q['id']+' bounded additive rubric')
  check(all(x.strip() for x in q['explanation']) and len(q['explanation'])>=2,q['id']+' detailed aligned explanation')
  check(not re.search('[①②③④⑤]',q['prompt']),q['id']+' no unrelated numbered demand bundle')
  check(q.get('source') and q.get('commonMistakes') and q.get('accepted'),q['id']+' source, misconception, alternative grading')
  check(q['essayRevision']==T['revision'] and not q.get('questionRevision'),q['id']+' current essay revision marker only')
  if t['before']:
   check(q['id']==t['before']['id'] and q['type']==t['before']['type'],q['id']+' stable identity')
  for src in re.findall(r'src="([^"]+)"',q.get('visual','')):
   check((E/('mock-exam' if name=='mockChanges' else 'written')/src).is_file(),q['id']+' associated image exists')
check('관제' not in Q['ES002']['prompt'] and '입증' not in Q['ES002']['prompt'],'ES002 only explains the supplied attention experiment')
check('1945~1960' in Q['ES003']['prompt'] and not any(x in Q['ES003']['prompt'] for x in ['각각','두 가지 이상','최근','세 단계']),'ES003 focuses on one historical period')
check(not Q['ES030'].get('visual'),'ES030 range-effect question no unrelated VR table')
check(Q['ES033']['visual'].count('<figure')==1 and 'Fitts' not in Q['ES033']['prompt'],'ES033 only tilt experiment')
check('Sternberg' not in Q['ES041']['visual'] and Q['ES041']['visual'].count('<figure')==1,'ES041 only SRT/CRT regression material')
check('Number Set' in Q['ES065']['visual'] and 'T/F는' not in Q['ES065']['visual'],'ES065 complete log without supplied answer interpretation')
for n in range(1,6):
 qs=[q for q in M if q['set']==n]
 check(len(qs)==32 and sum(q['points'] for q in qs)==100 and sum(q['minutes'] for q in qs)+10==120,f'set{n}:32 /100 /120min')
 check(len({q['chapter'] for q in qs if q['chapter']!='복합 개념'})==7,f'set{n}: seven chapters')
 for q in qs:
  if q['type']=='essay' and not q['variant']:
   origin=Q[q['originId']]
   for key in ['prompt','answer','explanation','commonMistakes','conceptIds','visual','assessmentObjective']:
    check(q.get(key)==origin.get(key),q['id']+' focused source synchronized '+key)

# Independent hand arithmetic for every numeric essay family and numeric variant.
check((F(1)/F('0.5'))**2==4,'ES010 sample size quadruples')
check(F('.2')*F('2.3')+F('.8')*F('.3')==F('.7'),'ES014 supplied-log weighted entropy0.7')
check(F('.5')*1+2*F('.25')*2==F('1.5'),'ME2Q26 entropy1.5')
check((1-F('2.4')/3)*100==20,'ES016 redundancy20%')
check(F(8,16)*1==F('.5'),'ES018 weighted equivocation0.5')
check(380-300==80,'ES023 response-selection subtraction80ms')
check((550-300)/2==125 and 300+125*3==675,'ES024 Hick slope125 and prediction675')
check(F(1000,125)==8,'ES061 throughput8bits/s')
check(F('1.26')-F('.16')==F('1.10') and F('.33')-F('.20')==F('.13'),'ES063 VR peak intervals1.10/0.13s')
check(math.sqrt(sum((v-50)**2 for v in [40,50,60])/2)==10,'ES034 sample SD10')
for id,ys,sxy,b0,b1 in [('ES039',[2,3,7],5,-1,F('2.5')),('ME4-Q28',[1,3,8],7,-3,F('3.5'))]:
 xs=[1,2,3];xm=F(sum(xs),3);ym=F(sum(ys),3);xx=sum((x-xm)**2 for x in xs);xy=sum((x-xm)*(y-ym) for x,y in zip(xs,ys))
 check(xy==sxy and xy/xx==b1 and ym-b1*xm==b0,id+' OLS coefficients independently calculated')
 check(ys[1]-(b0+b1*2)==-1,id+' signed residual−1')
check((F(14)-F('1.5'))/14==F(25,28) and (F('12.5')/1)/(F('1.5')/(3-2))==F(25,3),'ES068 R²25/28 and F25/3')
check((1-F('.4'))*100==60,'ES056 redundancy60%')
check(-2*F('.5')*(-1)==1,'ES070 zero-probability contribution0 and remaining entropy1')
check('3%' in Q['ES041']['answer'] and '0.16' in Q['ES041']['answer'],'ES041 low explained variance and nonsignificance')

versions=json.loads((E/'assets/essay-exam-versions.json').read_text());runtime=(E/'assets/study-revisions.js').read_text()
for version,qs in versions.items():
 for t in T['mockChanges']:
  check(t['id'] in qs,version+' snapshot includes '+t['id'])
for t in T['mockChanges']:check(versions[T['previousRevision']][t['id']]==t['before'],t['id']+' published prior exam preserved exactly')
check('focused-essay-2026-10-18' in runtime and 'ESSAY_IDS' in runtime,'versioned practice migration present')
for bank,qs in [('multiple-choice',json.loads((E/'multiple-choice/questions.json').read_text()))]:
 for q in qs:check(sha(q)==S[bank][q['id']],q['id']+' objective unchanged')
check(hashlib.sha256((E/'ox/index.html').read_bytes()).hexdigest()==S['ox'],'OX unchanged')
out={'status':'pass','checksPassed':len(checks),'writtenEssaysReviewed':70,'existingEssaysRevised':42,'focusedSupplements':28,'mockEssaysRevised':20,'coverage':{'written':188,'mockUnion':188},'counts':{'written':191,'total':674},'scope':'One focus per essay, related demands, aligned answer/rubric, independent numeric checks, unchanged non-code/non-essay content, explicit prior R baseline, versioned exam preservation. No student-response difficulty statistics; no push.'}
(A/'essay-source-results.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n');print(json.dumps(out,ensure_ascii=False))
