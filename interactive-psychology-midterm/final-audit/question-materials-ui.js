async page=>{
 const result={checks:[],visited:{},errors:[],screenshots:[]};
 page.on('pageerror',e=>result.errors.push(e.message));
 const root=new URL('../',page.url()).href;
 const check=(v,label)=>{if(!v)throw Error(label);result.checks.push(label)};
 const settle=async()=>page.evaluate(async()=>{await StudyMath.typeset(document.getElementById('questionList')||document.getElementById('content'));await StudyMath.idle();return [...document.querySelectorAll('[data-mjx-error]')].map(n=>n.getAttribute('data-mjx-error'))});
 const figures=async()=>{await page.locator('.analysis-material img').evaluateAll(async imgs=>{await Promise.all(imgs.map(img=>img.complete?null:new Promise(resolve=>{img.onload=img.onerror=resolve}))) });return page.locator('.analysis-material img').evaluateAll(imgs=>imgs.every(img=>img.complete&&img.naturalWidth>0))};
 const inspectCode=async(q)=>{
  check(await page.locator('[data-code-blank]').count()===q.codeBlanks.length,q.id+' blank count');
  if(q.codeSetup){
   check(await page.locator('.wr-editor-setup .wr-code-source').allTextContents().then(a=>a.join('\n')===q.codeSetup),q.id+' all input source lines displayed exactly');
   check(await page.locator('.wr-editor-setup input,.wr-editor-setup textarea').count()===0,q.id+' input source read-only');
  }
  for(const b of q.codeBlanks)await page.locator('[data-code-blank="'+b.id+'"]').fill(b.answer);
  const completed=await page.locator('.wr-code-question .wr-code-source').evaluateAll(lines=>lines.map(l=>[...l.childNodes].map(n=>n.nodeType===1&&n.tagName==='INPUT'?n.value:n.textContent).join('')).join('\n'));
  check(completed===q.modelCode,q.id+' visible filled script matches executed R answer');
 };
 try{
  await page.setViewportSize({width:1280,height:960});
  await page.goto(root+'index.html?view=problems&question=RC004');
  const written=JSON.parse(await page.locator('#writtenData').textContent());
  for(const q of written){
   await page.locator('#writtenJump').selectOption(q.id);check((await settle()).length===0,q.id+' math valid');
   check(await figures(),q.id+' referenced images load');
   if(q.type==='code')await inspectCode(q);
  }
  result.visited.written=written.length;
  await page.locator('#writtenJump').selectOption('RC020');await page.reload();
  check(await page.locator('[data-code-blank="1"]').inputValue()==='Time ~ bit','written R blanks saved across reload');
  await page.locator('#writtenJump').selectOption('RC013');
  await page.screenshot({path:"/Users/a0/Desktop/kw/3\u1112\u1161\u11a8\u1102\u1167\u11ab 2\u1112\u1161\u11a8\u1100\u1175/\u110b\u1175\u11ab\u1110\u1165\u1105\u1162\u11a8\u1110\u1175\u1107\u1173\u1109\u1175\u11b7\u1105\u1175\u1112\u1161\u11a8/07_\uc2dc\ud5d8\ub300\ube44/\uc911\uac04/final-audit/output/playwright"+'/RC013-data-desktop.png'});
  await page.setViewportSize({width:390,height:844});
  for(const id of ['RC004','RC007','RC013','RC019','RC020','ES030','ES033','ES041','ES042']){
   await page.locator('#writtenJump').selectOption(id);await settle();check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' mobile page width');
  }
  await page.screenshot({path:"/Users/a0/Desktop/kw/3\u1112\u1161\u11a8\u1102\u1167\u11ab 2\u1112\u1161\u11a8\u1100\u1175/\u110b\u1175\u11ab\u1110\u1165\u1105\u1162\u11a8\u1110\u1175\u1107\u1173\u1109\u1175\u11b7\u1105\u1175\u1112\u1161\u11a8/07_\uc2dc\ud5d8\ub300\ube44/\uc911\uac04/final-audit/output/playwright"+'/ES042-video-cases-mobile.png'});
  await page.goto(root+'multiple-choice/index.html');const mc=JSON.parse(await page.locator('#questionData').textContent());
  await page.locator('[data-mode="mixed"]').click();await page.locator('[data-state="all"]').click();
  const seen=new Set();
  for(let i=0;i<mc.length;i++){
   const id=(await page.locator('#position').innerText()).match(/MC\d+/)[0];seen.add(id);
   check((await settle()).length===0,id+' math valid');check(await figures(),id+' referenced images load');
   check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' mobile page width');
   if(i<mc.length-1)await page.locator('#nextBtn').click();
  }
  check(seen.size===mc.length,'all multiple-choice items visited');result.visited.multipleChoice=seen.size;
  await page.goto(root+'multiple-choice/index.html?question=MC118');await settle();
  check(await page.locator('.analysis-material table').count()===2,'MC118 both analysis tables supplied');
  const text=await page.locator('.analysis-material').allTextContents();check(text.join(' ').includes('Number Set')&&text.join(' ').includes('5000')&&text.join(' ').includes('0.16'),'MC118 output, schema and timeout visible');
  await page.screenshot({path:"/Users/a0/Desktop/kw/3\u1112\u1161\u11a8\u1102\u1167\u11ab 2\u1112\u1161\u11a8\u1100\u1175/\u110b\u1175\u11ab\u1110\u1165\u1105\u1162\u11a8\u1110\u1175\u1107\u1173\u1109\u1175\u11b7\u1105\u1175\u1112\u1161\u11a8/07_\uc2dc\ud5d8\ub300\ube44/\uc911\uac04/final-audit/output/playwright"+'/MC118-data-mobile.png'});
  const q118=mc.find(q=>q.id==='MC118');
  for(const o of q118.options.filter(o=>o.correct))await page.locator('[data-option="'+o.id+'"]').click();
  await page.locator('#submitBtn').click();await page.reload();check(await page.locator('.option-explain').count()===4,'MC118 answers persist with all option explanations');
  await page.setViewportSize({width:1280,height:960});await page.screenshot({path:"/Users/a0/Desktop/kw/3\u1112\u1161\u11a8\u1102\u1167\u11ab 2\u1112\u1161\u11a8\u1100\u1175/\u110b\u1175\u11ab\u1110\u1165\u1105\u1162\u11a8\u1110\u1175\u1107\u1173\u1109\u1175\u11b7\u1105\u1175\u1112\u1161\u11a8/07_\uc2dc\ud5d8\ub300\ube44/\uc911\uac04/final-audit/output/playwright"+'/MC118-data-desktop.png'});
  await page.goto(root+'mock-exam/index.html?mode=practice&set=1');const mock=JSON.parse(await page.locator('#mockData').textContent());
  for(let set=1;set<=5;set++){
   await page.goto(root+'mock-exam/index.html?mode=practice&set='+set);
   for(const q of mock.filter(q=>q.set===set)){
    await page.locator('#mockJump').selectOption(q.id);check((await settle()).length===0,q.id+' math valid');check(await figures(),q.id+' referenced images load');
    if(q.type==='code')await inspectCode(q);
   }
  }
  result.visited.mock=mock.length;
  await page.goto(root+'mock-exam/index.html?mode=practice&set=4&question=ME4-Q16');
  check(await page.locator('.analysis-material table').count()===2,'mock copy of MC118 has both datasets');
  await page.goto(root+'mock-exam/index.html?mode=exam&set=1&question=ME1-Q30');
  // Test storage and time behavior in this isolated profile only.
  await page.evaluate(()=>{const k='psych-midterm-mock-v1',s=JSON.parse(localStorage.getItem(k));s.exams[1]={status:'running',startedAt:Date.now(),deadline:Date.now()+7200000,selected:{},texts:{},codeAnswers:{},codeNotes:{},rubrics:{},graded:{},checked:{},review:{},assessedAt:{}};localStorage.setItem(k,JSON.stringify(s))});
  await page.reload();check(await page.locator('.wr-editor-setup').count()===1,'exam displays question input before submission');
  check(await page.locator('#mockReveal').count()===0,'exam still withholds solutions');
  check(result.errors.length===0,'no unhandled browser exceptions');
 }catch(e){result.failed=e.message}
 await page.evaluate(r=>{window.R_MATERIALS_UI_AUDIT=r;localStorage.setItem('psy-r-materials-ui-result',JSON.stringify(r))},result);
 return {passed:result.checks.length,visited:result.visited,failed:result.failed,errors:result.errors};
}