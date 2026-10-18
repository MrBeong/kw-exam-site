/* Numbered short-answer blanks. Answers remain ordinary text in the existing storage. */
(()=>{
 'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function values(q,text){
  const lines=String(text||'').split('\n');
  return q.recallBlanks.map(b=>{const prefix='('+b.id+') ';return lines.find(l=>l.startsWith(prefix))?.slice(prefix.length)||''});
 }
 function render(q,text,locked=false){
  const saved=values(q,text);
  return `<fieldset class="recall-fields"><legend>번호별 단답 <small>자동 저장</small></legend>${q.recallBlanks.map((b,i)=>`<label><span>${esc(b.label)}</span><input type="text" data-recall-blank="${esc(b.id)}" aria-label="${esc(q.id)} 빈칸 ${esc(b.id)}" value="${esc(saved[i])}" placeholder="(${esc(b.id)})" autocomplete="off" autocapitalize="off" spellcheck="false" ${locked?'disabled':''}></label>`).join('')}</fieldset>`;
 }
 function read(root,q){
  const vals=q.recallBlanks.map(b=>root.querySelector(`[data-recall-blank="${b.id}"]`)?.value||'');
  return vals.some(v=>v.trim())?vals.map((v,i)=>'('+q.recallBlanks[i].id+') '+v).join('\n'):'';
 }
 window.StudyRecall={render,read,values};
})();
