async page=>{
 const checks=[],errors=[],check=(v,t)=>{if(!v)throw Error(t);checks.push(t);};
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const d=await page.evaluate(()=>JSON.parse(document.querySelector('#bankData').textContent));
 const key=await page.evaluate(()=>window.BIGDATA_PRACTICE.key);
 const qs=d.bank.filter(q=>q.transcriptGuidance),ids=qs.map(q=>q.id);
 const answer=q=>q.type==='mc'?{choice:q.correct,graded:true,correct:true,at:123}:q.type==='short'?{text:q.answer,graded:true,correct:true,at:123}:{values:q.blanks.map(b=>b.answer),graded:true,correct:true,at:123};
 const seeded=Object.fromEntries(qs.map(q=>[q.id,answer(q)]));seeded.BC01={values:['original draft','',''],graded:false};
 await page.evaluate(({key,d,seeded})=>localStorage.setItem(key,JSON.stringify({version:d.version,type:'mc',filter:'all',scope:'all',section:'all',search:'',auto:false,current:'BM27',answers:seeded,stars:{BM27:true,BC01:true},round:null,history:[],reveals:{},viewed:{},appliedRevisions:{[d.questionRevision.id]:true}})),{key,d,seeded});
 await page.reload();
 const record=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 check(JSON.stringify((await record()).answers)===JSON.stringify(seeded),'existing answers and code draft preserved');
 const choose=async q=>{
   await page.locator(`[data-type="${q.type}"]`).click();
   if(await page.locator('#settings').isHidden())await page.locator('#tools').click();
   await page.locator('#scope').selectOption('all');await page.locator('#search').fill(q.id);await page.locator('#tools').click();
   if(await page.locator('#retryOne').count())await page.locator('#retryOne').click();
 };
 for(const q of qs){
   await choose(q);
   check(await page.locator('h1').innerText()===q.prompt,q.id+' same question stem');
   check(await page.locator('.transcript-guidance').count()===0,q.id+' no supplemental explanation before answer');
   const prior=JSON.stringify((await record()).answers[q.id]);
   await page.locator('#peek').click();
   check(await page.locator('.transcript-guidance').count()===1,q.id+' explanation available in explicit preview');
   const text=await page.locator('.transcript-guidance').innerText();
   check(q.transcriptGuidance.notes.every(n=>text.includes(n)),q.id+' all supplementary notes visible');
   check(JSON.stringify((await record()).answers[q.id])===prior,q.id+' preview preserves answer');
   const source=await page.locator('.transcript-guidance a').getAttribute('href');
   check((await page.request.get(new URL(source,page.url()).href)).status()===200,q.id+' transcript source link works');
   await page.locator('#peek').click();
   check(await page.locator('.transcript-guidance').count()===0,q.id+' preview closes');
   if(q.type==='mc')await page.locator(`[data-choice="${q.correct}"]`).click();
   else if(q.type==='short'){await page.locator('#short').fill(q.answer);await page.locator('#submit').click();}
   else{
     for(const b of q.blanks)await page.locator(`[data-blank="${b.number}"]`).fill(b.answer);
     await page.locator('#submit').click();
   }
   check((await page.locator('.result').innerText()).startsWith('정답입니다.'),q.id+' grading unchanged');
   check(await page.locator('.transcript-guidance').count()===1,q.id+' annotation after grading');
 }
 await page.reload();const stored=await record();
 check(ids.every(id=>stored.answers[id]?.correct),'all 16 grades reload');
 check(stored.answers.BC01.values[0]==='original draft','unrelated draft retained');
 check(stored.stars.BM27&&stored.stars.BC01,'bookmarks retained');
 await choose(qs.find(q=>q.id==='BM29'));await page.locator('#peek').click();
 for(const [width,height] of [[320,640],[390,844],[1440,1000]]){
   await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   await page.locator('.transcript-guidance').scrollIntoViewIfNeeded();
   const m=await page.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth,h:innerHeight,sh:document.documentElement.scrollHeight,foot:document.querySelector('footer').getBoundingClientRect().bottom}));
   check(m.w===m.sw&&m.sh<=m.h+1&&m.foot<=m.h+1,'annotated question fits viewport '+width);
   if(width!==320)await page.screenshot({path:'output/playwright/bigdata-transcript-question-'+width+'.png'});
 }
 check(errors.length===0,'no console or page errors');
 return {date:'2026-10-21',questions:qs.length,passed:checks.length,errors,checks};
}
