async (page) => {
 const results=[],errors=[];try { page.on('pageerror',e=>errors.push(e.message));
 const check=async(v,n)=>{if(!v)throw new Error(n);results.push(n);await page.evaluate(r=>localStorage.setItem('mock-qa-flow-progress',JSON.stringify(r)),results)};
 const base=page.url().split('?')[0],read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('psych-midterm-mock-v1')||'{}'));
 const data=JSON.parse(await page.locator('#mockData').textContent()),byId=id=>data.find(q=>q.id===id),q1=byId('ME1-Q01'),multi=byId('ME1-Q13'),tf=byId('ME1-Q17');
 await page.evaluate(()=>{localStorage.removeItem('psych-midterm-mock-v1');for(const k of ['psych-midterm-notion-v1','psych-midterm-ox-v1','psych-midterm-multiple-v1'])localStorage.setItem(k,JSON.stringify({answers:{keep:'preserved'},bookmarks:{keep:true},checks:{keep:true}}))});
 await page.goto(base);await check(await page.locator('.mock-intro').isVisible(),'new exam shows timing and language instructions before questions');
 await check(await page.locator('[data-question]').count()===0,'question and solution UI absent before exam start');
 const audit=await page.evaluate(()=>window.MOCK_AUDIT);await check(audit.questions===160&&audit.concepts===185&&audit.sets.every(s=>s.questions===32&&s.points===100&&s.minutes===120&&s.chapters===7),'five complete 120-minute 100-point balanced sets');
 await page.getByRole('button',{name:'시험 시작',exact:true}).click();let s=await read(),deadline=s.exams['1'].deadline;
 await check(s.exams['1'].status==='running'&&deadline-s.exams['1'].startedAt===7200000,'start stores a 7200-second deadline');
 await check(await page.locator('#mockSet').isDisabled()&&await page.locator('#modeToggle').isDisabled(),'running exam cannot change set or reveal mode');
 await check(await page.locator('#mockReveal').count()===0&&await page.locator('#mockSolution').innerText()==='','answers withheld during exam');
 await page.locator(`[data-option="${q1.options.find(o=>o.correct).id}"]`).check();
 await check((await read()).exams['1'].selected[q1.id].length===1,'single-choice answer saved without feedback');
 await page.locator('#mockJump').selectOption(multi.id);await page.locator(`[data-option="${multi.options.find(o=>o.correct).id}"]`).check();
 await page.locator('#mockJump').selectOption(tf.id);
 await page.locator(`[data-tf="s1"][value="${tf.statements[0].correct}"]`).check();await page.locator(`[data-tf="s2"][value="${!tf.statements[1].correct}"]`).check();
 await page.locator('#mockJump').selectOption('ME1-Q19');await page.locator('#mockText').fill('Previous Experience / Present Experience / Future Experience');
 await page.locator('#mockJump').selectOption('ME1-Q25');await page.locator('#mockText').fill('연구의 목적과 설계 절차를 설명한 답안');
 await page.locator('#mockJump').selectOption('ME1-Q29');const code=byId('ME1-Q29');for(const b of code.codeBlanks)await page.getByRole('textbox',{name:`${code.id} 빈칸 ${b.id}`,exact:true}).fill(b.answer);await page.locator('#mockText').fill('90');
 await check((await read()).exams['1'].codeAnswers[code.id]['2']==='TRUE','R input saved in native syntax');
 await page.reload();s=await read();await check(s.exams['1'].deadline===deadline&&await page.locator('#mockTimer').innerText().then(t=>t.startsWith('119:')||t==='120:00'),'reload preserves deadline and elapsed time');
 await check(await page.getByRole('textbox',{name:`${code.id} 빈칸 2`,exact:true}).inputValue()==='TRUE','R blank restored after reload');
 await page.locator('#toggleExam').click();await check(!await page.locator('#examBar').isVisible(),'exam bar collapses');
 await check((await read()).exams['1'].deadline===deadline,'collapsing bar does not pause or reset timer');await page.locator('#toggleExam').click();
 await page.goto(base+'?mode=practice&set=2');s=await read();await check(s.activeSet===1&&s.mode==='exam'&&s.exams['1'].deadline===deadline,'running exam resumes even if URL requests practice or another set');
 page.once('dialog',d=>d.dismiss());await page.locator('#submitBtn').click();await check((await read()).exams['1'].status==='running','cancel submission preserves running answers and timer');
 page.once('dialog',d=>d.accept());await page.locator('#submitBtn').click();s=await read();await check(s.exams['1'].status==='submitted'&&!s.exams['1'].timeUp,'confirmed submission closes exam');
 await check(await page.locator('#resultPanel').innerText().then(t=>t.includes('객관식 3 / 36점')&&t.includes('총점은 주관식 자기채점 후 확정')),'single/multi-exact/TF-partial scoring totals 3 and leaves subjective pending');
 await page.locator('#mockJump').selectOption(q1.id);await check(await page.locator('[data-option]:disabled').count()===4,'submitted objective choices locked');await page.locator('#mockReveal').click();await check(await page.locator('.mock-option-explain').count()===4,'all four option explanations revealed after submission');
 await page.locator('#mockJump').selectOption('ME1-Q29');await check(await page.locator('[data-code-blank]:disabled').count()===3&&await page.locator('#mockText').isDisabled(),'submitted R blanks and interpretation locked');await page.locator('#mockReveal').click();
 for(const r of await page.locator('[data-rubric]').all())await r.check();await page.locator('#finishGrade').click();
 await check((await read()).exams['1'].graded[code.id]&&await page.locator('#mockWrittenScore').innerText().then(t=>t.includes('4 / 4')&&t.includes('채점 완료')),'R rubric full points explicitly confirmed');
 await page.locator('#mockJump').selectOption('ME1-Q19');await page.locator('#mockReveal').click();await page.locator('[data-rubric="0"]').check();await page.locator('#finishGrade').click();const partial=byId('ME1-Q19').rubric[0].points;
 for(const q of data.filter(q=>q.set===1&&!['single','multi','tf'].includes(q.type)&&!['ME1-Q19','ME1-Q29'].includes(q.id))){await page.locator('#mockJump').selectOption(q.id);if(await page.locator('#mockReveal').getAttribute('aria-expanded')==='false')await page.locator('#mockReveal').click();await page.locator('#finishGrade').click()}
 await check(await page.locator('#resultPanel').innerText().then(t=>t.includes(`총점 ${7+partial} / 100점`)),'final total appears only after all 14 written grades confirmed');
 await page.reload();await check((await read()).exams['1'].graded[code.id],'confirmed manual grades persist after reload');
 await page.locator('#mockSet').selectOption('2');await page.locator('#modeToggle').click();
 await check(await page.locator('#mockTimer').innerText()==='시간 제한 없음'&&(await read()).mode==='practice','practice mode has no timer');
 const pq=byId('ME2-Q01'),bad=pq.options.find(o=>!o.correct).id,good=pq.options.find(o=>o.correct).id;
 await page.locator(`[data-option="${bad}"]`).check();await page.locator('#mockReveal').click();await check((await read()).answers[pq.id]?.correct===false,'practice wrong answer published for central review');
 await page.locator('#mockReveal').click();await check((await read()).answers[pq.id]?.correct===false,'closing solution retains wrong-answer record');
 await page.locator(`[data-option="${good}"]`).check();await page.locator('#mockReveal').click();await check(!(await read()).answers[pq.id],'corrected and checked practice answer clears latest mistake');
 await page.locator('#mockJump').selectOption('ME2-Q13');const pm=byId('ME2-Q13');for(const o of pm.options.filter(o=>o.correct))await page.locator(`[data-option="${o.id}"]`).check();await page.locator('#mockReveal').click();await check(await page.locator('#mockSolution h4').innerText().then(t=>t.includes('2 / 2')),'exact multi-answer set earns full credit');
 await page.locator('#mockJump').selectOption('ME2-Q29');const pc=byId('ME2-Q29');for(const b of pc.codeBlanks)await page.getByRole('textbox',{name:`${pc.id} 빈칸 ${b.id}`,exact:true}).fill(b.answer);if(pc.followUp)await page.locator('#mockText').fill(pc.answer);await page.locator('#mockReveal').click();for(const r of await page.locator('[data-rubric]').all())await r.check();await page.locator('#finishGrade').click();
 await page.getByRole('textbox',{name:`${pc.id} 빈칸 1`,exact:true}).fill('wrong');s=await read();await check(!s.practice['2'].graded[pc.id]&&s.practice['2'].rubrics[pc.id].length===0,'editing practice code invalidates manual grade and rubric');
 await check(await page.locator('#mockSolution').isVisible()&&await page.locator('#mockReveal').getAttribute('aria-expanded')==='true','editing free code preserves open solution consistently');
 await page.locator('#mockBookmark').click();page.once('dialog',d=>d.dismiss());await page.locator('#retryOne').click();await check((await read()).practice['2'].codeAnswers[pc.id]['1']==='wrong','cancel individual retry preserves draft');
 page.once('dialog',d=>d.accept());await page.locator('#retryOne').click();s=await read();await check(!s.practice['2'].codeAnswers[pc.id]&&s.bookmarks[pc.id]&&s.exams['1'].graded[code.id]&&s.practice['2'].selected[pq.id][0]===good,'individual practice reset preserves bookmark other questions and completed exam');
 page.once('dialog',d=>d.dismiss());await page.locator('#resetBtn').click();await check((await read()).practice['2'].selected[pq.id][0]===good,'cancel set reset preserves records');page.once('dialog',d=>d.accept());await page.locator('#resetBtn').click();s=await read();await check(!Object.keys(s.practice['2'].selected).length&&s.bookmarks[pc.id]&&s.exams['1'].graded[code.id],'practice-set reset preserves exam mode and bookmark');
 await check(await page.evaluate(()=>['psych-midterm-notion-v1','psych-midterm-ox-v1','psych-midterm-multiple-v1'].every(k=>JSON.parse(localStorage.getItem(k)).answers.keep==='preserved')),'mock resets preserve all previous study-stage records');
 await page.goto(base+'?set=3&mode=exam');await page.locator('#startBtn').click();await page.evaluate(()=>{const k='psych-midterm-mock-v1',s=JSON.parse(localStorage.getItem(k));s.exams['3'].deadline=Date.now()-1000;localStorage.setItem(k,JSON.stringify(s))});await page.reload();s=await read();
 await check(s.exams['3'].status==='submitted'&&s.exams['3'].timeUp&&await page.locator('#resultPanel').innerText().then(t=>t.includes('자동 제출')),'expired deadline auto submits on reload');
 const ended=s.exams['3'].submittedAt;await page.reload();await check((await read()).exams['3'].submittedAt===ended,'auto submission is idempotent across reloads');

 const out={passed:results.length,results,errors};await page.evaluate(r=>{window.MOCK_FLOW_QA=r;localStorage.setItem('mock-qa-flow-result',JSON.stringify(r))},out);return out;
 }catch(error){const out={failed:error.message,passed:results.length,results,errors};await page.evaluate(r=>{window.MOCK_FLOW_QA=r;localStorage.setItem('mock-qa-flow-result',JSON.stringify(r))},out);return out;}
}