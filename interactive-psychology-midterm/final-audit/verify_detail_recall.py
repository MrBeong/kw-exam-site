"""Audit explicit recall coverage without treating broad concept IDs as leaf objectives."""
from pathlib import Path
import json, re, math, hashlib
E=Path(__file__).resolve().parent.parent; A=E/'final-audit'
W=json.loads((E/'written/questions.json').read_text()); M=json.loads((E/'mock-exam/questions.json').read_text())
objectives=json.loads((A/'detail-recall-objectives.json').read_text()); trace=json.loads((A/'detail-recall-mock-changes.json').read_text())
checks=[]
def check(v,s):
    assert v,s
    checks.append(s)
new=[q for q in W if q.get('detailRevision')]
check([q['id'] for q in new]==[f'SA{i:03}' for i in range(45,76)],'31 new stable short IDs')
check(len(W)==137 and len(M)==160,'137 written / 160 mock')
check(sum(len(q['recallBlanks']) for q in new)==128,'128 individual recall blanks')
check([q['id'] for q in objectives]==[q['id'] for q in new],'every new objective documented')
registry={t['term']:t for t in json.loads((E/'written/english-terms.json').read_text())}
check(len(registry)==88,'88 lecture-sourced terms')
for q in new:
    check(q['type']=='short' and q['source'] and q['conceptIds'],q['id']+' traceable short recall')
    check([b['id'] for b in q['recallBlanks']]==[str(i+1) for i in range(len(q['recallAnswers']))],q['id']+' numbered blank/answer bijection')
    check(q['points']==sum(r['points'] for r in q['rubric'])==len(q['recallBlanks']),q['id']+' per-blank grading')
    check(all(f'({i+1}) {a}'==q['rubric'][i]['criterion'] for i,a in enumerate(q['recallAnswers'])),q['id']+' answer/rubric synchronized')
    check(all(t in registry and registry[t]['sources'] for t in q['englishTerms']),q['id']+' English names grounded in lecture')
    if q.get('visual'):
        src=re.search(r'src="([^\"]+)"',q['visual'])[1]
        check((E/'written'/src).is_file(),q['id']+' required complete figure exists')
for t in trace:
    q=next(q for q in M if q['id']==t['id']);before=t['before']
    check(q==t['after'],q['id']+' full current trace')
    for k in ['id','set','number','type','points','minutes']:
        check(q[k]==before[k],q['id']+' stable exam '+k)
    check(q['originId'] in {q['id'] for q in new},q['id']+' assessed leaf source')
    check(math.isclose(sum(r['points'] for r in q['rubric']),2),q['id']+' 2-point short slot')
    check(len(q['recallBlanks'])==len(q['recallAnswers'])==len(q['rubric']),q['id']+' complete blank scoring')
for n in range(1,6):
    packet=[q for q in M if q['set']==n]
    check(len(packet)==32 and sum(q['points'] for q in packet)==100 and sum(q['minutes'] for q in packet)==110,f'set {n} 32 / 100 / 110+10 minutes')
baseline=json.loads((A/'detail-recall-baseline-sha256.json').read_text())
check([q['id'] for q in W[:106]]==list(baseline['written']),'all original written IDs/order preserved')
for bank,questions in [('written',W[:106]),('mock-exam',[q for q in M if q['id'] not in {t['id'] for t in trace}])]:
    for q in questions:
        sha=hashlib.sha256(json.dumps(q,ensure_ascii=False,sort_keys=True,separators=(',',':')).encode()).hexdigest()
        check(sha==baseline[bank][q['id']],q['id']+' existing content preserved byte-semantically')
answers={q['id']:q['recallAnswers'] for q in new}
check(answers['SA045']==['2','dashed','3','dotted','1','solid'],'line panel A authoritative mapping')
check(answers['SA046']==['6','twodash','4','dotdash','5','longdash'],'line panel B authoritative mapping')
check(answers['SA047']==['0','blank'],'no-line mapping')
check(answers['SA051']==['==','!=','<=','>='],'R comparison symbols')
check(answers['SA052']==['!','|','&','TRUE','FALSE'],'R vector Boolean operators and output')
check(answers['SA058']==['1','n−2','n−1','SSR / 1','SSE / (n−2)','MSR / MSE'],'intercept-included simple OLS table')
check(len(answers['SA075'])==8 and 'Short-term sensory store' in answers['SA075'],'processing diagram includes sensory store')
result={'status':'pass','checksPassed':len(checks),'newShortQuestions':31,'numberedBlanks':128,'mockRevised':5,'bankCounts':{'written':137,'mock-exam':160},'scope':'Lecture tables, figures, R parameters and direct recall; broad concept coverage and leaf recall are distinct.'}
(A/'detail-recall-source-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False))
