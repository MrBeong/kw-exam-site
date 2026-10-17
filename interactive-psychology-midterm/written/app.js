    // 단답·서술·R 코드 작성 단계: 답안과 자기채점 기준을 문항별로 보존한다.
    let writtenType='all',writtenChapter='all',writtenQuery='',writtenFiltered=[],writtenReviewIds=null;
    let writtenInitialTarget=new URLSearchParams(location.search).get('question');
    let writtenSaveIssue=false;
    const writtenRetry=StudyRetry.create(state,{keys:['answers','grades','rubrics','revealed','codeAnswers','codeNotes'],persist:saveState});
    const writtenChapters=[...new Set(problems.map(q=>q.chapter))];
    state.rubrics=state.rubrics||{};state.revealed=state.revealed||{};state.bookmarks=state.bookmarks||{};
    state.codeAnswers=state.codeAnswers||{};state.codeNotes=state.codeNotes||{};state.legacyCodeDrafts=state.legacyCodeDrafts||{};
    // 전체 코드 답안을 빈칸형 답안으로 오인하지 않는다. 이전 초안·자기채점은 별도 보존한다.
    if(state.codeSchemaVersion!==1){
      problems.filter(q=>q.type==='code').forEach(q=>{
        if(state.answers[q.id]||state.grades[q.id]||state.rubrics[q.id]?.length){
          state.legacyCodeDrafts[q.id]={answer:state.answers[q.id]||'',grade:state.grades[q.id]||'',rubrics:state.rubrics[q.id]||[]};
          delete state.answers[q.id];delete state.grades[q.id];delete state.rubrics[q.id];delete state.revealed[q.id];
        }
      });
      state.codeSchemaVersion=1;
      try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){writtenSaveIssue=true}
    }
    function hasWrittenAnswer(q){return q.type==='code'?q.codeBlanks.some(b=>(state.codeAnswers[q.id]?.[b.id]||'').trim())||!!(state.codeNotes[q.id]||'').trim():!!(state.answers[q.id]||'').trim()}
    const blankWidth=value=>Math.max(6,Math.min(48,(value||'').length+1));
    function highlightRLine(line,q){
      // 표시만 담당한다. 원문 공백·기호를 보존하며 답안을 실행하지 않는다.
      const tokens=/\{\{\d+\}\}|#[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[A-Za-z.][A-Za-z0-9._]*|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?[Li]?\b|<<-|<-|->>|->|==|!=|<=|>=|&&|\|\||%[^%\n]+%|[~+$*/^=!&|:<>-]/g;
      let html='',cursor=0;
      for(const match of line.matchAll(tokens)){
        html+=esc(line.slice(cursor,match.index));const token=match[0];cursor=match.index+token.length;
        if(token.startsWith('{{')&&q){
          const id=token.slice(2,-2),value=state.codeAnswers[q.id]?.[id]||'';
          html+=`<input class="wr-code-input" type="text" data-code-blank="${id}" aria-label="${q.id} 빈칸 ${id}" title="빈칸 ${id} · R 코드 입력" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="(${id})" style="width:${blankWidth(value)}ch" value="${esc(value)}">`;
          continue;
        }
        const kind=token[0]==='#'?'comment':/^["']/.test(token)?'string':/^(TRUE|FALSE|NULL|NA|NaN|Inf)$/.test(token)?'constant':/^\d/.test(token)?'number':/^[A-Za-z.]/.test(token)?(/^\s*\(/.test(line.slice(cursor))?'function':'name'):'operator';
        html+=`<span class="r-${kind}">${esc(token)}</span>`;
      }
      return html+esc(line.slice(cursor));
    }
    function renderRSetup(q){
      if(!q.codeSetup)return '';
      const lines=q.codeSetup.split('\n');
      return `<section class="wr-analysis-input" aria-label="문제의 분석자료"><h4>분석자료 · 준비 코드</h4><p class="wr-small">${esc(q.inputDescription||'아래 자료를 생성한 뒤 빈칸 코드를 이어서 실행합니다.')}</p><div class="wr-editor wr-editor-setup"><div class="wr-editor-bar"><span class="wr-script-tab"><b aria-hidden="true">R</b>${q.id}_data.R</span><span class="wr-script-kind">제시자료 · 읽기 전용</span></div><div class="wr-editor-scroll" role="group" aria-label="R 분석자료 준비 코드"><div class="wr-editor-lines">${lines.map((line,i)=>`<div class="wr-code-line"><span class="wr-line-number" aria-hidden="true">${i+1}</span><code class="wr-code-source">${highlightRLine(line,null)}</code></div>`).join('')}</div></div><div class="wr-editor-status"><span>R</span><span>들여쓰기: 2칸</span><span>UTF-8</span></div></div></section>`;
    }
    function renderRScript(q,solution=false){
      const lines=(solution?q.modelCode:q.codeTemplate).split('\n');
      return `<div class="wr-editor ${solution?'wr-editor-solution':''}">
        <div class="wr-editor-bar"><span class="wr-script-tab"><b aria-hidden="true">R</b>${q.id}${solution?'_solution':''}.R</span><span class="wr-script-kind">${solution?'완성 코드':'빈칸 작성'}</span></div>
        <div class="wr-editor-scroll ${solution?'wr-model-code':'wr-code-question'}" role="group" aria-label="${solution?'R 완성 코드':'R 코드 빈칸'}"><div class="wr-editor-lines">${lines.map((line,i)=>`<div class="wr-code-line"><span class="wr-line-number" aria-hidden="true">${i+1}</span><code class="wr-code-source">${highlightRLine(line,solution?null:q)}</code></div>`).join('')}</div></div>
        <div class="wr-editor-status"><span>R</span><span>들여쓰기: 2칸</span><span>UTF-8</span></div>
      </div>`;
    }
    function renderCodeQuestion(q){
      const legacy=state.legacyCodeDrafts[q.id];
      return `${renderRSetup(q)}<p class="wr-code-instruction">번호별 빈칸에 코드를 직접 입력하세요. <span>자동 저장</span></p>${renderRScript(q)}${q.followUp?`<label class="wr-answer-label" for="writtenAnswer">추가 답안</label><p class="wr-followup">${esc(q.followUp)}</p><textarea class="answer-box" id="writtenAnswer" placeholder="출력값·해석 등 위에서 요구한 내용을 작성하세요.">${esc(state.codeNotes[q.id]||'')}</textarea>`:''}${legacy?`<details class="wr-legacy"><summary>이전 형식으로 작성한 답안 보관</summary><p>빈칸형으로 바꾸기 전의 답안입니다. 새 빈칸 답안과 채점은 별도로 저장합니다.</p><pre>${esc(legacy.answer)}</pre>${legacy.grade?`<p>이전 자기채점: ${esc({done:'완벽 이해',unsure:'애매함',again:'다시 풀기'}[legacy.grade]||legacy.grade)}</p>`:''}</details>`:''}`;
    }
    const writtenNames={short:'단답형',essay:'서술형',code:'R 코드'};
    const writtenRoot=document.getElementById('problems');
    const writtenPoints=q=>(state.rubrics[q.id]||[]).reduce((s,v,i)=>s+(v?(q.rubric[i]?.points||0):0),0);
    function writtenVisible(q){
      if(writtenType!=='all'&&q.type!==writtenType)return false;
      if(writtenChapter!=='all'&&q.chapter!==writtenChapter)return false;
      if(writtenQuery&&!`${q.id} ${q.promptPlain||q.prompt} ${q.chapter}`.toLowerCase().includes(writtenQuery))return false;
      if(currentFilter==='unanswered'&&state.grades[q.id])return false;
      if(writtenRetry.active&&!writtenRetry.ids.includes(q.id))return false;
      if(currentFilter==='again'&&!(writtenRetry.active?writtenRetry.ids:writtenReviewIds||[]).includes(q.id))return false;
      if(currentFilter==='bookmarked'&&!state.bookmarks[q.id])return false;
      if(currentFilter==='calc'&&!q.calc)return false;
      if(currentFilter==='visual'&&!q.visual)return false;
      return true;
    }
    function applyProblemFilter(keepId){
      const previous=keepId||writtenInitialTarget||writtenFiltered[problemCursor]?.id;
      if(currentFilter==='again'&&!writtenReviewIds)writtenReviewIds=problems.filter(q=>['again','unsure'].includes(state.grades[q.id])).map(q=>q.id);
      writtenFiltered=problems.filter(writtenVisible);
      const at=writtenFiltered.findIndex(q=>q.id===previous);problemCursor=at>=0?at:0;writtenInitialTarget=null;renderProblems();
    }
    function renderProblems(){
      writtenRetry.refresh?.();writtenRetry.visit(writtenFiltered[problemCursor]?.id);
      document.getElementById('expectedCountSide').textContent=String(problems.length);
      document.querySelectorAll('[data-written-type]').forEach(b=>b.classList.toggle('active',b.dataset.writtenType===writtenType));
      writtenRoot.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('active',b.dataset.filter===currentFilter));
      const graded=problems.filter(q=>state.grades[q.id]).length,done=problems.filter(q=>state.grades[q.id]==='done').length;
      document.getElementById('writtenStats').textContent=`${problems.length}문항 · ${graded}개 자기채점 · 완벽 이해 ${done}개 · ${new Set(problems.flatMap(q=>q.conceptIds)).size}/${JSON.parse(document.getElementById('writtenConcepts').textContent).length}개념`;
      document.getElementById('againArrow').textContent=againBarOpen?'▴':'▾';
      document.getElementById('againBar').style.display=currentFilter==='again'&&againBarOpen?'flex':'none';
      const review=writtenReviewIds||[];document.getElementById('againCountBadge').textContent=review.length+'문항';
      document.getElementById('againProgressBadge').textContent=review.filter(id=>state.grades[id]==='done').length+' / '+review.length+' 해결';
      const empty=!writtenFiltered.length;document.getElementById('emptyState').style.display=empty?'grid':'none';
      document.getElementById('questionList').hidden=empty;document.getElementById('practicePosition').textContent=empty?'0 / 0':`${problemCursor+1} / ${writtenFiltered.length} · ${writtenFiltered[problemCursor].id}`;
      document.getElementById('practicePrev').disabled=empty||problemCursor===0;document.getElementById('practiceNext').disabled=empty||problemCursor===writtenFiltered.length-1;
      const jump=document.getElementById('writtenJump');jump.innerHTML=writtenFiltered.map(q=>`<option value="${q.id}">${q.id} · ${writtenNames[q.type]} · ${esc((q.promptPlain||q.prompt).slice(0,34))}</option>`).join('');jump.disabled=empty;
      if(empty){document.getElementById('questionList').innerHTML='';return}
      const q=writtenFiltered[problemCursor];if(pageView==='problems'){try{const url=new URL(location.href);url.searchParams.set('view','problems');url.searchParams.set('question',q.id);history.replaceState(null,'',url)}catch(e){}}const open=!!state.revealed[q.id],grade=state.grades[q.id];jump.value=q.id;
      document.getElementById('questionList').innerHTML=`<article class="wr-card" data-question="${q.id}">
        <div class="wr-head"><span class="wr-badge">${q.id} · ${writtenNames[q.type]}</span><span class="wr-chapter">${esc(q.chapter)} · ${q.points}점</span><button id="writtenBookmark" type="button" aria-label="문항 북마크" aria-pressed="${!!state.bookmarks[q.id]}">${state.bookmarks[q.id]?'★':'☆'}</button></div>
        <div class="wr-scroll"><h3 class="wr-prompt">${esc(q.prompt)}</h3><p class="wr-language">${esc(q.language)}</p>${(q.visual||'').replaceAll('../assets/','assets/')}
        ${q.type==='code'?renderCodeQuestion(q):`<label class="wr-answer-label" for="writtenAnswer">내 답안 <span>자동 저장</span></label><textarea class="answer-box" id="writtenAnswer" placeholder="답을 직접 작성한 뒤 정답과 채점 기준을 확인하세요.">${esc(state.answers[q.id]||'')}</textarea>`}
        <button class="wr-reveal" id="writtenReveal" type="button" aria-expanded="${open}">${open?'정답·해설 접기':'정답·해설·채점 기준 보기'}</button>
        <div class="solution ${open?'open':''}" id="writtenSolution" ${open?'':'hidden'}>
          ${q.type==='code'?`<h4>빈칸별 정답·해설</h4><ol class="wr-blank-answers">${q.codeBlanks.map(b=>`<li><strong>(${b.id})</strong> <code>${esc(b.answer)}</code><p>${esc(b.explanation)}</p></li>`).join('')}</ol>`:''}
          <h4>${q.type==='code'?'완성 코드·모범 답안':'모범 답안'}</h4>${q.modelCode?renderRScript(q,true):''}<p class="wr-model">${esc(q.answer)}</p>
          <h4>상세 해설</h4><ol>${q.explanation.map(t=>`<li>${esc(t)}</li>`).join('')}</ol>
          <h4>채점 기준 · ${q.points}점</h4><p class="wr-small">충족한 항목을 직접 체크하면 부분점수를 합산합니다. 서술 의미·R 코드 실행 결과를 자동 판정하지 않습니다.</p>
          <div class="wr-rubrics">${q.rubric.map((r,i)=>`<label><input type="checkbox" data-rubric="${i}" ${(state.rubrics[q.id]||[])[i]?'checked':''}><span>${esc(r.criterion)}</span><b>${r.points}점</b></label>`).join('')}</div><p id="writtenScore" aria-live="polite">체크한 점수 ${writtenPoints(q)} / ${q.points}점</p>
          <h4>인정 답안·표기</h4><p>${esc(q.accepted)}</p>${q.englishTerms.length?`<p class="wr-small">영문 용어: ${q.englishTerms.map(esc).join(' · ')}. 대소문자·일반적인 하이픈/공백 차이는 의미가 같으면 인정합니다. R 함수·객체의 대소문자는 실행에 영향을 주므로 정확히 씁니다.</p>`:''}
          <h4>자주 틀리는 부분</h4><ul>${q.commonMistakes.map(t=>`<li>${esc(t)}</li>`).join('')}</ul><p class="wr-source">근거: ${esc(q.source)}</p><details class="wr-coverage"><summary>개념 대응 ${q.conceptIds.length}개</summary>${q.conceptIds.join(' · ')}</details>
        </div></div>
        <div class="wr-grade-row"><span id="writtenGradeHint" class="wr-small">답안 작성 후 해설을 열어 자기채점하세요.</span><div class="grade-group">${[['done','완벽 이해'],['unsure','애매함'],['again','다시 풀기']].map(([g,t])=>`<button type="button" data-written-grade="${g}" class="${grade===g?'active':''}" ${open&&hasWrittenAnswer(q)?'':'disabled'}>${t}</button>`).join('')}</div><button id="writtenRetry" type="button">↺ 현재 문제 다시 풀기</button></div>
      </article>`;
      function changedAnswer(){
        delete state.grades[q.id];state.rubrics[q.id]=[];writtenRetry.unmark(q.id);saveState();
        document.getElementById('writtenStats').textContent=`${problems.length}문항 · ${problems.filter(x=>state.grades[x.id]).length}개 자기채점 · 완벽 이해 ${problems.filter(x=>state.grades[x.id]==='done').length}개 · ${new Set(problems.flatMap(q=>q.conceptIds)).size}/${JSON.parse(document.getElementById('writtenConcepts').textContent).length}개념`;
        document.querySelectorAll('[data-written-grade]').forEach(b=>{b.classList.remove('active');b.disabled=!state.revealed[q.id]||!hasWrittenAnswer(q)});
        document.querySelectorAll('[data-rubric]').forEach(c=>c.checked=false);
        const score=document.getElementById('writtenScore');if(score)score.textContent='답안이 수정되어 채점 기준을 다시 확인해야 합니다. 체크한 점수 0 / '+q.points+'점';
      }
      const textarea=document.getElementById('writtenAnswer');
      textarea?.addEventListener('input',()=>{if(q.type==='code')state.codeNotes[q.id]=textarea.value;else state.answers[q.id]=textarea.value;changedAnswer()});
      document.querySelectorAll('[data-code-blank]').forEach(input=>input.addEventListener('input',()=>{state.codeAnswers[q.id]=state.codeAnswers[q.id]||{};state.codeAnswers[q.id][input.dataset.codeBlank]=input.value;input.style.width=blankWidth(input.value)+'ch';changedAnswer()}));
      document.getElementById('writtenReveal').addEventListener('click',()=>{const top=document.querySelector('.wr-scroll').scrollTop;state.revealed[q.id]=!state.revealed[q.id];saveState();renderProblems();document.querySelector('.wr-scroll').scrollTop=top;});
      document.getElementById('writtenBookmark').addEventListener('click',()=>{const top=document.querySelector('.wr-scroll').scrollTop;state.bookmarks[q.id]=!state.bookmarks[q.id];saveState();renderProblems();document.querySelector('.wr-scroll').scrollTop=top;});
      document.querySelectorAll('[data-rubric]').forEach(c=>c.addEventListener('change',()=>{const checks=state.rubrics[q.id]||[];checks[Number(c.dataset.rubric)]=c.checked;state.rubrics[q.id]=checks;saveState();document.getElementById('writtenScore').textContent='체크한 점수 '+writtenPoints(q)+' / '+q.points+'점';}));
      document.querySelectorAll('[data-written-grade]').forEach(b=>b.addEventListener('click',()=>{state.grades[q.id]=b.dataset.writtenGrade;writtenRetry.mark(q.id);saveState();writtenRetry.refresh?.();document.querySelectorAll('[data-written-grade]').forEach(x=>x.classList.toggle('active',x===b));document.getElementById('writtenGradeHint').textContent='저장됨 · 복습 표시는 직접 선택하며 체크 점수와 별도로 관리합니다.';const review=writtenReviewIds||[];document.getElementById('againProgressBadge').textContent=review.filter(id=>state.grades[id]==='done').length+' / '+review.length+' 해결';document.getElementById('writtenStats').textContent=`${problems.length}문항 · ${problems.filter(x=>state.grades[x.id]).length}개 자기채점 · 완벽 이해 ${problems.filter(x=>state.grades[x.id]==='done').length}개 · ${new Set(problems.flatMap(q=>q.conceptIds)).size}/${JSON.parse(document.getElementById('writtenConcepts').textContent).length}개념`;}));
      document.getElementById('writtenRetry').addEventListener('click',()=>{clearWrittenAnswers([q.id]);saveState();renderProblems()});
    }
    function clearWrittenAnswers(ids){ids.forEach(id=>{writtenRetry.unmark(id);delete state.answers[id];delete state.codeAnswers[id];delete state.codeNotes[id];delete state.legacyCodeDrafts[id];delete state.grades[id];delete state.rubrics[id];delete state.revealed[id]})}
    function openWrittenReview(reset=false){
      if(reset){startWrittenWrongRetry();return}
      writtenReviewIds=problems.filter(q=>['again','unsure'].includes(state.grades[q.id])).map(q=>q.id);
      currentFilter='again';writtenType='all';writtenChapter='all';writtenQuery='';document.getElementById('writtenChapter').value='all';document.getElementById('questionSearch').value='';problemCursor=0;setPageView('problems');applyProblemFilter();
    }
    writtenRoot.querySelectorAll('[data-written-type]').forEach(b=>b.addEventListener('click',()=>{writtenType=b.dataset.writtenType;applyProblemFilter()}));
    writtenRoot.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.filter!=='again')writtenRetry.finish();if(b.dataset.filter==='again'){if(currentFilter==='again'){againBarOpen=!againBarOpen;renderProblems();return}writtenReviewIds=null;againBarOpen=false}else againBarOpen=false;currentFilter=b.dataset.filter;applyProblemFilter()}));
    document.getElementById('writtenChapter').innerHTML='<option value="all">전체 단원</option>'+writtenChapters.map(ch=>`<option>${esc(ch)}</option>`).join('');
    document.getElementById('writtenChapter').addEventListener('change',e=>{writtenChapter=e.target.value;applyProblemFilter()});document.getElementById('questionSearch').addEventListener('input',e=>{writtenQuery=e.target.value.trim().toLowerCase();applyProblemFilter()});
    document.getElementById('writtenJump').addEventListener('change',e=>{problemCursor=writtenFiltered.findIndex(q=>q.id===e.target.value);renderProblems()});
    document.getElementById('practicePrev').addEventListener('click',()=>{if(problemCursor>0){problemCursor--;renderProblems()}});document.getElementById('practiceNext').addEventListener('click',()=>{if(problemCursor<writtenFiltered.length-1){problemCursor++;renderProblems()}});
    document.getElementById('refreshAgainListBtn').addEventListener('click',()=>{writtenReviewIds=null;applyProblemFilter()});document.getElementById('exitAgainBtn').addEventListener('click',()=>{writtenRetry.finish();currentFilter='all';againBarOpen=false;writtenReviewIds=null;applyProblemFilter()});
    document.getElementById('writtenShowAll').addEventListener('click',()=>{writtenRetry.finish();writtenType='all';writtenChapter='all';writtenQuery='';currentFilter='all';writtenReviewIds=null;againBarOpen=false;document.getElementById('writtenChapter').value='all';document.getElementById('questionSearch').value='';applyProblemFilter()});
    document.addEventListener('keydown',e=>{if(pageView!=='problems'||['TEXTAREA','INPUT','SELECT'].includes(document.activeElement?.tagName)||e.metaKey||e.ctrlKey||e.altKey)return;if(e.key==='ArrowLeft'&&problemCursor>0){e.preventDefault();problemCursor--;renderProblems()}if(e.key==='ArrowRight'&&problemCursor<writtenFiltered.length-1){e.preventDefault();problemCursor++;renderProblems()}});
    window.WRITTEN_AUDIT={questionCount:problems.length,codeQuestionCount:problems.filter(q=>q.type==='code').length,codeBlankCount:problems.reduce((s,q)=>s+(q.codeBlanks?.length||0),0),conceptCount:new Set(problems.flatMap(q=>q.conceptIds)).size,coverageMissing:JSON.parse(document.getElementById('writtenConcepts').textContent).filter(c=>!problems.some(q=>q.conceptIds.includes(c.id)) ).map(c=>c.id)};

    document.getElementById('toolbarRetryCurrentBtn')?.addEventListener('click',()=>{const q=writtenFiltered[problemCursor];if(!q)return;clearWrittenAnswers([q.id]);saveState();renderProblems()});

    function startWrittenWrongRetry(){
      const u=new URL(location.href);u.searchParams.delete('retryWrong');history.replaceState(null,'',u);
      writtenRetry.finish();const ids=problems.filter(q=>state.grades[q.id]==='again').map(q=>q.id);writtenRetry.start(ids);
      currentFilter='again';writtenReviewIds=writtenRetry.ids;writtenType='all';writtenChapter='all';writtenQuery='';againBarOpen=false;problemCursor=0;
      document.getElementById('writtenChapter').value='all';document.getElementById('questionSearch').value='';setPageView('problems');applyProblemFilter();
    }
    writtenRetry.mount({before:document.querySelector('#problems .wr-search-row'),onStart:startWrittenWrongRetry,onExit:()=>{currentFilter='all';writtenType='all';writtenChapter='all';writtenQuery='';document.getElementById('writtenChapter').value='all';document.getElementById('questionSearch').value='';applyProblemFilter()},isCorrect:id=>state.grades[id]==='done',visible:()=>currentFilter==='again'});
    if(writtenRetry.active){currentFilter='again';writtenReviewIds=writtenRetry.ids;writtenInitialTarget=writtenRetry.cursor;}
    else if(new URLSearchParams(location.search).get('retryWrong')==='1')queueMicrotask(startWrittenWrongRetry);
    if(writtenRetry.active){const u=new URL(location.href);u.searchParams.delete('retryWrong');history.replaceState(null,'',u)}
