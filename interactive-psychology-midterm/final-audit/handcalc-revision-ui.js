async page=>{
 const root=new URL(/\/(ox|multiple-choice|mock-exam)\//.test(new URL(page.url()).pathname)?'../':'./',page.url()).href,r={checks:[],errors:[]};
 const check=(v,s)=>{if(!v)throw Error(s);r.checks.push(s)};
 const get=key=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'{}'),key);
 const seed=(key,obj)=>page.evaluate(([k,v])=>localStorage.setItem(k,JSON.stringify(v)),[key,obj]);
 page.on('pageerror',e=>r.errors.push(e.message));page.removeAllListeners('dialog');page.on('dialog',d=>d.accept());
 try{
 const mc='psych-midterm-multiple-v1',wr='psych-midterm-notion-v1',ox='psych-midterm-ox-v1',me='psych-midterm-mock-v1';
 await seed(mc,{answers:{MC028:{selected:['o1'],correct:true}},bookmarks:{MC028:true},retrySession:{active:true,ids:['MC028','MC001'],originals:{MC028:{answers:{selected:['o1'],correct:false}},MC001:{answers:{selected:['o2'],correct:false}}},completed:{},cursor:'MC028'}});
 await page.goto(root+'multiple-choice/index.html?question=MC028');let a=await get(mc);
 check(!a.answers.MC028&&a.answers.MC001.correct===false,'changed MC cleared; unfinished unaffected retry restored');check(!a.retrySession&&a.bookmarks.MC028,'old retry finished and bookmarks kept');
 const archive=await get(a.revisionArchiveKey);check(archive.state.answers.MC028.correct===true&&archive.state.retrySession.active,'complete old MC state archived');
 const archiveKey=a.revisionArchiveKey;await page.reload();a=await get(mc);check(a.revisionArchiveKey===archiveKey,'migration idempotent across reload');
 await page.locator('[data-option=o1]').click();a=await get(mc);check(a.answers.MC028.correct,'new MC answer saved');
 await seed(wr,{codeSchemaVersion:1,answers:{SA015:'총 16명 / 추가 11명',SA016:'2'},grades:{SA015:'done',SA016:'done'},rubrics:{SA015:[true,true,true]},revealed:{SA015:true},codeAnswers:{RC018:{'1':'log2(D / W + 1)','2':'50 + 150 * ID'},RC001:{'1':'sort'}},bookmarks:{SA015:true},checks:{keep:true}});
 await page.goto(root+'index.html?view=problems&question=SA015');a=await get(wr);
 check(!a.answers.SA015&&!a.grades.SA015&&!a.rubrics.SA015&&!a.revealed.SA015,'changed written answer/grade/rubric/reveal cleared');
 check(a.answers.SA016==='2'&&a.grades.SA016==='done'&&a.bookmarks.SA015&&a.checks.keep,'unaffected written records preserved');check(!a.codeAnswers.RC018&&a.codeAnswers.RC001['1']==='sort','only changed R exercise cleared');check((await get(a.revisionArchiveKey)).state.answers.SA015.includes('16'),'old written answer archived');
 await seed(ox,{answers:{OX044:{value:true,correct:true},OX001:{value:true,correct:true}},bookmarks:{OX044:true}});await page.goto(root+'ox/index.html');a=await get(ox);check(!a.answers.OX044&&a.answers.OX001.correct&&a.bookmarks.OX044,'OX changed record only reset');
 const submitted={status:'submitted',selected:{},texts:{'ME4-Q26':'53.2%'},codeAnswers:{},codeNotes:{},rubrics:{'ME4-Q26':[true,true,true]},graded:{'ME4-Q26':true},checked:{'ME4-Q26':true},review:{},assessedAt:{'ME4-Q26':1},deadline:12345};
 await seed(me,{activeSet:4,mode:'exam',exams:{4:submitted},practice:{4:{status:'practice',texts:{'ME4-Q26':'old','ME4-Q27':'keep'},graded:{'ME4-Q26':true},rubrics:{'ME4-Q26':[true,true,true]}}},bookmarks:{'ME4-Q26':true}});
 await page.goto(root+'mock-exam/index.html?mode=exam&set=4&question=ME4-Q26');a=await get(me);
 check(a.exams[4].texts['ME4-Q26']==='53.2%'&&a.exams[4].graded['ME4-Q26']&&a.exams[4].deadline===12345,'submitted exam answers/grades/deadline preserved');
 check((await page.evaluate(()=>bank().find(q=>q.id==='ME4-Q26').prompt)).includes('0.468'),'submitted exam uses original question snapshot');check((await page.locator('#examTitle').innerText()).includes('이전 문항'),'old exam version visibly labelled');
 check(!a.practice[4].texts['ME4-Q26']&&a.practice[4].texts['ME4-Q27']==='keep','mock practice changed item only reset');
 await page.locator('#mockJump').selectOption('ME4-Q26');check((await page.locator('#mockSolution').innerText()).includes('53.2'),'old submitted solution matches original data');
 await page.locator('#resetBtn').click();check((await page.evaluate(()=>bank().find(q=>q.id==='ME4-Q26').prompt)).includes('0.4'),'new exam retake uses new hand calculation data');a=await get(me);check((await get(a.revisionArchiveKey)).state.exams[4].texts['ME4-Q26']==='53.2%','retake retains old archive');
 const deadline=Date.now()+300000;const running={...submitted,status:'running',deadline,texts:{},graded:{},checked:{}};
 await seed(me,{activeSet:2,mode:'exam',exams:{2:running},practice:{},bookmarks:{}});await page.goto(root+'mock-exam/index.html?mode=exam&set=2&question=ME2-Q32');a=await get(me);
 check(a.exams[2].deadline===deadline&&a.exams[2].status==='running','running exam deadline/status unchanged');check((await page.evaluate(()=>bank().find(q=>q.id==='ME2-Q32').modelCode)).includes('c(100, 200)'),'running exam retains old R inputs');await page.reload();a=await get(me);check(a.exams[2].deadline===deadline,'legacy running exam survives reload');
 for(const currentMarker of [false,true]){
  const incoming={activeSet:2,mode:'exam',exams:{2:running},practice:{},bookmarks:{}};
  if(currentMarker)incoming.questionRevision='midterm-review-2026-10-18';
  await page.evaluate(([key,obj])=>window.dispatchEvent(new StorageEvent('storage',{key,newValue:JSON.stringify(obj)})),[me,incoming]);
  a=await get(me);check(JSON.stringify(a.exams[2])===JSON.stringify(running),'storage event preserves raw exam record '+currentMarker);
  check((await page.evaluate(()=>bank().find(q=>q.id==='ME2-Q32').modelCode)).includes('c(100, 200)'),'storage event retains old R data '+currentMarker);
  check(a.exams[2].deadline===deadline&&a.previousExamVersions[2]==='midterm-review-2026-10-18','storage event normalizes version outside exam '+currentMarker);
 }
 const quota=await page.context().newPage();await quota.addInitScript(()=>{window.blockArchive=true;const original=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(window.blockArchive&&k.includes(':archive:'))throw new DOMException('quota','QuotaExceededError');return original.call(this,k,v)}});
 await seed(mc,{answers:{MC028:{selected:['o2'],correct:false}},bookmarks:{}});await quota.goto(root+'multiple-choice/index.html?question=MC028');
 check((await get(mc)).answers.MC028.correct===false,'archive failure never overwrites original persisted answer');await quota.locator('[data-option=o1]').click();check((await get(mc)).answers.MC028.correct===false,'failed archive blocks later main-record write');
 await quota.evaluate(()=>window.blockArchive=false);await quota.locator('#retryBtn').click();await quota.locator('[data-option=o1]').click();a=await get(mc);check(a.answers.MC028.correct&&(await get(a.revisionArchiveKey)).state.answers.MC028.correct===false,'archive completes before new answer writes when storage recovers');await quota.close();
 await page.setViewportSize({width:390,height:844});
 for(const route of ['multiple-choice/index.html?question=MC065','index.html?view=problems&question=RC018','mock-exam/index.html?mode=practice&set=2&question=ME2-Q32','ox/index.html']){
  await page.evaluate(()=>localStorage.removeItem('psych-midterm-mock-v1'));await page.goto(root+route);await page.evaluate(async()=>{await StudyMath.typeset();await StudyMath.idle()});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'mobile revision notice and question '+route);
 }
 check(r.errors.length===0,'no browser errors');r.status='pass';
 }catch(e){r.status='fail';r.failure=e.message;r.url=page.url()}return r;
}
