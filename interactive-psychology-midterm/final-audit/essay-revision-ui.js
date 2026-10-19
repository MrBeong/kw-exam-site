async page=>{
 const root=new URL(/\/(ox|multiple-choice|mock-exam)\//.test(new URL(page.url()).pathname)?'../':'./',page.url()).href;
 const r={checks:[],errors:[]},check=(v,s)=>{if(!v)throw Error(s);r.checks.push(s)};
 const wr='psych-midterm-notion-v1',me='psych-midterm-mock-v1';
 const seed=(k,v)=>page.evaluate(([k,v])=>localStorage.setItem(k,JSON.stringify(v)),[k,v]);
 const get=k=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{}'),k);
 page.on('pageerror',e=>r.errors.push(e.message));page.removeAllListeners('dialog');page.on('dialog',d=>d.accept());
 try{
 const trace=await page.evaluate(async root=>(await fetch(root+'final-audit/essay-revision.json')).json(),root);
 await seed(wr,{questionRevision:trace.previousRevision,codeSchemaVersion:1,answers:{ES002:'old gorilla answer',ES003:'old eras',SA020:'keep calculation'},grades:{ES002:'again',SA020:'done'},rubrics:{ES002:[true,false,true]},revealed:{ES002:true},codeAnswers:{RC018:{'1':'log2(D / W + 1)','2':'50 + 150 * ID'}},bookmarks:{ES002:true},checks:{keep:true}});
 await page.goto(root+'index.html?view=problems&question=ES002');let a=await get(wr);
 check(!a.answers.ES002&&!a.answers.ES003&&!a.grades.ES002&&!a.rubrics.ES002&&!a.revealed.ES002,'changed essay answer/grade/rubric/reveal reset together');
 check(a.answers.SA020==='keep calculation'&&a.grades.SA020==='done'&&a.codeAnswers.RC018['1']==='log2(D / W + 1)'&&a.bookmarks.ES002&&a.checks.keep,'latest non-essay work and bookmarks preserved');
 check((await get(a.revisionArchiveKey)).state.answers.ES002==='old gorilla answer','full prior essay answer archived');
 await page.locator('#writtenAnswer').fill('제한된 주의를 패스 세기에 집중하여 예상하지 못한 고릴라를 알아차리지 못했다.');await page.reload();
 check((await page.locator('#writtenAnswer').inputValue()).includes('제한된 주의'),'new essay answer persists after reload');
 await page.locator('#writtenReveal').click();check(await page.locator('[data-rubric]').count()===2,'ES002 has only two relevant grading items');
 await page.locator('#writtenJump').selectOption('ES003');check((await page.locator('.wr-prompt').innerText()).includes('1945~1960'),'ES003 one selected era rendered');
 check(await page.locator('#writtenSolution').isHidden(),'ES003 answer hidden initially');
 await page.locator('#writtenJump').selectOption('ES070');await page.locator('#writtenReveal').click();await page.evaluate(async()=>{await StudyMath.typeset();await StudyMath.idle()});
 check(await page.locator('[data-mjx-error]').count()===0,'new limit formula renders');
 const base={status:'submitted',selected:{},texts:{'ME5-Q25':'preserved old history answer'},codeAnswers:{},codeNotes:{},rubrics:{'ME5-Q25':[true,false,true]},graded:{'ME5-Q25':true},checked:{'ME5-Q25':true},review:{},assessedAt:{'ME5-Q25':1},deadline:12345};
 for(const v of [trace.previousRevision,'hand-calc-2026-10-18',null]){
  const rec={...base,...(v?{questionRevision:v}:{})};
  await seed(me,{questionRevision:trace.previousRevision,activeSet:5,mode:'exam',exams:{5:rec},practice:{5:{status:'practice',texts:{'ME5-Q25':'old practice','ME5-Q24':'keep short'},codeAnswers:{'ME5-Q29':{'1':'keep R'}},graded:{'ME5-Q25':true},rubrics:{'ME5-Q25':[true,true]}}},bookmarks:{'ME5-Q25':true}});
  await page.goto(root+'mock-exam/index.html?mode=exam&set=5&question=ME5-Q25');a=await get(me);
  check(JSON.stringify(a.exams[5])===JSON.stringify(rec),'submitted raw exam preserved '+v);
  const shown=await page.evaluate(()=>bank().find(q=>q.id==='ME5-Q25'));
  check(shown.prompt===trace.mockChanges.find(t=>t.id==='ME5-Q25').before.prompt,'old multi-era question retained only in old exam '+v);
  check(!a.practice[5].texts['ME5-Q25']&&a.practice[5].texts['ME5-Q24']==='keep short'&&a.practice[5].codeAnswers['ME5-Q29']['1']==='keep R','only changed practice essays cleared '+v);
  check(!a.answers['ME5-Q25'],'old essay grade does not become new-question wrong record '+v);
  check((await page.locator('#examTitle').innerText()).includes('이전 문항'),'prior exam label '+v);
 }
 // Published-review version must preserve every old essay, including variants.
 for(let set=1;set<=5;set++){
  await seed(me,{questionRevision:trace.previousRevision,activeSet:set,mode:'exam',exams:{[set]:{...base,questionRevision:trace.previousRevision}},practice:{},bookmarks:{}});
  await page.goto(root+'mock-exam/index.html?mode=exam&set='+set);
  const seen=await page.evaluate(()=>bank().filter(q=>q.type==='essay'));
  for(const q of seen)check(JSON.stringify(q)===JSON.stringify(trace.mockChanges.find(t=>t.id===q.id).before),q.id+' complete published snapshot shown');
 }
 const deadline=Date.now()+300000,rec={...base,status:'running',questionRevision:trace.previousRevision,deadline};
 await seed(me,{questionRevision:trace.previousRevision,activeSet:5,mode:'exam',exams:{5:rec},practice:{},bookmarks:{}});
 await page.goto(root+'mock-exam/index.html?mode=exam&set=5&question=ME5-Q25');await page.reload();a=await get(me);
 check(a.exams[5].deadline===deadline&&a.exams[5].status==='running','running exam timer and version survive reload');
 await page.evaluate(([k,obj])=>window.dispatchEvent(new StorageEvent('storage',{key:k,newValue:JSON.stringify(obj)})),[me,{questionRevision:trace.previousRevision,activeSet:5,mode:'exam',exams:{5:rec},practice:{},bookmarks:{}}]);
 check((await page.evaluate(()=>bank().find(q=>q.id==='ME5-Q25').prompt))===trace.mockChanges.find(t=>t.id==='ME5-Q25').before.prompt,'storage update keeps old essay semantics');
 await page.locator('#resetBtn').click();await page.locator('#startBtn').click();await page.locator('#mockJump').selectOption('ME5-Q25');
 check((await page.evaluate(()=>bank().find(q=>q.id==='ME5-Q25').prompt))===trace.mockChanges.find(t=>t.id==='ME5-Q25').after.prompt,'retake applies focused new question');
 await page.setViewportSize({width:390,height:844});
 for(const id of ['ES002','ES003','ES033','ES039','ES065','ES070']){
  await page.goto(root+'index.html?view=problems&question='+id);await page.locator('#writtenReveal').click();await page.evaluate(async()=>{await StudyMath.typeset();await StudyMath.idle()});
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' mobile width');
 }
 await page.setViewportSize({width:1360,height:950});await page.goto(root+'index.html?view=problems&question=ES003');
 await page.screenshot({path:'output/playwright/essay-ES003.png',fullPage:true});
 check(r.errors.length===0,'no page errors');r.status='pass';
 }catch(e){r.status='fail';r.failure=e.message;r.url=page.url()}
 return r;
}
