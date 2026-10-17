# -*- coding: utf-8 -*-
"""Rebuild answers from actual question JSON, then run each in a fresh native R process.
Requires R and lawstat/jsonlite (PSY_R_LIBRARY can point to a private library).
"""
from pathlib import Path
import csv,hashlib,json,os,re,shutil,subprocess,sys,xml.etree.ElementTree as ET,zipfile
B=Path(__file__).resolve().parent;E=B.parent.parent;C=E.parent.parent
runtime=shutil.which('Rscript') or ('/opt/homebrew/bin/Rscript' if Path('/opt/homebrew/bin/Rscript').exists() else None)
if not runtime:raise SystemExit('Install R before running this audit')
book=E/'final-audit/fixtures/regression1.xlsx'
if not book.is_file():book=next((C/'01_강의자료').glob('regression1.xlsx'))
ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(book) as z:
 sheet=ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
 rows=[]
 for row in sheet.findall('.//s:sheetData/s:row',ns)[1:]:
  cells={re.sub(r'\d','',x.attrib['r']):x.findtext('s:v',namespaces=ns) for x in row.findall('s:c',ns)}
  if all(cells.get(k) is not None for k in 'ABC'):
   rows.append([float(cells[k]) for k in 'ABC'])
assert len(rows)==12,rows
with (B/'regression1.csv').open('w') as f:
 writer=csv.writer(f);writer.writerow(['satisfaction','absence','aptitude']);writer.writerows(rows)
result=[];blanks=0
for bank in ['written','mock-exam']:
 for q in json.loads((E/bank/'questions.json').read_text()):
  if q['type']!='code':continue
  filled=re.sub(r'\{\{(\d+)\}\}',lambda m:next(b['answer'] for b in q['codeBlanks'] if b['id']==m[1]),q['codeTemplate'])
  assert filled==q['modelCode'],q['id']+' code/blank mismatch'
  assert sum(r['points'] for r in q['rubric'])==q['points']
  original=q.get('originId',q['id'])
  if original in ['RC001','RC002','RC003','RC017','RC018']:provenance='question_literal_vectors'
  elif original=='RC019':provenance='question_complete_eight_row_table'
  elif original in ['RC013','RC014','RC015','RC016']:provenance='provided_regression1.xlsx_actual_12_rows'
  else:provenance='question_visible_constructed_practice_data'
  case={**q,'originId':original,'bank':bank,'inputProvenance':provenance}
  if original=='RC019':
   values=re.findall(r'<tr>(.*?)</tr>',q['visual'],re.S)[1:]
   values=[re.findall(r'<td>(.*?)</td>',r) for r in values]
   case['providedRows']={k:[(x[i]=='TRUE') if i in [1,2,3] else int(x[i]) for x in values] for i,k in enumerate(['PSS','Present','Correct','Timeout','Time'])}
  source=B/(q['id']+'-answer.R');source.write_text(filled+'\n')
  (B/(q['id']+'.R')).write_text('# Question data followed by the completed answer.\n'+q.get('codeSetup','')+'\n\n'+filled+'\n')
  test=B/(q['id']+'.json');test.write_text(json.dumps(case,ensure_ascii=False,indent=2)+'\n')
  run=subprocess.run([runtime,'--vanilla',str(B/'verify_case.R'),str(test)],text=True,capture_output=True)
  if run.stdout or run.stderr:(B/(q['id']+'-runner.txt')).write_text(run.stdout+run.stderr)
  else:(B/(q['id']+'-runner.txt')).unlink(missing_ok=True)
  path=B/(q['id']+'-result.json')
  actual=json.loads(path.read_text()) if path.exists() else {'id':q['id'],'status':'fail','error':run.stderr}
  actual.update(bank=bank,blanks=len(q['codeBlanks']),codeSha256=hashlib.sha256(filled.encode()).hexdigest(),setupSha256=hashlib.sha256(q.get('codeSetup','').encode()).hexdigest(),returnCode=run.returncode)
  result.append(actual);blanks+=len(q['codeBlanks'])
  print(q['id'],actual['status'],actual.get('metrics',{}).get('error',''))
summary={'date':'2026-10-17','Rscript':runtime,'questions':len(result),'blanks':blanks,'passed':sum(r['status']=='pass' for r in result),'checks':sum(len(r.get('checks',[])) for r in result),'workbookSha256':hashlib.sha256(book.read_bytes()).hexdigest(),'results':result}
(B/'results.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in summary.items() if k!='results'},ensure_ascii=False))
if summary['passed']!=summary['questions']:sys.exit(1)
