from pathlib import Path
import json,subprocess,hashlib,math
e=Path(__file__).resolve().parent.parent;audit=e/'final-audit';qs=json.loads((e/'written/questions.json').read_text());by={q['id']:q for q in qs};snippets=json.loads((audit/'cram-code-examples.json').read_text())
setups='\n'.join(by[k]['codeSetup'] for k in ['RC021','RC036','RC040','RC043','RC046'])
r='''library(jsonlite)
'''+setups+'''
snippets <- fromJSON("cram-code-examples.json")
pdf("cram-code-plots.pdf", width=6, height=4)
values <- vector("list", length(snippets))
for (i in seq_along(snippets)) {
  values[[i]] <- eval(parse(text=snippets[[i]]))
}
dev.off()
checks <- c(
  identical(values[[1]], 80),
  inherits(values[[2]], "htest"),
  identical(unname(values[[3]]$null.value), 150),
  grepl("Two Sample", values[[6]]$method),
  !grepl("Welch", values[[6]]$method),
  identical(unname(values[[6]]$parameter), 38),
  all.equal(datadiff, datat2$after-datat2$before)==TRUE,
  all.equal(mean(datadiff), -33.65)==TRUE,
  identical(unname(values[[9]]$null.value), 0),
  all.equal(unname(coef(model)),c(30.9333333333,.870476190476),tolerance=1e-8)==TRUE,
  abs(summary(model)$r.squared-.682814)<1e-6,
  identical(a, baseball$득점),
  mean(a)==sum(a)/length(a),
  median(a)==(41+80)/2,
  var(a)==sum((a-mean(a))^2)/(length(a)-1),
  abs(sd(a)^2-var(a))<1e-10,
  identical(unname(quantile(a))[c(1,5)],c(16,128)),
  min(a)==16,max(a)==128,
  identical(bit,c(0,1,2,3)),
  all.equal(t.test(datadiff)$statistic,t.test(datat2$after,datat2$before,paired=TRUE)$statistic)==TRUE,
  all.equal(t.test(datat[datat$group=="Deagu",]$height,mu=150)$statistic,t.test(mu=150,x=datat[datat$group=="Deagu",]$height,alternative="two.sided")$statistic)==TRUE
)
stopifnot(all(checks))
write_json(list(status="passed", snippets=length(snippets), assertions=length(checks), runtime=R.version.string, packages=list(lawstat=as.character(packageVersion("lawstat")),jsonlite=as.character(packageVersion("jsonlite"))), checks=checks, constructed_fixture=TRUE),"cram-r-results.json",pretty=TRUE,auto_unbox=TRUE)
'''
(audit/'verify_cram_R.R').write_text(r)
result=subprocess.run(['/opt/homebrew/bin/Rscript','verify_cram_R.R'],cwd=audit,text=True,capture_output=True);print(result.stdout);print(result.stderr);assert result.returncode==0
checks=[]
def check(name,got,want):
 assert math.isclose(got,want,rel_tol=1e-10,abs_tol=1e-10),(name,got,want);checks.append({'name':name,'actual':got,'expected':want})
H=lambda ps:-sum(x*math.log2(x) for x in ps if x)
check('provided logarithms entropy',.2*2.3+.8*.3,.7);check('provided logarithms redundancy',(1-.7)*100,30)
check('matrix HX',H([.25]*4),2);check('matrix HY',H([.5,.25,.25]),1.5);check('matrix HXY',H([.25]*4),2);check('matrix I',2+1.5-2,1.5);check('matrix equivocation',2-1.5,.5);check('matrix noise',1.5-1.5,0);check('matrix accuracy',12/16,.75)
check('Hick b',(550-300)/2,125);check('Hick a',300-125*math.log2(1),300);check('Hick capacity',1000/125,8);check('Hick RT',300+125*math.log2(8),675)
check('Fitts ID argument',80/20+1,5);check('Fitts MT rounded log',50+150*2.3,395);check('Fitts variant argument',100/10+1,11);check('Fitts variant MT',50+150*3.5,575)
check('sample continuous',(2*10/(.1*80))**2,6.25);check('sample integer',math.ceil(6.25),7);check('additional',math.ceil(6.25)-5,2);check('SD n multiplier',2**2,4);check('SE n multiplier',1/math.sqrt(4),.5)
x=[1,2,3];y=[2,3,7];sx=sum((a-2)**2 for a in x);sxy=sum((a-2)*(b-4) for a,b in zip(x,y));check('Sxx',sx,2);check('Sxy',sxy,5);check('OLS slope',sxy/sx,2.5);check('OLS intercept',4-2.5*2,-1);check('OLS residual',3-(-1+2.5*2),-1)
check('ANOVA SSR',80-20,60);check('ANOVA R2',1-20/80,.75);check('ANOVA F',(60/1)/(20/(10-2)),24);check('ANOVA total df',10-1,9);check('ANOVA residual df',10-2,8);check('Donders discrimination',260-200,60);check('Donders selection',350-260,90)
check('rounded log2(5)',round(math.log2(5),1),2.3);check('rounded log2(11)',round(math.log2(11),1),3.5)
check('BMI cm conversion',81/(180/100)**2,25);check('BMI one decimal',round(81/1.8**2,1),25)
check('upper 25 percentile',100-25,75);check('sample mean',sum([2,4,6])/3,4);check('sample variance',((2-4)**2+(4-4)**2+(6-4)**2)/(3-1),4);check('sample SD',math.sqrt(4),2)
check('Sternberg YES slope',(480-420)/(4-2),30);check('Sternberg NO slope',(580-500)/(4-2),40);check('Sternberg YES intercept',420-30*2,360);check('Sternberg NO intercept',500-40*2,420)
check('VR goal interval',1.26-.16,1.10);check('VR stimulus interval',.33-.20,.13);check('3D Fitts explained percentage',.645*100,64.5);check('warning supplied entropy redundancy',(1-2.4/3)*100,20)
(audit/'cram-numeric-results.json').write_text(json.dumps({'status':'passed','checks':len(checks),'results':checks},ensure_ascii=False,indent=2)+'\n')
print('numeric checks',len(checks));print((audit/'cram-r-results.json').read_text())

# Source-level checks complement actual execution and browser layout checks.
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
class ReviewParser(HTMLParser):
 def __init__(self):
  super().__init__();self.links=[];self.ids=[];self.sections=[];self.in_pre=False;self.pre_codes=[];self.buf=[];self.recalls=0
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if a.get('id'):self.ids.append(a['id'])
  if tag=='section':self.sections.append(a)
  if tag=='details' and a.get('class')=='recall':self.recalls+=1
  for key in ['href','src']:
   if a.get(key):self.links.append(a[key])
  if tag=='pre':self.in_pre=True;self.buf=[]
 def handle_data(self,data):
  if self.in_pre:self.buf.append(data)
 def handle_endtag(self,tag):
  if tag=='pre':self.pre_codes.append(''.join(self.buf));self.in_pre=False
html_path=e/'28_시험1시간전_압축정리.html';source=html_path.read_text();parser=ReviewParser();parser.feed(source)
assert len(parser.ids)==len(set(parser.ids))
assert len(parser.sections)==6 and parser.recalls==36
for link in parser.links:
 u=urlsplit(link)
 if u.scheme or u.netloc:continue
 if u.path:assert (e/unquote(u.path)).is_file(),link
 elif u.fragment:assert u.fragment in parser.ids,link
assert 'localStorage' not in source and 'fetch(' not in source
added=json.loads((audit/'cram-added-code-cases.json').read_text());allowed=snippets+[line for case in added for line in case['code'].splitlines()]
assert all(c in allowed for c in parser.pre_codes if not c.startswith('Coefficients:'))
assert not [c for c in source if ord(c)<32 and c not in '\n\r\t']
assert 'log₂6≈2.3' not in source and '80/20+1)=2.3' in source
assert len(snippets)==24
root=e.parents[2]
if not list(root.glob('03_*.md')):root=e.parent/'study-standards'
import unicodedata
standards={}
for prefix in ['02_','03_']:
 f=next(f for f in root.glob(prefix+'*.md') if '표준' in unicodedata.normalize('NFC',f.name));standards[prefix]=f.read_text()
required=['## 17.', '## 18.', '| 강의 입력 코드 대응 |','한 줄 전체 모범답안·허용 대안','문항별 기록 표','채점 예시','실행을 막는 오타']
assert all(x in standards['03_'] for x in required)
assert '부분 빈칸과 한 줄 전체 작성 필터/입력란' in standards['02_']
assert (e/'index.html').read_bytes()==(e/'인터랙티브심리학_중간고사_Notion.html').read_bytes()
result={'status':'passed','sections':6,'recalls':36,'r_snippets':len(snippets),'linked_assets_and_targets':len(parser.links),'duplicate_ids':0,'artifact_does_not_write_learning_storage':True,'production_standard_connections':required}
(audit/'cram-source-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(result)

added_results=[]
for case in added:
 code=case['setup']+'\n'+case['code']+'\nstopifnot('+case['assert']+')\n'
 target=audit/('cram-added-'+case['id']+'.R');target.write_text(code)
 r=subprocess.run(['/opt/homebrew/bin/Rscript','--vanilla',str(target)],cwd=audit,text=True,capture_output=True)
 assert r.returncode==0,(case['id'],r.stderr)
 added_results.append({'id':case['id'],'status':'passed','statements':len(case['code'].splitlines()),'assert':case['assert']})
(audit/'cram-added-R-results.json').write_text(json.dumps({'status':'passed','cases':added_results},ensure_ascii=False,indent=2)+'\n')
print('Added actual R cases passed:',len(added_results))
