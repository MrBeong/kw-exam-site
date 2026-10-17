async (page) => {
 const results=[],errors=[];try { page.on('pageerror',e=>errors.push(e.message));
 const check=(v,n)=>{if(!v)throw new Error(n);results.push(n)};
 const base=page.url().split('?')[0],read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('psych-midterm-mock-v1')||'{}'));
 const data=JSON.parse(await page.locator('#mockData').textContent()),byId=id=>data.find(q=>q.id===id),q1=byId('ME1-Q01'),multi=byId('ME1-Q13'),tf=byId('ME1-Q17');
 await page.evaluate(()=>{localStorage.removeItem('psych-midterm-mock-v1');for(const k of ['psych-midterm-notion-v1','psych-midterm-ox-v1','psych-midterm-multiple-v1'])localStorage.setItem(k,JSON.stringify({answers:{keep:'preserved'},bookmarks:{keep:true},checks:{keep:true}}))});
 await page.goto(base);check(await page.locator('.mock-intro').isVisible(),'new exam shows timing and language instructions before questions');
 check(await page.locator('[data-question]').count()===0,'question and solution UI absent before exam start');
 const audit=await page.evaluate(()=>window.MOCK_AUDIT);check(audit.questions===160&&audit.concepts===185&&audit.sets.every(s=>s.questions===32&&s.points===100&&s.minutes===120&&s.chapters===7),'five complete 120-minute 100-point balanced sets');
 await page.getByRole('button',{name:'시험 시작',exact:true}).click();let s=await read(),deadline=s.exams['1'].deadline;
 check(s.exams['1'].status==='running'&&deadline-s.exams['1'].startedAt===7200000,'start stores a 7200-second deadline');
 check(await page.locator('#mockSet').isDisabled()&&await page.locator('#modeToggle').isDisabled(),'running exam cannot change set or reveal mode');
 check(await page.locator('#mockReveal').count()===0&&await page.locator('#mockSolution').innerText()==='','answers withheld during exam');
 await page.locator(`[data-option="${q1.options.find(o=>o.correct).id}"]`).check();
 check((await read()).exams['1'].selected[q1.id].length===1,'single-choice answer saved without feedback');
 await page.locator('#mockJump').selectOption(multi.id);await page.locator(`[data-option="${multi.options.find(o=>o.correct).id}"]`).check();
 await page.locator('#mockJump').selectOption(tf.id);
 await page.locator(`[data-tf="s1"][value="${tf.statements[0].correct}"]`).check();await page.locator(`[data-tf="s2"][value="${!tf.statements[1].correct}"]`).check();
 await page.locator('#mockJump').selectOption('ME1-Q19');await page.locator('#mockText').fill('Previous Experience / Present Experience / Future Experience');
 await page.locator('#mockJump').selectOption('ME1-Q25');await page.locator('#mockText').fill('연구의 목적과 설계 절차를 설명한 답안');
 await page.locator('#mockJump').selectOption('ME1-Q29');const code=byId('ME1-Q29');for(const b of code.codeBlanks)await page.getByRole('textbox',{name:`${code.id} 빈칸 ${b.id}`,exact:true}).fill(b.answer);await page.locator('#mockText').fill('90');
 check((await read()).exams['1'].codeAnswers[code.id]['2']==='TRUE','R input saved in native syntax');
 await page.reload();s=await read();check(s.exams['1'].deadline===deadline&&await page.locator('#mockTimer').innerText().then(t=>t.startsWith('119:')||t==='120:00'),'reload preserves deadline and elapsed time');
 check(await page.getByRole('textbox',{name:`${code.id} 빈칸 2`,exact:true}).inputValue()==='TRUE','R blank restored after reload');
 await page.locator('#toggleExam').click();check(!await page.locator('#examBar').isVisible(),'exam bar collapses');
 check((await read()).exams['1'].deadline===deadline,'collapsing bar does not pause or reset timer');await page.locator('#toggleExam').click();
 await page.goto(base+'?mode=practice&set=2');s=await read();check(s.activeSet===1&&s.mode==='exam'&&s.exams['1'].deadline===deadline,'running exam resumes even if URL requests practice or another set');
 page.once('dialog',d=>d.dismiss());await page.locator('#submitBtn').click();check((await read()).exams['1'].status==='running','cancel submission preserves running answers and timer');
 page.once('dialog',d=>d.accept());await page.locator('#submitBtn').click();s=await read();check(s.exams['1'].status==='submitted'&&!s.exams['1'].timeUp,'confirmed submission closes exam');
 check(await page.locator('#resultPanel').innerText().then(t=>t.includes('객관식 3 / 36점')&&t.includes('총점은 주관식 자기채점 후 확정')),'single/multi-exact/TF-partial scoring totals 3 and leaves subjective pending');
 await page.locator('#mockJump').selectOption(q1.id);check(await page.locator('[data-option]:disabled').count()===4,'submitted objective choices locked');await page.locator('#mockReveal').click();check(await page.locator('.mock-option-explain').count()===4,'all four option explanations revealed after submission');
 await page.locator('#mockJump').selectOption('ME1-Q29');check(await page.locator('[data-code-blank]:disabled').count()===3&&await page.locator('#mockText').isDisabled(),'submitted R blanks and interpretation locked');await page.locator('#mockReveal').click();
 for(const r of await page.locator('[data-rubric]').all())await r.check();await page.locator('#finishGrade').click();
 check((await read()).exams['1'].graded[code.id]&&await page.locator('#mockWrittenScore').innerText().then(t=>t.includes('4 / 4')&&t.includes('채점 완료')),'R rubric full points explicitly confirmed');
 await page.locator('#mockJump').selectOption('ME1-Q19');await page.locator('#mockReveal').click();await page.locator('[data-rubric="0"]').check();await page.locator('#finishGrade').click();const partial=byId('ME1-Q19').rubric[0].points;
 for(const q of data.filter(q=>q.set===1&&!['single','multi','tf'].includes(q.type)&&!['ME1-Q19','ME1-Q29'].includes(q.id))){await page.locator('#mockJump').selectOption(q.id);if(await page.locator('#mockReveal').getAttribute('aria-expanded')==='false')await page.locator('#mockReveal').click();await page.locator('#finishGrade').click()}
 check(await page.locator('#resultPanel').innerText().then(t=>t.includes(`총점 ${7+partial} / 100점`)),'final total appears only after all 14 written grades confirmed');
 await page.reload();check((await read()).exams['1'].graded[code.id],'confirmed manual grades persist after reload');
 await page.locator('#mockSet').selectOption('2');await page.locator('#modeToggle').click();
 check(await page.locator('#mockTimer').innerText()==='시간 제한 없음'&&(await read()).mode==='practice','practice mode has no timer');
 const pq=byId('ME2-Q01'),bad=pq.options.find(o=>!o.correct).id,good=pq.options.find(o=>o.correct).id;
 await page.locator(`[data-option="${bad}"]`).check();await page.locator('#mockReveal').click();check((await read()).answers[pq.id]?.correct===false,'practice wrong answer published for central review');
 await page.locator('#mockReveal').click();check((await read()).answers[pq.id]?.correct===false,'closing solution retains wrong-answer record');
 await page.locator(`[data-option="${good}"]`).check();await page.locator('#mockReveal').click();check(!(await read()).answers[pq.id],'corrected and checked practice answer clears latest mistake');
 await page.locator('#mockJump').selectOption('ME2-Q13');const pm=byId('ME2-Q13');for(const o of pm.options.filter(o=>o.correct))await page.locator(`[data-option="${o.id}"]`).check();await page.locator('#mockReveal').click();check(await page.locator('#mockSolution h4').innerText().then(t=>t.includes('2 / 2')),'exact multi-answer set earns full credit');
 await page.locator('#mockJump').selectOption('ME2-Q29');const pc=byId('ME2-Q29');for(const b of pc.codeBlanks)await page.getByRole('textbox',{name:`${pc.id} 빈칸 ${b.id}`,exact:true}).fill(b.answer);if(pc.followUp)await page.locator('#mockText').fill(pc.answer);await page.locator('#mockReveal').click();for(const r of await page.locator('[data-rubric]').all())await r.check();await page.locator('#finishGrade').click();
 await page.getByRole('textbox',{name:`${pc.id} 빈칸 1`,exact:true}).fill('wrong');s=await read();check(!s.practice['2'].graded[pc.id]&&s.practice['2'].rubrics[pc.id].length===0,'editing practice code invalidates manual grade and rubric');
 check(await page.locator('#mockSolution').isVisible()&&await page.locator('#mockReveal').getAttribute('aria-expanded')==='true','editing free code preserves open solution consistently');
 await page.locator('#mockBookmark').click();page.once('dialog',d=>d.dismiss());await page.locator('#retryOne').click();check((await read()).practice['2'].codeAnswers[pc.id]['1']==='wrong','cancel individual retry preserves draft');
 page.once('dialog',d=>d.accept());await page.locator('#retryOne').click();s=await read();check(!s.practice['2'].codeAnswers[pc.id]&&s.bookmarks[pc.id]&&s.exams['1'].graded[code.id]&&s.practice['2'].selected[pq.id][0]===good,'individual practice reset preserves bookmark other questions and completed exam');
 page.once('dialog',d=>d.dismiss());await page.locator('#resetBtn').click();check((await read()).practice['2'].selected[pq.id][0]===good,'cancel set reset preserves records');page.once('dialog',d=>d.accept());await page.locator('#resetBtn').click();s=await read();check(!Object.keys(s.practice['2'].selected).length&&s.bookmarks[pc.id]&&s.exams['1'].graded[code.id],'practice-set reset preserves exam mode and bookmark');
 check(await page.evaluate(()=>['psych-midterm-notion-v1','psych-midterm-ox-v1','psych-midterm-multiple-v1'].every(k=>JSON.parse(localStorage.getItem(k)).answers.keep==='preserved')),'mock resets preserve all previous study-stage records');
 await page.goto(base+'?set=3&mode=exam');await page.locator('#startBtn').click();await page.evaluate(()=>{const k='psych-midterm-mock-v1',s=JSON.parse(localStorage.getItem(k));s.exams['3'].deadline=Date.now()-1000;localStorage.setItem(k,JSON.stringify(s))});await page.reload();s=await read();
 check(s.exams['3'].status==='submitted'&&s.exams['3'].timeUp&&await page.locator('#resultPanel').innerText().then(t=>t.includes('자동 제출')),'expired deadline auto submits on reload');
 const ended=s.exams['3'].submittedAt;await page.reload();check((await read()).exams['3'].submittedAt===ended,'auto submission is idempotent across reloads');
 await page.locator('#modeToggle').click();await page.getByRole('button',{name:'전체',exact:true}).click();
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
 check(errors.length===0,'no unhandled JavaScript errors');
 const output={passed:results.length,results,errors,allQuestionsRendered:rendered,rBlanks,visuals,audit};await page.evaluate(r=>window.MOCK_QA_RESULT=r,output);return output;
 }catch(error){const out={failed:error.message,passed:results.length,results,errors};await page.evaluate(r=>window.MOCK_QA_RESULT=r,out);return out;}
}
