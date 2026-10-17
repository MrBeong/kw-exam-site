/* Shared offline math rendering. TeX is authored in content, never inferred from R code. */
(() => {
  'use strict';
  const ignored='script,style,noscript,textarea,pre,code,select,option,input,mjx-container,.wr-editor,.wr-legacy';
  let queue=new Set(),scheduled=false,chain=Promise.resolve();
  const hasMath=root=>{
    if(!root||root.nodeType!==1||root.matches(ignored)||root.closest('mjx-container'))return false;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>n.parentElement?.closest(ignored)?NodeFilter.FILTER_REJECT:NodeFilter.FILTER_ACCEPT});
    while(walker.nextNode())if(/\\[([]/.test(walker.currentNode.nodeValue))return true;
    return false;
  };
  function typeset(root=document.body){
    if(!root?.isConnected||!hasMath(root))return chain;
    queue.add(root);
    if(scheduled)return chain;
    scheduled=true;
    chain=chain.then(async()=>{
      await window.MathJax?.startup?.promise;
      const roots=[...queue].filter(r=>r.isConnected);queue.clear();scheduled=false;
      if(!window.MathJax?.typesetPromise)return;
      const outer=roots.filter(r=>!roots.some(other=>other!==r&&other.contains(r)));
      const math=window.MathJax.startup.document.math;
      const stale=[...math].map(m=>m.typesetRoot).filter(n=>n&&!n.isConnected);
      if(stale.length)window.MathJax.typesetClear(stale);
      if(outer.length)await window.MathJax.typesetPromise(outer);
    }).catch(error=>{scheduled=false;window.STUDY_MATH_ERRORS.push(String(error));console.error('Math rendering:',error)});
    return chain;
  }
  window.STUDY_MATH_ERRORS=[];
  window.StudyMath={typeset,idle:()=>chain};
  window.MathJax={
    tex:{inlineMath:[['\\(','\\)']],displayMath:[['\\[','\\]']],processEscapes:true},
    svg:{fontCache:'local'},
    options:{enableMenu:false,skipHtmlTags:['script','noscript','style','textarea','pre','code','select','option'],ignoreHtmlClass:'math-ignore|wr-editor|wr-legacy'},
    startup:{typeset:false,ready(){
      window.MathJax.startup.defaultReady();
      window.MathJax.startup.promise.then(()=>{
        typeset(document.body);
        new MutationObserver(records=>{
          for(const record of records){
            const target=record.target.nodeType===1?record.target:record.target.parentElement;
            if(!target||target.closest(ignored))continue;
            if(record.type==='characterData'){if(/\\[([]/.test(record.target.nodeValue))typeset(target)}
            else for(const node of record.addedNodes){
              if(node.nodeType===1)typeset(node);
              else if(node.nodeType===3&&/\\[([]/.test(node.nodeValue))typeset(target);
            }
          }
        }).observe(document.body,{childList:true,subtree:true,characterData:true});
      });
    }}
  };
})();
