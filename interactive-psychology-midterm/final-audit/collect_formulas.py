from pathlib import Path
import json,re,html
E=Path(__file__).resolve().parent.parent
entries={}
def take(s,origin,dollar=False):
 s=html.unescape(s)
 for m in re.finditer(r'\\\(([\s\S]*?)\\\)|\\\[([\s\S]*?)\\\]',s):entries.setdefault(m[1] or m[2],[]).append(origin)
 if dollar:
  for m in re.finditer(r'(?<!\\)\$([^$\n]+)\$',s):entries.setdefault(m[1],[]).append(origin)
def walk(v,origin):
 if isinstance(v,str):take(v,origin)
 elif isinstance(v,list):
  for x in v:walk(x,origin)
 elif isinstance(v,dict):
  for k,x in v.items():
   if k not in ['codeTemplate','modelCode','codeBlanks','promptPlain','stemPlain']:walk(x,origin+':'+k)
for bank in ['written','multiple-choice','mock-exam']:
 for q in json.loads((E/bank/'questions.json').read_text()):walk(q,q['id'])
for name in ['written/main-template.html','ox/index.html']:
 text=(E/name).read_text();markup=re.sub(r'<script\b[^>]*>[\s\S]*?</script>|<style\b[^>]*>[\s\S]*?</style>','',text)
 take(markup,name)
 if name.startswith('ox'):
  for i,m in enumerate(re.finditer(r'  q\("([^"\n]+)",R`([\s\S]*?)`,(true|false),R`([\s\S]*?)`,"([^"\n]+)","([^"\n]+)"\);',text)):
   take(m[2],f'OX{i+1:03}:statement');take(m[4],f'OX{i+1:03}:explanation')
  meta=re.search(r'const chapterMeta\s*=\s*({[\s\S]*?});',text)
  if meta:walk(json.loads(meta[1]),'OX chapter overview')
for f in E.glob('*.md'):
 text=re.sub(r'```[\s\S]*?```|`[^`\n]*`','',f.read_text())
 take(text,f.name,f.name[:2] not in ['03','04','07','08','10','11','13','14','15'])
result=[{'tex':k,'origins':sorted(set(v))} for k,v in entries.items()]
(E/'final-audit/formulas.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print('unique formulas',len(result))
