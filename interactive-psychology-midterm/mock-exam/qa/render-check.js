async (page)=>{const results=[],errors=[];page.on('pageerror',e=>errors.push(e.message));const check=(v,n)=>{if(!v)throw new Error(n);results.push(n)};try{const data=JSON.parse(await page.locator('#mockData').textContent());
 let rendered=0,rBlanks=0;
 for(let set=1;set<=5;set++){
  await page.locator('#mockSet').selectOption(String(set));
  for(const q of data.filter(q=>q.set===set)){
   await page.locator('#mockJump').selectOption(q.id);if(await page.locator('#mockReveal').getAttribute('aria-expanded')==='false')await page.locator('#mockReveal').click();
   if(await page.locator('[data-question]').getAttribute('data-question')!==q.id)throw new Error('render '+q.id);
   if(['single','multi'].includes(q.type)&&await page.locator('.mock-option-explain').count()!==4)throw new Error('all option solutions '+q.id);
   if(q.type==='code'){
    const restored=await page.locator('.wr-code-question .wr-code-source').evaluateAll(lines=>lines.map(l=>[...l.childNodes].map(n=>n.nodeName==='INPUT'?'{{'+n.dataset.codeBlank+'}}':n.textContent).join('')).join('\n'));
    if(restored!==q.codeTemplate)throw new Error('R template/indentation '+q.id);
    if((await page.locator('.wr-model-code .wr-code-source').allTextContents()).join('\n')!==q.modelCode)throw new Error('R complete model '+q.id);
    rBlanks+=await page.locator('[data-code-blank]').count();
   }
   if(!['single','multi','tf'].includes(q.type)&&await page.locator('[data-rubric]').count()!==q.rubric.length)throw new Error('rubrics '+q.id);
   rendered++;
  }
 }
 check(rendered===160,'all 160 questions render with full solutions and scoring criteria');check(rBlanks===61,'all 20 R editors preserve indentation and 61 blank mappings');
 await page.setViewportSize({width:390,height:844});let visuals=0;
 for(let set=1;set<=5;set++){await page.locator('#mockSet').selectOption(String(set));for(const q of data.filter(q=>q.set===set&&q.visual)){await page.locator('#mockJump').selectOption(q.id);if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))throw new Error('mobile overflow '+q.id);visuals++}}
 check(visuals===19,'all 19 visual/table questions fit mobile width');
 await page.locator('#mockSet').selectOption('1');await page.locator('#mockJump').selectOption('ME1-Q29');await page.screenshot({path:'/tmp/psy-mock-mobile.png'});
 await page.setViewportSize({width:320,height:760});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'320px no page-wide horizontal overflow');check(await page.locator('#resetBtn').isVisible(),'reset remains visible at narrow width');
 await page.setViewportSize({width:1280,height:960});await page.locator('#mockJump').selectOption('ME1-Q26');await page.screenshot({path:'/tmp/psy-mock-desktop.png'});

const out={passed:results.length,results,errors,allQuestionsRendered:rendered,rBlanks,visuals};await page.evaluate(r=>window.MOCK_RENDER_QA=r,out);return out;}catch(e){const out={failed:e.message,results,errors};await page.evaluate(r=>window.MOCK_RENDER_QA=r,out);return out;}}