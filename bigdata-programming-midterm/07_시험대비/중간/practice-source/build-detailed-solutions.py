"""Build in-page reasoning and verified execution records from author-written code."""
from pathlib import Path
import ast,builtins,contextlib,io,json,os,random,shutil,sys,tempfile,types
E=Path(__file__).resolve().parent.parent
D=json.loads((E/'practice-source/questions.json').read_text())
G=json.loads((E/'practice-source/solution-guides.json').read_text())
CG=json.loads((E/'practice-source/code-solution-guides.json').read_text())
LB=json.loads((E/'practice-source/lecture-blank-questions.json').read_text())
CG.update({q['id']:q['solution']for q in LB['questions']})
for change in D.get('wholeExampleRevision',{}).get('guideChanges',[]):
    assert CG[change['id']]==change['before'],change['id']+' stale compound guide'
    CG[change['id']]=change['after']
for change in D.get('assessmentPruning',{}).get('guideCorrections',[]):
    assert CG[change['id']][change['field']]==change['before'],change['id']+' stale guide correction'
    CG[change['id']][change['field']]=change['after']
CG={id:guide for id,guide in CG.items()if any(q['id']==id and q['type']=='code'for q in D['bank'])}
A=json.loads((E/'practice-source/short-answer-additions.json').read_text())
G.update({q['id']:q['solution'] for q in A['questions']})
OP=json.loads((E/'practice-source/output-prediction-questions.json').read_text())
G.update({q['id']:q['solution']for q in OP['questions']})
for change in D.get('noncodeReview',{}).get('guideChanges',[]):
    assert G[change['id']]==change['before'],change['id']+' stale noncode guide'
    G[change['id']]=change['after']
for item in D.get('noncodeReview',{}).get('added',[]):G[item['id']]=item['solution']
G={id:guide for id,guide in G.items()if any(q['id']==id and q['type']!='code'for q in D['bank'])}
subject=E.parent.parent
expected_errors={'BM05':'TypeError','BM29':'ValueError','BM32':'TypeError','BM38':'NameError','BM43':'ValueError','BM44':'ValueError','BM46':'NameError','BM47':'TypeError','BS02':'TypeError','BS03':'ZeroDivisionError','BS04':'NameError','BFS03':'FileExistsError'}
expected_errors.update({q['id']:q['solution']['expectedException'] for q in A['questions'] if q['solution'].get('expectedException')})
input_overrides={'BS05':['20']}
short_types={'BS05':'str','BFS01':'str'}
results={};audit=[]

def run(q):
    cwd=Path.cwd();saved_input=builtins.input;code=q['code'];variant='';inputs=q.get('input') or input_overrides.get(q['id'],[])
    if q['id']=='BM05':code=q['options'][q['correct']]+'\n'+code;variant='정답 보기의 대입문을 맨 앞에 넣은 실행'
    if q['id']=='BM45':code+='\n    '+q['options'][q['correct']];variant='정답 보기의 갱신 문장을 반복 몸체 끝에 넣은 실행'
    tree=ast.parse(code)
    if q['id']=='BM01':tree.body=[tree.body[0],tree.body[2],tree.body[1]];variant='문제의 셀 실행 순서 A → C → B (줄 번호는 제시 코드 기준)'
    nodes={n.lineno:n for n in ast.walk(tree) if isinstance(n,ast.stmt)}
    source_lines=code.splitlines();trace=[];states={};pending={};frames_with_error=set();stream=io.StringIO();out_pos=0
    with tempfile.TemporaryDirectory(prefix='bigdata-detailed-solution-') as td:
        work=Path(td)/(q.get('workName') or 'work');work.mkdir()
        try:
            os.chdir(work)
            for f,value in D['fixtures'].items():(work/f).write_text(value,encoding='utf-8')
            if q.get('binary'):shutil.copy2(subject/'01_강의자료/ch5_lab/bridge.png',work/'bridge.png')
            for f in q.get('binaryInputFiles',[]):shutil.copy2(subject/'01_강의자료/ch5_lab'/f,work/f)
            if q['id']=='BFM01':(work/'sample.bin').write_bytes(bytes(i%256 for i in range(2500)))
            if q['id']=='BM34':(work/'sample.txt').write_text('DATA',encoding='utf-8')
            if q['id']=='BM50':(work/'log.txt').write_text('',encoding='utf-8')
            ns={'__name__':'__main__','__file__':str(work/'practice.py')};values=iter(inputs)
            builtins.input=lambda prompt='':next(values);random.seed(0)
            def val(value):
                if isinstance(value,types.ModuleType):s='모듈 '+value.__name__
                elif isinstance(value,types.FunctionType):s='함수 '+value.__name__
                elif isinstance(value,io.IOBase):s=f"파일 {Path(str(value.name)).name!r} · mode={value.mode!r} · {'닫힘' if value.closed else '열림'}"
                elif isinstance(value,bytes):s=repr(value) if len(value)<=32 else f'bytes · 길이 {len(value)}바이트'
                elif isinstance(value,set):s='set('+repr(sorted(value,key=repr))+') · 원소 표시 순서는 의미 없음'
                else:
                    try:s=repr(value)
                    except Exception:s='<표시할 수 없는 값>'
                s=s.replace(str(work),'현재 작업 폴더').replace(td,'실습 폴더')
                if len(s)>260:s=s[:230]+'… (긴 값의 표시 생략)'
                return {'type':type(value).__name__,'value':s}
            def snap(frame):return {k:val(v) for k,v in dict(frame.f_locals).items() if not k.startswith('__')}
            def flush(frame,next_line=None,return_value=None,is_return=False):
                nonlocal out_pos
                fid=id(frame);line=pending.pop(fid,None)
                if line is None:return
                now=snap(frame);prev=states.get(fid,{})
                changes={k:{'before':prev.get(k),'after':v} for k,v in now.items() if prev.get(k)!=v}
                states[fid]=now
                text=stream.getvalue();new_output=text[out_pos:];out_pos=len(text)
                node=nodes.get(line);expression=None;decision=None;observed={}
                if isinstance(node,(ast.Assign,ast.AugAssign,ast.AnnAssign)):
                    targets=node.targets if isinstance(node,ast.Assign) else [node.target]
                    names={n.id for target in targets for n in ast.walk(target) if isinstance(n,ast.Name) and isinstance(n.ctx,ast.Store)}
                    observed={k:now[k] for k in names if k in now}
                if isinstance(node,ast.Expr) and isinstance(node.value,(ast.BinOp,ast.BoolOp,ast.Compare,ast.Constant)):
                    try:expression=val(eval(compile(ast.Expression(node.value),'<expression>','eval'),frame.f_globals,frame.f_locals))
                    except Exception:pass
                if next_line and isinstance(node,(ast.If,ast.While,ast.For)):
                    start=min(x.lineno for x in node.body);end=max(getattr(x,'end_lineno',x.lineno) for x in node.body)
                    entered=start<=next_line<=end
                    decision=('반복 몸체로 진행' if entered else '반복/조건 범위 밖으로 진행') if isinstance(node,(ast.While,ast.For)) else ('조건이 참인 분기로 진행' if entered else '조건이 거짓인 다음 경로로 진행')
                returned=val(return_value) if is_return and frame.f_code.co_name!='<module>' and fid not in frames_with_error else None
                action=None
                if isinstance(node,ast.Expr) and isinstance(node.value,ast.Call):
                    fn=node.value.func
                    if isinstance(fn,ast.Attribute):
                        action={'write':'파일의 현재 쓰기 위치에 인수를 기록한다.','seek':'열린 파일의 읽기/쓰기 위치를 지정한다.','add':'집합에 원소를 추가한다. 이미 있는 원소이면 개수는 그대로다.','append':'리스트 끝에 인수를 원소 하나로 추가한다.','extend':'전달한 각 원소를 리스트 끝에 추가한다.','insert':'지정한 위치 앞에 원소를 삽입한다.','remove':'첫 번째 일치 원소를 제거한다.','reverse':'리스트 자체의 순서를 뒤집는다.','close':'파일을 닫는다.'}.get(fn.attr)
                    elif isinstance(fn,ast.Name) and fn.id in ns and isinstance(ns[fn.id],types.FunctionType):action='함수 '+fn.id+' 호출을 마치고 다음 문장으로 진행한다.'
                elif isinstance(node,ast.Global):action='함수 안 대입이 전역 이름 '+', '.join(node.names)+'에 반영되도록 선언한다.'
                elif isinstance(node,ast.Break):action='현재 반복문을 끝낸다.'
                elif isinstance(node,ast.Continue):action='현재 반복의 나머지를 건너뛰고 다음 반복으로 진행한다.'
                if changes or new_output or expression or decision or returned or observed or action:
                    trace.append({'line':line,'scope':'전체' if frame.f_code.co_name=='<module>' else frame.f_code.co_name,'code':source_lines[line-1] if line<=len(source_lines) else '', 'changes':changes,'observed':observed,'output':new_output,'outputRepr':repr(new_output),'expression':expression,'action':action,'decision':decision,'returned':returned})
                if len(trace)>4000:raise RuntimeError('Execution trace limit exceeded')
            def tracer(frame,event,arg):
                if frame.f_code.co_filename!='<question>':return None
                fid=id(frame)
                if event=='call' and frame.f_code.co_name!='<module>':
                    initial=snap(frame);states[fid]=initial
                    trace.append({'line':frame.f_lineno,'scope':frame.f_code.co_name,'code':source_lines[frame.f_lineno-1],'changes':{k:{'before':None,'after':v} for k,v in initial.items()},'observed':initial,'output':'','outputRepr':"''",'expression':None,'decision':'함수 호출 · 인수를 매개변수에 전달','returned':None})
                elif event=='line':
                    flush(frame,next_line=frame.f_lineno);pending[fid]=frame.f_lineno
                elif event=='exception':
                    flush(frame);frames_with_error.add(fid)
                elif event=='return':flush(frame,return_value=arg,is_return=True)
                return tracer
            error=None
            try:
                sys.settrace(tracer)
                with contextlib.redirect_stdout(stream):exec(compile(tree,'<question>','exec'),ns)
            except Exception as exc:
                tb=exc.__traceback__;line=None
                while tb:
                    if tb.tb_frame.f_code.co_filename=='<question>':line=tb.tb_lineno
                    tb=tb.tb_next
                error={'name':type(exc).__name__,'message':str(exc),'line':line}

            finally:sys.settrace(None)
            expected=expected_errors.get(q['id'])
            assert (error or {}).get('name')==expected,(q['id'],error)
            stdout=stream.getvalue()
            if q['type']=='code' and not (q.get('random') or q.get('randomRule')) and q.get('output') is not None:assert stdout==q['output'],(q['id'],repr(stdout),repr(q['output']))
            if q.get('expectedOutput'):assert stdout==q['expectedOutput'],q['id']
            for f,value in q.get('written',{}).items():assert (work/f).read_text(encoding='utf-8')==value,(q['id'],f)
            if q.get('binary'):assert (work/'bridge.png').read_bytes()==(work/'bridge_copy.png').read_bytes(),q['id']
            if q['id'] in short_types:assert type(ns['value' if q['id']=='BS05' else 'text']).__name__==q['answer'],q['id']
            final={k:val(v) for k,v in ns.items() if not k.startswith('__')}
            random_case=bool(q.get('random') or q.get('randomRule') or q['id']=='BM13')
            notes=[]
            if random_case:notes.append('난수 값은 검증한 한 실행 예시다. 실행마다 달라질 수 있으며 문항의 정답은 제시한 범위/생성 규칙을 기준으로 판단한다.')
            if q.get('notebookCell') or q.get('notebookCells') or q['id'] in ['BM01','BM02']:notes.append('출력 칸은 print가 만든 표준출력이다. 대입 없는 식의 계산값과 Notebook의 자동 표시 여부는 별도로 구분한다.')
            if error:notes.append('표시한 예외가 발생한 지점에서 정상 실행이 중단된다. 그 뒤 문장이 정상 실행된 것으로 이어서 계산하지 않는다.')
            if q['id']=='BM05':notes.append('아래 실행은 정답 대입문을 넣은 경우다. 다른 세 대입문은 내장 sum을 가리지 않아6을 정상 출력한다.')
            files={f:(work/f).read_text(encoding='utf-8') for f in q.get('written',{})}
            if q['id']=='BM31':files['sample.txt']=(work/'sample.txt').read_text(encoding='utf-8')
            if q['id']=='BM50':files['log.txt']=(work/'log.txt').read_text(encoding='utf-8')
            return {'variant':variant,'sourceCode':code,'input':inputs,'stdout':stdout,'stdoutRepr':repr(stdout),'exception':error,'trace':trace,'finalState':final,'files':files,'notes':notes,'randomExample':random_case}
        finally:sys.settrace(None);builtins.input=saved_input;os.chdir(cwd)

for q in D['bank']:
    if q['type']=='code':
        info={**CG[q['id']],'intent':q['goal']}
    else:info=dict(G[q['id']])
    if q.get('code'):
        runtime=run(q);info['runtime']=runtime
        if q['type']=='code':
            evidence=[]
            for b in q['blanks']:
                rows=[r for r in runtime['trace'] if r['line']==b['line']]
                selected=rows if len(rows)<=3 else rows[:2]+rows[-1:]
                evidence.append({'number':b['number'],'line':b['line'],'source':q['code'].splitlines()[b['line']-1],'observations':selected})
            info['blankEvidence']=evidence
    results[q['id']]=info
    audit.append({'id':q['id'],'reasoningSteps':len(info['reasoning']),'hasRuntime':bool(info.get('runtime')),'traceSteps':len(info.get('runtime',{}).get('trace',[])),'exception':info.get('runtime',{}).get('exception',{}),'passed':True})
assert set(CG)=={q['id'] for q in D['bank'] if q['type']=='code'}
assert set(G)=={q['id'] for q in D['bank'] if q['type']!='code'}
assert len(results)==len(D['bank']) and all(x['reasoning'] for x in results.values())
(E/'practice-source/detailed-solutions.json').write_text(json.dumps(results,ensure_ascii=False,indent=2)+'\n')
report={'date':'2026-10-24','questions':len(results),'manuallyAuthoredConceptGuides':len(G),'manuallyAuthoredCodeGuides':len(CG),'manuallyAuthoredTotal':len(G)+len(CG),'executionCases':sum(x['hasRuntime'] for x in audit),'traceSteps':sum(x['traceSteps'] for x in audit),'passed':True,'cases':audit,'limits':['Independent execution of author-written code, never student input.','BM01 follows specified cell order; BM05/BM45 include the correct option.','Random values are an explicitly labeled sample.','Active keys retain the source code; retired questions and removed blanks are archived by the explicit quality policy.']}
(E/'final-audit/detailed-solutions-execution.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['cases','limits']},ensure_ascii=False))
