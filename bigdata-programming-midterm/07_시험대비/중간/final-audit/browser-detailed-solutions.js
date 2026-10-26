async page=>{
 const checks=[],errors=[],check=(v,t)=>{if(!v)throw Error(t);checks.push(t);};
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.reload();
 const d=await page.evaluate(()=>JSON.parse(document.querySelector('#bankData').textContent)),key=await page.evaluate(()=>window.BIGDATA_PRACTICE.key),url=page.url();
 const answers={BM41:{choice:1,graded:true,correct:false,at:123},BC01:{values:['old draft','',''],graded:false}};
 await page.evaluate(({key,d,answers})=>localStorage.setItem(key,JSON.stringify({version:d.version,type:'mc',filter:'all',scope:'all',section:'all',search:'BM41',auto:false,current:'BM41',answers,stars:{BM41:true},history:[],round:null,reveals:{},viewed:{},appliedRevisions:{[d.questionRevision.id]:true}})),{key,d,answers});
 await page.reload();
 check(JSON.stringify(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).answers,key))===JSON.stringify(answers),'existing wrong answer and unrelated draft preserved');
 check(await page.locator('.reasoning li').count()===5,'saved graded BM41 immediately shows detailed reasoning');
 check(await page.locator('.reference-table').isVisible(),'character reference still visible');
 const choose=async q=>{await page.locator(`[data-type="${q.type}"]`).click();if(!await page.locator('#settings').isVisible())await page.locator('#tools').click();await page.locator('#scope').selectOption('all');await page.locator('#section').selectOption('all');await page.locator('#search').fill(q.id);await page.locator('#tools').click();check((await page.locator('.q-head').innerText()).startsWith(q.id+' ·'),'selected '+q.id);};
 const selectId=async id=>choose(d.bank.find(q=>q.id===id));
 for(const q of d.bank){
   await choose(q);const s=d.detailedSolutions[q.id],graded=!!answers[q.id]?.graded;
   if(!graded){check(await page.locator('.solution,.opt-exp').count()===0,q.id+' no explanation before explicit request');await page.locator('#peek').click();}
   check(await page.locator('.solution h2').innerText()==='정답과 상세 해설',q.id+' explanation in current window');
   check(await page.locator('.reasoning li').count()===s.reasoning.length,q.id+' complete reasoning');
   const text=await page.locator('.reasoning').innerText();check(s.reasoning.every(t=>text.includes(t.replaceAll('`',''))),q.id+' exact authored text rendered');
   check(await page.locator('.source-details').evaluate(el=>!el.open),q.id+' PDF optional and collapsed');
   if(q.type==='code'){
     check(await page.locator('.complete-solution').evaluate(el=>el.open),q.id+' complete code and line explanation open');
     check(await page.locator('.answer-row').count()===q.blanks.length,q.id+' every blank rationale');
     check(await page.locator('.blank-evidence').count()===q.blanks.length,q.id+' every filled sentence shown');
   }else if(q.type==='mc'){check(await page.locator('.opt-exp').count()===q.options.length,q.id+' all option reasons shown');check(await page.locator('.option-detail').count()===q.options.length,q.id+' every option has deeper explanation');const details=await page.locator('.option-detail').allTextContents();check(details.every((t,i)=>t===s.optionDetails[i].replaceAll('`','')),q.id+' every detailed option aligned');}
   if(s.runtime){
     check(await page.locator('.trace-step').count()===s.runtime.trace.length,q.id+' all actual execution steps retained');
     check(await page.locator('.verified-output').textContent()===(s.runtime.stdout||'(화면 출력 없음)'),q.id+' stdout exact');
     check((await page.locator('.output-representation code').textContent())===s.runtime.stdoutRepr,q.id+' spaces and newline exact');
     if(s.runtime.exception)check((await page.locator('.execution-error').innerText()).includes(s.runtime.exception.name),q.id+' error class explained');
     if(s.runtime.randomExample)check((await page.locator('.solution').innerText()).includes('한 예시'),q.id+' random output is sample');
   }
   if(!graded){await page.locator('#peek').click();check(await page.locator('.solution,.opt-exp').count()===0,q.id+' explicit close hides explanations again');}
 }
 check(JSON.stringify(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).answers,key))===JSON.stringify(answers),'preview all 204 leaves every answer record unchanged');
 check(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).stars.BM41,key),'bookmark preserved');
 await selectId('BC24');await page.locator('#peek').click();
 const middle=page.locator('.middle-trace');check(await middle.count()===1,'long loop groups middle steps');
 await middle.locator('summary').click();check(await middle.evaluate(el=>el.open),'all intermediate loop steps expandable in same window');
 check(await middle.locator('.trace-step').count()===d.detailedSolutions.BC24.runtime.trace.length-16,'no intermediate iterations dropped');
 await middle.locator('summary').click();
 const before=await page.locator('#card details').evaluateAll(ds=>ds.map(el=>el.open));
 await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));check(await page.locator('#card details').evaluateAll(ds=>ds.every(el=>el.open)),'printing expands complete reasoning and intermediate steps');
 await page.evaluate(()=>dispatchEvent(new Event('afterprint')));check(JSON.stringify(await page.locator('#card details').evaluateAll(ds=>ds.map(el=>el.open)))===JSON.stringify(before),'printing restores detail states');
 for(const id of ['BM41','BC24']){
   await selectId(id);if(await page.locator('#peek').count()&&await page.locator('.solution').count()===0)await page.locator('#peek').click();
   for(const [width,height] of [[1440,1000],[390,844],[320,640]]){
     await page.setViewportSize({width,height});await page.locator('.reasoning h3').scrollIntoViewIfNeeded();
     await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
     const fit=await page.locator('#card').evaluate(el=>({left:el.getBoundingClientRect().left,right:el.getBoundingClientRect().right,w:innerWidth,sw:document.documentElement.scrollWidth}));
     check(fit.left>=0&&fit.right<=fit.w+1&&fit.sw===fit.w,id+' explanation page fits '+width);
     if(width!==320)await page.screenshot({path:'output/playwright/detailed-solutions-'+id+'-'+width+'.png',animations:'disabled'});
   }
 }
 await page.setViewportSize({width:1440,height:1000});
 await selectId('BC01');if(await page.locator('.solution').count())await page.locator('#peek').click();
 const q=d.bank.find(q=>q.id==='BC01');for(let i=0;i<q.blanks.length;i++)await page.locator(`[data-blank="${i+1}"]`).fill(q.blanks[i].answer);
 await page.locator('#submit').click();check((await page.locator('.result').innerText()).startsWith('정답입니다.'),'code grading unchanged');
 check(await page.locator('.complete-solution').evaluate(el=>el.open),'graded code shows full explanation by default');
 await selectId('BFS01');await page.locator('#short').fill('s t r');await page.locator('#submit').click();check((await page.locator('.result').innerText()).startsWith('정답입니다.'),'short whitespace grading unchanged');
 await selectId('BM41');await page.locator('#retryOne').click();await page.locator('[data-choice="1"]').click();check((await page.locator('.result').innerText()).startsWith('오답입니다.'),'MC distractor still wrong');
 check(await page.locator('.option-detail').count()===4,'BM41 every option has deeper explanation');
 await page.locator('[data-filter="wrong"]').click();check(!await page.locator('#retryBar').isVisible(),'retry controls hidden on first wrong-tab click');
 await page.locator('[data-filter="wrong"]').click();check(await page.locator('#retryBar').isVisible(),'retry controls on second wrong-tab click');
 await page.locator('#startRetry').click();check(await page.locator('.solution').count()===0,'retry starts without previous answer exposed');
 await page.locator('[data-choice="2"]').click();check((await page.locator('.result').innerText()).startsWith('정답입니다.'),'retry correct grade and detailed solution');
 await page.locator('#endRetry').click();await page.reload();
 check(await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).answers.BM41.correct,key),'graded answer persists on reload');
 check(await page.locator('.reasoning li').count()===5,'reloaded grade keeps detailed solution');
 check(page.url()===url,'no PDF or external navigation required');check(errors.length===0,'no page or console errors');
 return {date:'2026-10-24',questions:204,passed:checks.length,errors,checks};
}
