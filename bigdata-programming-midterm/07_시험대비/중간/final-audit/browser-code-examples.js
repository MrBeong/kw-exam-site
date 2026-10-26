async page=>{
 const checks=[],errors=[],check=(v,t)=>{if(!v)throw Error(t);checks.push(t);};
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 const d=await page.evaluate(()=>JSON.parse(document.querySelector('#bankData').textContent));
 const key=await page.evaluate(()=>window.BIGDATA_PRACTICE.key);
 const ids=d.presentationRevision.changes.map(c=>c.id);
 const answers=Object.fromEntries(ids.map(id=>{const q=d.bank.find(q=>q.id===id);return[id,q.type==='mc'?{choice:q.correct,graded:true,correct:true,at:123}:{text:q.answer,graded:true,correct:true,at:123}];}));
 answers.BC01={values:['old draft','',''],graded:false};
 await page.evaluate(({key,d,answers})=>localStorage.setItem(key,JSON.stringify({version:d.version,type:'mc',filter:'all',scope:'all',section:'all',search:'',auto:false,current:'BM02',answers,stars:{BC01:true,BM02:true},round:null,history:[],reveals:{},viewed:{},appliedRevisions:{[d.questionRevision.id]:true}})),{key,d,answers});
 await page.reload();
 const rec=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),key);
 check(JSON.stringify((await rec()).answers)===JSON.stringify(answers),'all-existing-answers-and-drafts-preserved');
 check((await rec()).stars.BM02&&(await rec()).stars.BC01,'bookmarks-preserved');
 const choose=async q=>{
  await page.locator(`[data-type="${q.type}"]`).click();
  if(await page.locator('#settings').isHidden())await page.locator('#tools').click();
  await page.locator('#scope').selectOption('all');await page.locator('#search').fill(q.id);await page.locator('#tools').click();
  if(await page.locator('#retryOne').count())await page.locator('#retryOne').click();
 };
 for(const id of ids){
  const q=d.bank.find(q=>q.id===id);await choose(q);
  check(await page.locator('h1').innerText()===q.prompt,id+' clear stem');
  check(await page.locator('.solution,.result,.opt-exp').count()===0,id+' no-answer-preview');
  const shown=await page.locator('#card>.code-wrap .code-line').evaluateAll(lines=>lines.map(line=>{const c=line.cloneNode(true);c.querySelector('.line-no').remove();return c.textContent.trim()?c.textContent:'';}).join('\n'));
  check(shown===q.code,id+' code-exact-with-indentation');
  check((await page.locator('.code-head').first().innerText())===q.codeLabel,id+' code-label');
  if(id==='BM02'){
   check(shown.includes('# 셀 1\nx = 3\n\n# 셀 2\nx + 4\n\n# 셀 3\nprint(x)'),'BM02 complete-three-cell-example');
   await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'output/playwright/bigdata-BM02-code-desktop.png'});
   await page.setViewportSize({width:390,height:844});await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));await page.screenshot({path:'output/playwright/bigdata-BM02-code-mobile.png'});
  }
  if(q.type==='mc'){await page.locator(`[data-choice="${q.correct}"]`).click();check(await page.locator('.opt-exp').count()===q.options.length,id+' all-option-explanations');}
  else{await page.locator('#short').fill(q.answer);await page.locator('#submit').click();}
  check((await page.locator('.result').innerText()).startsWith('정답입니다.'),id+' correct-grading');
  const m=await page.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth,h:innerHeight,sh:document.documentElement.scrollHeight,footer:document.querySelector('footer').getBoundingClientRect().bottom}));
  check(m.w===m.sw&&m.sh<=m.h+1&&m.footer<=m.h+1,id+' viewport');
 }
 await page.reload();
 check(ids.every(id=>d.bank.some(q=>q.id===id)),'all-IDs-kept');
 const s=await rec();check(ids.every(id=>s.answers[id]?.correct),'all-new-example-answers-reloaded');check(s.answers.BC01.values[0]==='old draft','unrelated-code-draft-not-changed');
 await page.locator('[data-type="mc"]').click();await page.locator('#tools').click();await page.locator('#search').fill('keys_view');await page.locator('#tools').click();
 check((await page.locator('.q-head').innerText()).startsWith('BM24 '),'search-includes-code-text');
 const q=d.bank.find(q=>q.id==='BM02');await choose(q);
 for(const [width,height] of [[320,640],[375,667],[390,844],[768,1024],[1440,1000]]){
  await page.setViewportSize({width,height});const m=await page.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth,h:innerHeight,sh:document.documentElement.scrollHeight,b:document.querySelector('footer').getBoundingClientRect().bottom}));
  check(m.w===m.sw&&m.sh<=m.h+1&&m.b<=m.h+1,'BM02 viewport '+width);
 }
 check(errors.length===0,'no-runtime-console-errors');
 return {date:'2026-10-21',questions:ids.length,passed:checks.length,errors,checks};
}
