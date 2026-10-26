async (page) => {
  const results=[];
  const check=(ok,label)=>{if(!ok)throw Error(label);results.push(label);};
  await page.setViewportSize({width:390,height:844});
  await page.goto('http://127.0.0.1:8873/practice/index.html');
  // 이 세션은 작업자가 만든 독립 QA 프로필이며 사용자 풀이 기록이 아니다.
  await page.evaluate(()=>localStorage.removeItem(window.BIGDATA_PRACTICE.key));
  await page.reload();
  await page.getByRole('button',{name:'설정 ▾',exact:true}).click();
  await page.locator('#scope').selectOption('all');
  await page.getByRole('button',{name:'설정 ▴',exact:true}).click();
  const data=await page.evaluate(()=>window.BIGDATA_PRACTICE.bank);
  for(const type of ['code','short','mc']){
    await page.locator(`[data-type="${type}"]`).click();
    const qs=data.filter(q=>q.type===type);
    for(let i=0;i<qs.length;i++){
      const q=qs[i];
      check((await page.locator('.q-head').innerText()).includes(q.id),q.id+' navigation');
      check(await page.locator('h1').innerText()===q.prompt,q.id+' prompt');
      check(await page.locator('.result').count()===0,q.id+' no-answer-leak');
      check(await page.locator('.solution').count()===0,q.id+' no-implicit-solution');
      if(type==='code'){
        check((await page.locator('.goal').innerText()).includes(q.goal),q.id+' goal-visible-before-grade');
        if(q.output&&!q.random)check((await page.locator('.goal pre').first().textContent())===q.output,q.id+' expected-output-exact');
        if(Object.keys(q.written||{}).length)check((await page.locator('.goal').innerText()).includes('목표 파일'),q.id+' file-goal-visible');
        check(await page.locator('.blank').count()===q.blanks.length,q.id+' blank-count');
        for(let j=0;j<q.blanks.length;j++)await page.locator('.blank').nth(j).fill(q.blanks[j].answer);
        await page.locator('#submit').click();
        check(await page.locator('.answer-row').count()===q.blanks.length,q.id+' explanations');
        await page.locator('.solution details summary').click();
        check((await page.locator('.solution .code-line').count())===q.code.split('\n').length,q.id+' full-code');
      }else if(type==='short'){
        await page.locator('#short').fill(q.answer);
        await page.locator('#submit').click();
      }else{
        await page.locator(`[data-choice="${q.correct}"]`).click();
        check(await page.locator('.opt-exp').count()===q.options.length,q.id+' all-options-explained');
      }
      check((await page.locator('.result').innerText()).startsWith('정답입니다.'),q.id+' grading');
      const dims=await page.evaluate(()=>({w:document.documentElement.clientWidth,sw:document.documentElement.scrollWidth,h:innerHeight,sh:document.documentElement.scrollHeight,footer:document.querySelector('footer').getBoundingClientRect().bottom}));
      check(dims.sw===dims.w&&dims.sh<=dims.h+1&&dims.footer<=dims.h+1,q.id+' mobile-viewport');
      if(i<qs.length-1)await page.locator('#next').click();
    }
  }
  await page.reload();
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem(window.BIGDATA_PRACTICE.key)));
  check(Object.values(saved.answers).filter(a=>a.graded&&a.correct).length===data.length,'all-answer-reload');
  return {passed:results.length,questions:data.length,viewport:'390x844',checks:results};
}
