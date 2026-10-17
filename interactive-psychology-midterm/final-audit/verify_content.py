"""Final structural, numeric and coverage audit. Run with Python 3, no extra packages."""
from pathlib import Path
import json,re,math,statistics,zipfile,xml.etree.ElementTree as ET
E=Path(__file__).resolve().parent.parent
checks=[]
def check(ok,label):
 assert ok,label
 checks.append(label)
def close(a,b,label,tol=1e-8):check(math.isclose(a,b,rel_tol=tol,abs_tol=tol),label)
cs=json.loads((E/'multiple-choice/concepts.json').read_text());ids={c['id'] for c in cs}
ox=[]
for i,m in enumerate(re.finditer(r'  q\("([^"\n]+)",R`([\s\S]*?)`,(true|false),R`([\s\S]*?)`,"([^"\n]+)","([^"\n]+)"\);',(E/'ox/index.html').read_text())):
 ox.append(dict(id=f'OX{i+1:03}',chapter=m[1],statement=m[2],answer=m[3]=='true',explanation=m[4],source=m[5],kind=m[6]))
check(len(ids)==len(cs)==len(ox)==188,'188 unique concepts and OX items')
banks={b:json.loads((E/b/'questions.json').read_text()) for b in ['multiple-choice','written','mock-exam']}
coverage=[]
for c in cs:
 row={**c,'notesAnchor':'c'+str(list(dict.fromkeys(x['chapter'] for x in cs)).index(c['chapter'])+1),'canonical':ox[int(c['id'][2:])-1]['explanation']}
 for b,qs in banks.items():
  row[b]=[q['id'] for q in qs if c['id'] in q['conceptIds']];check(bool(row[b]),c['id']+' coverage '+b)
 coverage.append(row)
check((E/'index.html').read_bytes()==(E/'인터랙티브심리학_중간고사_Notion.html').read_bytes(),'main HTML aliases identical')
code_count=blanks=options=rubrics=0
for b,qs in banks.items():
 check(len({q['id'] for q in qs})==len(qs),b+' unique IDs')
 for q in qs:
  check(set(q['conceptIds'])<=ids and bool(q['conceptIds']),q['id']+' concept IDs valid')
  if 'options' in q:
   options+=len(q['options']);check(len(q['options'])==4 and len({o['id'] for o in q['options']})==4,q['id']+' four unique options')
   right=sum(o['correct'] for o in q['options']);check(right in [2,3] if q['type']=='multi' else right==1,q['id']+' answer cardinality')
   check(all(o['explanation'] for o in q['options']),q['id']+' all options explained')
  if q['type']=='tf':check(len(q['statements'])==2 and all(isinstance(s['correct'],bool) and s['explanation'] for s in q['statements']),q['id']+' both TF statements keyed/explained')
  if q.get('rubric'):
   rubrics+=len(q['rubric']);close(sum(r['points'] for r in q['rubric']),q['points'],q['id']+' rubric sum')
   check(all(r['points']>0 and r['criterion'] for r in q['rubric']),q['id']+' positive explained rubric items')
  if q['type']=='code':
   code_count+=1;blanks+=len(q['codeBlanks']);keys=[b['id'] for b in q['codeBlanks']]
   check(re.findall(r'\{\{(\d+)\}\}',q['codeTemplate'])==keys,q['id']+' blank order')
   filled=re.sub(r'\{\{(\d+)\}\}',lambda m:next(b['answer'] for b in q['codeBlanks'] if b['id']==m[1]),q['codeTemplate'])
   check(filled==q['modelCode'],q['id']+' exact reconstructed R model')
   check(all('\t' not in l and (len(l)-len(l.lstrip(' ')))%2==0 for l in filled.splitlines()),q['id']+' R two-space indentation')
   import hashlib
   expected=json.loads((E/'final-audit/r-source-hashes.json').read_text())[q['id']]
   actual=hashlib.sha256(json.dumps({k:q[k] for k in ['codeTemplate','codeBlanks','modelCode']},ensure_ascii=False,sort_keys=True).encode()).hexdigest()
   check(actual==expected,q['id']+' literal R source unchanged by math migration')
for n in range(1,6):
 qs=[q for q in banks['mock-exam'] if q['set']==n]
 check(len(qs)==32 and sum(q['points'] for q in qs)==100 and sum(q['minutes'] for q in qs)+10==120,'set '+str(n)+' blueprint 32/100/120')
 check({c['chapter'] for c in cs}<={q['chapter'] for q in qs},'set '+str(n)+' all seven chapters')
terms=json.loads((E/'written/english-terms.json').read_text());termset={t['term'] for t in terms}
check(len(termset)==60 and all(t['sources'] for t in terms),'60 lecture-sourced English terms')
for b in ['written','mock-exam']:
 for q in banks[b]:check(set(q.get('englishTerms',[]))<=termset,q['id']+' English terms from lecture glossary')
# Variant fixtures explicitly check grading metadata and all values changed from the source bank.
mock_by_id={q['id']:q for q in banks['mock-exam']}
check('1.6 m' in mock_by_id['ME4-Q20']['rubric'][0]['criterion'] and '1.8' not in mock_by_id['ME4-Q20']['rubric'][0]['criterion'],'ME4-Q20 rubric agrees with 160 cm prompt')
check('160' in mock_by_id['ME1-Q30']['explanation'][1] and '150' not in mock_by_id['ME1-Q30']['explanation'][1],'ME1-Q30 explanation agrees with mu160')
q=mock_by_id['ME1-Q32'];rt=[float(v) for v in re.search(r'RT <- c\(([^)]+)\)',q['modelCode'])[1].split(',')];check(rt==[280,400,520] and '280' in q['answer'] and '120' in q['answer'] and rt[1]-rt[0]==120,'ME1-Q32 actual RT data produce a280 b120')
q=mock_by_id['ME2-Q32'];check('40 + 120 * ID' in q['modelCode'] and '40' in q['prompt'] and '120' in q['prompt'] and '350.20' in q['answer'] and '455.13' in q['answer'],'ME2-Q32 coefficients agree with predicted MT and prompt')
check('4%' in mock_by_id['ME4-Q32']['answer'] and '4%' in mock_by_id['ME4-Q32']['rubric'][-1]['criterion'],'ME4-Q32 R squared and scoring agree at four percent')
# Independent arithmetic; expected values are answer/lecture fixtures, not rendered strings.
num=[]
def nclose(label,value,expected,tol=1e-8):
 close(value,expected,label,tol);num.append({'check':label,'computed':value,'expected':expected,'tolerance':tol})
def entropy(ps):return -sum(p*math.log2(p) for p in ps if p>0)
for cm,kg in [(180,81),(160,64)]:nclose(f'BMI {kg}/{cm}',kg/(cm/100)**2,25)
for n0,mean,s,z,k,total,additional,raw in [(5,100,10,1.96,.05,16,11,15.3664),(4,80,8,1.96,.04,25,21,24.01)]:
 value=(z*s/(k*mean))**2;nclose('sample raw '+str(n0),value,raw);nclose('sample total '+str(n0),math.ceil(value),total);nclose('sample additional '+str(n0),math.ceil(value)-n0,additional)
nclose('sample s doubling and k halving',((2/.5)**2),16);nclose('SE 12/sqrt36',12/math.sqrt(36),2);nclose('SE fourfold n ratio',(12/math.sqrt(144))/(12/math.sqrt(36)),.5)
for N in [1,2,4,8,16,32]:nclose('Hartley '+str(N),math.log2(N),{1:0,2:1,4:2,8:3,16:4,32:5}[N])
for ps,H,R in [([.5,.5],1,0),([.2,.8],.7219280948873623,27.807190511263773),([.9,.1],.4689955935892812,53.100440641071884),([.35,.35]+[.05]*6,2.356779649447039,21.44067835176536),([.5,.25,.125,.125],1.75,12.5),([.25,.75],.8112781244591328,18.872187554086716),([.5,.25,.25],1.5,5.360536964281395)]:
 nclose('probability sum '+str(ps),sum(ps),1);nclose('entropy '+str(ps),entropy(ps),H);nclose('redundancy '+str(ps),(1-entropy(ps)/math.log2(len(ps)))*100,R)
for H,N,R in [(.468,2,53.2),(.722,2,27.8),(.81125,2,18.875),(.7219,2,27.81),(2.3568,8,21.44),(2.25,8,25),(0,2,100)]:nclose(f'given rounded H={H} redundancy',(1-H/math.log2(N))*100,R,1e-7)
nclose('rounded .25/.75 information',.25*2+.75*.4150,.81125)
nclose('rounded .2/.8 information',.2*2.322+.8*.322,.722)
for label,mat in [('lecture',[[4,0,0,0],[4,0,0,0],[0,0,4,0],[0,0,0,4]]),('variant',[[8,0,0,0],[0,8,0,0],[0,8,0,0],[0,0,0,8]])]:
 total=sum(map(sum,mat));px=[sum(r)/total for r in mat];py=[sum(r[j] for r in mat)/total for j in range(4)];hxy=entropy([v/total for r in mat for v in r]);hx=entropy(px);hy=entropy(py);I=hx+hy-hxy
 for key,val,ex in [('HX',hx,2),('HY',hy,1.5),('HXY',hxy,2),('I',I,1.5),('equivocation',hx-I,.5),('noise',hy-I,0)]:nclose(label+' matrix '+key,val,ex)
for A,C,B,ident in [(200,260,350,60),(180,250,340,70)]:nclose('Donders identification '+str(A),C-A,ident);nclose('Donders selection '+str(A),B-C,90)
for a,b,N,RT in [(200,150,4,500),(200,150,8,650),(300,130,8,690),(180,120,4,420),(180,120,8,540),(200,100,16,600)]:nclose(f'Hick {a}+{b}log2({N})',a+b*math.log2(N),RT)
for b,rate in [(150,6.6666666667),(130,7.6923076923),(120,8.3333333333),(100,10)]:nclose('Hick throughput '+str(b),1000/b,rate)
nclose('Hick warning 20 percent reduction',250*.8,200);nclose('Hick 8 to2 time difference',150*(math.log2(2)-math.log2(8)),-300)
for a,b,D,W,MT in [(50,150,80,20,398.28921423310436),(50,150,100,10,568.9147427955946),(40,120,100,20,350.1955000865387),(40,120,200,20,455.1317942364757)]:nclose(f'Fitts {a},{b},{D},{W}',a+b*math.log2(D/W+1),MT)
nclose('Fitts original 2A/W',math.log2(2*80/20),3);nclose('Fitts unit conversion',math.log2(100/20+1),math.log2(6));nclose('Fitts scale invariance',math.log2(240/40+1),math.log2(120/20+1))
for data,mean,var,sd in [([2,4,6],4,4,2),([10,20,30],20,100,10),([50]*4,50,0,0),([0,100,25,75],50,6250/3,45.64354645876384)]:
 nclose('mean '+str(data),statistics.mean(data),mean);nclose('sample variance '+str(data),statistics.variance(data),var);nclose('sample sd '+str(data),statistics.stdev(data),sd)
nclose('outlier mean',statistics.mean([1,2,3,4,100]),22);nclose('outlier median',statistics.median([1,2,3,4,100]),3)
def ols(x,y):
 n=len(x);mx=statistics.mean(x);my=statistics.mean(y);xx=sum((a-mx)**2 for a in x);xy=sum((a-mx)*(b-my) for a,b in zip(x,y));b1=xy/xx;b0=my-b1*mx;yh=[b0+b1*a for a in x];res=[a-b for a,b in zip(y,yh)];sst=sum((v-my)**2 for v in y);ssr=sum((v-my)**2 for v in yh);sse=sum(v*v for v in res)
 return dict(n=n,b1=b1,b0=b0,yhat=yh,residuals=res,SST=sst,SSR=ssr,SSE=sse,R2=1-sse/sst,F=ssr/(sse/(n-2)),adjusted=1-(sse/(n-2))/(sst/(n-1)))
for y,expect in [([2,3,7],dict(b1=2.5,b0=-1,SST=14,SSR=12.5,SSE=1.5,R2=12.5/14,F=12.5/1.5)),([1,3,8],dict(b1=3.5,b0=-3,SST=26,SSR=24.5,SSE=1.5,R2=24.5/26,F=24.5/1.5))]:
 r=ols([1,2,3],y)
 for k,v in expect.items():nclose('OLS '+str(y)+' '+k,r[k],v)
 nclose('OLS residual x=2 '+str(y),r['residuals'][1],-1);nclose('OLS partition '+str(y),r['SSR']+r['SSE'],r['SST'])
for n,sst,sse,ssr,df,mse,F,R2 in [(12,100,30,70,10,3,70/3,.7),(10,80,20,60,8,2.5,24,.75)]:
 for label,v,ex in [('SSR',sst-sse,ssr),('df',n-2,df),('MSE',sse/(n-2),mse),('F',(sst-sse)/(sse/(n-2)),F),('R2',1-sse/sst,R2)]:nclose(f'ANOVA n{n} '+label,v,ex)
# The actual regression workbook, not the erroneous x9=55 slide table.
workbook=E/'final-audit/fixtures/regression1.xlsx';z=zipfile.ZipFile(workbook);ns={'s':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'};rows=[]
for row in ET.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('.//s:row',ns)[1:]:rows.append([float(c.find('s:v',ns).text) for c in row.findall('s:c',ns)])
r=ols([v[2] for v in rows],[v[0] for v in rows]);
for k,ex in [('b0',30.9333),('b1',.8705),('R2',.6828),('adjusted',.6511),('F',21.53)]:nclose('actual regression1.xlsx '+k,r[k],ex,.0002)
# T reference outputs: inference does not turn non-rejection into proof.
nclose('single sample implied SE',(156.1165-150)/3.8148,1.6034,1e-4)
nclose('CI center',(152.7607+159.4723)/2,156.1165)
nclose('paired sign reversal',-(-33.65),33.65);nclose('timeout milliseconds to seconds',5000/1000,5)
X=[-1,0,1];Y=[1,0,1];nclose('nonlinear example covariance numerator',sum((x-statistics.mean(X))*(y-statistics.mean(Y)) for x,y in zip(X,Y)),0)
nclose('physiology minimum',10+90+20+30,150);nclose('physiology maximum',30+90+20+30,170)
# Incomplete beta continued fraction, independently checked against Cauchy t(df=1).
def beta_fraction(a,b,x):
 tiny=1e-300;qab=a+b;qap=a+1;qam=a-1;c=1;d=1-qab*x/qap;d=1/(d if abs(d)>tiny else tiny);h=d
 for m in range(1,501):
  aa=m*(b-m)*x/((qam+2*m)*(a+2*m));d=1+aa*d;d=d if abs(d)>tiny else tiny;c=1+aa/c;c=c if abs(c)>tiny else tiny;d=1/d;h*=d*c
  aa=-(a+m)*(qab+m)*x/((a+2*m)*(qap+2*m));d=1+aa*d;d=d if abs(d)>tiny else tiny;c=1+aa/c;c=c if abs(c)>tiny else tiny;d=1/d;delta=d*c;h*=delta
  if abs(delta-1)<1e-14:return h
 raise ValueError('beta did not converge')
def ibeta(x,a,b):
 if x<=0:return 0.
 if x>=1:return 1.
 bt=math.exp(math.lgamma(a+b)-math.lgamma(a)-math.lgamma(b)+a*math.log(x)+b*math.log1p(-x))
 return bt*beta_fraction(a,b,x)/a if x<(a+1)/(a+b+2) else 1-bt*beta_fraction(b,a,1-x)/b
def t_two_sided(t,df):return ibeta(df/(df+t*t),df/2,.5)
for t in [.5,1,2,8]:nclose('t df1 independent Cauchy '+str(t),t_two_sided(t,1),1-2*math.atan(t)/math.pi)
def t_tail_integer(t,df):
 theta=math.atan(t/math.sqrt(df));n=df-1
 value=math.pi/2-theta if n%2==0 else 1-math.sin(theta)
 for k in range(2 if n%2==0 else 3,n+1,2):value=(k-1)/k*value-math.sin(theta)*math.cos(theta)**(k-1)/k
 return 2*math.exp(math.lgamma((df+1)/2)-.5*math.log(math.pi)-math.lgamma(df/2))*value
for tv,df in [(3.8148,19),(7.6951,19),(math.sqrt(r['F']),10)]:nclose('t independent trig integral '+str(df)+' '+str(tv),t_two_sided(tv,df),t_tail_integer(tv,df),1e-10)
nclose('single t p df19',t_two_sided(3.8148,19),.001169,1e-6)
nclose('paired t p df19',t_two_sided(7.6951,19),2.97e-7,1e-9)
nclose('workbook model F p',ibeta(10/(10+r['F']),5,.5),.0009218,1e-6)
(E/'final-audit/coverage.json').write_text(json.dumps(coverage,ensure_ascii=False,indent=2)+'\n')
(E/'final-audit/numeric-checks.json').write_text(json.dumps({'passed':len(num),'checks':num,'workbook':str(workbook),'regressionResult':r},ensure_ascii=False,indent=2)+'\n')
result={'concepts':188,'questions':len(ox)+sum(len(qs) for qs in banks.values()),'bankCounts':{'ox':len(ox),**{b:len(qs) for b,qs in banks.items()}},'coverageMissing':{b:sorted(ids-{c for q in qs for c in q['conceptIds']}) for b,qs in banks.items()},'checksPassed':len(checks),'numericChecksPassed':len(num),'optionExplanations':options,'rubricItems':rubrics,'RQuestions':code_count,'RBlanks':blanks,'englishTerms':len(terms),'checks':checks}
(E/'final-audit/content-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items() if k!='checks'},ensure_ascii=False))
