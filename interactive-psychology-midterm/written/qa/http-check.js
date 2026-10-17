async (page) => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));const checks=[];const check=(v,n)=>{if(!v)throw new Error(n);checks.push(n)};
 check(await page.locator('#writtenJump option').count()===103,'HTTP shortcut opens 103-item bank');
 await page.locator('#writtenJump').selectOption('RC001');await page.getByRole('button',{name:'정답·해설·채점 기준 보기',exact:true}).click();
 check(await page.locator('.wr-model-code').innerText().then(t=>t.includes('ascending <- sort(score)')),'ascending and descending model present');
 check(await page.locator('[data-rubric]').count()===4,'RC001 updated rubric present');
 await page.locator('#writtenJump').selectOption('ES003');await page.getByRole('button',{name:'정답·해설·채점 기준 보기',exact:true}).click();
 check(await page.locator('#writtenSolution').innerText().then(t=>t.includes('1945')&&t.includes('1959')),'history institution examples present');
 await page.locator('#writtenJump').selectOption('RC005');await page.getByRole('button',{name:'정답·해설·채점 기준 보기',exact:true}).click();check(await page.locator('#writtenSolution').innerText().then(t=>t.includes('작업 환경')),'R and RStudio role explanation present');
 await page.locator('#writtenJump').selectOption('SA013');await page.locator('#writtenAnswer').fill('Deficiency / Contamination');await page.getByRole('button',{name:'정답·해설·채점 기준 보기',exact:true}).click();await page.getByRole('button',{name:'다시 풀기',exact:true}).click();
 await page.getByRole('link',{name:'다지선다',exact:true}).click();await page.waitForURL('**/multiple-choice/index.html');
 check(await page.evaluate(()=>window.MC_AUDIT.questionCount===132),'existing MC bank still loads');
 await page.getByRole('link',{name:'오답 정리',exact:true}).click();await page.waitForURL('**/index.html?view=mistakes');check(await page.locator('#errorLog').innerText().then(t=>t.includes('SA013')),'HTTP shared mistakes preserve written record');
 await page.getByRole('link',{name:'O/X',exact:true}).click();await page.waitForURL('**/ox/index.html');check(await page.evaluate(()=>window.OX_ITEMS.length===185),'existing OX bank still loads');
 const corrected=await page.evaluate(()=>window.OX_ITEMS.find(q=>q.id==='OX053').statement);check(corrected.includes('제품 설계 적용'),'OX053 paper phase matches primary source');
 await page.getByRole('link',{name:'예상문제',exact:true}).click();await page.waitForURL('**/index.html?view=problems*');
 check(errors.length===0,'HTTP no uncaught errors');
 const result={checks:checks.length,results:checks,errors};await page.evaluate(r=>window.WRITTEN_HTTP_QA_RESULT=r,result);return result;
}
