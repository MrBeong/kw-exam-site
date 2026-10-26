"""압축본의 강의 코드·출력·파일·변형 경계·기존 문제은행 보존을 독립 검산."""
from pathlib import Path
import json, tempfile, os, sys, io, contextlib, random, builtins, hashlib
from content import data

ROOT=Path(__file__).resolve().parent;EXAM=ROOT.parent
bank=json.loads((EXAM/'practice-source/questions.json').read_text())
concept=json.loads((EXAM/'concept-source/concept-data.json').read_text())
qmap={q['id']:q for q in bank['bank']}
coverage=json.loads((ROOT/'coverage.json').read_text())
oracle=json.loads((ROOT/'oracles.json').read_text())
checks=[];runs=[]
def check(name,ok,detail=None):
    checks.append({'name':name,'passed':bool(ok),'detail':detail})
    assert ok,(name,detail)
def execute(code,inputs=(),files=None):
    stdin=iter(inputs);namespace={};out=io.StringIO();blocks=[];cwd=Path.cwd()
    with tempfile.TemporaryDirectory(prefix='bigdata-cram-') as td:
        os.chdir(td)
        try:
            for name,text in (files or {}).items():
                path=Path(name)
                if isinstance(text,bytes):path.write_bytes(text)
                else:path.write_text(text,encoding='utf-8')
            def prompt(_=''):return next(stdin)
            namespace={'__builtins__':dict(vars(builtins),input=prompt),'__name__':'__main__'}
            lines=code.splitlines()
            def trace(frame,event,arg):
                if event=='line' and frame.f_code.co_filename=='<cram>' and 'if not block:' in lines[frame.f_lineno-1]:blocks.append(len(frame.f_locals['block']))
                return trace
            with contextlib.redirect_stdout(out):
                sys.settrace(trace)
                try:exec(compile(code,'<cram>','exec'),namespace)
                finally:sys.settrace(None)
            written={p.name:p.read_bytes() for p in Path('.').iterdir() if p.is_file()}
            return out.getvalue(),namespace,written,blocks
        finally:os.chdir(cwd)

refs={r['ref']:r for r in coverage['executions']}
check('independent oracle for every included code',set(refs)==set(oracle))
for ref,r in refs.items():
    kind,key=ref.split(':',1)
    original=qmap[key] if kind=='q' else concept['snippets'][key]
    check(ref+' exact original code',r['code']==original['code'])
    fixtures={name:bank['fixtures'].get(name,concept['fixtures'].get(name)) for name in r['files']}
    if 'bridge.png' in fixtures:fixtures['bridge.png']=bytes(range(250))*10
    check(ref+' all initial file data provided',all(v is not None for v in fixtures.values()))
    stdout,ns,written,blocks=execute(r['code'],r['input'],fixtures)
    o=oracle[ref]
    if 'random' in o:
        spec=o['random'];lines=stdout.splitlines()
        check(ref+' random output invariants',len(lines)==spec['lines'] and all(len(x)==spec['length'] and set(x)<=set(spec['alphabet']) for x in lines))
    else:check(ref+' actual stdout == independent expectation',stdout==o['stdout'],{'actual':stdout,'expected':o['stdout']})
    for name,value in o.get('values',{}).items():check(ref+' final '+name,ns[name]==value)
    for name,typeName in o.get('types',{}).items():check(ref+' type '+name,type(ns[name]).__name__==typeName)
    for name,text in o.get('written',{}).items():check(ref+' file '+name,written[name]==text.encode('utf-8'))
    if 'copy' in o:
        src,dst=o['copy'];check(ref+' copied exact bytes',written[src]==written[dst]);check(ref+' unchanged input file',written[src]==(fixtures[src].encode('utf-8') if isinstance(fixtures[src],str) else fixtures[src]))
    if 'blocks' in o:check(ref+' read chunks including EOF',blocks==o['blocks'],blocks)
    runs.append({'ref':ref,'stdout':stdout,'blockLengths':blocks,'files':{n:{'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()} for n,b in written.items()}})

# Boundary results are derived separately, rather than copied from generated answers.
for year,leap in [(2012,True),(1900,False),(2000,True),(2023,False)]:
    stdout,_,_,_=execute(qmap['BO03']['code'],[str(year)])
    expected=f'{year} 년은 윤년입니다.\n' if leap else f'{year} 년은 윤년이 아닙니다.\n'
    check('leap century exception '+str(year),stdout==expected)
for n,fact in [(0,1),(1,1),(4,24)]:
    stdout,ns,_,_=execute(qmap['BO04']['code'],[str(n)]);check('factorial boundary '+str(n),ns['fact']==fact)
stdout,ns,_,_=execute(qmap['BO01']['code'],['3.5','4.5']);check('fractional inputs remain float',stdout=='합계: 8.0\n평균: 4.0\n')

valueCases=[('-7 / 4',-1.75),('-7 // 4',-2),('-7 % 4',1),('int(-1.75)',-1),('2 ** 3 ** 2',512),('(2 ** 3) ** 2',64),('2 ^ 3',1),('0 or 5',5),('"Python" and 3',3),('0 != 0 and 10 / 0 > 2',False),('list(range(5,0,-2))',[5,3,1]),('list(range(5,0))',[]),('list(range(5))',[0,1,2,3,4]),('list(range(1,5))',[1,2,3,4]),('list(range(10))[10:2:-2]',[9,7,5,3]),('max("Hello world")','w'),('min("Hello world")',' '),('len("가")',1),('len("가".encode("utf-8"))',3)]
for expression,expected in valueCases:check('table value '+expression,eval(expression)==expected)
for expression,name in [('int("20.5")','ValueError'),('"Hi"+3','TypeError'),('range(1,5,0)','ValueError'),('[1][6]','IndexError'),('{}["missing"]','KeyError'),('[].pop()','IndexError'),('[1].remove(9)','ValueError'),('10/0','ZeroDivisionError')]:
    try:eval(expression)
    except Exception as ex:check('table exception '+expression,type(ex).__name__==name)
    else:check('table exception '+expression,False)

cardIds={c['id'] for s in data['sections'] for c in s['cards']}
actualConcepts={c['id'] for s in concept['sections'] for c in s['items']}
check('all 98 current concept groups mapped',set(c['concept'] for c in coverage['concepts'])==actualConcepts)
check('each coverage target has actual card',all(c['card'] in cardIds for c in coverage['concepts']))
check('recommended path totals 60 minutes',sum(s['minutes'] for s in data['sections'])==60)
check('five final mixed retrieval items',len(data['checks'])==5)
check('output MC and term types actually represented',{x['kind'] for x in data['checks']}=={'output','mc','term'})
check('actual four and five choice formats',sorted(a['optionCount'] for a in coverage['assessments'] if a['kind']=='mc')==[4,5])
check('output checks match independent stdout',all(oracle[t['ref']]['stdout']==t['answer'] for t in data['checks'] if t['kind']=='output'))
check('term answer is exact lecture spelling',next(x for x in data['checks'] if x['kind']=='term')['answer']==qmap['BSA027']['answer']=='Dynamic Typing')
check('MC four choice independent correct index',qmap['BM51']['correct']==1 and qmap['BM51']['options'][1]=='5 / 3')
check('MC five choice independent correct index',qmap['BM18']['correct']==4 and qmap['BM18']['options'][4]=='6')
allowed=[]
for i,option in enumerate(qmap['BM18']['options']):
    try:['A','B','C','D','E','F'][int(option)]
    except IndexError:allowed.append(i)
check('only index6 fails with actual lookup',allowed==[qmap['BM18']['correct']])
def walk(blocks):
    for b in blocks:
        yield b
        if b['kind']=='fold':yield from walk(b['blocks'])
blocks=[b for section in data['sections'] for c in section['cards'] for b in walk(c['blocks'])]
check('core plus optional recall questions',len([b for b in blocks if b['kind']=='recall'])==6)
for b in [b for b in blocks if b['kind']=='recall']:
    q=qmap[b['ref'].split(':')[1]];code=q['template']
    for blank in q['blanks']:code=code.replace('⟦'+str(blank['number'])+'⟧',blank['answer'])
    check(q['id']+' original blank locations and answers',code==q['code'])

# Additional statements exposed by the second content audit.
for expression,expected in [('65-53',12),('65-65',0),('65-70',-5),('sorted([-4,1,-2,3],key=abs,reverse=True)',[-4,3,-2,1]),('sorted([-4,1,-2,3],key=abs)',[1,-2,3,-4])]:
    check('reviewed example '+expression,eval(expression)==expected)
md=(EXAM/'35_시험1시간전_압축정리.md').read_text()
check('mixed MD uses real newlines',('### 5분 혼합 점검'+chr(10)*2+'####') in md)
check('optional recalls labeled faithfully',[(a['ref'],a['original']) for a in coverage['assessments'] if a['kind']=='blank' and a['ref'] in ['q:BC32','q:BC24']]==[('q:BC32',False),('q:BC24',False)])

before=EXAM/'previous/before-one-hour-cram-2026-10-25'
for rel in ['practice-source/questions.json','practice-source/app.js','practice-source/style.css']:
    check('existing bank/state/wheel behavior unchanged '+rel,(EXAM/rel).read_bytes()==(before/rel).read_bytes())
check('concept main aliases remain identical',(EXAM/'index.html').read_bytes()==(EXAM/'빅데이터프로그래밍_중간고사_Notion.html').read_bytes())
check('compression JS does not write learning storage','localStorage' not in (ROOT/'app.js').read_text())
check('no external asset dependency',all(x not in (EXAM/'35_시험1시간전_압축정리.html').read_text() for x in ['<script src=','<link rel="stylesheet"']))
result={'date':'2026-10-25','passed':True,'checks':len(checks),'codeExecutions':len(runs),'conceptGroups':98,'questionsUnchanged':len(bank['bank']),'results':checks,'runs':runs,'limits':'코드/수치와 현재 개념군 대응의 검산이다. 미공개 시험 출제와60분 학습 시간의 실측 검증을 뜻하지 않는다.'}
(EXAM/'final-audit/cram-execution.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k not in ['results','runs']},ensure_ascii=False))
