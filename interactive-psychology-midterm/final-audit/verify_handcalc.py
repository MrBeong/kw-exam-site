"""Verify intentional hand-calculation revisions with exact independent arithmetic."""
from pathlib import Path
from fractions import Fraction as F
from decimal import Decimal, ROUND_HALF_UP
import json, re, math

E=Path(__file__).resolve().parent.parent
A=E/'final-audit'
delta=json.loads((A/'handcalc-changes.json').read_text())
trace=json.loads((A/'handcalc-compatibility.json').read_text())
banks={b:json.loads((E/b/'questions.json').read_text()) for b in ['multiple-choice','written','mock-exam']}
allq={q['id']:q for qs in banks.values() for q in qs}
checks=[]
def check(v,label):
    assert v,label
    checks.append(label)
def contains(id,*terms):
    q=allq[id]
    text=q.get('stem',q.get('prompt',''))+' '+q.get('answer','') if isinstance(q.get('answer',''),str) else q.get('stem','')
    for term in terms:check(term in text,id+' has '+term)
def rounded(x):return Decimal(x.numerator)/Decimal(x.denominator)
def one(x):return str(rounded(x).quantize(Decimal('.1'),rounding=ROUND_HALF_UP))
for bank,ids in delta['changed'].items():
    check([q['id'] for q in banks[bank] if q.get('questionRevision')==delta['revision']]==ids,bank+' revision manifest complete')
for id,t in trace.items():
    before,after=t['before'],allq[id]
    check(t['after']==after,id+' explicit current revision trace')
    for k in ['id','type','conceptIds','points','set','number','minutes']:
        check(before.get(k)==after.get(k),id+' stable '+k)
    for k in ['options','statements']:
        if k in before:check([(o['id'],o['correct']) for o in before[k]]==[(o['id'],o['correct']) for o in after[k]],id+' stable '+k+' order/answer set')
    if after.get('rubric'):check(math.isclose(sum(r['points'] for r in after['rubric']),after['points']),id+' all requested grading points')
for bank,ids in delta['changed'].items():
    for id in ids:check('손계산용' in allq[id]['source'],id+' source distinguishes practice adaptation')

# Arithmetic uses the supplied rounded constants, never a more precise hidden log.
raw=(F(2)*10/(F('0.1')*80))**2
check(raw==F(25,4) and math.ceil(raw)==7 and math.ceil(raw)-5==2,'pilot ceiling and additional recruitment')
contains('MC028','80','10','z=2','k=0.1');contains('SA015','총 7명','추가 2명')
check((F(2)*8/(F('.05')*80))**2==16,'variant pilot exact total')
contains('ME5-Q20','총 16명','추가 12명')
H=F('.2')*F('2.3')+F('.8')*F('.3')
check(one(H)=='0.7' and one((1-H)*100)=='30.0','rounded-log Shannon and redundancy')
for id in ['SA020','ES014']:contains(id,'2.3','0.3','0.7','30.0')
H2=F('.25')*2+F('.75')*F('.4')
check(one(H2)=='0.8' and one((1-H2)*100)=='20.0','variant rounded log')
contains('ME2-Q21','0.8','20.0')
for h,hmax,out in [('.4',1,'60.0'),('2.4',3,'20.0'),('.6',1,'40.0'),('2.1',3,'30.0')]:
    check(one((1-F(h)/hmax)*100)==out,'supplied entropy redundancy '+h)
contains('SA021','60.0','20.0');contains('ME3-Q21','40.0','30.0')
check(one(F(1000,150))=='6.7' and one(F(1000,120))=='8.3','throughput one decimal')
check(F(50)+150*F('2.3')==395 and F(50)+150*F('3.5')==575,'supplied Fitts logs')
contains('SA031','395.0','575.0')
for id,ds,ws,a,b,expected in [('RC018',[60,140],[20,20],50,150,[350,500]),('ME2-Q32',[30,70],[10,10],40,120,[280,400])]:
    q=allq[id]
    actual_d=[int(n) for n in re.search(r'D <- c\(([^)]+)\)',q['modelCode'])[1].split(',')]
    actual_w=[int(n) for n in re.search(r'W <- c\(([^)]+)\)',q['modelCode'])[1].split(',')]
    check(actual_d==ds and actual_w==ws,id+' actual R literal inputs')
    check([d//w+1 for d,w in zip(ds,ws)]==[4,8],id+' exact power-of-two arguments')
    check([a+b*i for i in [2,3]]==expected,id+' independently computed R outputs')
    for v in expected:check(str(v) in q['answer'] and str(v) in q['rubric'][-1]['criterion'],id+' answer/rubric '+str(v))
check(F(1000,125)==8 and 300+125*3==675,'simple Hick fit and extrapolation')
contains('ES024','425','550','125','675','8.0')
x=[40,50,60];mean=sum(x)/3;variance=sum((v-mean)**2 for v in x)/2
check(mean==50 and variance==100 and math.sqrt(variance)==10,'sample SD hand calculation')
contains('ES034','40,50,60','10')
check(F('12.5')/14==F(25,28) and F('12.5')/F('1.5')==F(25,3),'OLS exact ratios source')
check(F('24.5')/26==F(49,52) and F('24.5')/F('1.5')==F(49,3),'OLS exact ratios variant')
contains('ES039','25}{28','25}{3');contains('ME4-Q28','49}{52','49}{3')
for q in banks['mock-exam']:
    src=allq.get(q['originId'])
    if src and not q['variant']:
        check(q['prompt']==src.get('stem',src.get('prompt')),q['id']+' nonvariant prompt matches')
        if 'options'in q:check({o['id']:o for o in q['options']}=={o['id']:o for o in src['options']},q['id']+' all options/explanations match')
for n in range(1,6):
    qs=[q for q in banks['mock-exam'] if q['set']==n]
    check(len(qs)==32 and sum(q['points'] for q in qs)==100,n.__str__()+' 32 questions and 100 points')
result={'status':'pass','checksPassed':len(checks),'changed':{**{b:len(ids) for b,ids in delta['changed'].items()},'ox':len(delta['ox'])},'precision':'Use supplied log values; retain intermediates; final one decimal or exact fraction; integer counts round up.'}
(A/'handcalc-source-results.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(result,ensure_ascii=False))
