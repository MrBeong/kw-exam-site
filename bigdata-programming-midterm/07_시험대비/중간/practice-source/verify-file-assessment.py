from audit_invariants import preserved_except_scoped_corrections,reviewed_catalog,retired_ids,expected_active
"""New file-I/O questions: real execution, misconceptions and preserved records schema."""
from pathlib import Path
import ast,contextlib,hashlib,io,json,os,re,sys,tempfile
E=Path(__file__).resolve().parent.parent
D=json.loads((E/'practice-source/questions.json').read_text())
old=json.loads((E/'final-audit/file-assessment-before-bank.json').read_text())
LB=json.loads((E/'practice-source/lecture-blank-questions.json').read_text());ids=D['fileTranscriptAssessment']['addedIds'];B=reviewed_catalog(D);checks=[];cases=[]
def ck(value,label):
    assert value,label
    checks.append(label)
ck(ids==['BFC01','BFC02','BFC03','BFC04','BFC05','BFS01','BFS02','BFS03','BFM01','BFM02','BFM03','BFM04'],'12 declared additions')
ck(preserved_except_scoped_corrections(D,old),'original objects preserved except documented BM33/BM39 scope corrections')
ck(len(D['bank'])==expected_active(D)['questions'] and D['counts']=={t:expected_active(D)[t]for t in ['code','short','mc']},'only declared short/original questions added to the three official types')
ck(sum(len(q.get('blanks',[])) for q in D['bank'])==expected_active(D)['blanks'],'previous318 plus declared original code blanks')
ck(D['version']==old['version'] and D['questionRevision']==old['questionRevision'],'same storage version and prior revision policy')
ck(D['presentationRevision']==old['presentationRevision'],'same code-presentation revision')
ck(not json.loads((E/'practice-source/coverage.json').read_text())['missing'],'98 concept groups still mapped')
for id in ids:
    q=B[id];ast.parse(q['code']);ck(True,id+' real Python syntax')
    ck(q['source']=='BIG-019' and q['scope']=='slides' and all(1<=p<=49 for p in q['pages']),id+' slide source and page bounds')
    ck(q['assessmentOrigin']['transcript']=='BIG-023' and q['assessmentOrigin']['lines'],id+' transcript emphasis evidence')
    ck(q['steps'] and {int(n) for n,_ in q['steps']}=={i for i,s in enumerate(q['code'].splitlines(),1) if s.strip()},id+' every code line explained')
    ck('.lstrip(' not in q['code'] and not any(isinstance(n,(ast.Try,ast.TryStar)) for n in ast.walk(ast.parse(q['code']))),id+' no excluded oral or next-lesson syntax')
    ck(all(f in D['fixtures'] for f in q['files']),id+' all displayed fixtures exist')
    if q['type']=='code':
        restored=re.sub(r'⟦(\d+)⟧',lambda m:q['blanks'][int(m[1])-1]['answer'],q['template'])
        ck(restored==q['code'] and all(b['why'] for b in q['blanks']),id+' blanks restore actual source with reasons')
    elif q['type']=='mc':
        ck(len(q['options'])==len(q['reasons'])==4 and len(set(q['options']))==4 and all(q['reasons']),id+' four unique choices and detailed reasons')
        lengths=[len(re.sub(r'\s','',s)) for s in q['options']]
        ck(lengths[q['correct']]<1.5*sum(lengths)/4,id+' correct choice not conspicuously longer')

def run(qid,overrides=None,byte_count=None,trace=False,source=None):
    q=B[qid];cwd=Path.cwd();code=source or q['code'];namespace={};buf=io.StringIO();error=None;counts={'read':0,'write':0}
    with tempfile.TemporaryDirectory(prefix='bigdata-file-assessment-') as td:
        try:
            os.chdir(td)
            for name,text in D['fixtures'].items():Path(name).write_text(text,encoding='utf-8')
            for name,text in (overrides or {}).items():Path(name).write_text(text,encoding='utf-8')
            payload=bytes(i%256 for i in range(2500 if byte_count is None else byte_count))
            if qid=='BFM01':Path('sample.bin').write_bytes(payload)
            initial={f:Path(f).read_bytes() for f in q['files']}
            def tracer(frame,event,arg):
                if frame.f_code.co_filename=='<file-question>' and event=='line':
                    if frame.f_lineno==4:counts['read']+=1
                    if frame.f_lineno==7:counts['write']+=1
                return tracer
            if trace:sys.settrace(tracer)
            try:
                with contextlib.redirect_stdout(buf):exec(compile(code,'<file-question>','exec'),namespace)
            except Exception as e:error=type(e).__name__
            finally:sys.settrace(None)
            ck(all(Path(f).read_bytes()==v for f,v in initial.items()),qid+' input files unchanged')
            if qid=='BFM01':ck(Path('sample_copy.bin').read_bytes()==payload,qid+' copied bytes exact '+str(len(payload)))
            return namespace,buf.getvalue(),error,counts
        finally:os.chdir(cwd)

for id in ids:
    q=B[id];ns,out,error,cnt=run(id,trace=id=='BFM01')
    ck(error==('FileExistsError' if id=='BFS03' else None),id+' intended completion or exception')
    if q['type']=='code':ck(out==q['output'],id+' exact target output')
    if id=='BFC01':ck(isinstance(ns['text'],str) and ns['infile'].closed,id+' retained string and closed input')
    if id=='BFC02':ck(isinstance(ns['first'],str) and isinstance(ns['remaining'],list) and len(ns['remaining'])==2 and ns['end']=='',id+' mixed reads share current position')
    if id=='BFC03':ck(ns['first']=='A\n' and ns['text']==D['fixtures']['letters.txt'],id+' seek does not mutate saved text')
    if id=='BFC04':ck(ns['total']==39.5,id+' last person total not cumulative')
    if id=='BFC05':ck(type(ns['original']) is bytes and ns['original']==ns['copied']==b'ABC',id+' actual bytes and equality')
    if id=='BFS01':ck(type(ns['text']).__name__==q['answer'] and out=='홍길동\n' and ns['infile'].closed,id+' short type correct outside with')
    if id=='BFS02':ck(ns['second']=='\n' and ns['fourth']=='' and q['answer']=='EOF' and out=="'\\n'\n''\n",id+' blank line versus EOF')
    if id=='BFS03':ck(error==q['answer'] and 'out' not in ns,id+' x fails before binding or write')
    if id=='BFM01':ck(cnt=={'read':4,'write':3} and q['options'][q['correct']]=='4회 / 3회',id+' one correct call count')
    if id=='BFM02':
        ck(' / '.join(out.splitlines())==q['options'][q['correct']],id+' unique output choice')
        ck(ns['line']=='\t,A,\n' and ns['trimmed']==',A,',id+' repr and strip preserve original and punctuation')
    if id=='BFM03':ck(out=='Susan 4.0\nBrad 9.0\n' and out.splitlines()[1]==q['options'][q['correct']],id+' reset placement predicts second line')
    if id=='BFM04':ck(' / '.join(out.splitlines())==q['options'][q['correct']],id+' equal sizes unequal content')
    cases.append({'id':id,'passed':True,'output':out,'exception':error,'counts':cnt if id=='BFM01' else None})

_,out,_,_=run('BFC03',source=B['BFC03']['code'].replace('    f.seek(0)\n',''))
ck(out=="''\n",'without seek EOF is not reset')
_,out,_,_=run('BFC05',overrides={'bytes_same.txt':'ABD'})
ck(out=='바이트 일치: False\n원본 크기: 3\n복사본 크기: 3\n','same size alone cannot establish byte equality')
_,out,_,_=run('BFM03',source=B['BFM03']['code'].replace('        fields =','        total = 0.0\n        fields =',1))
ck(out=='Susan 4.0\nBrad 5.0\n','per-person reset produces alternative output only after changing code')
for size,expected in [(0,{'read':1,'write':0}),(1024,{'read':2,'write':1}),(1025,{'read':3,'write':2})]:
    _,_,error,counts=run('BFM01',byte_count=size,trace=True)
    ck(error is None and counts==expected,'binary chunk boundary '+str(size))

for file in ['11_공지반영_예상문제.md','12_공지반영_정답과해설.md']:
    text=(E/file).read_text()
    for id in ids:
        if id in retired_ids(D):
            ck(('## '+id+' ·')not in text if file.startswith('11_')else('## '+id+'\n')not in text,id+' retired from active MD, source preserved in review archive')
            continue
        q=next(q for q in D['bank']if q['id']==id);marker='## '+id+(' ·' if file.startswith('11_') else '\n')
        section=text.split(marker,1)[1].split('\n## ',1)[0]
        ck(((q.get('template') or q['code']) if file.startswith('11_') else q['code']) in section,id+' code in '+file)
        effective_conditions=D.get('questionDisplay',{}).get('questions',{}).get(id,{}).get('conditions',q.get('conditions',[])) # Both MDs render the same reviewed learner-facing conditions.
        ck(all(c in section for c in effective_conditions),id+' effective conditions in '+file)
        ck(all(D['fixtures'][f] in section for f in q['files']),id+' fixtures in '+file)
        if file.startswith('12_'):ck(all(why in section for _,why in q['steps']),id+' all statements in answer MD')
coverage=json.loads((E/'practice-source/file-assessment-coverage.json').read_text())
ck({id for row in coverage['emphasisPoints'] for id in row['addedQuestionIds']}==set(ids),'every new question linked to an emphasis point')
for row in coverage['emphasisPoints']:
    ck(all(id in B for id in row['previousQuestionIds']+row['addedQuestionIds']),row['id']+' existing question links')
    ck(all(1<=n<=91 for n in row['transcriptLines']) and all(1<=n<=49 for n in row['slidePages']),row['id']+' valid transcript and slide references')
for s in D['sources']:ck(hashlib.sha256(Path(s['source']).read_bytes()).hexdigest()==s['sha256'],s['id']+' original source hash unchanged')
result={'date':'2026-10-22','passed':True,'historicalAdditionCount':len(ids),'activeAddedQuestions':len(set(ids)-retired_ids(D)),'retiredAddedQuestions':sorted(set(ids)&retired_ids(D)),'counts':D['counts'],'codeBlanks':sum(len(q.get('blanks',[]))for q in D['bank']),'checks':len(checks),'cases':cases,'checkNames':checks,'unchangedOldQuestions':190,'documentedScopeCorrections':['BM33','BM39'],'limits':['Independent Python execution in temporary folders, not a live Jupyter kernel.','Scope is BIG-019 slide syntax. Oral-only lstrip and next-lesson exception handling are not added.','Answer literals follow the practice key; the real professor answer sheet is unavailable.']}
(E/'final-audit/file-assessment-execution.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k not in ['cases','checkNames','limits']},ensure_ascii=False))
