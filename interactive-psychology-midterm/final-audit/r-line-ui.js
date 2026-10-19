async page=>{
 const root=new URL(/\/(ox|multiple-choice|mock-exam)\//.test(new URL(page.url()).pathname)?'../':'./',page.url()).href;
 const r={checks:[],errors:[],wholeWritten:0,mockPrevious:0},check=(v,s)=>{if(!v)throw Error(s);r.checks.push(s)};
 const wr='psych-midterm-notion-v1',me='psych-midterm-mock-v1',get=k=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{}'),k),seed=(k,v)=>page.evaluate(([k,v])=>localStorage.setItem(k,JSON.stringify(v)),[k,v]);
 page.removeAllListeners('dialog');page.on('dialog',d=>d.accept());page.on('pageerror',e=>r.errors.push(e.message));
 try{
 const trace=await page.evaluate(async root=>(await fetch(root+'final-audit/r-line-revision.json')).json(),root);
 await page.evaluate(()=>localStorage.removeItem('psych-midterm-notion-v1'));await page.goto(root+'index.html?view=problems&question=RC021');
 await page.locator('[data-written-type="code-line"]').click();check(await page.locator('#writtenJump option').count()===26,'dedicated whole-line filter contains26 questions');
 const full=await page.evaluate(()=>problems.filter(q=>q.codeMode==='line'));
 for(const q of full){
  await page.locator('#writtenJump').selectOption(q.id);check(await page.locator('#writtenSolution').isHidden(),q.id+' no premature answer');
  check(await page.locator('[data-code-blank]').count()===1,q.id+' whole-line single input');
  check((await page.locator('.wr-target-result').innerText()).includes(q.targetResult),q.id+' desired result visible');
  const input=page.locator('[data-code-blank="1"]');await input.fill(q.modelCode);
  check(await input.inputValue()===q.modelCode,q.id+' full statement entered');
  check(await input.evaluate(n=>getComputedStyle(n).color)==='rgb(36, 85, 187)',q.id+' blue console input');
  await page.locator('#writtenReveal').click();
  check((await page.locator('.wr-model-code .wr-code-source').allTextContents()).join('\n')===q.modelCode,q.id+' executable model excludes prompt');
  check(await page.locator('.wr-line-explanations li').count()===q.lineExplanations.length,q.id+' statement explanation shown');
  check(await page.locator('[data-rubric]').count()===q.rubric.length,q.id+' partial credit shown');r.wholeWritten++;
 }
 await page.reload();check(await page.locator('[data-code-blank="1"]').inputValue()===full.at(-1).modelCode,'whole-line draft persists after reload');
 await page.locator('#toolbarRetryCurrentBtn').click();let a=await get(wr);check(!a.codeAnswers.RC046&&a.codeAnswers.RC021['1']===full[0].modelCode,'current-line reset preserves other answers');
 const version=await page.evaluate(()=>StudyRevisions.revision);
 await seed(wr,{questionRevision:version,codeSchemaVersion:1,answers:{},codeAnswers:{RC039:{1:'t.test(data = datat, height ~ group)'}},grades:{RC039:'again'},rubrics:{RC039:[true,false]},revealed:{RC039:true},bookmarks:{RC039:true}});
 await page.goto(root+'index.html?view=problems&question=RC039');await page.locator('#againFilterBtn').click();check(await page.locator('#wrongRetryPanel').isHidden(),'first wrong-tab click keeps retry controls folded');await page.locator('#againFilterBtn').click();await page.locator('#retryWrongBtn').click();
 check(await page.locator('[data-code-blank="1"]').inputValue()===''&&await page.locator('#writtenSolution').isHidden(),'whole-line wrong retry starts empty with hidden answer');
 await page.locator('[data-code-blank="1"]').fill('t.test(data = datat, height ~ group, var.equal = TRUE)');await page.reload();check((await page.locator('[data-code-blank="1"]').inputValue()).includes('var.equal = TRUE'),'whole-line retry draft resumes');
 // Only changed answer structures reset; formatting-only R, essays and short work survive.
 await seed(wr,{questionRevision:trace.previousRevision,codeSchemaVersion:1,answers:{ES003:'keep essay',SA001:'keep short'},grades:{ES003:'done',RC001:'done',RC010:'again',RC018:'done'},codeAnswers:{RC001:{1:'sort',2:'TRUE',3:'1'},RC010:{1:'height ~ group',2:'data = datat',3:'TRUE'},RC018:{1:'log2(D / W + 1)',2:'50 + 150 * ID'}},rubrics:{RC010:[true,true,true]},revealed:{RC010:true},bookmarks:{RC010:true}});
 await page.goto(root+'index.html?view=problems&question=RC010');a=await get(wr);
 check(!a.codeAnswers.RC010&&!a.grades.RC010&&!a.rubrics.RC010&&!a.revealed.RC010,'renumbered input answer and grading reset together');
 check(a.codeAnswers.RC001[1]==='sort'&&a.codeAnswers.RC018[1]==='log2(D / W + 1)'&&a.answers.ES003==='keep essay'&&a.answers.SA001==='keep short','format-only R and unrelated learning records preserved');
 check((await get(a.revisionArchiveKey)).state.codeAnswers.RC010[1]==='height ~ group'&&a.bookmarks.RC010,'prior answers archived before reset; bookmark kept');
 const exam={status:'submitted',questionRevision:trace.previousRevision,selected:{},texts:{},codeAnswers:{'ME4-Q30':{1:'height ~ group',2:'data = datat',3:'TRUE'}},codeNotes:{},rubrics:{'ME4-Q30':[true,true,true]},graded:{'ME4-Q30':true},checked:{'ME4-Q30':true},review:{},assessedAt:{'ME4-Q30':1},deadline:12345};
 for(const v of [trace.previousRevision,'midterm-review-2026-10-18','hand-calc-2026-10-18',null]){
  const rec={...exam};if(v)rec.questionRevision=v;else delete rec.questionRevision;
  await seed(me,{questionRevision:trace.previousRevision,activeSet:4,mode:'exam',exams:{4:rec},practice:{},bookmarks:{}});await page.goto(root+'mock-exam/index.html?mode=exam&set=4&question=ME4-Q30');a=await get(me);
  check(JSON.stringify(a.exams[4])===JSON.stringify(rec),'prior raw exam immutable '+v);
  const old=await page.evaluate(()=>bank().find(q=>q.id==='ME4-Q30'));check(old.codeTemplate.includes('{{3}}'),'old three-blank exam retained '+v);check(!a.answers['ME4-Q30'],'old grade not applied to new whole-line item '+v);
 }
 for(let set=1;set<=5;set++){
  await seed(me,{questionRevision:trace.previousRevision,activeSet:set,mode:'exam',exams:{[set]:{...exam}},practice:{},bookmarks:{}});await page.goto(root+'mock-exam/index.html?mode=exam&set='+set);
  const olds=await page.evaluate(()=>bank().filter(q=>q.type==='code'));
  for(const q of olds){check(JSON.stringify(q)===JSON.stringify(trace.mockChanges.find(t=>t.id===q.id).before),q.id+' previous complete R problem retained');r.mockPrevious++;}
  const same=await page.evaluate(()=>StudyRevisions.isCurrent(DATA.find(q=>q.id==='ME1-Q29'),{questionRevision:'focused-essay-2026-10-18'},true));check(same,'formatting-only R assessment remains compatible');
 }
 const deadline=Date.now()+300000,rec={...exam,status:'running',deadline};await seed(me,{questionRevision:trace.previousRevision,activeSet:4,mode:'exam',exams:{4:rec},practice:{},bookmarks:{}});await page.goto(root+'mock-exam/index.html?mode=exam&set=4&question=ME4-Q30');await page.reload();a=await get(me);check(a.exams[4].deadline===deadline,'running exam deadline survives code revision/reload');
 await page.locator('#resetBtn').click();await page.locator('#startBtn').click();await page.locator('#mockJump').selectOption('ME4-Q30');check(await page.locator('[data-code-blank]').count()===1,'new exam retake has one whole-line input');
 await page.locator('[data-code-blank="1"]').fill('t.test(data = datat, height ~ group, var.equal = TRUE)');await page.reload();check((await page.locator('[data-code-blank="1"]').inputValue()).includes('var.equal = TRUE'),'whole-line exam input saved');
 await page.evaluate(()=>localStorage.removeItem('psych-midterm-mock-v1'));await page.goto(root+'mock-exam/index.html?mode=practice&set=4&question=ME4-Q30');await page.locator('[data-code-blank="1"]').fill('t.test(data = datat, height ~ group, var.equal = TRUE)');await page.locator('#mockReveal').click();check(await page.locator('.wr-line-explanations li').count()===1,'mock full-line explanation shown');check(await page.locator('[data-rubric]').count()===2,'mock full-line scoring two criteria');
 await page.setViewportSize({width:390,height:844});
 for(const id of ['RC023','RC034','RC039','RC040','RC042','RC044']){
  await page.goto(root+'index.html?view=problems&question='+id);const q=full.find(q=>q.id===id);await page.locator('[data-code-blank="1"]').fill(q.modelCode);if(await page.locator('#writtenSolution').isHidden())await page.locator('#writtenReveal').click();
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' mobile page has no horizontal overflow');
  check((await page.locator('[data-code-blank="1"]').inputValue())===q.modelCode,id+' mobile full statement not truncated');
 }
 await page.screenshot({path:'output/playwright/r-line-mobile.png',fullPage:true});
 await page.setViewportSize({width:1360,height:950});await page.goto(root+'index.html?view=problems&question=RC039');if(await page.locator('#writtenSolution').isHidden())await page.locator('#writtenReveal').click();await page.locator('.wr-code-question').scrollIntoViewIfNeeded();await page.screenshot({path:'output/playwright/r-line-RC039.png',fullPage:true});
 check(r.errors.length===0,'no browser exceptions');r.status='pass';
 }catch(e){r.status='fail';r.failure=e.message;r.url=page.url()}
 return r;
}
