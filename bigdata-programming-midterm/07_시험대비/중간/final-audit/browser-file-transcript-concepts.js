async page=>{
 const checks=[],errors=[],check=(v,t)=>{if(!v)throw Error(t);checks.push(t);};
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.reload();
 const base=new URL('.',page.url()).href;
 const d=await (await page.request.get(base+'concept-source/concept-data.json')).json();
 const t=await (await page.request.get(base+'concept-source/file-transcript.json')).json();
 await page.waitForFunction(()=>document.querySelector('#BD-088').open);
 check(await page.locator('.concept').count()===98,'98 concept groups retained');
 for(const s of d.sections)for(const c of s.items){
   if(!c.transcript)continue;
   const card=page.locator('#'+c.id);
   await card.evaluate(e=>e.open=true);
   const text=await card.innerText();
   check(t.items[c.key].notes.every(n=>text.includes(n.replaceAll('`',''))),c.id+' all transcript notes rendered');
   const a=card.locator('.source-row a[href*="파일입출력_전사대조"]');
   check(await a.count()===1,c.id+' transcript source link');
   const url=await a.getAttribute('href');const res=await page.request.get(new URL(url,page.url()).href);
   check(res.status()===200&&(await res.text()).includes('id="'+c.id+'"'),c.id+' source and target anchor exist');
 }
 const supplement=page.locator('#BD-088 .transcript-example');
 check(await supplement.locator('code').innerText()===t.example.code,'supplement code indentation exact');
 check(!(await supplement.locator('.output').evaluate(e=>e.open)),'supplement output initially folded');
 await supplement.locator('.fixture summary').click();
 check(await supplement.locator('.fixture pre').innerText()===d.fixtures['phones.txt'],'correct phone fixture shown');
 await supplement.locator('.output summary').click();
 check(await supplement.locator('.output pre').innerText()===t.example.output.trimEnd(),'verified output displayed');
 await page.evaluate(()=>{window.__originalWrite=navigator.clipboard.writeText.bind(navigator.clipboard);navigator.clipboard.writeText=async text=>window.__transcriptCopy=text;});
 await supplement.locator('.copy').click();
 check(await page.evaluate(()=>window.__transcriptCopy)===t.example.code,'copy retains actual Python with indentation');
 await page.evaluate(()=>navigator.clipboard.writeText=window.__originalWrite);
 await page.locator('#search').fill('lstrip');
 check(await page.locator('#BD-089').isVisible(),'oral supplement searchable');
 check((await page.locator('#BD-089').innerText()).includes('해당 슬라이드에는 미기재'),'oral supplement scope label clear');
 await page.keyboard.press('Escape');
 const checkKey='bigdata-midterm:concept-checks:2026-10-20:v1';
 await page.locator('[data-check]').first().check();await page.reload();
 check(await page.locator('[data-check]').first().isChecked(),'concept check saved and restored');
 const record=await page.evaluate(key=>localStorage.getItem(key),checkKey);
 const state=await page.locator('details').evaluateAll(ds=>ds.map(e=>e.open));
 await page.evaluate(()=>dispatchEvent(new Event('beforeprint')));
 check(await page.locator('details:not([open])').count()===0,'print expands supplemental code fixture and output');
 await page.evaluate(()=>dispatchEvent(new Event('afterprint')));
 check(JSON.stringify(await page.locator('details').evaluateAll(ds=>ds.map(e=>e.open)))===JSON.stringify(state),'print restores all previous folded states');
 check(await page.evaluate(key=>localStorage.getItem(key),checkKey)===record,'print does not change check records');
 for(const [width,height] of [[320,640],[390,844],[1440,1000]]){
   await page.setViewportSize({width,height});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   await page.locator('#BD-088').evaluate(e=>e.open=true);
   await supplement.scrollIntoViewIfNeeded();
   const m=await page.evaluate(()=>({w:innerWidth,sw:document.documentElement.scrollWidth,right:document.querySelector('.transcript-example').getBoundingClientRect().right}));
   check(m.w===m.sw&&m.right<=m.w+1,'supplement stays within viewport '+width);
   if(width!==320)await page.screenshot({path:'output/playwright/bigdata-transcript-concept-'+width+'.png'});
 }
 const raw=new URL('../../02_녹화와_전사/파일입출력_제공전사.txt',base).href;
 check((await page.request.get(raw)).status()===200,'preserved raw source accessible');
 check(errors.length===0,'no console or page errors');
 return {date:'2026-10-21',passed:checks.length,errors,checks};
}
