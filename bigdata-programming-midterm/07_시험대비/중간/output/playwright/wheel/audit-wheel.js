async page => {
 const checks=[],motions=[],failures=[];
 const check=(name,ok,detail)=>{checks.push({name,ok,...(detail?{detail}:{})});if(!ok)failures.push({name,detail});};
 const key='kw.bigdata.midterm.notice-practice.v1';
 await page.reload();
 await page.setViewportSize({width:1440,height:800});
 async function choose(type,id){
  await page.locator('[data-type="'+type+'"]').click();
  if(!await page.locator('#settings').isVisible())await page.locator('#tools').click();
  await page.locator('#scope').selectOption('all');await page.locator('#section').selectOption('all');await page.locator('#search').fill(id);
  await page.locator('#tools').click();if(await page.locator('#peek').count()&&(await page.locator('#peek').textContent()).includes('닫기'))await page.locator('#peek').click();await page.locator('#card').evaluate(e=>e.scrollTop=0);
  check('selected '+id,(await page.locator('.q-head').innerText()).includes(id));
 }
 async function wheelOn(selector,label,delta=180){
  const loc=page.locator(selector).first();
  if(!await loc.count()){check(label+' exists',false,selector);return;}
  await loc.evaluate(e=>e.scrollIntoView({block:'center',inline:'nearest'}));
  let card=await page.locator('#card').boundingBox(),box=await loc.boundingBox();
  let top=Math.max(box.y,card.y+3),bottom=Math.min(box.y+box.height,card.y+card.height-3);
  if(bottom<=top){check(label+' visible',false,{card,box});return;}
  let x=selector==='#card'?card.x+4:Math.min(Math.max(box.x+Math.min(35,box.width/2),card.x+4),card.x+card.width-4),y=(top+bottom)/2;
  const hit=await page.evaluate(({x,y,selector})=>{const el=document.elementFromPoint(x,y);return{match:!!el?.closest(selector),tag:el?.tagName,cls:el?.className};},{x,y,selector});
  check(label+' pointer hits target',hit.match,hit);
  await page.mouse.move(x,y);await page.waitForTimeout(230);
  const before=await page.locator('#card').evaluate(e=>({y:e.scrollTop,max:e.scrollHeight-e.clientHeight}));
  const sign=before.max-before.y>20?1:-1;
  const stored=await page.evaluate(key=>localStorage.getItem(key),key);
  await page.mouse.wheel(0,sign*delta);await page.waitForTimeout(240);
  const after=await page.locator('#card').evaluate(e=>e.scrollTop);
  const ok=sign>0?after>before.y+1:after<before.y-1;
  check(label+' native vertical wheel',ok,{before,after,sign});
  check(label+' records unchanged',stored===await page.evaluate(key=>localStorage.getItem(key),key));
  motions.push({label,selector,before:before.y,after,direction:sign>0?'down':'up',pointer:hit});
 }
 await choose('code','BP43');
 // Confirm the known broken CSS fails under the same real wheel gesture.
 const legacy=await page.addStyleTag({content:'.code-scroll{overscroll-behavior:contain!important}'});
 for(const selector of ['.code-scroll','.blank']){
  await page.locator('#card').evaluate(e=>e.scrollTop=0);
  await page.locator(selector).first().evaluate(e=>e.scrollIntoView({block:'center'}));
  const loc=page.locator(selector).first(),box=await loc.boundingBox(),card=await page.locator('#card').boundingBox();
  const x=box.x+Math.min(35,box.width/2),y=(Math.max(box.y,card.y+3)+Math.min(box.y+box.height,card.y+card.height-3))/2;
  await page.mouse.move(x,y);await page.waitForTimeout(230);const before=await page.locator('#card').evaluate(e=>e.scrollTop);
  await page.mouse.wheel(0,180);await page.waitForTimeout(240);
  const after=await page.locator('#card').evaluate(e=>e.scrollTop);
  check('legacy CSS reproduces trapped '+selector,before===after,{before,after});
 }
 await legacy.evaluate(e=>e.remove());
 for(const viewport of [{width:1440,height:800},{width:390,height:844},{width:320,height:740}]){
  await page.setViewportSize(viewport);await choose('code','BP43');
  const name=viewport.width+'px';
  for(const selector of ['.goal','.task-requirements','.task-output','.code-head','.code-scroll','.blank','#card'])await wheelOn(selector,name+' BP43 '+selector);
  // Focused input keeps its draft and caret after wheel events.
  const input=page.locator('.blank').first();await input.fill('s[1]');await input.focus();await input.press('Home');
  const inputBefore=await input.evaluate(e=>({value:e.value,start:e.selectionStart,end:e.selectionEnd}));
  await wheelOn('.blank',name+' focused draft input');
  check(name+' focused input/caret unchanged',await input.evaluate((e,b)=>document.activeElement===e&&e.value===b.value&&e.selectionStart===b.start&&e.selectionEnd===b.end,inputBefore));
  if((await page.locator('#star').getAttribute('aria-pressed'))==='false')await page.locator('#star').click();
  // Place code at the left/right horizontal limits, then verify native Y chaining.
  const code=page.locator('.code-scroll').first();
  for(const edge of ['start','end']){
   await code.evaluate((e,edge)=>e.scrollLeft=edge==='start'?0:e.scrollWidth,edge);
   await wheelOn('.code-scroll',name+' horizontal '+edge+' vertical');
  }
  if(viewport.width<600){
   await code.evaluate(e=>{e.scrollIntoView({block:'center'});e.scrollLeft=0;});await page.waitForTimeout(400);
   let box=await code.boundingBox(),card=await page.locator('#card').boundingBox();
   const x=box.x+box.width/2,y=(Math.max(box.y,card.y+3)+Math.min(box.y+box.height,card.y+card.height-3))/2;
   await page.mouse.move(x,y);await page.waitForTimeout(230);
   const before=await code.evaluate(e=>e.scrollLeft),mainBefore=await page.locator('#card').evaluate(e=>e.scrollTop);
   await page.mouse.wheel(220,0);await page.waitForTimeout(240);
   const horizontalAfter=await code.evaluate(e=>({left:e.scrollLeft,max:e.scrollWidth-e.clientWidth}));check(name+' native horizontal code wheel',horizontalAfter.max===0?horizontalAfter.left===0:horizontalAfter.left>before,{before,after:horizontalAfter,pointer:{x,y}});
   check(name+' horizontal wheel keeps vertical position',Math.abs(await page.locator('#card').evaluate(e=>e.scrollTop)-mainBefore)<1);
  }
  if(viewport.width<600){
   await choose('code','BC26');const longCode=page.locator('.code-scroll').first();
   await longCode.evaluate(e=>{e.scrollIntoView({block:'center'});e.scrollLeft=0;});await page.waitForTimeout(400);
   const box=await longCode.boundingBox(),card=await page.locator('#card').boundingBox();
   const x=box.x+box.width/2,y=(Math.max(box.y,card.y+3)+Math.min(box.y+box.height,card.y+card.height-3))/2;
   await page.mouse.move(x,y);await page.waitForTimeout(230);const oldTop=await page.locator('#card').evaluate(e=>e.scrollTop);
   await page.mouse.wheel(220,0);await page.waitForTimeout(240);
   const pos=await longCode.evaluate(e=>({left:e.scrollLeft,max:e.scrollWidth-e.clientWidth}));
   check(name+' long code genuine horizontal wheel',pos.max>0&&pos.left>0,pos);
   check(name+' long code horizontal keeps main position',Math.abs(await page.locator('#card').evaluate(e=>e.scrollTop)-oldTop)<1);
   await choose('code','BP43');
  }
  await page.locator('#peek').click();
  for(const selector of ['.answer-row','.solution','.statement-list li','.verified-output'])if(await page.locator(selector).count())await wheelOn(selector,name+' BP43 explanation '+selector);
  await choose('code','BC24');
  for(const selector of ['.file summary','.file pre'])await wheelOn(selector,name+' file '+selector);
  await choose('mc','BM41');
  for(const selector of ['.reference-scroll','.reference-table td'])await wheelOn(selector,name+' reference '+selector);
  await page.locator('#peek').click();
  for(const selector of ['.choice','.opt-exp','.option-detail','.reasoning li'])if(await page.locator(selector).count())await wheelOn(selector,name+' MC '+selector);
  await choose('short','BSA150');await page.locator('#short').fill('bytes');
  await page.locator('#peek').click();
  for(const selector of ['#short','.solution'])await wheelOn(selector,name+' short '+selector);
  check(name+' no document horizontal overflow',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 await page.setViewportSize({width:1440,height:800});await choose('code','BP43');
 // Explicit upward return over the code and draft input.
 for(const selector of ['.code-scroll','.blank']){
  await page.locator('#card').evaluate(e=>e.scrollTop=e.scrollHeight);
  const loc=page.locator(selector).first();await loc.evaluate(e=>e.scrollIntoView({block:'center'}));
  const card=await page.locator('#card').boundingBox(),box=await loc.boundingBox();
  const x=box.x+Math.min(35,box.width/2),y=(Math.max(box.y,card.y+3)+Math.min(box.y+box.height,card.y+card.height-3))/2;
  await page.mouse.move(x,y);await page.waitForTimeout(230);const before=await page.locator('#card').evaluate(e=>e.scrollTop);
  await page.mouse.wheel(0,-180);await page.waitForTimeout(240);const after=await page.locator('#card').evaluate(e=>e.scrollTop);
  check('upward return '+selector,after<before,{before,after});
 }
 const saved=await page.evaluate(key=>localStorage.getItem(key),key);await page.reload();
 check('saved draft and marks survive reload',saved===await page.evaluate(key=>localStorage.getItem(key),key));
 check('no JS wheel interception',await page.evaluate(()=>!document.querySelector('script:last-of-type').textContent.includes('addEventListener(\'wheel\'')));
 await page.emulateMedia({media:'print'});
 check('print main overflow visible',await page.locator('#card').evaluate(e=>getComputedStyle(e).overflow==='visible'));
 check('print code overflow visible',await page.locator('.code-scroll').first().evaluate(e=>getComputedStyle(e).overflow==='visible'));
 await page.emulateMedia({media:'screen'});
 await page.locator('#card').evaluate(e=>e.scrollTop=0);
 await page.screenshot({path:'output/playwright/wheel/fixed-desktop.png',fullPage:false});
 const finalCss=await page.locator('.code-scroll').first().evaluate(e=>({x:getComputedStyle(e).overscrollBehaviorX,y:getComputedStyle(e).overscrollBehaviorY}));
 return{date:'2026-10-25',browser:'Chromium',passed:failures.length===0,checks:checks.length,nativeWheelCases:motions.length,finalCss,failures,motions};
}