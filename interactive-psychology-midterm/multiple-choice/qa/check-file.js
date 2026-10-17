async (page) => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const mcUrl=page.url().split('?')[0];const rootUrl=new URL('../index.html',mcUrl).href;
 await page.goto(mcUrl+'?question=MC001');await page.keyboard.press('4');await page.reload();
 const result=await page.evaluate(()=>({title:document.title,options:document.querySelectorAll('.option').length,explanations:document.querySelectorAll('.option-explain').length,answer:JSON.parse(localStorage.getItem('psych-midterm-multiple-v1')).answers.MC001,audit:window.MC_AUDIT}));
 if(!result.answer.correct||result.options!==4||result.explanations!==4)throw new Error('file grading/restoration');
 await page.getByRole('link',{name:'개념 정리',exact:true}).click();if(page.url().split('?')[0]!==rootUrl)throw new Error('file notes link');
 await page.getByRole('link',{name:'O/X',exact:true}).click();if(!page.url().includes('/ox/index.html'))throw new Error('file ox link');
 if(!await page.getByRole('button',{name:'↺ 문제 초기화',exact:true}).isVisible())throw new Error('file OX reset missing');
 await page.getByRole('link',{name:'다지선다',exact:true}).click();if(page.url().split('?')[0]!==mcUrl)throw new Error('file MC link');
 await page.setViewportSize({width:320,height:740});
 if(!await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))throw new Error('320px MC overflow');
 await page.getByRole('link',{name:'O/X',exact:true}).click();
 const oxOverflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,reset:document.querySelector('#resetBtn').getBoundingClientRect().toJSON()}));
 await page.screenshot({path:'/tmp/psy-qa/ox-mobile.png',fullPage:true});
 const final={checks:['file grading','file reload restoration','file notes link','file OX link','file MC link','file visible OX reset','320px MC viewport'],errors,oxOverflow,audit:result.audit};
 await page.evaluate(v=>window.PSY_FILE_RESULT=v,final);return final;
}
