async page=>{
 const root=new URL(/\/(ox|multiple-choice|mock-exam)\//.test(new URL(page.url()).pathname)?'../':'./',page.url()).href;
 const r={checks:[],errors:[]},check=(v,s)=>{if(!v)throw Error(s);r.checks.push(s)};
 page.removeAllListeners('dialog');page.on('dialog',d=>d.accept());page.on('pageerror',e=>r.errors.push(e.message));
 const key='psych-midterm-notion-v1',mk='psych-midterm-mock-v1';
 const state=async k=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{}'),k);
 try{
 await page.setViewportSize({width:1360,height:950});await page.evaluate(([a,b])=>{localStorage.removeItem(a);localStorage.removeItem(b)},[key,mk]);
 await page.goto(root+'index.html?view=problems&question=SA045');
 const qs=await page.evaluate(()=>problems.filter(q=>q.recallBlanks));check(qs.length===31,'31 new direct-recall questions');
 for(const q of qs){
  await page.locator('#writtenJump').selectOption(q.id);
  check(await page.locator('#writtenSolution').isHidden(),q.id+' answer hidden');
  check(await page.locator('[data-recall-blank]').count()===q.recallBlanks.length,q.id+' all blank inputs');
  if(q.visual)check(await page.locator('.analysis-material img').evaluateAll(async ns=>{await Promise.all(ns.map(n=>n.complete?null:new Promise(ok=>n.onload=n.onerror=ok)));return ns.every(n=>n.naturalWidth>0)}),q.id+' complete required figure');
  if(['SA045','SA046','SA047'].includes(q.id))check(!/twodash|longdash|dotdash|dashed|dotted|solid|blank/.test(await page.locator('.wr-scroll').innerText()),q.id+' no visible style answer');
  for(const b of q.recallBlanks)await page.locator('[data-recall-blank="'+b.id+'"]').fill('검수답안 '+b.id);
  await page.reload();
  check((await page.locator('[data-recall-blank]').evaluateAll(ns=>ns.map(n=>n.value))).every((v,i)=>v==='검수답안 '+(i+1)),q.id+' numbered answers survive reload');
  await page.locator('#writtenReveal').click();
  check(await page.locator('[data-rubric]').count()===q.rubric.length,q.id+' complete grading criteria');
  await page.locator('[data-rubric="0"]').check();await page.locator('[data-written-grade="again"]').click();
  await page.locator('[data-recall-blank="1"]').fill('수정');let saved=await state(key);
  check(!saved.grades[q.id]&&(saved.rubrics[q.id]||[]).length===0,q.id+' edits invalidate old grade');
  await page.locator('#writtenRetry').click();
  check((await page.locator('[data-recall-blank]').evaluateAll(ns=>ns.map(n=>n.value))).every(v=>v===''),q.id+' item reset clears every numbered blank');
 }
 for(const id of ['ME1-Q24','ME2-Q24','ME3-Q24','ME4-Q24','ME5-Q24']){
  const n=Number(id[2]);await page.goto(root+'mock-exam/index.html?mode=practice&set='+n+'&question='+id);
  const count=await page.locator('[data-recall-blank]').count();check(count>=2,id+' mock blank fields');
  for(let i=1;i<=count;i++)await page.locator('[data-recall-blank="'+i+'"]').fill('답안 '+i);
  await page.reload();check((await page.locator('[data-recall-blank]').evaluateAll(ns=>ns.map(n=>n.value))).every((v,i)=>v==='답안 '+(i+1)),id+' mock saved input');
  await page.locator('#mockReveal').click();check(await page.locator('[data-rubric]').count()===count,id+' mock per-blank criteria');
 }
 await page.evaluate(k=>localStorage.removeItem(k),mk);await page.goto(root+'mock-exam/index.html?mode=exam&set=1');await page.locator('#startBtn').click();await page.locator('#mockJump').selectOption('ME1-Q24');
 await page.locator('[data-recall-blank="1"]').fill('2');await page.locator('#submitBtn').click();
 check(await page.locator('[data-recall-blank="1"]').isDisabled(),'submitted new blank answer locked');await page.reload();check(await page.locator('[data-recall-blank="1"]').inputValue()==='2','submitted numbered answer survives reload');
 const prior={questionRevision:'hand-calc-2026-10-18',activeSet:2,mode:'exam',exams:{2:{questionRevision:'hand-calc-2026-10-18',status:'running',deadline:Date.now()+600000,selected:{},texts:{},codeAnswers:{},codeNotes:{},rubrics:{},graded:{},checked:{},review:{},assessedAt:{}}},practice:{},bookmarks:{}};
 await page.evaluate(([k,v])=>localStorage.setItem(k,JSON.stringify(v)),[mk,prior]);await page.goto(root+'mock-exam/index.html?mode=exam&set=2&question=ME2-Q32');
 check((await page.evaluate(()=>bank().find(q=>q.id==='ME2-Q32').modelCode)).includes('c(30, 70)'),'interim handcalc running exam retains its own R data');
 check(!(await page.evaluate(()=>bank().find(q=>q.id==='ME2-Q24').recallBlanks)),'interim exam retains pre-recall short question');
 check(JSON.stringify((await state(mk)).exams[2])===JSON.stringify(prior.exams[2]),'interim running exam raw record unchanged');
 const archived={activeSet:1,mode:'exam',exams:{1:{status:'submitted',deadline:1,selected:{},texts:{'ME1-Q24':'이전 t검정 답안'},codeAnswers:{},codeNotes:{},rubrics:{'ME1-Q24':[false,false,false]},graded:{'ME1-Q24':true},checked:{'ME1-Q24':true},review:{},assessedAt:{'ME1-Q24':1}}},practice:{},bookmarks:{}};
 await page.evaluate(([k,v])=>localStorage.setItem(k,JSON.stringify(v)),[mk,archived]);await page.goto(root+'mock-exam/index.html?mode=exam&set=1&question=ME1-Q24');
 check(!(await state(mk)).answers['ME1-Q24'],'old unrelated short assessment not applied to new line-style question');
 await page.locator('#retryOne').click();check((await state(mk)).mode==='exam'&&(await page.locator('#saveStatus').innerText()).includes('수정 전 오답'),'old changed item retry keeps archived question instead of silently swapping concepts');
 await page.setViewportSize({width:390,height:844});
 for(const id of ['SA046','SA058','SA075']){
  await page.goto(root+'index.html?view=problems&question='+id);await page.evaluate(async()=>{await StudyMath.typeset();await StudyMath.idle()});
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' mobile no horizontal overflow');
  await page.locator('[data-recall-blank="1"]').fill('모바일 입력');check(await page.locator('[data-recall-blank="1"]').inputValue()==='모바일 입력',id+' mobile input clickable');
  if(id==='SA046'||id==='SA075')await page.screenshot({path:'/tmp/'+id+'-recall-mobile.png'});
 }
 check(r.errors.length===0,'no browser exceptions');r.status='pass';
 }catch(e){r.status='fail';r.failure=e.message;r.url=page.url()}
 return r;
}
