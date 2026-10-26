"""빈칸 답으로 실제 소스를 복원한 뒤 새 임시 디렉터리에서만 실행한다."""
import ast
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

root = Path(__file__).resolve().parent
package = root.parent if root.name == 'practice-source' else root / 'package'
data = json.loads((package / 'practice-source/questions.json').read_text())
subject = Path(data['sources'][0]['source']).parent.parent
results = []
runner = '''
import builtins, contextlib, io, json
job=json.load(__import__('sys').stdin)
values=iter(job.get('input', []))
builtins.input=lambda prompt='': next(values)
buf=io.StringIO()
namespace={'__file__':job['filename']}
with contextlib.redirect_stdout(buf):
    exec(compile(job['code'],job['filename'],'exec'),namespace)
states={key:eval(key,namespace) for key in job.get('stateKeys',[])}
displays={key:eval(key,namespace) for key in job.get('displayKeys',[])}
print(json.dumps({'output':buf.getvalue(),'states':states,'displays':displays},ensure_ascii=False))
'''
bank=data['bank']
assert len({q['id'] for q in bank})==len(bank)
for q in bank:
    assert q['conceptIds'] and q['source'] and q['pages'],q['id']
    if q['type']=='code':
        numbers=[int(n) for n in re.findall(r'⟦(\d+)⟧',q['template'])]
        assert numbers==list(range(1,len(q['blanks'])+1)),q['id']
        restored=re.sub(r'⟦(\d+)⟧',lambda m:q['blanks'][int(m[1])-1]['answer'],q['template'])
        assert restored==q['code'],q['id']
        ast.parse(restored)
        with tempfile.TemporaryDirectory(prefix='bigdata-notice-practice-') as temp:
            work=Path(temp)
            if q.get('workName'):
                work=work/q['workName'];work.mkdir()
            for f,text in data['fixtures'].items():
                (work/f).write_text(text,encoding='utf-8')
            if q.get('binary'):
                shutil.copy2(subject/'01_강의자료/ch5_lab/bridge.png',work/'bridge.png')
            for name in q.get('binaryInputFiles',[]):
                shutil.copy2(subject/'01_강의자료/ch5_lab'/name,work/name)
            job={'code':restored,'input':q.get('input',[]),'filename':str(work/'practice.py'),'stateKeys':list(q.get('finalState',{})),'displayKeys':[x['expression'] for x in q.get('displayExpressions',[])]}
            proc=subprocess.run([sys.executable,'-c',runner],input=json.dumps(job),cwd=work,text=True,capture_output=True,timeout=5)
            assert proc.returncode==0,(q['id'],proc.stderr)
            response=json.loads(proc.stdout)
            actual=response['output']
            if q.get('randomRule')=='dice10':
                assert re.fullmatch(r'(?:[1-6] ){10}',actual),(q['id'],actual)
            elif q.get('random'):
                assert re.fullmatch(r'(?:[a-z0-9]{6}\n){3}',actual),(q['id'],actual)
            elif q.get('output') is not None:
                assert actual==q['output'],(q['id'],repr(actual),repr(q['output']))
            for f,text in q.get('written',{}).items():
                assert (work/f).read_text(encoding='utf-8')==text,(q['id'],f)
            if q.get('binary'):
                assert (work/'bridge.png').read_bytes()==(work/'bridge_copy.png').read_bytes()
            assert response['states']==q.get('finalState',{}),(q['id'],response['states'])
            for item in q.get('displayExpressions',[]):
                assert response['displays'][item['expression']]==item['value'],q['id']
            assert q.get('goal'),q['id']
            results.append({'id':q['id'],'kind':'filled-code-execution','pass':True,'output':actual,'blanks':len(q['blanks'])})
    elif q['type']=='mc':
        assert len(q['options']) in (4,5) and len(q['reasons'])==len(q['options']) and 0<=q['correct']<len(q['options']),q['id']
        assert len(set(q['options']))==len(q['options']),q['id']
        assert all(q['reasons']),q['id']
        if q.get('expectedOutput'):
            with tempfile.TemporaryDirectory(prefix='bigdata-mc-output-') as temp:
                work=Path(temp)
                for name,value in data['fixtures'].items():(work/name).write_text(value,encoding='utf-8')
                proc=subprocess.run([sys.executable,'-c',runner],input=json.dumps({'code':q['code'],'input':q.get('input',[]),'filename':str(work/'mc.py')}),cwd=work,text=True,capture_output=True,timeout=5)
                assert proc.returncode==0,(q['id'],proc.stderr)
                assert json.loads(proc.stdout)['output']==q['expectedOutput'],q['id']
            results.append({'id':q['id'],'kind':'mc-code-output','pass':True})
    else:
        assert q['answer'] and q['explain'],q['id']
coverage=json.loads((package/'practice-source/coverage.json').read_text())
assert not coverage['missing']
assert len(coverage['coverage'])==98
assert len([q for q in bank if q['scope']=='lab'])==3
assert not any('Hello, World!' in q.get('code','') for q in bank)
files=[subject/'01_강의자료/week01/Untitled.ipynb']+list((subject/'01_강의자료/ch5_lab').glob('*.py'))+[Path(s['source']) for s in data['sources']]
hashes={str(p):hashlib.sha256(p.read_bytes()).hexdigest() for p in files}
report={'python':sys.version,'questions':len(bank),'types':data['counts'],'codeBlanks':sum(len(q.get('blanks',[])) for q in bank),'execution':results,'sourceHashes':hashes,'limits':['빈칸 복원 코드의 독립 Python 실행. 사용자 Jupyter UI/커널 검증 아님.','표기 일치 연습이며 실제 교수 정답표/문항 수/단원 비중은 미확보.','98개 개념군의 대응은 모든 하위 항목의 실제 출제 보장을 뜻하지 않음.']}
(package/'practice-source/execution-audit.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps({'questions':len(bank),'codeBlanks':report['codeBlanks'],'executionCases':len(results),'passed':True},ensure_ascii=False))
