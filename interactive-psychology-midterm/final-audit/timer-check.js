async page=>{
 const out={checks:[],errors:[]};page.on('pageerror',e=>out.errors.push(e.message));const check=(v,n)=>{if(!v)throw Error(n);out.checks.push(n)};let peer;
 try{
  const url=page.url().split('?')[0];await page.goto(url+'?mode=exam&set=4');
  const s0=await page.evaluate(()=>JSON.parse(localStorage.getItem('psych-midterm-mock-v1')));check(s0.exams['4'].status==='running','returning resumes the running fourth set');
  peer=await page.context().newPage();await peer.goto(url+'?mode=practice&set=1');
  const read=p=>p.evaluate(()=>JSON.parse(localStorage.getItem('psych-midterm-mock-v1')));let s=await read(peer);check(s.mode==='exam'&&s.activeSet===4&&s.exams['4'].deadline===s0.exams['4'].deadline,'second tab resumes same active exam and deadline');
  const qs=JSON.parse(await page.locator('#mockData').textContent()),q=qs.find(q=>q.id==='ME4-Q01');const option=q.options[0].id;
  await peer.locator('#mockJump').selectOption(q.id);await peer.locator('[data-option="'+option+'"]').check();await page.waitForTimeout(200);
  check((await read(page)).exams['4'].selected[q.id]?.includes(option),'other-tab answers synchronize through storage event');
  const before=await page.locator('#mockTimer').innerText();await page.waitForTimeout(1250);const after=await page.locator('#mockTimer').innerText();check(before!==after,'timer visibly counts down in an open page');
  // Advance only this isolated page's Date.now; the next real interval must submit it.
  await page.evaluate(()=>{const now=Date.now.bind(Date);Date.now=()=>now()+7200001});await page.waitForTimeout(1250);s=await read(page);
  check(s.exams['4'].status==='submitted'&&s.exams['4'].timeUp,'time expiry auto submits without reload');
  check(await page.locator('#resultPanel').innerText().then(t=>t.includes('자동 제출')),'automatic submission shown on active page');
  await peer.waitForTimeout(300);check(await peer.locator('#resultPanel').innerText().then(t=>t.includes('자동 제출')),'automatic submission synchronizes to second tab');
  const submitted=s.exams['4'].submittedAt;await page.reload();await page.waitForTimeout(1100);check((await read(page)).exams['4'].submittedAt===submitted,'expiry submission remains idempotent after interval and reload');
  check(out.errors.length===0,'timer and cross-tab flow has no exceptions');
 }catch(error){out.failed=error.message}finally{await peer?.close()}
 await page.evaluate(r=>{window.FINAL_TIMER_AUDIT=r;localStorage.setItem('psych-final-timer-result',JSON.stringify(r))},out);return {passed:out.checks.length,failed:out.failed,errors:out.errors};
}
