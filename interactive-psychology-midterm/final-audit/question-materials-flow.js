async page=>{
 page.removeAllListeners('dialog');
 const r={checks:[],errors:[]},root=new URL('./',page.url()).href;
 page.on('pageerror',e=>r.errors.push(e.message));const check=(v,s)=>{if(!v)throw Error(s);r.checks.push(s)};
 try{
  await page.goto(root+'index.html?view=problems&question=RC010');
  const input=await page.locator('.wr-editor-setup .wr-code-source').allTextContents();
  await page.locator('[data-code-blank="1"]').fill('height ~ group');await page.reload();
  check(await page.locator('[data-code-blank="1"]').inputValue()==='height ~ group','R answer reload persistence');
  await page.locator('#writtenRetry').click();
  check(await page.locator('[data-code-blank]').evaluateAll(ns=>ns.every(n=>!n.value)),'R reset clears only answers');
  check((await page.locator('.wr-editor-setup .wr-code-source').allTextContents()).join('\n')===input.join('\n'),'R reset preserves full given dataset');
  await page.evaluate(()=>localStorage.removeItem('psych-midterm-mock-v1'));
  await page.goto(root+'mock-exam/index.html?mode=exam&set=1');
  await page.locator('[data-action="start"]').click();
  const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('psych-midterm-mock-v1')).exams[1]);
  check(before.deadline-before.startedAt===7200000,'exam real start sets 120-minute deadline');
  await page.locator('#mockJump').selectOption('ME1-Q30');
  check(await page.locator('.wr-editor-setup').count()===1,'analysis dataset available during live exam');
  check(await page.locator('#mockReveal').count()===0,'solutions withheld during live exam');
  await page.locator('[data-code-blank="1"]').fill('t.test');await page.reload();
  check(await page.locator('[data-code-blank="1"]').inputValue()==='t.test','exam R answer reload persistence');
  check(await page.evaluate(t=>JSON.parse(localStorage.getItem('psych-midterm-mock-v1')).exams[1].deadline===t,before.deadline),'exam deadline survives reload');
  const text=await page.locator('#mockTimer').textContent().catch(()=>null);
  if(text!==null){await page.waitForFunction(t=>document.getElementById('mockTimer').textContent!==t,text);check(true,'real countdown advances')}
  await page.evaluate(()=>{const key='psych-midterm-mock-v1',s=JSON.parse(localStorage.getItem(key));s.exams[1].deadline=Date.now()-1;localStorage.setItem(key,JSON.stringify(s))});
  await page.reload();
  check(await page.evaluate(()=>JSON.parse(localStorage.getItem('psych-midterm-mock-v1')).exams[1].status==='submitted'),'expired deadline submits automatically');
  check(await page.locator('[data-code-blank]').evaluateAll(ns=>ns.every(n=>n.disabled)),'submitted exam locks R answers');
  check(await page.locator('.wr-editor-setup').count()===1,'submitted exam retains analysis dataset');
  await page.locator('#mockReveal').click();check(await page.locator('.wr-blank-answers').count()===1,'code answer explanations available after submission');
  check(r.errors.length===0,'no browser exceptions in save/reset/timer flow');
 }catch(e){r.failed=e.message}
 await page.evaluate(v=>{window.PSY_R_FLOW_AUDIT=v;localStorage.setItem('psy-r-flow-result',JSON.stringify(v))},r);
 return {checks:r.checks.length,failed:r.failed,errors:r.errors};
}