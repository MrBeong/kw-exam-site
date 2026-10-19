async page=>{
 const root=new URL(/\/(ox|multiple-choice|mock-exam)\//.test(new URL(page.url()).pathname)?'../':'./',page.url()).href,r={checks:[],errors:[]};
 page.removeAllListeners('dialog');page.on('dialog',d=>d.accept());page.on('pageerror',e=>r.errors.push(e.message));
 const check=(v,s)=>{if(!v)throw Error(s);r.checks.push(s)};
 const fresh=()=>({status:'practice',selected:{'ME1-Q01':['invalid']},texts:{},codeAnswers:{},codeNotes:{},rubrics:{},graded:{},checked:{'ME1-Q01':true},review:{},assessedAt:{'ME1-Q01':100}});
 const banks=[
 {name:'OX',url:'ox/index.html',key:'psych-midterm-ox-v1',tab:'#stateTabs [data-state=wrong]',all:'#stateTabs [data-state=all]',position:'#position',seed:{answers:{OX001:{value:false,correct:false},OX003:{value:true,correct:true}},bookmarks:{OX003:true}}},
 {name:'MC',url:'multiple-choice/index.html',key:'psych-midterm-multiple-v1',tab:'#stateTabs [data-state=wrong]',all:'#stateTabs [data-state=all]',position:'#position',seed:{answers:{MC118:{selected:['a'],correct:false},MC001:{selected:['b'],correct:true}},bookmarks:{MC001:true},autoAdvance:false}},
 {name:'Written',url:'index.html?view=problems',key:'psych-midterm-notion-v1',tab:'#againFilterBtn',all:'[data-filter=all]',position:'#practicePosition',seed:{answers:{SA001:'correct'},grades:{RC001:'again',SA001:'done'},codeAnswers:{RC001:{1:'old code'}},codeNotes:{},rubrics:{},revealed:{},bookmarks:{SA001:true},codeSchemaVersion:1}},
 {name:'Mock',url:'mock-exam/index.html?mode=practice&set=1',key:'psych-midterm-mock-v1',tab:'[data-filter=wrong]',all:'[data-filter=all]',position:'#mockPosition',seed:{activeSet:1,mode:'practice',exams:{},practice:{1:fresh()},bookmarks:{'ME1-Q02':true},answers:{}}}
 ];
 try{
 for(const b of banks){
  await page.evaluate(([k,v])=>{v.questionRevision=StudyRevisions.revision;localStorage.setItem(k,JSON.stringify(v))},[b.key,b.seed]);await page.goto(root+b.url);const tab=page.locator(b.tab),panel=page.locator('#wrongRetryPanel');
  check(await panel.isHidden(),b.name+' all tab: controls hidden');
  const before=await page.evaluate(k=>localStorage.getItem(k),b.key);await tab.click();
  check(await tab.getAttribute('aria-expanded')==='false'&&await panel.isHidden(),b.name+' first click: wrong list only');
  const position=await page.locator(b.position).textContent();check(!!position&&!position.includes('0 / 0'),b.name+' wrong questions displayed');
  check(await page.evaluate(([k,s])=>localStorage.getItem(k)===s,[b.key,before]),b.name+' entering wrong tab does not change answers');
  await tab.click();check(await panel.isVisible()&&await tab.getAttribute('aria-expanded')==='true',b.name+' second click: controls expanded');
  check((await page.locator(b.position).textContent())===position,b.name+' expanding keeps current question');
  await tab.click();check(await panel.isHidden()&&await tab.getAttribute('aria-expanded')==='false',b.name+' third click: controls collapsed');
  check(await page.evaluate(([k,s])=>localStorage.getItem(k)===s,[b.key,before]),b.name+' collapse does not change records');
  await tab.click();await page.locator('#retryWrongBtn').click();
  check(await panel.isVisible()&&await tab.getAttribute('aria-expanded')==='true',b.name+' new round keeps controls and arrow expanded');
  let snapshot=await page.evaluate(k=>localStorage.getItem(k),b.key);check(!!JSON.parse(snapshot).retrySession,b.name+' round started');
  let draft;
  if(b.name==='Written'){await page.locator('[data-code-blank="1"]').fill('sort');draft=await page.locator('[data-code-blank="1"]').inputValue()}
  if(b.name==='MC'){await page.locator('[data-option]').first().click();draft=await page.locator('.option.selected').count()}
  if(b.name==='Mock'){await page.locator('[data-option]').first().check();draft=await page.locator('[data-option]:checked').count()}
  snapshot=await page.evaluate(k=>localStorage.getItem(k),b.key);const at=await page.locator(b.position).textContent();
  await tab.click();check(await panel.isHidden(),b.name+' active round can collapse controls');await tab.click();
  check(await panel.isVisible()&&(await page.locator(b.position).textContent())===at,b.name+' active round reopens same question');
  check(await page.evaluate(([k,s])=>localStorage.getItem(k)===s,[b.key,snapshot]),b.name+' toggling preserves session and progress');
  if(b.name==='Written')check(await page.locator('[data-code-blank="1"]').inputValue()===draft,'Written toggle preserves code draft');
  if(b.name==='MC')check(await page.locator('.option.selected').count()===draft,'MC toggle preserves unsubmitted selection');
  if(b.name==='Mock')check(await page.locator('[data-option]:checked').count()===draft,'Mock toggle preserves selected answer');
  await page.reload();check(await panel.isHidden(),'Reloaded '+b.name+' starts with controls folded');check(await page.evaluate(k=>!!JSON.parse(localStorage.getItem(k)).retrySession,b.key),b.name+' reload resumes round');
  await tab.click();check(await panel.isVisible(),b.name+' active wrong tab click opens after reload');
  await page.locator(b.all).click();check(await panel.isHidden(),b.name+' leaving wrong hides controls');check(await page.evaluate(k=>!JSON.parse(localStorage.getItem(k)).retrySession,b.key),b.name+' leaving restores pending records');
  await tab.click();check(await panel.isHidden(),b.name+' re-entering wrong starts folded');
  await page.setViewportSize({width:390,height:844});await tab.click();check(await panel.isVisible()&&await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),b.name+' mobile controls accessible without page overflow');await page.setViewportSize({width:1360,height:950});
 }
 await page.goto(root+'index.html?view=mistakes');
 check(await page.locator('#resetAndSolveMistakesBtn').count()===0,'Mistakes view has no separate retry-start button');
 check(await page.locator('#mistakes a[href*=retryWrong]').count()===0,'Mistakes view has no automatic retry-start link');
 check(await page.locator('#wrongRetryPanel').isHidden(),'Mistakes view hides retry controls');
 check(r.errors.length===0,'No unhandled browser errors');r.status='pass';
 }catch(e){r.status='fail';r.failure=e.message;r.url=page.url()}
 await page.evaluate(r=>window.RETRY_FOLD_AUDIT=r,r);return r;
}
