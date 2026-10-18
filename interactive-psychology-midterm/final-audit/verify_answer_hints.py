"""Regression checks for answer-bearing hints; content correctness is audited separately.
Run: python3 final-audit/verify_answer_hints.py [exam-root]
"""
from pathlib import Path
import json,re,sys
E=Path(sys.argv[1]).resolve() if len(sys.argv)>1 else Path(__file__).resolve().parent.parent
B={b:json.loads((E/b/'questions.json').read_text()) for b in ['written','multiple-choice','mock-exam']}
W={q['id']:q for q in B['written']};C={q['id']:q for q in B['multiple-choice']}
checks=[];failures=[]
def check(value,label):
 (checks if value else failures).append(label)
def shown(q):return q.get('prompt',q.get('stem',''))+' '+q.get('visual','')+' '+q.get('inputDescription','')+' '+q.get('codeSetup','')+' '+q.get('codeTemplate','')+' '+q.get('followUp','')
for id,forbidden in {
 'SA001':['사용하기 전, 사용하는 도중, 사용한 후'],
 'SA002':['인지도','태도','윤리','충성도'],
 'SA003':['감성','사용성','사용자 가치'],
 'SA017':['지각→','반응선택→','반응실행의'],
 'ES003':['Dark Ages','Proto UX','Gold Rush','Middle/Modern Age'],
 'ES020':['2.8','7 \\pm 2','10\\text','50\\text'],
 'ES022':['Self-terminating','Exhaustive'],
 'ES025':['양립성·학습·연령','감각전달·중앙처리·운동전달·근수축','20% 단축'],
 'ES030':['Overshoot','Undershoot','Stimulus-based','Goal-based'],
 'ES032':['문화적 차이 vs. 경험적 차이'],
 'RC017':['log2()로'],
 'RC018':['log2()로','ID} = \\log_2(D/W + 1)']}.items():
 for phrase in forbidden:check(phrase not in shown(W[id]),id+' no answer hint: '+phrase)
check('The Dark Ages →' not in C['MC005']['stem'],'MC005 does not supply the tested chronology')
check('실제로 포함되어' not in C['MC097']['stem'] and '집합에 없고' not in C['MC097']['stem'],'MC097 membership must be read from the log')
for q in [*B['written'],*B['multiple-choice'],*B['mock-exam']]:
 check('information-processing-p31.png' not in q.get('visual',''),q['id']+' no answer-labelled lecture slide')
 check('기울기 추정에는 다른 집합크기의 자료가 추가로 필요하다' not in q.get('visual',''),q['id']+' no inferred sampling conclusion in caption')
 check(bool(q.get('conceptIds')),q['id']+' keeps assessed concepts')
for q in B['mock-exam']:
 if q['type'] in ['single','multi']:
  expected=[i for i,o in enumerate(q['options'],1) if o['correct']]
  check([int(i) for i in re.findall(r'\d+',q['answer'])]==expected,q['id']+' printed answer matches option order')
check('NO 응답' not in C['MC097']['visual'],'MC097 figure title does not identify the tested condition')
check('Number는 검사 숫자' not in W['ES022']['visual'] and 'Number (Probe)' not in W['ES022']['visual'],'ES022 requested Probe definition is not supplied in its data')
check('개념 양립성' in W['ES032']['answer'] and '개념 양립성' in W['ES032']['rubric'][0]['criterion'],'ES032 requested compatibility type has model and scoring')
check('기술 연구' in next(q for q in B['mock-exam'] if q['id']=='ME1-Q25')['answer'],'ME1-Q25 research type names propagated to model answer')
for q in B['mock-exam']:
 source=W.get(q['originId']) or C.get(q['originId'])
 if source and not q['variant']:
  field='stem' if q['originId'].startswith('MC') else 'prompt'
  check(q['prompt']==source[field],q['id']+' unmodified copy matches source prompt')
for id in ['ES039']:
 check('regression1.xlsx' not in shown(W[id]) and '<td>7</td>' in W[id]['visual'],id+' only the three observed pairs')
q=next(q for q in B['mock-exam'] if q['id']=='ME4-Q28');check('regression1.xlsx' not in shown(q) and '<td>8</td>' in q['visual'],'ME4-Q28 retains its own variant values')
for q in [W['SA002'],next(q for q in B['mock-exam'] if q['id']=='ME2-Q19')]:
 check(len(q['rubric'])==4 and [r['criterion'] for r in q['rubric']]==['Brand Awareness','Attitude to brand','Brand Ethics','Brand Loyalty'],q['id']+' all four terms remain in solution/rubric')
check('30.0' in W['ES014']['answer'] and '30.0' in W['ES014']['rubric'][-1]['criterion'],'ES014 requested redundancy has answer and scoring')
ox=re.findall(r'  q\("([^"\n]+)",R`([\s\S]*?)`,(true|false),R`([\s\S]*?)`,"([^"\n]+)","([^"\n]+)"\);',(E/'ox/index.html').read_text())
for id,terms in [('OX087',['약 5개','7 \\pm 2']),('OX097',['자극식별 N','반응선택 Y']),('OX100',['10\\text','50\\text'])]:
 s=ox[int(id[2:])-1][1]
 for term in terms:check(term not in s,id+' no supplied lookup answer: '+term)
check(len(ox)+sum(map(len,B.values()))==620,'full 620-question inventory scanned')
out={'status':'fail' if failures else 'pass','checksPassed':len(checks),'failures':failures,'inventory':{**{k:len(v) for k,v in B.items()},'ox':len(ox)}}
print(json.dumps(out,ensure_ascii=False));sys.exit(bool(failures))
