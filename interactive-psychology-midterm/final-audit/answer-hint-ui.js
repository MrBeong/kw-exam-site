async page=>{
 const root=new URL(/\/(ox|multiple-choice|mock-exam)\//.test(new URL(page.url()).pathname)?'../':'./',page.url()).href;
 const r={checks:0,visited:{written:0,multiple:0,mock:0,ox:0},formulaCount:0,errors:[]};
 page.removeAllListeners('dialog');page.on('dialog',d=>d.accept());page.on('pageerror',e=>r.errors.push(e.message));
 const check=(v,s)=>{if(!v)throw Error(s);r.checks++};
 const settle=()=>page.evaluate(async()=>{await StudyMath.typeset();await StudyMath.idle();return document.querySelectorAll('[data-mjx-error]').length});
 const inspect=async()=>{
  check(await settle()===0,'formula typesetting');
  check(await page.locator('.analysis-material img').evaluateAll(async ns=>{await Promise.all(ns.map(n=>n.complete?null:new Promise(resolve=>n.onload=n.onerror=resolve)));return ns.every(n=>n.complete&&n.naturalWidth>0)}),'analysis figures load');
 };
 try{
 await page.evaluate(()=>{for(const k of ['psych-midterm-ox-v1','psych-midterm-multiple-v1','psych-midterm-notion-v1','psych-midterm-mock-v1'])localStorage.removeItem(k)});
 await page.goto(root+'index.html?view=problems');const ws=await page.evaluate(()=>problems);
 for(const q of ws){await page.locator('#writtenJump').selectOption(q.id);check(await page.locator('#writtenSolution').isHidden(),q.id+' solution hidden before reveal');await page.locator('#writtenReveal').click();await inspect();check(await page.locator('[data-rubric]').count()===q.rubric.length,q.id+' rubric');
  if(q.type==='code'){check(await page.locator('[data-code-blank]').count()===q.codeBlanks.length,q.id+' blanks');if(q.codeSetup)check((await page.locator('.wr-editor-setup .wr-code-source').allTextContents()).join('\n')===q.codeSetup,q.id+' full data source');check((await page.locator('.wr-model-code .wr-code-source').allTextContents()).join('\n')===q.modelCode,q.id+' R indentation and syntax');}
  r.visited.written++;
 }
 await page.goto(root+'multiple-choice/index.html');const ms=await page.evaluate(()=>questions);
 for(const q of ms){await page.goto(root+'multiple-choice/index.html?question='+q.id);check((await page.locator('#source').innerText())==='',q.id+' source and concept hints hidden before grading');await inspect();check((await page.locator('#position').textContent()).includes(q.id),q.id+' routing');r.visited.multiple++;}
 for(let set=1;set<=5;set++){
  await page.goto(root+'mock-exam/index.html?mode=practice&set='+set);const qs=await page.evaluate(()=>bank());
  for(const q of qs){await page.locator('#mockJump').selectOption(q.id);check(await page.locator('#mockSolution').isHidden(),q.id+' mock solution hidden before reveal');await page.locator('#mockReveal').click();await inspect();
   if(q.type==='code'){check(await page.locator('[data-code-blank]').count()===q.codeBlanks.length,q.id+' blanks');if(q.codeSetup)check((await page.locator('.wr-editor-setup .wr-code-source').allTextContents()).join('\n')===q.codeSetup,q.id+' full data');check((await page.locator('.wr-model-code .wr-code-source').allTextContents()).join('\n')===q.modelCode,q.id+' R source');}
   r.visited.mock++;
  }
 }
 await page.goto(root+'ox/index.html');const count=await page.evaluate(()=>OX_ITEMS.length);
 await page.setViewportSize({width:390,height:844});
 for(let i=0;i<count;i++){await inspect();check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'OX mobile width');r.visited.ox++;if(i<count-1)await page.locator('#nextBtn').click();}
 await page.setViewportSize({width:1360,height:950});await page.goto(root+'index.html');await inspect();
 const formulas=await page.evaluate(async root=>{const response=await fetch(root+'final-audit/formulas.json');return response.json()},root);
 r.formulaCount=Array.isArray(formulas)?formulas.length:formulas.formulas.length;
 const list=Array.isArray(formulas)?formulas:formulas.formulas;
 const errors=await page.evaluate(async formulas=>{const errors=[];await StudyMath.idle();for(const f of formulas){try{const n=await MathJax.tex2svgPromise(f.tex,{display:false});if(n.querySelector('[data-mjx-error]'))errors.push(f.tex)}catch(e){errors.push(String(e))}}return errors},list);
 check(errors.length===0,'all unique formulas compile');check(r.visited.written+r.visited.multiple+r.visited.mock+r.visited.ox===674,'all 674 questions visited');check(r.errors.length===0,'no browser exceptions');r.status='pass';
 }catch(e){r.status='fail';r.failure=e.message;r.url=page.url()}
 await page.evaluate(r=>{window.PSY_HINT_UI_AUDIT=r;localStorage.setItem('psy-hint-ui-audit',JSON.stringify(r))},r);return r;
}
