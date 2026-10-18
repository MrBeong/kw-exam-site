async page => {
 const root=new URL(/\/(ox|multiple-choice|mock-exam)\//.test(new URL(page.url()).pathname)?'../':'./',page.url()).href;
 const r={checks:0,visited:{multiple:0,mockObjective:0,mockTF:0},errors:[],mobile:[],desktopLengths:[]};
 const check=(v,s)=>{if(!v)throw Error(s);r.checks++};
 page.removeAllListeners('dialog');page.on('dialog',d=>d.accept());page.on('pageerror',e=>r.errors.push(e.message));
 const settle=()=>page.evaluate(async()=>{await StudyMath.typeset();await StudyMath.idle();return !document.querySelector('[data-mjx-error]')});
 try {
  await page.evaluate(()=>{for(const k of ['psych-midterm-multiple-v1','psych-midterm-mock-v1'])localStorage.removeItem(k)});
  await page.setViewportSize({width:1360,height:950});
  await page.goto(root+'multiple-choice/index.html');const qs=await page.evaluate(()=>questions);
  for(const q of qs){
   await page.goto(root+'multiple-choice/index.html?question='+q.id);check(await settle(),q.id+' math');
   check(await page.locator('#options .option-text').count()===4,q.id+' all four choices');
   check(await page.locator('.option-explain').count()===0,q.id+' solutions initially hidden');
   const heights=await page.locator('#options .option-text').evaluateAll(ns=>ns.map(n=>Math.round(n.getBoundingClientRect().height)));
   r.desktopLengths.push({id:q.id,heights});
   const wrong=q.options.find(o=>!o.correct);await page.locator('[data-option='+wrong.id+']').click();if(q.type==='multi')await page.locator('#submitBtn').click();
   check((await page.locator('#resultBar').innerText()).startsWith('오답'),q.id+' wrong selection is wrong');
   check(await page.locator('.option-explain').count()===4,q.id+' all option rationales shown');check(await settle(),q.id+' explanation math');
   await page.locator('#retryBtn').click();
   for(const o of q.options.filter(o=>o.correct))await page.locator('[data-option='+o.id+']').click();
   if(q.type==='multi')await page.locator('#submitBtn').click();
   check((await page.locator('#resultBar').innerText()).startsWith('정답'),q.id+' exact correct set accepted');
   await page.reload();check((await page.locator('#resultBar').innerText()).startsWith('정답'),q.id+' grading survives reload');r.visited.multiple++;
  }
  for(let set=1;set<=5;set++){
   await page.goto(root+'mock-exam/index.html?mode=practice&set='+set);const bank=await page.evaluate(()=>bank());
   for(const q of bank.filter(q=>['single','multi','tf'].includes(q.type))){
    await page.locator('#mockJump').selectOption(q.id);check(await page.locator('#mockSolution').isHidden(),q.id+' solution initially hidden');
    if(q.type==='tf'){
     for(const s of q.statements)await page.locator('[data-tf='+s.id+'][value='+s.correct+']').check();
    }else{
     check(await page.locator('.mock-option').count()===4,q.id+' four choices');
     for(const o of q.options.filter(o=>o.correct))await page.locator('[data-option='+o.id+']').check();
    }
    await page.locator('#mockReveal').click();check((await page.locator('#mockSolution h4').innerText()).includes('2 / 2점'),q.id+' correct scores full credit');
    check(await page.locator('.mock-option-explain').count()===(q.type==='tf'?2:4),q.id+' each rationale shown');check(await settle(),q.id+' solution math');
    await page.locator('#retryOne').click();
    if(q.type==='tf'){
     for(const s of q.statements)await page.locator('[data-tf='+s.id+'][value='+(!s.correct)+']').check();
    }else{
     await page.locator('[data-option='+q.options.find(o=>!o.correct).id+']').check();
    }
    await page.locator('#mockReveal').click();check((await page.locator('#mockSolution h4').innerText()).includes('0 / 2점'),q.id+' wrong scores zero');
    if(q.type==='tf')r.visited.mockTF++;else r.visited.mockObjective++;
   }
  }
  await page.setViewportSize({width:390,height:844});
  for(const id of ['MC001','MC018','MC020','MC031','MC049','MC054','MC067','MC076','MC084','MC085','MC086','MC091','MC098','MC108','MC118','MC122','MC127','MC133','MC135']){
   await page.goto(root+'multiple-choice/index.html?question='+id);check(await settle(),id+' mobile math');
   check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),id+' mobile page width');
   check(await page.locator('#options .option-text').count()===4,id+' mobile all choices');r.mobile.push(id);
  }
  check(r.visited.multiple===135&&r.visited.mockObjective===80&&r.visited.mockTF===10,'all objective questions tested');
  check(r.errors.length===0,'no browser exceptions');r.status='pass';
 }catch(e){r.status='fail';r.failure=e.message;r.url=page.url()}
 return r;
}
