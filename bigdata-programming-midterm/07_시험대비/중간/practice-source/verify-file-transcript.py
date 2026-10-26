"""Verify transcript additions without changing lecture files or learner storage."""
from audit_invariants import declared_additions, CORRECTED,reviewed_bank
from pathlib import Path
from urllib.parse import unquote
import ast, contextlib, hashlib, io, json, os, re, sys, tempfile, unicodedata

E = Path(__file__).resolve().parent.parent
if E == Path('/'):
    E = Path(json.load(open('/tmp/bigdata-transcript-paths.json'))['exam'])
C = E.parent.parent
R = C.parent
T = json.loads((E/'concept-source/file-transcript.json').read_text())
D = json.loads((E/'concept-source/concept-data.json').read_text())
Q = json.loads((E/'practice-source/questions.json').read_text())
before = json.loads((E/'final-audit/file-transcript-before-bank.json').read_text())
checks = []
def ck(value, label):
    assert value, label
    checks.append(label)

raw = Path(T['source']['source']).read_bytes()
ck(raw == Path(T['source']['originalAttachment']).read_bytes(), 'raw transcript preserved byte for byte')
ck(hashlib.sha256(raw).hexdigest() == T['source']['sha256'], 'raw transcript SHA256')
lines = raw.decode().splitlines()
nonempty = {i for i,line in enumerate(lines, 1) if line.strip()}
mapped = {n for v in T['items'].values() for n in v['lines']}
ck(len(lines)==91 and len(nonempty)==46, '91 physical lines and 46 content paragraphs')
ck(mapped | {53,55,57} == nonempty, 'all technical paragraphs or separated discussion accounted for')
ck(not mapped & {53,55,57}, 'discussion paragraphs not presented as code concepts')
ck(T['source']['lectureDate']=='미확인', 'no invented lecture date')
concepts = {c['key']: c for section in D['sections'] for c in section['items']}
ck(len(concepts)==98 and len(T['items'])==14, '98 existing concepts with 14 supplemental annotations')
processing = (C/'03_주차별정리/파일입출력_전사대조.md').read_text()
for key, item in T['items'].items():
    c = concepts[key]
    ck(c['transcript']['lines']==item['lines'], key+' source lines')
    ck(all(n in c['notes'] for n in item['notes']), key+' concept notes generated')
    ck(all(n in processing for n in item['notes']), key+' processing note matches canonical source')
    ck(f'id="{c["id"]}"' in processing, key+' processing anchor')
    ck(all(n in nonempty for n in item['lines']), key+' valid source paragraphs')
    ck(all(n in (E/'01_핵심개념과_문법.md').read_text() for n in item['notes']), key+' MD contains explanation')

added=declared_additions(Q)
original=[q for q in reviewed_bank(Q) if q['id'] not in added]
ck(len(original)==192 and {t:sum(q['type']==t for q in original) for t in ['code','short','mc']}=={'code':118,'short':24,'mc':50}, 'original question types unchanged')
ck(len(reviewed_bank(Q))==192+len(added), 'only declared new questions appended')
ck(sum(len(q.get('blanks',[])) for q in original)==307, '307 code blanks unchanged')
old_bank = before['bank'] if isinstance(before,dict) else before
ck([q['id'] for q in original]==[q['id'] for q in old_bank], 'question IDs and order unchanged')
ck(Q['version']=='2026-10-20-notice-1', 'same storage data version')
revision_before={c['id']:c['before']for r in Q['supplementalQuestionRevisions']for c in r['changes']if c['id']in CORRECTED}
for q, old in zip(original,old_bank):
    candidate=revision_before[q['id']]if q['id']in CORRECTED else q
    ck({k:v for k,v in candidate.items() if k!='transcriptGuidance'}==old, q['id']+' preserved or matches archived pre-scope-correction question')
    if q['id'] in T['questionGuidance']:
        g = T['questionGuidance'][q['id']]
        ck(q['transcriptGuidance']==dict(g,source='BIG-023'), q['id']+' supplemental explanation source')
        ck(all(n in (E/'12_공지반영_정답과해설.md').read_text() for n in g['notes']), q['id']+' generated answer MD')
    ck('.lstrip(' not in q.get('code','') and '.lstrip(' not in q.get('template',''), q['id']+' no new oral-only lstrip assessment')
merged=[item for item in Q.get('duplicateReview',{}).get('retired',[])+Q.get('wholeExampleRevision',{}).get('retired',[])if item['before'].get('transcriptGuidance')]
ck(sum('transcriptGuidance' in q for q in Q['bank'])+len(merged)==16, '16 source annotation groups retained or explicitly transferred to surviving original')
for item in merged:
 ck(item['replacementId']in {q['id']for q in Q['bank']},item['id']+' annotation has active surviving question')
 part=(E/'12_공지반영_정답과해설.md').read_text().split('## '+item['replacementId']+'\n',1)[1].split('\n## ',1)[0]
 ck(all(note in part for note in item['before']['transcriptGuidance']['notes']),item['id']+' emphasis rendered in surviving question answer')

def execute(code, files=None):
    ast.parse(code)
    cwd = Path.cwd()
    with tempfile.TemporaryDirectory(prefix='bigdata-transcript-') as td:
        try:
            os.chdir(td)
            for name,text in (files or {}).items():Path(name).write_text(text,encoding='utf-8')
            stream=io.StringIO();ns={}
            with contextlib.redirect_stdout(stream):exec(code,ns)
            return ns,stream.getvalue()
        finally:os.chdir(cwd)

e = T['example']
ns,out = execute(e['code'], {name:D['fixtures'][name] for name in e['files']})
ck(out==e['output'], 'supplement code exact output')
ck(ns['infile'].closed and isinstance(ns['text'],str), 'with retains closed object and saved str')
try:ns['infile'].read()
except ValueError:ck(True,'closed file read ValueError')
else:raise AssertionError('closed file remained readable')
ns,out = execute('with open("a.txt", encoding="utf-8") as f:\n    first = f.read(2)\n    rest = f.read()\n    view = rest[:2]\n    end = f.read()\n    f.seek(0)\n    back = f.read(2)',{'a.txt':'AB\nCD'})
ck([ns[k] for k in ['first','rest','view','end','back']]==['AB','\nCD','\nC','','AB'],'read cursor, string slice, EOF, seek')
ns,out = execute('with open("a.txt", encoding="utf-8") as f:\n    one = f.readline()\n    remaining = f.readlines()\n    eof = f.readline()',{'a.txt':'A\nB\nC\n'})
ck(ns['one']=='A\n' and ns['remaining']==['B\n','C\n'] and ns['eof']=='','readline and readlines current position')
value=' \t,A, \n'
ck(value.strip()==',A,' and value.lstrip()==',A, \n' and value.rstrip()==' \t,A,', 'strip, lstrip, rstrip preserve punctuation')
ck(value.rstrip('\n')==' \t,A, ', 'rstrip newline preserves other whitespace')
with tempfile.TemporaryDirectory(prefix='bigdata-modes-') as td:
    f=Path(td)/'m.txt';f.write_text('old',encoding='utf-8')
    with f.open(encoding='utf-8') as stream:ck(stream.read()=='old','default r reads existing content')
    ck(f.read_text()=='old','r does not truncate')
    with f.open('w',encoding='utf-8'):pass
    ck(f.read_bytes()==b'', 'w truncates at open even without write')
    with f.open('a',encoding='utf-8') as stream:stream.write('A');stream.write('B')
    ck(f.read_text()=='AB','write no automatic newline')
    with f.open('a',encoding='utf-8') as stream:stream.write('\nC')
    ck(f.read_text()=='AB\nC','a appends and explicit newline')
    try:f.open('x',encoding='utf-8')
    except FileExistsError:ck(True,'x protects existing file')
    else:raise AssertionError('x overwrote file')
    payload=bytes(range(250))*10;src=Path(td)/'src.bin';dst=Path(td)/'dst.bin';src.write_bytes(payload)
    sizes=[];writes=0
    with src.open('rb') as source, dst.open('wb') as target:
        while True:
            block=source.read(1024);sizes.append(len(block))
            if not block:break
            target.write(block);writes+=1
    ck(sizes==[1024,1024,452,0] and writes==3, '2500 bytes four reads and three writes')
    ck(dst.read_bytes()==payload,'binary copy exact bytes')
    ck(len('가')==1 and len('가'.encode('utf-8'))==3,'text characters versus bytes')
totals=[]
for line in ['100 Susan 10.0 21.4','101 Brad 16.8 20.0','102 Jenn 19.5 20.0']:
    fields=line.split();total=0.0
    for token in fields[2:]:total+=float(token)
    totals.append((fields[1],total))
ck(totals==[('Susan',31.4),('Brad',36.8),('Jenn',39.5)],'float time tokens and per-person reset with explicit verification fixture')
ck('10.5'.split()==['10.5'],'split whitespace retains decimal point')

guide_files=[]
for p in R.iterdir():
    n=unicodedata.normalize('NFC',p.name)
    if n.startswith(('02_시험대비_웹디자인_','03_시험대비_개념정리_')) and n.endswith('.md'):guide_files.append(p)
ck(len(guide_files)==2,'two canonical shared guides found')
mirror=next(p for p in R.iterdir() if unicodedata.normalize('NFC',p.name)=='단위조작이론및실험2')/'kw-exam-site/study-standards'
for p in guide_files:
    mirror_p=mirror/p.name;ck(mirror_p.exists(),p.name+' existing mirror')
    marker='code-stimulus-standard' if p.name.startswith('03_') else 'readable-code-stimulus'
    def block(file):
        s=file.read_text();return s.split('<a id="'+marker+'"></a>',1)[1].split('\n## 18.',1)[0].strip()
    ck(block(p)==block(mirror_p),p.name+' same new standard in mirror')
    ck(p.read_text().count(f'id="{marker}"')==1,p.name+' unique anchor')
    for token in ['실제','코드','조건','셀','출력','들여쓰기','정답','인쇄','저장']:
        ck(token in block(p),p.name+' requirement '+token)

result={'date':'2026-10-22','passed':True,'checks':len(checks),'conceptNotes':14,'answerAnnotations':16,'newConceptCodeExamples':1,'unchangedQuestions':190,'documentedScopeCorrections':sorted(CORRECTED),'sharedGuides':4,'rawSourceSha256':T['source']['sha256'],'checkNames':checks,'limits':['The transcript was supplied as text. Lecture date, audio and timing are unconfirmed.','The small Susan/Brad/Jenn test is an explicit verifier fixture; it does not replace the lecture input.','Oral-only lstrip is supplemental and is not added to the slide-only question scope.']}
(E/'final-audit/file-transcript-execution.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k not in ['checkNames','limits']},ensure_ascii=False))
