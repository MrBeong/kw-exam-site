from noncode_invariants import restore_before_noncode
# This script preserves its historical scope; verify-noncode.py audits the actual current bank.
from audit_invariants import reviewed_bank
"""코드 제시 보완 문항을 임시 폴더에서 실행하고, 기존 정답·채점 기록 호환도 대조한다."""
from pathlib import Path
import ast,builtins,contextlib,io,json,os,subprocess,sys,tempfile
E=Path(__file__).resolve().parent.parent;D=restore_before_noncode(json.loads((E/'practice-source/questions.json').read_text()));B={q['id']:q for q in D['bank']};R=D['presentationRevision'];checks=[];cases=[]
def ck(value,label):
 assert value,label
 checks.append(label)
expect={
'BM02':{'out':'3\n','state':{'x':3}},
'BM07':{'out':'-2\n1\n-1\n'},'BM08':{'out':'512\n1\n'},'BM09':{'out':'True\nFalse\n'},'BM12':{'out':'5\n3\n1\n'},
'BM13':{'out':''},'BM15':{'out':'','state':{'result':10}},'BM18':{'out':'','state':{'stops':['A','B','C','D','E','F']}},
'BM19':{'out':'[1, 2, [3, 4]]\n3\n'},'BM20':{'out':'20\n[10, 30]\n'},'BM21':{'out':'None\n[10, 20, 30]\n'},
'BM23':{'out':"['foo', 'bar', 'baz']\n"},'BM24':{'out':'','expr':{'list(keys_view)':['foo','bar','baz'],'keys_list':['foo','bar']}},
'BM25':{'out':"없음\n{'one': '하나'}\n"},'BM27':{'out':'','state':{'first':'A\nB\n','second':''}},'BM28':{'out':'','state':{'line':'  Alice  \n'}},
'BM29':{'out':'True\n','error':'ValueError'},'BM30':{'out':'1\n3\n'},'BM31':{'out':'','files':{'sample.txt':'HelloPython'}},
'BM32':{'out':'','error':'TypeError','state':{'a':[9,2],'s':'ab'}},'BM33':{'out':'123.46\n'},
'BM34':{'out':'','state':{'text':'DATA'},'fixtures':{'sample.txt':'DATA'}},'BM38':{'out':'','error':'NameError'},
'BM39':{'out':'[1, 2, 3, 4]\n[3]\n'},'BM41':{'out':"'w'\n' '\n"},'BM42':{'out':"[('foo', 1), ('bar', 2)]\n"},
'BM43':{'out':'','error':'ValueError'},'BM44':{'out':'[]\n','error':'ValueError'},'BM47':{'out':'','error':'TypeError'},
'BM49':{'out':'0\n99\n1\n'},'BM50':{'out':'','fixtures':{'log.txt':''},'files':{'log.txt':'RUN\nRUN\n'}},
'BS02':{'out':'','error':'TypeError'},'BS03':{'out':'','error':'ZeroDivisionError'},'BS04':{'out':'','error':'NameError'},
'BS05':{'out':'','input':['20'],'expr':{'type(value).__name__':'str'}},'BS09':{'out':'10\n','state':{'result':None}},'BS16':{'out':'','expr':{'type(value).__name__':'int'}}}
original_input=builtins.input
cwd=Path.cwd()
for item in R['changes']:
 q=B[item['id']];before=item['before'];id=q['id'];ck(before.get('code') is None,id+' adds absent example')
 for key in ['id','type','options','optionIds','correct','answer','conceptIds','scope','section']:
  if id in ['BM33','BM39'] and key=='options':
   ck(q.get(key)!=before.get(key) and any(c['id']==id and c['resetAnswer'] for r in D['supplementalQuestionRevisions'] for c in r['changes']),id+' documented option correction')
  else:ck(q.get(key)==before.get(key),id+' preserves '+key)
 ast.parse(q['code']);ck(True,id+' valid Python syntax')
 if id=='BM05':
  for i,choice in enumerate(q['options']):
   ns={};buf=io.StringIO();error=None
   try:
    with contextlib.redirect_stdout(buf):exec(choice+'\n'+q['code'],ns)
   except Exception as e:error=type(e).__name__
   ck((error=='TypeError')==(i==q['correct']),id+' unique failing choice '+str(i+1))
   if i!=q['correct']:ck(buf.getvalue()=='6\n',id+' valid choice output '+str(i+1))
  cases.append({'id':id,'pass':True,'mode':'all four actual assignments'});continue
 cfg=expect[id]
 with tempfile.TemporaryDirectory(prefix='bigdata-code-examples-') as temp:
  work=Path(temp)/'data';work.mkdir();ns={'__file__':str(Path(temp)/'src/main.py')};buf=io.StringIO();error=None
  try:
   os.chdir(work)
   for name,content in cfg.get('fixtures',{}).items():Path(name).write_text(content,encoding='utf-8')
   values=iter(cfg.get('input',[]));builtins.input=lambda prompt='':next(values)
   try:
    with contextlib.redirect_stdout(buf):exec(compile(q['code'],str(ns['__file__']),'exec'),ns)
   except Exception as err:error=type(err).__name__
   ck(error==cfg.get('error'),id+' expected completion/exception')
   ck(buf.getvalue()==cfg['out'],id+' output')
   for name,value in cfg.get('state',{}).items():ck(ns[name]==value,id+' state '+name)
   for expr,value in cfg.get('expr',{}).items():ck(eval(expr,ns)==value,id+' expression '+expr)
   for name,content in cfg.get('files',{}).items():ck(Path(name).read_text(encoding='utf-8')==content,id+' written '+name)
   if id=='BM13':ck(type(ns['value']) is int and 1<=ns['value']<=6,id+' integer range')
   if id=='BM18':
    for i,choice in enumerate(q['options']):
     failed=False
     try:ns['stops'][int(choice)]
     except IndexError:failed=True
     ck(failed==(i==q['correct']),id+' unique invalid index '+choice)
   if id=='BM28':
    for i,choice in enumerate(q['options']):ck((eval(choice,ns)=='  Alice  ')==(i==q['correct']),id+' exact whitespace choice '+str(i+1))
   if id=='BS16':
    changed=q['code'].replace('(1)','(1,)');exec(changed,ns);ck(isinstance(ns['value'],tuple) and len(ns['value'])==1,id+' comma creates singleton tuple')
   if id=='BM02':
    cell={};exec('x = 3',cell);display=eval('x + 4',cell);ck(display==7 and cell['x']==3,id+' notebook display versus assignment')
   cases.append({'id':id,'pass':True,'output':buf.getvalue(),'exception':error})
  finally:builtins.input=original_input;os.chdir(cwd)
ck(len(cases)==38,'38 examples executed')
added=set(D.get('fileTranscriptAssessment',{}).get('addedIds',[]))|set(D.get('shortAnswerExpansion',{}).get('addedIds',[]))|set(D.get('lectureOriginalBlanks',{}).get('addedIds',[]))
base=[q for q in reviewed_bank(D) if q['id'] not in added]
ck(len(base)==192 and {t:sum(q['type']==t for q in base) for t in ['code','short','mc']}=={'code':118,'short':24,'mc':50},'base 192 question type counts unchanged')
ck(len(reviewed_bank(D))==192+len(added),'only declared assessment questions appended')
ck(D['version']=='2026-10-20-notice-1','storage version unchanged')
ck(not json.loads((E/'practice-source/coverage.json').read_text())['missing'],'concept coverage unchanged')
# 재생성본의 문제·해설 MD에 코드가 실제로 포함되어야 한다.
for qid in [item['id'] for item in R['changes']]:
 for file in ['11_공지반영_예상문제.md','12_공지반영_정답과해설.md']:
  txt=(E/'previous/before-noncode-audit-2026-10-25'/file).read_text();marker='## '+qid;section=txt.split(marker+' ·' if file.startswith('11_') else marker+'\n',1)[1].split('\n## ',1)[0]
  ck(B[qid]['code'] in section,qid+' generated '+file)
result={'date':'2026-10-22','python':sys.version,'examples':len(cases),'checks':len(checks),'passed':True,'cases':cases,'checkNames':checks,'limits':['Python의 독립 임시 실행이다. 실제 Jupyter 커널을 조작하지 않았다.','BM33/BM39의 강의 범위 교정은 별도 수정 이력으로 검증한다. 그 외 기존 정답/보기는 보존한다.']}
(E/'final-audit/code-examples-execution.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in result.items() if k not in ['cases','checkNames','limits']},ensure_ascii=False))
