async page=>{
 const checks=[],errors=[],check=(v,t)=>{if(!v)throw Error(t);checks.push(t);};
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const d=await page.evaluate(()=>JSON.parse(document.querySelector('#bankData').textContent));
 const key=await page.evaluate(()=>window.BIGDATA_PRACTICE.key),ids=d.fileTranscriptAssessment.addedIds;
 const old=d.bank.filter(q=>!ids.includes(q.id));
 const answer=q=>q.type==='code'?{values:q.blanks.map(b=>b.answer),graded:true,correct:true,at:123}:q.type==='mc'?{choice:q.correct,graded:true,correct:true,at:123}:{text:q.answer,graded:true,correct:true,at:123};
 const seeded=Object.fromEntries(old.map(q=>[q.id,answer(q)]));
 seeded.BE17={values:['wrong','read','read'],graded:true,correct:false,at:123};
 seeded.BC01={values:['old draft','',''],graded:false};
 await page.evaluate(({key,d,seeded})=>localStorage.setItem(key,JSON.stringify({version:d.version,type:'code',filter:'all',scope:'all',section:'all',search:'',auto:false,current:'BC01',answers:seeded,stars:{BC01:true,BE17:true},round:null,history:[],reveals:{},viewed:{},appliedRevisions:{[d.questionRevision.id]:true}})),{key,d,seeded});
 await page.reload();
 const record=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 check(JSON.stringify((await record()).answers)===JSON.stringify(seeded),'all original answer fixtures preserved');
 check(ids.every(id=>!(id in seeded)),'new questions start unanswered');
 const choose=async q=>{
   await page.locator(`[data-type="${q.type}"]`).click();
   if(await page.locator('#settings').isHidden())await page.locator('#tools').click();
   await page.locator('#scope').selectOption('all');await page.locator('#section').selectOption('all');await page.locator('#search').fill(q.id);await page.locator('#tools').click();
 };
 const fill=async(q,bad=false)=>{
   if(q.type==='code')for(const b of q.blanks)await page.locator(`[data-blank="${b.number}"]`).fill(b.answer+(bad&&b.number===1?' ':''));
   else if(q.type==='short')await page.locator('#short').fill(bad?q.answer+'()':q.answer);
 };
 for(const id of ids){
   const q=d.bank.find(q=>q.id===id);await choose(q);
   check(await page.locator('h1').innerText()===q.prompt,id+' focused prompt');
   check(await page.locator('.solution,.result,.opt-exp,.statement-notes').count()===0,id+' no answers or statements leaked');
   const condition=await page.locator('.problem-conditions').count()?await page.locator('.problem-conditions').innerText():'';
   check((q.conditions||[]).every(c=>condition.includes(c)),id+' necessary execution conditions visible');
   check(await page.locator('.file').count()===q.files.length,id+' exactly relevant file fixtures');
   for(let i=0;i<q.files.length;i++)check(await page.locator('.file pre').nth(i).innerText()===d.fixtures[q.files[i]],id+' input file exact '+q.files[i]);
   const shown=await page.locator('#card>.code-wrap .code-line').evaluateAll(lines=>lines.map(line=>{const c=line.cloneNode(true);c.querySelector('.line-no').remove();c.querySelectorAll('[data-blank]').forEach(e=>e.replaceWith('⟦'+e.dataset.blank+'⟧'));return c.textContent.trim()?c.textContent:'';}).join('\n'));
   check(shown===(q.template||q.code),id+' Python indentation and blank boundaries exact');
   await page.locator('#peek').click();
   check(await page.locator('.solution').count()===1,id+' explicit preview available');
   if(q.type!=='code')await page.locator('.statement-notes summary').click();
   const solution=await page.locator('.solution').innerText();
   check(q.steps.every(([n,t])=>solution.includes(t)),id+' detailed statement explanations');
   if(q.type==='mc')check(await page.locator('.opt-exp').count()===4,id+' all four choice explanations');
   check(!(await record()).answers[id],id+' preview does not grade or save answer');
   await page.locator('#peek').click();
   if(q.type==='mc')await page.locator(`[data-choice="${(q.correct+1)%4}"]`).click();
   else{await fill(q,true);await page.locator('#submit').click();}
   check((await page.locator('.result').innerText()).startsWith('오답입니다.'),id+' incorrect or nonmatching answer rejected');
   await page.locator('#retryOne').click();
   if(q.type==='mc')await page.locator(`[data-choice="${q.correct}"]`).click();
   else{await fill(q);await page.locator('#submit').click();}
   check((await page.locator('.result').innerText()).startsWith('정답입니다.'),id+' correct literal accepted');
   const link=await page.locator('.source a').first().getAttribute('href');
   check((await page.request.get(new URL(link,page.url()).href)).status()===200,id+' official slide source works');
 }
 await page.reload();const stored=await record();
 check(ids.every(id=>stored.answers[id]?.correct),'12 new grades survive reload');
 check(old.every(q=>JSON.stringify(stored.answers[q.id])===JSON.stringify(seeded[q.id])),'all 192 old records still identical');
 check(stored.stars.BC01&&stored.stars.BE17,'existing bookmarks retained');
 const retryQ=d.bank.find(q=>q.id==='BFC03');await choose(retryQ);await page.locator('#retryOne').click();await fill(retryQ,true);await page.locator('#submit').click();
 if(await page.locator('#settings').isHidden())await page.locator('#tools').click();await page.locator('#search').fill('');await page.locator('#section').selectOption('files');await page.locator('#tools').click();
 await page.locator('[data-filter="wrong"]').click();check(await page.locator('#retryBar').isHidden(),'first wrong tab only filters');
 await page.locator('[data-filter="wrong"]').click();check(await page.locator('#retryBar').isVisible(),'second wrong tab reveals retry bar');
 const prior=await record();await page.locator('#startRetry').click();const round=await record();
 check(round.round.ids.includes('BFC03')&&round.round.ids.includes('BE17'),'retry round includes new and old wrong questions');
 await page.locator('#endRetry').click();const restored=await record();
 check(JSON.stringify(restored.answers.BFC03)===JSON.stringify(prior.answers.BFC03)&&JSON.stringify(restored.answers.BE17)===JSON.stringify(prior.answers.BE17),'unfinished retry restores new and old answers');
 for(const [width,height,id] of [[1440,1000,'BFC03'],[390,844,'BFM03'],[320,640,'BFM02']]){
   await page.setViewportSize({width,height});await choose(d.bank.find(q=>q.id===id));
   if(await page.locator('#retryOne').count())await page.locator('#retryOne').click();
   await page.locator('.code-wrap').first().scrollIntoViewIfNeeded();await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const m=await page.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth,h:innerHeight,sh:document.documentElement.scrollHeight,foot:document.querySelector('footer').getBoundingClientRect().bottom}));
   check(m.w===m.sw&&m.sh<=m.h+1&&m.foot<=m.h+1,'viewport '+width);
   if(width!==320)await page.screenshot({path:'output/playwright/bigdata-file-assessment-'+width+'.png',animations:'disabled'});
 }
 await choose(d.bank.find(q=>q.id==='BFM04'));if(await page.locator('#peek').count())await page.locator('#peek').click();
 const openBefore=await page.locator('details').evaluateAll(ds=>ds.map(e=>e.open));
 await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));
 check(await page.locator('.statement-notes').evaluate(e=>e.open),'print includes newly added statement notes');
 await page.evaluate(()=>dispatchEvent(new Event('afterprint')));
 check(JSON.stringify(await page.locator('details').evaluateAll(ds=>ds.map(e=>e.open)))===JSON.stringify(openBefore),'print restores folded states');
 check(errors.length===0,'no runtime or console errors');
 return {date:'2026-10-22',questions:ids.length,passed:checks.length,errors,checks};
}
