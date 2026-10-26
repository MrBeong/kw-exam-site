import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {makeBank} from './bank.mjs';
import {pruneBlankPractice,blankQualityReview} from './blank-quality-review.mjs';
import {addOutputPredictionQuestions,outputPredictionReview} from './output-prediction-questions.mjs';
import {correctBlankSpans,blankSpanRevision} from './blank-span-corrections.mjs';
import {consolidateDuplicates,duplicateReview} from './duplicate-review.mjs';
import {applyWholeExamples,wholeExampleReview} from './whole-example-review.mjs';
import {applyIntegrationReview,integrationReview} from './integration-review.mjs';
import {applyNoncodeReview,noncodeReview} from './noncode-review.mjs';
import {addLectureOriginalBlanks,lectureBlankBank} from './lecture-blank-questions.mjs';
import {addShortAnswerQuestions,shortAnswerExpansion} from './short-answer-additions.mjs';
import {addCodeExamples} from './code-examples.mjs';
import {addFileTranscriptQuestions,fileQuestionFixtures} from './file-transcript-questions.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const installed=path.basename(root)==='practice-source';
const out=installed?path.dirname(root):path.join(root,'package');
const conceptFile=installed?path.join(out,'concept-source/concept-data.json'):path.resolve(root,'../bigdata-concepts/package/concept-source/concept-data.json');
const data=JSON.parse(fs.readFileSync(conceptFile));
const subject=path.dirname(path.dirname(data.sources[0].source));
const notebook=JSON.parse(fs.readFileSync(path.join(subject,'01_강의자료/week01/Untitled.ipynb')));
const labs=Object.fromEntries(['10-07-01.py','10-07-02.py','10:07.py'].map(f=>[f,fs.readFileSync(path.join(subject,'01_강의자료/ch5_lab',f),'utf8')]));
const bank=makeBank(data,notebook,labs);
addCodeExamples(bank);
Object.assign(data.fixtures,fileQuestionFixtures);
const fileAssessment=addFileTranscriptQuestions(bank,data);
addShortAnswerQuestions(bank,data);
addLectureOriginalBlanks(bank);
const transcript=JSON.parse(fs.readFileSync(path.join(out,'concept-source/file-transcript.json'),'utf8'));
for(const q of bank)if(transcript.questionGuidance[q.id])q.transcriptGuidance={...transcript.questionGuidance[q.id],source:transcript.source.id};
const statementNotes=JSON.parse(fs.readFileSync(path.join(root,'statement-explanations.json'),'utf8'));
for(const q of bank)if(statementNotes[q.id])q.steps=statementNotes[q.id];
for(const q of bank)q.files=q.files?.length?q.files:q.code?.includes('hours.txt')?['hours.txt']:q.code?.includes('scores.txt')?['scores.txt']:q.code?.includes('phones.txt')?['phones.txt']:[];
pruneBlankPractice(bank);
const outputPredictions=addOutputPredictionQuestions(bank);
correctBlankSpans(bank);
consolidateDuplicates(bank);
applyWholeExamples(bank);
applyIntegrationReview(bank);
applyNoncodeReview(bank);
// Re-audit the actual active slots after consolidation, without applying the five relocations twice.
const blankSpanAudit=JSON.parse(execFileSync('python3',[path.join(root,'blank_spans.py'),'--check'],{input:JSON.stringify({bank,review:blankSpanRevision}),encoding:'utf8',maxBuffer:32*1024*1024}));
const keys=new Set(data.sections.flatMap(s=>s.items).map(c=>c.key));
const missing=[...keys].filter(k=>!bank.some(q=>q.keys.includes(k)));
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const referenceTables=JSON.parse(fs.readFileSync(path.join(root,'reference-tables.json'),'utf8'));
// 보기 데이터의 실제 공백/개행만 보존한다. repr의 리터럴 \\n은 변환하지 않는다.
const literalChoices=q=>!!referenceTables[q.id]?.literalOptions||q.options.some(o=>/[\n\t]| {2,}|^\s|\s$/.test(o));
const optionsMD=q=>{
  if(!literalChoices(q))return q.options.map((o,i)=>`${i+1}. ${o}`).join('\n');
  const fence='```';
  return q.options.map((o,i)=>`${i+1}. 보기\n\n   ${fence}text\n${o.split('\n').map(line=>'   '+line).join('\n')}\n   ${fence}`).join('\n\n');
};
const referenceMD=q=>{
  const r=referenceTables[q.id];if(!r)return '';
  const cell=(v,i)=>i%2===0?'`'+v+'`':String(v);
  return '\n### '+r.title+'\n\n'+r.description+'\n\n| '+r.columns.join(' | ')+' |\n| '+r.columns.map(()=>'---').join(' | ')+' |\n'+r.rows.map(row=>'| '+row.map(cell).join(' | ')+' |').join('\n')+'\n\n표기 범례: '+r.legend.map(([v,t])=>'`'+v+'` = '+t).join(' / ')+'\n\n근거: '+r.source.id+' PDF p.'+r.source.pages.join(', ')+' · '+r.source.detail+'\n';
};
const goalExampleMD=view=>{
  let s='';
  if(view?.inputPrompts?.length)s+='\n입력 안내 문구: '+view.inputPrompts.map(text=>'`'+JSON.stringify(text)+'`').join(' · ')+'\n';
  const e=view?.example;if(!e)return s;
  s+='\n### '+e.caption+'\n\n';
  if(e.rows)s+='| 입력·확인 대상 | 결과 |\n|---|---|\n'+e.rows.map(([a,b])=>'| '+a.replaceAll('|','\\|')+' | '+b.replaceAll('|','\\|')+' |').join('\n')+'\n';
  if(e.output!==undefined)s+='```text\n'+e.output+(e.output.endsWith('\n')?'':'\n')+'```\n';
  if(e.files)for(const [name,content]of Object.entries(e.files))s+='\n'+name+':\n\n```text\n'+(content||'(빈 파일)')+(content.endsWith('\n')?'':'\n')+'```\n';
  if(e.text)s+=e.text+'\n';if(e.note)s+='\n'+e.note+'\n';
  return s;
};
const detailedMD=q=>{
  const d=packageData.detailedSolutions[q.id],r=d.runtime;
  let s='\n### 상세 풀이\n\n'+d.reasoning.map((t,i)=>`${i+1}. ${t}`).join('\n\n')+'\n';
  if(d.optionDetails)s+='\n### 보기별 추가 해설\n\n'+d.optionDetails.map((t,i)=>`${i+1}. ${t}`).join('\n\n')+'\n';
  if(!r)return s;
  if(r.variant)s+='\n실행 기준: '+r.variant+'\n';
  for(const n of r.notes)s+='\n- '+n+'\n';
  if(r.sourceCode!==q.code)s+='\n적용한 완성 코드:\n\n```python\n'+r.sourceCode+'\n```\n';
  const cell=v=>String(v).replaceAll('|','\\|').replaceAll('\n','<br>');
  s+='\n### 실행 순서와 값 변화\n\n| 단계/줄 | 실행 문장 | 값 변화·분기·반환 | 추가 출력(표현) |\n|---|---|---|---|\n';
  for(const [i,t] of r.trace.entries()){
    const changes=Object.entries(t.changes).map(([k,v])=>k+': '+(v.before?.value??'정의 전')+' → '+v.after.value+' ('+v.after.type+')');
    if(!changes.length)for(const [k,v] of Object.entries(t.observed||{}))changes.push(k+' = '+v.value+' ('+v.type+')');
    if(t.expression)changes.push('식의 계산값: '+t.expression.value+' (대입 없음)');if(t.action)changes.push(t.action);if(t.decision)changes.push(t.decision);if(t.returned)changes.push('반환값: '+t.returned.value);
    s+='| '+(i+1)+' / '+t.line+'줄 · '+cell(t.scope)+' | `'+cell(t.code.trim())+'` | '+cell(changes.join('; '))+' | `'+cell(t.outputRepr||"''")+'` |\n';
  }
  s+='\n'+(r.randomExample?'표준출력 한 실행 예시':'표준출력')+':\n\n```text\n'+(r.stdout||'(화면 출력 없음)')+(r.stdout.endsWith('\n')?'':'\n')+'```\n\n공백·개행을 보이는 형태: `'+r.stdoutRepr+'`\n';
  if(r.exception)s+='\n발생한 예외: `'+r.exception.name+'` · '+r.exception.line+'줄. '+r.exception.message+'\n';
  const final=Object.entries(r.finalState).filter(([,v])=>!['module','function'].includes(v.type));
  if(final.length)s+='\n최종 변수 상태:\n\n'+final.map(([k,v])=>'- `'+k+'`: `'+v.value+'` ('+v.type+')').join('\n')+'\n';
  for(const [f,v] of Object.entries(r.files))s+='\n최종 파일 '+f+':\n\n```text\n'+(v||'(빈 파일)')+(v.endsWith('\n')?'':'\n')+'```\n';
  return s;
};
const types={code:'코드 빈칸',short:'개념 단답',mc:'4/5지선다'};
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const notice=path.join(subject,'01_강의자료/261012_빅데이터프로그래밍_공지.pdf');
const sources=data.sources.map(s=>({...s}));
sources.push({id:'BIG-022',filename:path.basename(notice),source:notice,sha256:hash(notice),pages:5});
const sourceText=q=>q.labFile?`BIG-020 · ch5_lab/${q.labFile}`:q.notebookCells||q.notebookCell?`BIG-009 · Untitled.ipynb 화면 ${(q.notebookCells||[q.notebookCell]).join(', ')}셀 / 슬라이드 대응 ${q.source} p.${q.pages.join(', ')}`:`${q.source} · ${sources.find(s=>s.id===q.source).filename} · PDF p.${q.pages.join(', ')}`;
const counts=Object.fromEntries(Object.keys(types).map(t=>[t,bank.filter(q=>q.type===t).length]));
const packageData={version:'2026-10-20-notice-1',bank,fixtures:data.fixtures,sources,sections:data.sections.map(s=>({key:s.key,title:s.title})),counts,
  notice:{source:'BIG-022',page:2,types:['개념 단답형','4지·5지선다형','코드 빈칸'],excluded:['서술형','들여쓰기를 직접 작성하는 문제'],score:40,weight:40,
    timing:'10월26일15:00(사용자 제공). 공지에는 시험 일시·종료 시각·장소·문항 수·최종 페이지 경계 미기재.'}};
packageData.revision=noncodeReview.id;
packageData.noncodeReview=noncodeReview;
packageData.integrationReview=integrationReview;
packageData.wholeExampleRevision=wholeExampleReview;
packageData.duplicateReview=duplicateReview;
packageData.blankSpanRevision=blankSpanRevision;
packageData.outputPredictionAssessment=outputPredictions;
packageData.assessmentPruning=blankQualityReview;
packageData.questionDisplay=JSON.parse(fs.readFileSync(path.join(root,'question-display.json'),'utf8'));
const activeCodeIds=new Set(bank.filter(q=>q.type==='code').map(q=>q.id));
packageData.questionDisplay.questions=Object.fromEntries(Object.entries(packageData.questionDisplay.questions).filter(([id])=>activeCodeIds.has(id)));
for(const q of bank.filter(q=>q.type==='code'))if(!packageData.questionDisplay.questions[q.id])throw Error('Missing public question display '+q.id);
packageData.lectureOriginalBlanks={revision:lectureBlankBank.revision,addedIds:lectureBlankBank.questions.map(q=>q.id),baseline:lectureBlankBank.baseline};
packageData.lectureCodeKinds=Object.fromEntries(Object.entries(JSON.parse(fs.readFileSync(path.join(root,'lecture-code-kinds.json'),'utf8'))).filter(([id])=>activeCodeIds.has(id)));
packageData.shortAnswerExpansion={revision:shortAnswerExpansion.revision,addedIds:shortAnswerExpansion.questions.map(q=>q.id),baseline:shortAnswerExpansion.baseline};
packageData.supplementalQuestionRevisions=JSON.parse(fs.readFileSync(path.join(root,'supplemental-question-revisions.json'),'utf8'));
packageData.referenceTables=referenceTables;
packageData.fileTranscriptAssessment=fileAssessment;
packageData.transcriptSources=[transcript.source];
packageData.presentationRevision=JSON.parse(fs.readFileSync(path.join(root,'code-presentation-revision.json'),'utf8'));
packageData.questionRevision=JSON.parse(fs.readFileSync(path.join(root,'question-revisions.json'),'utf8'));
fs.mkdirSync(path.join(out,'practice-source'),{recursive:true});
fs.mkdirSync(path.join(out,'practice'),{recursive:true});
fs.writeFileSync(path.join(out,'practice-source/blank-span-audit.json'),JSON.stringify(blankSpanAudit,null,2));
fs.writeFileSync(path.join(out,'practice-source/questions.json'),JSON.stringify(packageData,null,2));
execFileSync('python3',[path.join(root,'build-detailed-solutions.py')],{cwd:out,encoding:'utf8'});
packageData.detailedSolutions=JSON.parse(fs.readFileSync(path.join(root,'detailed-solutions.json'),'utf8'));
const sourceHashes=[notebook,...Object.values(labs)]; // 원본 문자열 자체는 바꾸지 않는다.
const coverage=data.sections.flatMap(s=>s.items.map(c=>({id:c.id,key:c.key,title:c.title,questions:bank.filter(q=>q.keys.includes(c.key)).map(q=>q.id)})));
fs.writeFileSync(path.join(out,'practice-source/coverage.json'),JSON.stringify({missing,coverage,counts,noticeSha256:hash(notice)},null,2));
let questionMD=`# 공지 반영 예상문제\n\n${bank.length}문항: 코드 빈칸${counts.code} · 개념 단답${counts.short} · 4/5지선다${counts.mc}. 실제 기출이 아닌 강의자료 기반 예상문제다.\n\n공식 유형: 개념 단답형·4지/5지선다·코드 빈칸. 서술형·들여쓰기 직접 작성은 제외. 강의 슬라이드 범위만 출제. 개념은 띄어쓰기만 허용, 코드는 한 글자 차이도 오답·부분점수 없음(공지 PDF p.2). 아래 코드의 공백은 제시한 완성본 표기를 기준으로 연습한다. 실제 시험 정답표를 확보했다는 뜻은 아니다.\n\n[문제 풀기](practice/index.html) · [별도 정답](12_공지반영_정답과해설.md) · [공지 원문](../../01_강의자료/${encodeURIComponent(path.basename(notice))}#page=2)\n\n원문 빈칸19문항(52빈칸)은 준비 범위의 ‘교안 원문 빈칸’에서 따로 풀 수 있다. 추가 연습은 같은 예제의 전체 요구사항을 한 문제에 모으고 식·조건식·호출·문장 단위로 채운다. ‘완성할 동작’의 결과 예는 코드 완성의 과제 조건이며, 출력값을 맞히는 객관식·단답에는 정답 결과를 미리 제시하지 않는다.\n\n처음 열면 전체 ${bank.length}문항을 표시한다. 슬라이드형 ${bank.filter(q=>q.scope==='slides').length}문항과 실습 파일3문항은 준비 범위 필터로 구분할 수 있다. 수업 예제 우선 필터에는 py3문항도 포함한다. 기존에 저장한 필터와 풀이 기록은 유지한다. Hello World·검증용 helper는 출제하지 않았다.\n`;
let answersMD='# 공지 반영 정답과 해설\n\n실제 시험 채점표가 아니라 원문 기반 연습 정답이다. 다른 표현/동등 코드도 실행상 맞을 수 있으나 이 연습은 공지의 표기 일치 방식으로 판정한다.\n';
for(const q of bank){
  const view=packageData.questionDisplay.questions[q.id];
  const publicPrompt=view?.prompt||q.prompt,publicGoal=view?.goal||q.goal,publicConditions=view?.conditions??q.conditions;
  questionMD+=`\n## ${q.id} · ${types[q.type]}${q.scope==='lab'?' · 실습 보충':''}\n\n${publicPrompt}\n`;
  const relation=packageData.lectureCodeKinds[q.id];
  if(relation)questionMD+='\n출제 구분: '+relation.label+'\n';
  if(q.type==='code')questionMD+='\n완성할 동작: '+publicGoal+'\n'+goalExampleMD(view);
  if(publicConditions?.length)questionMD+='\n실행 조건:\n\n'+publicConditions.map(c=>'- '+c).join('\n')+'\n';
  if(q.input?.length)questionMD+='\n입력 순서: '+q.input.map(v=>'`'+v+'`').join(' → ')+'\n';
  const used=q.files?.length?q.files:q.code?.includes('hours.txt')?['hours.txt']:q.code?.includes('scores.txt')?['scores.txt']:q.code?.includes('phones.txt')?['phones.txt']:[];
  q.files=used;
  for(const f of used)if(data.fixtures[f])questionMD+=`\n준비 파일 ${f}(${data.fixtures[f].endsWith('\n')?'마지막 줄 개행 포함':'마지막 줄 개행 없음'}):\n\n\`\`\`text\n${data.fixtures[f]}\n\`\`\`\n`;
  if(q.binary)questionMD+='\n입력 bridge.png는 바이너리 파일이다. 파일의 실제 크기를 정답으로 요구하지 않는다.\n';
  if(q.code)questionMD+=`\n\`\`\`python\n${q.template||q.code}\n\`\`\`\n`;
  questionMD+=referenceMD(q);
  if(q.type==='mc')questionMD+='\n'+optionsMD(q)+'\n';
  questionMD+=`\n출처: ${sourceText(q)}\n${q.type!=='code'&&q.note?'\n주의: '+q.note+'\n':''}`;
  answersMD+=`\n## ${q.id}\n\n${publicPrompt}\n\n`;
  if(view)answersMD+='완성할 동작: '+publicGoal+'\n'+goalExampleMD(view)+'\n문항 주제(풀이 후 확인): '+q.prompt+'\n\n';
  if(q.displayNote)answersMD+='표시/실행 설명: '+q.displayNote+'\n\n';
  if(q.type==='code'||q.input?.length||publicConditions?.length||q.files?.length){
    if(q.input?.length)answersMD+='입력 순서: '+q.input.map(v=>'`'+v+'`').join(' → ')+'\n\n';
    if(publicConditions?.length)answersMD+='실행 조건:\n\n'+publicConditions.map(c=>'- '+c).join('\n')+'\n\n';
    for(const f of q.files||[])if(data.fixtures[f])answersMD+='준비 파일 '+f+':\n\n```text\n'+data.fixtures[f]+(data.fixtures[f].endsWith('\n')?'':'\n')+'```\n\n';
  }
  if(q.type!=='code'&&q.code)answersMD+=`제시 코드:\n\n\`\`\`python\n${q.code}\n\`\`\`\n\n`;
  answersMD+=referenceMD(q);
  if(q.type==='mc'&&literalChoices(q))answersMD+='보기(공백·줄바꿈 원형):\n\n'+optionsMD(q)+'\n\n';
  if(q.type==='code'){
    answersMD+=q.blanks.map(b=>`- 빈칸${b.number}: \`${b.answer}\` — ${b.why}`).join('\n')+'\n';
    answersMD+=`\n완성 코드:\n\n\`\`\`python\n${q.code}\n\`\`\`\n`;
    if(q.steps?.length)answersMD+='\n'+q.steps.map(([line,why])=>`- ${line}${/^[0-9–-]+$/.test(String(line))?'줄':''}: ${why}`).join('\n')+'\n';
    if(q.output)answersMD+=`\n${q.random?'출력 조건':'출력'}:\n\n\`\`\`text\n${q.output.trimEnd()}\n\`\`\`\n`;
    for(const [f,v] of Object.entries(q.written||{}))answersMD+=`\n생성 파일 ${f}:\n\n\`\`\`text\n${v}${v.endsWith('\n')?'':'\n'}\`\`\`\n`;
  }else if(q.type==='mc')answersMD+=`정답: ${q.correct+1}번\n\n`+q.reasons.map((v,i)=>`- ${i+1}번: ${v}`).join('\n')+'\n';
  else answersMD+=`정답: \`${q.answer}\`\n\n${q.explain}\n`;
  if(q.type!=='code'&&q.explain&&q.type!=='short')answersMD+='\n'+q.explain+'\n';
  if(q.type!=='code'&&q.steps?.length)answersMD+='\n코드 문장별 해설:\n\n'+q.steps.map(([n,t])=>'- '+n+'줄: '+t).join('\n')+'\n';
  const guidances=[q.transcriptGuidance,...[...duplicateReview.retired,...wholeExampleReview.retired].filter(item=>item.replacementId===q.id&&item.before.transcriptGuidance).map(item=>item.before.transcriptGuidance)].filter(Boolean);
  for(const guidance of guidances)answersMD+='\n수업에서 강조한 구분:\n\n'+guidance.notes.map(n=>'- '+n).join('\n')+'\n\n[제공 전사 '+guidance.source+' · '+guidance.lines.join(', ')+'행 대조](../../03_주차별정리/파일입출력_전사대조.md)\n';
  answersMD+=detailedMD(q);
  if(relation)answersMD+='\n출제 구분: '+relation.label+' — '+relation.detail+'\n';
  answersMD+=`\n출처: ${sourceText(q)}\n${q.note?'\n주의: '+q.note+'\n':''}`;
}
// q.files는 위에서 입력 컨텍스트를 완성했으므로 최종 데이터를 한 번 더 직렬화한다.
fs.writeFileSync(path.join(out,'practice-source/questions.json'),JSON.stringify(packageData,null,2));
fs.writeFileSync(path.join(out,'11_공지반영_예상문제.md'),questionMD);
fs.writeFileSync(path.join(out,'12_공지반영_정답과해설.md'),answersMD);
const json=JSON.stringify(packageData).replaceAll('<','\\u003c');
const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,interactive-widget=resizes-content"><link rel="icon" href="data:,"><title>빅데이터프로그래밍 · 예상문제</title><style>${fs.readFileSync(path.join(root,'style.css'),'utf8')}</style></head><body>
<header><a href="../index.html">⌘ 개념 정리</a><span>빅데이터프로그래밍</span><a href="../35_시험1시간전_압축정리.html" style="font-size:12px;white-space:nowrap">1시간 압축</a><button id="tools" aria-expanded="false" aria-controls="settings">설정 ▾</button></header>
<nav id="typeTabs" aria-label="문제 유형">${Object.entries(types).map(([t,label])=>`<button data-type="${t}">${label}</button>`).join('')}</nav>
<section id="settings" hidden><p>필기·Closed-book · 40점/40% · 서술형·들여쓰기 작성 없음. <a href="../../../01_강의자료/${encodeURIComponent(path.basename(notice))}#page=2" target="_blank" rel="noopener">공지 p.2</a></p><p>개념: 띄어쓰기만 무시. 코드: 공백·기호 포함 원문 일치, 부분점수 없음. 이 페이지는 실제 코드 실행이 아닌 표기 일치 연습입니다.</p><label>준비 범위 <select id="scope"><option value="original-blanks">교안 원문 빈칸</option><option value="slides">슬라이드형</option><option value="priority">수업 예제 우선</option><option value="lab">실습 파일 보충만</option><option value="all">모두</option></select></label><label>단원 <select id="section"><option value="all">전체 단원</option>${data.sections.map(s=>`<option value="${s.key}">${esc(s.title)}</option>`).join('')}</select></label><label><input id="auto" type="checkbox"> 정답 후 자동 다음</label><label>검색 <input id="search" type="search" placeholder="문항·지문 검색"></label><details id="revisionHistory" hidden><summary>수정 전 답안</summary><div id="revisionRecords"></div></details><p>숫자1–5: 객관식 선택 · ←/→: 이동 · 입력 중에는 단축키를 적용하지 않습니다.</p></section>
<div id="stateBar"><div role="group" aria-label="풀이 상태"><button data-filter="all">전체</button><button data-filter="new">미응답</button><button data-filter="wrong" aria-expanded="false">오답 ▾</button><button data-filter="star">★</button></div><button id="resetAll">전체 다시</button></div>
<section id="retryBar" hidden><p id="retryInfo"></p><button id="startRetry">오답만 다시 풀기</button><button id="endRetry">재풀이 종료 · 전체</button></section>
<div id="save" role="status"></div><main id="card" aria-live="polite"></main>
<footer><button id="prev">← 이전</button><button id="jump" aria-label="문항 번호로 이동"></button><button id="next">다음 →</button></footer>
<script id="bankData" type="application/json">${json}</script><script>${fs.readFileSync(path.join(root,'app.js'),'utf8')}</script></body></html>`;
fs.writeFileSync(path.join(out,'practice/index.html'),html);
for(const f of ['noncode-review.json','noncode-review.mjs','integration-review.json','integration-review.mjs','whole-example-review.json','whole-example-review.mjs','duplicate-review.json','duplicate-review.mjs','goal-target-review.json','blank-span-corrections.json','blank-span-corrections.mjs','blank_spans.py','output-prediction-questions.json','output-prediction-questions.mjs','blank-quality-review.json','blank-quality-review.mjs','question-display.json','lecture-blank-questions.mjs','lecture-blank-questions.json','lecture-code-kinds.json','short-answer-additions.mjs','short-answer-additions.json','supplemental-question-revisions.json','solution-guides.json','code-solution-guides.json','build-detailed-solutions.py','detailed-solutions.json','reference-tables.json','file-transcript-questions.mjs','code-examples.mjs','code-presentation-revision.json','statement-explanations.json','question-revisions.json','bank.mjs','review.mjs','supplements.mjs','goals.mjs','build.mjs','app.js','style.css','verify.py'])if(path.resolve(root,f)!==path.resolve(out,'practice-source',f))fs.copyFileSync(path.join(root,f),path.join(out,'practice-source',f));
console.log(JSON.stringify({questions:bank.length,counts,missing,subject,out},null,2));
