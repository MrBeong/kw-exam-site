async page=>{
 const result={checks:[],rendered:{},errors:[]};page.on('pageerror',e=>result.errors.push(e.message));
 const main=page.url().split('?')[0],root=new URL('./',main).href;
 const check=(yes,name)=>{if(!yes)throw Error(name);result.checks.push(name)};
 const settle=async(selector)=>page.evaluate(async sel=>{await StudyMath.typeset(document.querySelector(sel));await StudyMath.idle();return [...document.querySelectorAll(sel+' [data-mjx-error]')].map(n=>n.getAttribute('data-mjx-error'))},selector);
 const noLeak=async selector=>page.evaluate(sel=>{
  const w=document.createTreeWalker(document.querySelector(sel),NodeFilter.SHOW_TEXT);while(w.nextNode()){const n=w.currentNode;if(!n.parentElement.closest('code,pre,textarea,input,mjx-container')&&/\\[([]/.test(n.nodeValue))return false}return true
 },selector);
 const progress=async stage=>page.evaluate(s=>localStorage.setItem('psych-final-ui-progress',s),stage);
 try{
  await page.setViewportSize({width:1280,height:960});await page.goto(root+'index.html?view=problems&question=SA001');
  const written=JSON.parse(await page.locator('#writtenData').textContent());
  await page.evaluate(qs=>{const k='psych-midterm-notion-v1',s=JSON.parse(localStorage.getItem(k)||'{}');s.revealed=Object.fromEntries(qs.map(q=>[q.id,true]));localStorage.setItem(k,JSON.stringify(s))},written);await page.reload();
  for(const q of written){
   await page.locator('#writtenJump').selectOption(q.id);check((await settle('#questionList')).length===0,q.id+' math renders');check(await noLeak('#questionList'),q.id+' no raw TeX');
   check(await page.locator('[data-rubric]').count()===q.rubric.length,q.id+' complete rubric visible');
  }
  result.rendered.written=written.length;await progress('103 written pages rendered');
  await page.setViewportSize({width:390,height:844});
  for(const q of written.filter(q=>q.type!=='code')){
   await page.locator('#writtenJump').selectOption(q.id);await settle('#questionList');check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),q.id+' mobile no page overflow');
  }
  await page.locator('#writtenJump').selectOption('ES039');await settle('#questionList');await page.screenshot({path:"/Users/a0/Desktop/kw/3\u1112\u1161\u11a8\u1102\u1167\u11ab 2\u1112\u1161\u11a8\u1100\u1175/\u110b\u1175\u11ab\u1110\u1165\u1105\u1162\u11a8\u1110\u1175\u1107\u1173\u1109\u1175\u11b7\u1105\u1175\u1112\u1161\u11a8/07_\uc2dc\ud5d8\ub300\ube44/\uc911\uac04/final-audit"+'/written-math-mobile.png'});
  // Short-answer save, rubric invalidation, individual reset and unrelated data retention.
  await page.locator('#writtenJump').selectOption('SA015');await page.locator('#writtenAnswer').fill('총 16명, 추가 11명');await page.locator('[data-rubric="0"]').check();await page.locator('[data-written-grade="done"]').click();await page.reload();
  check(await page.locator('#writtenAnswer').inputValue()==='총 16명, 추가 11명','short answer reload persistence');check(await page.locator('[data-rubric="0"]').isChecked(),'short rubric reload persistence');
  await page.locator('#writtenAnswer').fill('총 16명');check(!await page.locator('[data-rubric="0"]').isChecked(),'short edit invalidates old rubric');
  await page.locator('#writtenBookmark').click();page.once('dialog',d=>d.dismiss());await page.locator('#writtenRetry').click();check(await page.locator('#writtenAnswer').inputValue()==='총 16명','short reset cancel retains answer');
  page.once('dialog',d=>d.accept());await page.locator('#writtenRetry').click();check(await page.locator('#writtenAnswer').inputValue()==='','short reset clears answer');
  const notionBefore=await page.evaluate(()=>localStorage.getItem('psych-midterm-notion-v1'));
  await page.goto(root+'multiple-choice/index.html');const mc=JSON.parse(await page.locator('#questionData').textContent());
  await page.evaluate(qs=>localStorage.setItem('psych-midterm-multiple-v1',JSON.stringify({answers:Object.fromEntries(qs.map(q=>[q.id,{selected:q.options.filter(o=>o.correct).map(o=>o.id),correct:true}])),bookmarks:{MC001:true},autoAdvance:false})),mc);await page.reload();
  await page.locator('[data-mode="mixed"]').click();await page.locator('[data-state="all"]').click();const mcSeen=new Set();
  for(let i=0;i<mc.length;i++){
   const id=(await page.locator('#position').innerText()).match(/MC\d+/)[0];mcSeen.add(id);check(await page.locator('.option-explain').count()===4,id+' all four explanations');check((await settle('#content')).length===0,id+' math renders');check(await noLeak('#content'),id+' no raw TeX');check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' mobile no page overflow');
   if(i<mc.length-1)await page.locator('#nextBtn').click();
  }
  check(mcSeen.size===132,'all 132 MC items visited');result.rendered.multipleChoice=mcSeen.size;await progress('132 MC pages rendered');
  page.once('dialog',d=>d.dismiss());await page.locator('#resetBtn').click();check(await page.locator('.option-explain').count()===4,'MC reset cancel retains answers');page.once('dialog',d=>d.accept());await page.locator('#resetBtn').click();
  check(await page.locator('.option-explain').count()===0,'MC reset clears answer feedback');check(await page.evaluate(()=>JSON.parse(localStorage.getItem('psych-midterm-multiple-v1')).bookmarks.MC001),'MC reset keeps bookmark');
  check(await page.evaluate(()=>localStorage.getItem('psych-midterm-notion-v1'))===notionBefore,'MC reset preserves written records');
  await page.goto(root+'multiple-choice/index.html?question=MC102');const q102=mc.find(q=>q.id==='MC102');for(const o of q102.options.filter(o=>o.correct))await page.locator('[data-option="'+o.id+'"]').click();await page.locator('#submitBtn').click();await settle('#content');
  check(await page.locator('#prompt mjx-container').count()===2,'sample-size and SE rendered as two formulas');await page.screenshot({path:"/Users/a0/Desktop/kw/3\u1112\u1161\u11a8\u1102\u1167\u11ab 2\u1112\u1161\u11a8\u1100\u1175/\u110b\u1175\u11ab\u1110\u1165\u1105\u1162\u11a8\u1110\u1175\u1107\u1173\u1109\u1175\u11b7\u1105\u1175\u1112\u1161\u11a8/07_\uc2dc\ud5d8\ub300\ube44/\uc911\uac04/final-audit"+'/math-MC102-mobile.png'});await page.reload();check(await page.locator('.option-explain').count()===4,'MC graded answer restores after reload');
  const mcBefore=await page.evaluate(()=>localStorage.getItem('psych-midterm-multiple-v1'));
  await page.goto(root+'ox/index.html');const ox=await page.evaluate(()=>window.OX_ITEMS);
  await page.evaluate(qs=>localStorage.setItem('psych-midterm-ox-v1',JSON.stringify({answers:Object.fromEntries(qs.map(q=>[q.id,{value:q.answer,correct:true}])),bookmarks:{OX001:true}})),ox);await page.reload();
  const oxSeen=new Set();for(let i=0;i<ox.length;i++){
   const id=(await page.locator('#position').innerText()).match(/OX\d+/)[0];oxSeen.add(id);check(await page.locator('#feedback').evaluate(n=>n.classList.contains('show')),id+' explanation shown');check((await settle('#quizCard')).length===0,id+' math renders');check(await noLeak('#quizCard'),id+' no raw TeX');check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' mobile no page overflow');if(i<ox.length-1)await page.locator('#nextBtn').click();
  }
  check(oxSeen.size===185,'all 185 OX items visited');result.rendered.ox=oxSeen.size;await progress('185 OX pages rendered');
  page.once('dialog',d=>d.dismiss());await page.locator('#resetBtn').click();check(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('psych-midterm-ox-v1')).answers).length)===185,'OX reset cancel retains answers');
  page.once('dialog',d=>d.accept());await page.locator('#resetBtn').click();check(await page.evaluate(()=>Object.keys(JSON.parse(localStorage.getItem('psych-midterm-ox-v1')).answers).length)===0,'OX reset clears all answers');
  check(await page.evaluate(()=>JSON.parse(localStorage.getItem('psych-midterm-ox-v1')).bookmarks.OX001),'OX reset preserves bookmarks');
  check(await page.evaluate(()=>localStorage.getItem('psych-midterm-multiple-v1'))===mcBefore,'OX reset preserves MC records');check(await page.evaluate(()=>localStorage.getItem('psych-midterm-notion-v1'))===notionBefore,'OX reset preserves written records');
  const first=ox[0];await page.locator('[data-answer="'+(!first.answer)+'"]').click();await page.reload();check(await page.locator('#verdict').innerText().then(t=>t.includes('오답')),'OX wrong answer and feedback restore');
  check(result.errors.length===0,'no unhandled browser exceptions');
 }catch(error){result.failed=error.message}
 await page.evaluate(r=>{window.FINAL_UI_AUDIT=r;localStorage.setItem('psych-final-ui-result',JSON.stringify(r))},result);return {passed:result.checks.length,rendered:result.rendered,failed:result.failed,errors:result.errors};
}
