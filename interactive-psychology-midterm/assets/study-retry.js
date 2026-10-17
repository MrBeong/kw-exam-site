/* Offline retry rounds. Originals survive unfinished rounds and are archived on completion. */
(()=>{
  'use strict';
  const copy=x=>JSON.parse(JSON.stringify(x));
  function create(owner,{keys,record=()=>owner,persist=()=>{}}){
    const active=()=>owner.retrySession?.active===true;
    const session=()=>owner.retrySession;
    let controlsOpen=false;
    function finish(){
      if(!active())return;
      const s=session();
      for(const id of s.ids)if(!s.completed[id]){
        const r=record(id);
        for(const k of keys){r[k]=r[k]||{};delete r[k][id];if(Object.hasOwn(s.originals[id],k))r[k][id]=copy(s.originals[id][k])}
      }
      s.active=false;s.finishedAt=Date.now();
      owner.retryHistory=[s,...(owner.retryHistory||[])].slice(0,3);
      delete owner.retrySession;persist();
    }
    const api={
      get active(){return active()},get ids(){return active()?session().ids:[]},
      get cursor(){return active()?session().cursor:null},
      get controlsOpen(){return controlsOpen},
      finish,
      start(ids){
        finish();ids=[...new Set(ids)];if(!ids.length)return false;
        const s={active:true,ids,originals:{},completed:{},startedAt:Date.now(),cursor:ids[0]};
        for(const id of ids){const r=record(id);s.originals[id]={};for(const k of keys){r[k]=r[k]||{};if(Object.hasOwn(r[k],id))s.originals[id][k]=copy(r[k][id]);delete r[k][id]}}
        owner.retrySession=s;persist();return true;
      },
      mark(id){if(active()&&session().ids.includes(id)){session().completed[id]=true;persist()}},
      unmark(id){if(active()){delete session().completed[id];persist()}},
      visit(id){if(active()&&id&&session().cursor!==id){session().cursor=id;persist()}},
      discard(){delete owner.retrySession;owner.retryHistory=[]},
      effective(key,r=owner){
        const values={...(r[key]||{})};
        if(active())for(const id of session().ids)if(!session().completed[id]&&record(id)===r&&Object.hasOwn(session().originals[id],key))values[id]=session().originals[id][key];
        return values;
      },
      mount({before,onStart,onExit,isCorrect=()=>false,visible=()=>true,tab,onToggle=()=>{}}){
        const panel=document.createElement('div');panel.className='study-retry';panel.id='wrongRetryPanel';
        panel.innerHTML='<div><strong>오답 재풀이</strong><span data-retry-status role="status" aria-live="polite"></span></div><div class="study-retry-actions"><button type="button" id="retryWrongBtn">오답만 다시 풀기</button><button type="button" id="exitWrongRetryBtn" hidden>재풀이 종료 · 전체 문항</button></div>';
        before.before(panel);const status=panel.querySelector('[data-retry-status]');
        let arrow=tab?.querySelector('[data-retry-arrow],#againArrow');
        if(tab){
          if(!arrow){arrow=document.createElement('span');arrow.dataset.retryArrow='';arrow.setAttribute('aria-hidden','true');tab.append(' ',arrow)}
          tab.setAttribute('aria-controls',panel.id);
          tab.title='오답 탭을 다시 누르면 재풀이 바를 펼치거나 접습니다.';
          // A repeated tab click changes only the controls, preserving the current question and draft.
          tab.addEventListener('click',event=>{
            if(!visible())return;
            event.stopImmediatePropagation();controlsOpen=!controlsOpen;api.refresh();onToggle(controlsOpen);
          },true);
        }
        api.refresh=message=>{if(!visible())controlsOpen=false;const expanded=visible()&&controlsOpen;panel.hidden=!expanded;if(tab)tab.setAttribute('aria-expanded',String(expanded));if(arrow)arrow.textContent=expanded?'▴':'▾';panel.querySelector('#exitWrongRetryBtn').hidden=!active();status.textContent=message||(active()?` ${session().ids.filter(id=>session().completed[id]).length} / ${session().ids.length}문항 채점 · 해결 ${session().ids.filter(id=>session().completed[id]&&isCorrect(id)).length}개 · 이전 답안 보관 · 자동 저장`:' 틀린 문제를 새 답안으로 다시 풉니다.');};
        panel.querySelector('#retryWrongBtn').onclick=()=>{onStart();api.refresh(active()?undefined:' 다시 풀 오답이 없습니다. 먼저 문제를 풀고 채점하세요.');};
        panel.querySelector('#exitWrongRetryBtn').onclick=()=>{finish();onExit();api.refresh(' 재풀이 종료 · 미채점 문항의 이전 답안을 복원했습니다.');};
        api.refresh();return panel;
      }
    };return api;
  }
  function effective(owner,key){const values={...(owner[key]||{})},s=owner.retrySession;if(s?.active)for(const id of s.ids||[])if(!s.completed?.[id]&&Object.hasOwn(s.originals?.[id]||{},key))values[id]=s.originals[id][key];return values}
  window.StudyRetry={create,effective};
})();
