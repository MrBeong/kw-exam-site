async (page) => {
 const results=[];const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const key='psych-midterm-mock-v1',base='http://127.0.0.1:8771/mock-exam/index.html';
 const make=(status,extra={})=>({questionRevision:'lecture-r-line-2026-10-18',status,selected:{},texts:{},codeAnswers:{},codeNotes:{},rubrics:{},graded:{},checked:{},review:{},assessedAt:{},...extra});
 const owner=(a,mode='exam')=>({questionRevision:'lecture-r-line-2026-10-18',activeSet:1,mode,exams:mode==='exam'?{1:a}:{},practice:mode==='practice'?{1:a}:{},bookmarks:{}});
 const check=(name,pass,detail)=>{results.push({name,pass,detail});if(!pass)throw Error(name+': '+JSON.stringify(detail))};
 const load=async(o,query='set=1&mode=exam&question=ME1-Q01')=>{await page.evaluate(({key,o})=>{localStorage.clear();localStorage.setItem(key,JSON.stringify(o))},{key,o});await page.goto(base+'?'+query);await page.waitForSelector('#questionList');return page.evaluate(()=>({count:bank().length,version:state.paperVersion,title:document.getElementById('examTitle').textContent,progress:document.getElementById('mockProgress').textContent,prompt:document.querySelector('.wr-prompt')?.textContent,deadline:state.deadline,selected:state.selected}));};
 await page.goto(base);const rev=await page.evaluate(()=>({now:StudyMockVersions.current,old:StudyMockVersions.prior,before:StudyMockVersions.before}));
 // Fresh papers always carry a stable, explicit final paper version.
 await load({activeSet:1,mode:'exam',exams:{},practice:{},bookmarks:{}});
 await page.locator('#startBtn').click();
 let r=await page.evaluate(()=>({count:bank().length,version:state.paperVersion,status:state.status}));check('fresh final50 start',r.count===50&&r.version===rev.now&&r.status==='running',r);
 // Earlier 32-question papers keep their original complete bank and clock.
 const deadline=Date.now()+600000;
 r=await load(owner(make('running',{deadline,startedAt:deadline-7200000,codeAnswers:{'ME1-Q29':{'1':'sort'}}})),'set=1&mode=exam&question=ME1-Q29');
 check('same revision old32 inferred from code',r.count===32&&r.version===rev.old&&r.deadline===deadline&&r.title.includes('이전 문항'),r);
 r=await page.evaluate(()=>({q:bank()[28],answer:state.codeAnswers['ME1-Q29']['1'],deadline:state.deadline}));check('old32 Q29 remains code and answer unchanged',r.q.type==='code'&&r.answer==='sort'&&r.deadline===deadline,{type:r.q.type,answer:r.answer});
 const previousRevisions=[null,'hand-calc-2026-10-18','midterm-review-2026-10-18','focused-essay-2026-10-18'];
 for(const v of previousRevisions){const a=make('submitted',{questionRevision:v||undefined,submittedAt:123456,codeAnswers:{'ME1-Q29':{'1':'sort'}}});r=await load(owner(a),'set=1&mode=exam&question=ME1-Q29');check('old revision32 '+v,r.count===32&&r.version===rev.old,r)}
 const full32=await page.evaluate(()=>{const qs=bank(),a={questionRevision:'lecture-r-line-2026-10-18',status:'submitted',paperVersion:StudyMockVersions.prior,submittedAt:123456,selected:{},texts:{},codeAnswers:{},codeNotes:{},rubrics:{},graded:{},checked:{},review:{},assessedAt:{}};for(const q of qs){if(['single','multi'].includes(q.type))a.selected[q.id]=q.options.filter(o=>o.correct).map(o=>o.id);else if(q.type==='tf')a.selected[q.id]=Object.fromEntries(q.statements.map(s=>[s.id,s.correct]));else{a.rubrics[q.id]=q.rubric.map(()=>true);a.graded[q.id]=true;if(q.type==='code')a.codeAnswers[q.id]=Object.fromEntries(q.codeBlanks.map(b=>[b.id,b.answer]));else a.texts[q.id]='full answer'}}return a});
 await load(owner(full32));r=await page.locator('#resultPanel').innerText();check('old32 correct denominators and 100 points',r.includes('36점')&&r.includes('64점')&&r.includes('14 / 14')&&r.includes('총점 100 / 100점'),r);
 // A submitted earlier 50-question exam uses the exact pre-review snapshot.
 r=await load({questionRevision:'lecture-r-line-2026-10-18',activeSet:4,mode:'exam',exams:{4:make('submitted',{codeAnswers:{'ME4-Q49':{'1':'dat$Correct & !dat$Timeout'}},submittedAt:123456})},practice:{},bookmarks:{}},'set=4&mode=exam&question=ME4-Q49');
 check('pre-review50 inferred',r.count===50&&r.version===rev.before,r);
 r=await page.evaluate(()=>{const q=bank().find(q=>q.id==='ME4-Q49');return {rubrics:q.rubric.length,followUp:q.followUp,mode:q.codeMode||'blank'}});check('pre-review50 original rubric preserved',r.rubrics===5&&r.mode==='blank'&&r.followUp.includes('기울기'),r);
 // No evidence: block interpretation until the user chooses the original paper.
 const uncertain=owner(make('running',{deadline,selected:{'ME1-Q01':['A']}}));
 r=await load(uncertain);check('ambiguous paper blocks interpretation',r.count===0&&r.version==='unresolved'&&await page.locator('[data-paper="32"]').count()===1,r);
 await page.locator('[data-paper="32"]').click();r=await page.evaluate(()=>({count:bank().length,deadline:state.deadline,selected:state.selected['ME1-Q01']}));check('explicit32 selection keeps answer and clock',r.count===32&&r.deadline===deadline&&r.selected[0]==='A',r);
 await page.reload();r=await page.evaluate(()=>({count:bank().length,deadline:state.deadline}));check('explicit32 survives reload',r.count===32&&r.deadline===deadline,r);
 await load(uncertain);await page.locator('[data-paper="50"]').click();r=await page.evaluate(()=>({count:bank().length,version:state.paperVersion,deadline:state.deadline}));check('explicit earlier50 selection keeps clock',r.count===50&&r.version===rev.before&&r.deadline===deadline,r);
 r=await page.evaluate(({key})=>{const a=JSON.parse(localStorage.getItem(key)),raw=JSON.parse(localStorage.getItem(a.paperArchiveKey));return {answer:raw.exams[1].selected['ME1-Q01'][0],deadline:raw.exams[1].deadline,hadPaperVersion:Object.hasOwn(raw.exams[1],'paperVersion')}},{key});check('raw archive predates all version tagging',r.answer==='A'&&r.deadline===deadline&&!r.hadPaperVersion,r);
 // Expired earlier papers submit against their old bank, not 50 current questions.
 r=await load(owner(make('running',{deadline:Date.now()-1000,codeAnswers:{'ME1-Q29':{'1':'sort'}}})),'set=1&mode=exam&question=ME1-Q29');r=await page.evaluate(()=>({count:bank().length,status:state.status,timeUp:state.timeUp}));check('old32 timeout uses 32-paper',r.count===32&&r.status==='submitted'&&r.timeUp===true,r);
 // Explicitly restarting an old paper applies final50, while the raw archive remains.
 await page.evaluate(()=>window.confirm=()=>true);await page.locator('#resetBtn').click();r=await page.evaluate(()=>({count:bank().length,version:state.paperVersion,status:state.status}));check('old paper restart selects final50',r.count===50&&r.version===rev.now&&r.status==='draft',r);
 const priorPractice=owner(make('practice',{paperVersion:rev.before,selected:{'ME1-Q01':['A']},texts:{'ME1-Q41':'old essay'},codeAnswers:{'ME1-Q47':{'1':'old code'}},rubrics:{'ME1-Q41':[true]}}),'practice');
 await load(priorPractice,'set=1&mode=practice&question=ME1-Q47');
 r=await page.evaluate(()=>({version:state.paperVersion,selected:state.selected['ME1-Q01'],oldText:state.texts['ME1-Q41'],oldCode:state.codeAnswers['ME1-Q47'],archive:store.paperArchiveKey,q:bank().find(q=>q.id==='ME1-Q47')}));
 check('practice resets revised items and keeps unchanged answer',r.version===rev.now&&r.selected[0]==='A'&&r.oldText===undefined&&r.oldCode===undefined&&!!r.archive,{version:r.version,selected:r.selected,oldText:r.oldText,oldCode:r.oldCode});
 check('latest practice full line and explanations restored',r.q.codeMode==='line'&&r.q.lineExplanations.length>0,{mode:r.q.codeMode,lines:r.q.lineExplanations?.length});
 check('original practice download available',await page.getByText('시험지 개편 전 원본 답안 내려받기',{exact:true}).count()===1);
 check('no browser exceptions',errors.length===0,errors);
 await page.evaluate(r=>window.__paperUITestResults=r,{pass:true,checks:results.length,results});
}
