async page=>{
 const root=new URL(/\/(ox|multiple-choice|mock-exam)\//.test(new URL(page.url()).pathname)?'../':'./',page.url()).href,r={checks:[],visited:[],errors:[]};
 const check=(v,s)=>{if(!v)throw Error(s);r.checks.push(s)};page.on('pageerror',e=>r.errors.push(e.message));
 try{
 await page.evaluate(()=>{for(const key of ['psych-midterm-ox-v1','psych-midterm-multiple-v1','psych-midterm-notion-v1','psych-midterm-mock-v1'])localStorage.removeItem(key)});
 const delta=await page.evaluate(async root=>(await fetch(root+'final-audit/answer-hint-changes.json')).json(),root);
 for(const q of delta.changes){
  const url=q.bank==='written'?'index.html?view=problems&question='+q.id:q.bank==='mock-exam'?'mock-exam/index.html?mode=practice&set='+q.id.match(/^ME(\d+)/)[1]+'&question='+q.id:q.bank+'/index.html?question='+q.id;
  await page.goto(root+url);await page.evaluate(async()=>{await StudyMath.typeset();await StudyMath.idle()});
  check(await page.evaluate(()=>!document.querySelector('[data-mjx-error]')),q.id+' final math renders');
  if(q.bank==='written'||q.bank==='mock-exam'){
   const prefix=q.bank==='written'?'written':'mock';check(await page.locator('#'+prefix+'Solution').isHidden(),q.id+' solution starts hidden');
   const text=await page.locator('.wr-prompt').innerText();
   if(['SA002','ME2-Q19'].includes(q.id))check(!/인지도|태도|윤리|충성도|Awareness|Loyalty|Ethics/.test(text),q.id+' no translated list in question');
   if(['SA003','ME3-Q19'].includes(q.id))check(!/감성|사용성|사용자 가치|Affect|Usability|User Value/.test(text),q.id+' no product-element list in question');
   if(q.id==='ES030')check(!/Stimulus-based|Goal-based|Overshoot|Undershoot/.test(await page.locator('.wr-scroll').innerText()),q.id+' classifications not supplied by its data table');
   if(['ES039','ME4-Q28'].includes(q.id))check(!(await page.locator('.wr-card .analysis-material').innerText()).includes('regression1.xlsx'),q.id+' only matching calculation data');
   await page.locator('#'+prefix+'Reveal').click();check(await page.locator('#'+prefix+'Solution').isVisible(),q.id+' complete explanation available');
  }
  if(q.bank==='multiple-choice')check((await page.locator('#position').innerText()).includes(q.id),q.id+' final MC route');
  if(q.bank==='ox')check((await page.locator('#position').innerText()).includes(q.id),q.id+' final OX route');
  r.visited.push(q.id);
 }
 await page.setViewportSize({width:390,height:844});
 for(const url of ['index.html?view=problems&question=SA002','index.html?view=problems&question=ES022','index.html?view=problems&question=ES030','multiple-choice/index.html?question=MC021','multiple-choice/index.html?question=MC054','mock-exam/index.html?mode=practice&set=2&question=ME2-Q19']){
  await page.goto(root+url);await page.evaluate(async()=>{await StudyMath.typeset();await StudyMath.idle()});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile width '+url);
 }
 await page.setViewportSize({width:1360,height:950});check(r.errors.length===0,'no browser exceptions');r.status='pass';
 }catch(e){r.status='fail';r.failure=e.message;r.url=page.url()}return r;
}
