from audit_invariants import preserved_except_scoped_corrections,expected_active
"""Check explanation coverage, immutable questions and actual execution evidence."""
from pathlib import Path
import ast,collections,json,re
E=Path(__file__).resolve().parent.parent
D=json.loads((E/'practice-source/questions.json').read_text());LB=json.loads((E/'practice-source/lecture-blank-questions.json').read_text());S=D['detailedSolutions'];B={q['id']:q for q in D['bank']}
O=json.loads((E/'previous/before-detailed-solutions-2026-10-24/practice-source/questions.json').read_text())
checks=[]
def check(v,t):
    assert v,t
    checks.append(t)
check(preserved_except_scoped_corrections(D,O),'original question objects preserved except declared scope corrections')
for k in ['version','questionRevision','presentationRevision','referenceTables','fixtures','notice']:
    check(D[k]==O[k],k+' preserved')
check(D['counts']=={t:expected_active(D)[t]for t in ['code','short','mc']},'question counts')
check(set(S)==set(B),'complete in-page guides for every question')
check(S==json.loads((E/'practice-source/detailed-solutions.json').read_text()),'sidecar and package identical')
for qid,q in B.items():
    s=S[qid]
    check(len(s['reasoning'])>=(2 if q['type']=='code' else 3),qid+' substantial reasoning paragraphs')
    check(sum(map(len,s['reasoning']))>=(60 if qid.startswith('BSA') else 100),qid+' explanation not a bare answer')
    check(all('\n' not in t for t in s['reasoning']),qid+' code escapes in prose stay visible')
    if q['type']=='mc':check(len(s['optionDetails'])==len(q['options']) and all(len(t)>=25 for t in s['optionDetails']),qid+' all options have aligned substantive explanations')
    check(bool(s.get('runtime'))==bool(q.get('code')),qid+' runtime coverage matches code presence')
    if q['type']=='code':
        check(len(s['blankEvidence'])==len(q['blanks']),qid+' every blank explained')
        check(bool(q['steps']),qid+' sentence-by-sentence explanations retained')
        for b,e in zip(q['blanks'],s['blankEvidence']):
            check(e['number']==b['number'] and e['source']==q['code'].splitlines()[b['line']-1],qid+' filled line '+str(b['number']))
    if not s.get('runtime'):continue
    r=s['runtime'];lines=r['sourceCode'].splitlines()
    check(ast.literal_eval(r['stdoutRepr'])==r['stdout'],qid+' whitespace-visible stdout exact')
    check('bigdata-detailed-solution-' not in json.dumps(r,ensure_ascii=False),qid+' no temporary path exposed')
    for t in r['trace']:
        check(1<=t['line']<=len(lines) and t['code']==lines[t['line']-1],qid+' trace maps to source line')
        check(ast.literal_eval(t['outputRepr'])==t['output'],qid+' incremental output exact')
    if q['type']=='code' and not(q.get('random') or q.get('randomRule')):
        check(r['stdout']==q.get('output',''),qid+' expected output exact')
    for f,v in q.get('written',{}).items():check(r['files'][f]==v,qid+' final file '+f)
executions=sum('runtime' in s for s in S.values())
check(executions==sum(bool(q.get('code')) for q in B.values()),'all author code executions')
check(sum(len(q.get('blanks',[])) for q in B.values())==expected_active(D)['blanks'],'all previous and original blank answers retain evidence')
expected={'BM05':'TypeError','BM29':'ValueError','BM32':'TypeError','BM38':'NameError','BM43':'ValueError','BM44':'ValueError','BM46':'NameError','BM47':'TypeError','BS02':'TypeError','BS03':'ZeroDivisionError','BS04':'NameError','BFS03':'FileExistsError'}
expected.update({q['id']:q['solution']['expectedException'] for q in json.loads((E/'practice-source/short-answer-additions.json').read_text())['questions'] if q['solution'].get('expectedException')})
check({id:s['runtime']['exception']['name'] for id,s in S.items() if s.get('runtime',{}).get('exception')}=={id:name for id,name in expected.items()if id in B},'all intentional errors match expected kinds')
rt=lambda id:S[id]['runtime']
v=lambda id,k:rt(id)['finalState'][k]['value']
check([t['line'] for t in rt('BM01')['trace']]==[2,8,5] and rt('BM01')['stdout']=='20\n','BM01 actual cell execution order')
check(v('BM02','x')=='3' and [t['expression']['value'] for t in rt('BM02')['trace'] if t['expression']]==['7'],'BM02 expression result is not assignment')
check(v('BM17','numbers')=='[1, 2]' and any(t['scope']=='modify' and t['changes'].get('li',{}).get('after',{}).get('value')=='[1, 2, 100, 200]' for t in rt('BM17')['trace']),'BM17 local rebinding and original list')
check([t['output'] for t in rt('BM40')['trace']]==['A-B ','C\n'],'BM40 incremental output buffer')
check(rt('BM41')['stdout']=="'w'\n' '\n" and len(S['BM41']['optionDetails'])==4,'BM41 repr, code points, every option')
check(v('BM11','product')=='1024','BM11 post-loop value')
check(v('BM45','product')=='1024' and rt('BM45')['stdout'].split()==['2','4','8','16','32','64','128','256','512'],'BM45 correct update applied without printing terminal 1024')
check(sum('block = src.read' in t['code'] for t in rt('BFM01')['trace'])==4 and sum(bool(t.get('action')) and 'dst.write' in t['code'] for t in rt('BFM01')['trace'])==3,'BFM01 4 reads versus 3 writes')
check(sum(t['code'].strip()=='total = 0.0' for t in rt('BC24')['trace'])==3 and rt('BC24')['stdout']=='Susan 31.4\nBrad 36.8\nJenn 39.5\n','BC24 per-person reset and totals')
check(any(t.get('action') and 'seek' in t['code'] for t in rt('BFC03')['trace']),'BFC03 seek evidence')
check(S['BC31']['blankEvidence'][0]['source'].strip()=='global area' and any(str(n)=='2' and '전역' in text for n,text in B['BC31']['steps']),'BC31 declaration explained even without bytecode trace event')
check(sum(t['code'].strip()=='prices_set.add(85000)' for t in rt('BP22')['trace'])==1,'BP22 redundant add still observed')
for qid,q in B.items():
    r=S[qid].get('runtime')
    if not r or not r['randomExample']:continue
    check(any('한 실행 예시' in n for n in r['notes']),qid+' random sample clearly labeled')
check(all(len(s)==6 and set(s)<=set('abcdefghijklmnopqrstuvwxyz0123456789') for s in rt('BO05')['stdout'].splitlines()),'BC08 sample password constraints')
check(len(rt('BP06')['stdout'].split())==10 and all(1<=int(s)<=6 for s in rt('BP06')['stdout'].split()),'BP06 10 dice in 1..6')
md=(E/'12_공지반영_정답과해설.md').read_text();html=(E/'practice/index.html').read_text()
for qid,q in B.items():
    check(all(t in md for t in S[qid]['reasoning']),qid+' reasoning in MD')
check('정답과 상세 해설' in html and '상세 풀이 과정' in html and '실행 순서와 실제 값 변화' in html,'offline UI renders explanations')
check('kw.bigdata.midterm.notice-practice.v1' in html,'storage key retained')
report={'date':'2026-10-24','passed':len(checks),'questions':len(B),'executions':executions,'traceSteps':sum(len(s.get('runtime',{}).get('trace',[])) for s in S.values()),'checks':checks}
(E/'final-audit/detailed-solutions-static.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='checks'},ensure_ascii=False))
