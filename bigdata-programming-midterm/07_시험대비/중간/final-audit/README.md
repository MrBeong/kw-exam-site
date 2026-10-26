## 2026-10-25 압축본 재검수

최신 결과는 [37번](../37_압축본_강조점과_유형_재검수.md)이다. 현재98개 개념군·전사34강조·예제111군과 실제 본문/형식을 대조했다. 누락된65-age·불명확한절댓값정렬·직접회상/객관식유형·코드결과패널을 보완했다. 수록31코드 실행191개와 [화면111개](../output/playwright/cram-review/browser-review.json) 확인을 통과했다. 필수60분/22카드와389문항·저장/채점 로직은 그대로다. 원문/재선정 빈칸을 구분하며 커밋·푸시 없음.

---

## 이전 기록 — 아래는 작성 당시 상태

## 2026-10-25 시험1시간전 압축본

[35번 압축본](../35_시험1시간전_압축정리.html)과 [36번 검수](../36_압축본_범위와_실행_검수.md)를 추가했다. cram-content-coverage.json은 현재98개 개념군·전사34묶음의 실제 위치/근거 문구다. cram-execution.json은 원문 코드28개와 경계/출력/파일의 독립 검산163개다. [실제 화면65개 확인](../output/playwright/cram/browser-cram.json)에는 세 원문 회상·다섯 전체 코드 점검, 표시 코드31개 동일성, 모바일/휠/인쇄/기존 초안·북마크 보존을 포함한다. 현재389문항·231칸과 풀이 저장/채점 로직은 그대로다. 커밋·푸시 없음.

---

## 이전 기록 — 아래는 작성 당시 상태

## 2026-10-25 제작 기준·전체 영역 휠 검수

최신 기능 수정은 [34번](../34_제작기준_반영과_휠스크롤_검수.md)이다. 기존 공통 제작MD22절·디자인MD와 로컬 배포용 기준 사본에 객관식/단답의 실제 누락·중복·보기·상세 해설 검수와 포인터 위치에 무관한 휠 기준을 반영했다.

코드의 overscroll-behavior를 X contain/Y auto로 나누어 세로 휠이 본문으로 전달되게 수정했다. [실제 화면](../output/playwright/wheel/browser-wheel.json)은256개 확인·영역별 세로 휠72회와 수정 전 실패 재현/가로 읽기/위쪽 복귀를 포함한다.1440·390·320px의 목표·출력·코드/입력·파일·표·보기·상세 해설을 확인했다. wheel-standards-static.json의32개 보존/기준 사본 확인과 wheel-regressions.json의20개 기존 회귀도 통과했다. 현재389문항·정답·저장/채점 로직 불변, 커밋·푸시 없음.

---

## 이전 기록 — 아래는 작성 당시 상태

## 2026-10-25 객관식·개념 단답형 재검수

최신 결과는 [33번](../33_객관식과_개념단답_재검수.md)이다. 기존304개를 검토해12개 중복을 통합하고3개 단답을 개정·3개를 추가했다. 현재 비빈칸295개(객관식63·단답232), 전체389개다. 코드94/231칸과 원문19/52는 보존했다. noncode-review.json/noncode_invariants.py가 정확한 변경 전후·대체 문항과 상세 실행 기록을 보존한다.

noncode-static.json은 현재389문항/102개 비빈칸 코드의 독립 기대값1,690검사다. browser-noncode.json은295문항/254개 보기 해설3,058검사이며 후속 조건 표시10검사도 통과했다. 모드 조건·갱신된 값의 설명·오답 근거·보기의 길이 단서·편집/실행·동시 대입·논리 피연산자·키 자료형의 부족을 수정했다. 원문6쪽을 새로 시각 확인했고 원본 해시는 유지했다. noncode-regressions.json은 역사적 보존 검사와 실제 현재 검사를 구분하며20개 스크립트 모두 통과했다. 커밋·푸시하지 않았다.

---

## 이전 기록 — 아래는 작성 당시 상태

## 2026-10-25 통합 후 의미·조건·빈칸 재검수

최신 결과는 [32번](../32_통합후_예제와_빈칸_재검수.md)이다.11개공개과제의숨긴인수·인코딩·값/자료형·경계를보완하고2개복사형칸을문장단위로재선정했다. 코드에없는재읽기설명과items뷰/list변환해설2곳수정.정답MD의공개조건/준비자료누락생성경로도수정했다.현재398문항/94코드/231칸·원문19/52·개념98·예제111군유지.

integration-review.json/integration_invariants.py가정확한변경전후와기존398개전체데이터보존을검사한다. source전사7개·34강조묶음은integration-coverage-review.json에현재실제문항으로연결한다. integration-static.json과browser-integration.json/별도회귀결과를완료기록으로확인한다. 변경키2개만보관후재시도하며396호환기록은보존한다. 커밋·푸시없음.


완료: integration-static.json 1,160검사, browser-integration.json 1,551검사, integration-regressions.json 19스크립트 모두 통과. 실제 사용자 기록은 건드리지 않았다.

---

## 이전 기록 — 아래는 작성 당시 상태

## 2026-10-25 예제 전체 동작을 완성하는 코드 문제

최신 결과는 [31번](../31_교안예제형_코드완성_문항보완.md)이다. 화면 재배치 없이‘완성할동작’의내용을구체화하고원문결과예9개및추가연습용검증결과를제공한다. 추가75개는식/조건식/호출/문장단위로재선정하고,부분연습12개·용어/단순시연9개를통합/대응했다. BN9·BP26은각각관련입력비교/주식사전의단계를한프로그램에모았다. 현재398문항/94코드/231칸,원문19/52·개념98/예제111군 유지.

whole-example-review.json은정확한변경전후문제·요구사항/결과예·대체ID·출처/해설변경을고정한다. whole_example_invariants.py는새키73개와제외21개의호환성,나머지325개기록보존정책을검사한다. 실제사용자저장소를초기화하지않으며과거단어답안을새문항의정답으로인정하지않는다. 원문/추가연습/출력판단의결과노출을구별한다.

정적/실행1,461검사·실제화면1,812검사와18개회귀스크립트통과. source원본/미러제작21.5절·디자인기준동일반영. 실제교수정답표/최종출제분량은미확보. 커밋·푸시없음.

---

## 이전 기록 — 아래는 작성 당시 상태

## 2026-10-25 중복 문항 통합

최신 결과는 [30번](../30_중복문항_검수와_정리.md)이다. 원문과 같은 예제의 추가 빈칸16문항·동일 판단 단답2문항을 통합해 현재419문항/115코드/269칸이다. 원문19/52·개념98/예제111군 대응을 보존한다. duplicate-review.json은 제외 전 전체 문항·사유·남긴ID를 고정하고, duplicate_invariants.py는 정확한18개 제외만 허용한다. 과거 단계 보존 대조와 현재 활성419개 검사를 분리했다. BC28의 전사 강조 해설은 BO19풀이에 연결했다.

duplicates-static.json 1,579검사, browser-duplicates.json 1,449검사와 followup12검사 통과. 모든115코드/269칸의 실제 위치·입력/채점·상세 해설/실행값·저장/새로고침·오답 재풀이와 제외 기록 보관/이전 회차 정리를 확인했다. root/미러 제작21.4절·디자인 기준 동일 반영. 커밋·푸시없음.

---

## 이전 기록 — 아래는 작성 당시 상태

## 2026-10-25 빈칸별 목표 누락 보완

[29번](../29_빈칸별_목표동작_보완.md). BP20·BP34의goal만명확히하고모든437개레코드/코드/키/위치/실행해설을유지했다. verify-goal-targets.py176검사·browser-goal-targets.js26검사,관련문안/토큰/예측회귀통과. goal-target-review.json은변경전후와각빈칸/줄의필수목표를대응시킨다. goal_invariants.py는정확한두문안/공개revision변경만허용하며이전보존검사를완화하지않는다. 사용자저장버전/앱로직변경없음. 공통21.3절과디자인원본/미러반영. 커밋·푸시없음.

---

## 이전 기록 — 아래는 작성 당시 상태

## 2026-10-25 빈칸 토큰 위치와 실제 화면 전수 검수

최신 검수는 [28번](../28_빈칸위치_토큰과_화면검수.md)이다. BC20·BE05·BP12·BP22·BP34의5개 위치를 실제NAME토큰으로 바로잡았다. 현재437문항/131코드/316칸,원문19/52·기존 키/해설/실행값 유지. blank-span-corrections.json은 변경 전 레코드/토큰 선택기·좌표와 의도한문자열5/반복토큰7개를 고정하고,blank_spans.py가 생성 직전 모든 활성 칸을 검사한다.

verify-blank-spans.py → 정적1,820검사. old HTML/token재현은 실패해야 하고 새131/316은통과해야 한다. source복원만으로 정상이라 하지 않으며 부분NAME/NUMBER/OP·미검수fragment/반복토큰·Unicode좌표를 검사한다. span_invariants.py의 정확한5개 before/after만 기존 보존 검사에 반영한다. 다른 지문·코드·정답을 바꾸면 실패한다.

독립 프로필snapshot 후 browser-blank-spans.js →2,310검사. 이전HTML의 잘못된 위치를 화면 재현하고 실제131문항/316입력을 토큰 좌표·키/상세 해설과 대조했다. 기존437기록·초안·진행 중 재풀이/prior·이력복사·반복 새로고침·오답 재풀이·원문 필터도 포함한다. 사용자 실제 저장소에서 fixture를 실행하지 않는다.

실제 실행146사례·해설7,784검사/242실행/2,152단계와 기존 verify스위트 통과. app.js는위치수정전기록을한번보관하되동일한키/번호의기존입력/정오를유지한다. 원본/미러 공통기준21.2절 반영. 커밋·푸시 없음.

---

## 이전 기록 — 아래는 작성 당시 상태

## 2026-10-24 완성 코드의 실행 결과 검수

최신 검수는 [27번](../27_완성코드_실행결과_유형검수.md)이다. 기존100코드 제시형의 실제 평가 내용을25갈래로 검토하고 부족한 실행 판단에11문항을 추가했다. 현재437문항(코드131·단답244·객관식62)/316빈칸,원문19/52·기존426개 객체 불변. 새 문항은객관식8·단답3이며 기존 코드 원문을 사용하고 BOP10만 입력을0으로 바꿨다. 풀이 전에는 전체 코드와 필수 입력/파일을 제공한다.

작성: practice-source/output-prediction-questions.json/.mjs. 빌더가 빈칸 정리 뒤 해당 예제를 그대로 가져오고 유형별 질문/정답/가이드를 결합한다. 검증: verify-output-predictions.py264검사·독립 실행11건,브라우저browser-output-coverage.js177검사·기존426답안/초안/북마크 보존. 전체 실행146사례·해설7,784검사/242실행/2,152단계 통과. 긴 출력 보기는 기존pre-wrap표시를 사용한다.

prediction_invariants.py는 before426개 레코드의 완전 불변과 새11개 명시적 레코드/코드/조건/정답을 검증한다. 기존 historical catalog 보존 검사와 현재 추가분 검사를 구별한다. 이름만 바꾼 미선언 문항이나 기존 정답/코드 변경은 통과하지 않는다. source/정적/브라우저 결과JSON과 새 문제/해설MD를 함께 확인한다. UI fixture는 사용자 실제 저장소에서 실행하지 않는다. 커밋·푸시 없음.

---

## 이전 기록 — 아래는 작성 당시 상태

## 2026-10-24 코드 빈칸 출제 적합성

최신 기록은 [26번](../26_코드빈칸_출제적합성_검수.md)이다. 기존142코드문항을 검토해11개를 제외하고23개에서30칸을 고정했다. 현재426문항/131코드문항/316빈칸,원문19문항/52칸 유지. 전체426실제UI3,122검사,이전 답안·정오/번호/재풀이 보존119검사,정적 적합성649검사와 현재 코드138실행 사례·해설7,455검사를 통과했다.

작성 정책은 practice-source/blank-quality-review.json/.mjs,검사는 verify-blank-quality.py,실제 저장 이전은 app.js의 migrateBlankQuality다. 정확한 before와 남길 칸 번호만 허용한다. 원문/자료 보관 검사는 역사적 catalog,현재 실행/채점/MD는 활성 은행을 검증하며 서로 구별한다. 독립 Playwright 프로필에서 snapshot 후 browser-blank-quality.js 및 browser-active-blank-quality.js를 실행한다. 사용자 실제 저장소에서 fixture를 실행하지 않는다.

재실행 순서: node practice-source/build.mjs → python3 practice-source/build-detailed-solutions.py → node practice-source/build.mjs → 해당 verify 스크립트. 생성 해설은 현재 활성 문항만 포함한다. raw 작성 데이터에는 제외 문항을 보관하나 생성 은행/표시 분류는 활성 문항만 포함한다. 커밋·푸시 없음.

---

## 이전 기록 — 아래는 작성 당시 상태

## 2026-10-24 풀이 전 정답 단서 검수

최신 기록은 [25번](../25_문제지문_정답단서_제거.md)이다. 전체437개 채점 객체·370빈칸을 유지하면서 코드142개의 공개 지문/목표를 별도 원본 question-display.json으로 관리한다. 중립 지문·목표 동작·필수 입력/조건/파일만 풀이 전에 표시하고, 결과/풀이 설명/표기 힌트는 해설 뒤에 둔다. 원문19문항 템플릿은 그대로다.

`python3 practice-source/verify-answer-hints.py`는 2,029검사로 전체 채점 데이터/해설 불변·142개 공개 목표·문제/정답 MD·필수 자료·API 이름 단서·검색·공개 후 설명을 대조한다. 정답 문자열 검색만으로 내용 검수를 대신하지 않는다. BP32/33의 x 같은 주어진 변수와 필수 숫자/문자열 과제 데이터는 구분한다.

독립 Playwright 프로필에서 문제 페이지 snapshot 후 browser-answer-hints.js를 실행한다.437문항의 미채점 화면을 확인하고 코드142·단답241·객관식54의 정답을 모두 직접 입력/선택해 채점한 3,242검사 결과가 browser-answer-hints.json이다. 저장·새로고침·미완성 코드·북마크·명시적 해설 열기/닫기·오답 재풀이·원문 필터 전환도 포함한다. 실제 사용자 브라우저에서 이 fixture를 실행하지 않는다.

회귀: 코드149실행 사례/370빈칸,해설7,819검사/242실행/2,130단계,원문237·제시 코드608·파일301·단답 대응2,213·공백15·내용1,845검사 통과. 코드 정답/필터 키/저장 버전을 바꾸지 않으며 원본은 previous/before-answer-hint-cleanup-2026-10-24/에 보존했다. 공통 MD 원본/미러4곳에도 동일 기준을 반영했다. 커밋·푸시 없음.

---

## 이전 기록 — 아래는 작성 당시 상태

## 2026-10-24 교안 원문 빈칸과 예제 일치

최신 검수는 [24번](../24_교안원문_빈칸과_예제일치_검수.md)이다. 코드 교안7개340쪽에서 원문 빈칸19쪽·52곳을 찾고19쪽 전체 화면을 직접 대조했다. BO01–19를 추가해 현재437문항/370코드 빈칸이다. 기존418개 객체와 저장 정책은 동일하다. 미확보 자료·교수 정답표 상태는 유지한다.

- 작성 원본: practice-source/lecture-blank-questions.json/.mjs. 원문 빈칸·정답·해설·조건과 원문 후속 실행문 구분을 보존한다.
- 문항별 출제 구분: practice-source/lecture-code-kinds.json. 코드142문항을 모두 분류한다. 원문 재현과 빈칸을 새로 가린 추가 연습을 구분한다.
- 원문 검사: `python3 practice-source/verify-lecture-original-blanks.py` → lecture-original-blanks.json,237검사. PDF의 고정 토큰과 빈칸 경계/수,화면 대조 기록,복원 코드/출력/파일,전체 기존418개 객체 불변을 확인한다. 실행 통과만으로 원문 일치를 판정하지 않는다.
- 기존 실제 실행: `python3 practice-source/verify.py` →142코드문항/370빈칸·149실행 사례. 상세 해설은7,819검사/242실행/2,130단계.
- UI: 독립 프로필에서 실제 문제 페이지 snapshot 후 browser-lecture-original-blanks.js를 실행 →357검사. 원문19개의52답을 직접 입력·채점,기존418개의 답안 재현 fixture 보존,원문 필터/유형 전환,기존 코드123개의 구분 표시,긴 식 입력 전체 표시,오답 재풀이·모바일·인쇄 복원. 실제 사용자 브라우저에서 실행하지 않는다.
- 신규22쪽 시각 확인(19실습+2후속 해설+1원문 코드 화면)과 기존 시각 기록을 구분한다. 추가 렌더는 output/lecture-blank-audit/,화면 증거는 output/playwright/lecture-original-*이다.

빌드/검증은 중간 폴더에서 수행한다. 원본과 이전 제작 상태는 previous/before-lecture-blank-fidelity-2026-10-24/에 보존한다. 공통 MD 원본/미러4곳에 같은 검수 규칙을 반영했다. 커밋·푸시 없음.

---

## 이전 기록 — 아래는 작성 당시 상태

## 2026-10-24 개념 단답 직접 출제/공통 상세 해설 기준

최신 검수는 [23번](../23_개념단답_전수대조와_상세해설_기준반영.md)이다.214단답을 추가해 현재418문항(코드123·단답241·객관식54)이다. 원본/이전 상태는 previous/before-short-answer-audit-2026-10-24/에 보존했다. BM33·BM39 범위 교정 이외 기존204개 중202개와 기존27단답은 동일하다. 정답 표기를 맞춘 신규3개를 포함해 영향 문항의 과거 답안만 보관한다. 사용자 실제 저장소에서 검수 스크립트를 실행하지 않는다.

- 단답 작성/해설 원본: practice-source/short-answer-additions.json. BSA001–214의 표적·정답·근거 페이지·필수 조건·실제 코드·직접 작성 문장별 설명.
- 공통 기준: root 제작19/20절·디자인 상세 해설 UI절과 기존 미러 동일.
- 대응표: short-answer-coverage.md/JSON. 전체241개 직접 표적,98개 개념군의 기존 단답/다른 유형/추가 표적,381쪽 기존 분류와 직접 단답 연결,7전사의 강조 행·직접 단답,원본 해시·신규 시각 확인21쪽·미확인 한계를 분리한다.

중간 폴더에서:

```sh
node practice-source/build.mjs
python3 practice-source/verify-short-answer-coverage.py
python3 practice-source/verify-detailed-solutions.py
python3 practice-source/verify.py
python3 practice-source/verify-code-examples.py
python3 practice-source/verify-file-assessment.py
python3 practice-source/verify-character-reference.py
python3 practice-source/verify-choice-whitespace.py
python3 practice-source/audit-examples.py
python3 practice-source/verify-file-transcript.py
python3 final-audit/content-audit.py
```

직접 단답2,213검사·전체 상세 해설7,116검사(223실행·1,900단계)가 통과했다. 새 코드42개를 별도 Python 실행으로 정답/출력/예외/변수/파일과 대조한다. 정상 및 의도적 오류를 구분하며 원본 입력은 바꾸지 않는다. build는 새 문항의 실행 조건·입력 파일을 문제 MD와 해설 MD에 모두 넣는다.

독립 Playwright CLI 프로필을 열고 실제 문제 페이지 snapshot 후 browser-short-answer-coverage.js를 run-code로 실행한다.418문항의 상세 해설,241개 정답 직접 채점/저장,교정 이전 답안·진행 중 재풀이 보존,표기 채점/오답 재풀이·인쇄·작은 화면을3,837검사했다. browser-short-answer-reset.js는 초기화 분기를5검사한다. CLI에서 실제 reset 버튼 click/확인창 dialog-dismiss도 확인했다. 네이티브 모달과 실행 중 스크립트의 결과 수집을 섞지 않고 구분한다. 각 log의 Result를 같은 이름의 JSON에 저장한다.

browser-short-answer-final-display.js는 최종 BSA207의 준비 파일 빈 줄/개행·필수 조건·채점/출력과 BSA151의 실행 해설을13검사했다. 파일/모바일 및 실행 기록 스크린샷을 직접 확인했다. 원본 Notebook22셀·py3개·111예제군 대응과 파일 전사556검사도 재확인했다.

원영상·실제 정답표·최종 시험 페이지·미확보 Notebook은 완료로 표시하지 않는다. 설치/행정/향후 학습과 슬라이드에 없는 구두 보충으로 새 범위를 만들지 않는다. GitHub 커밋·푸시 없음.

---

## 이전 기록 — 아래는 작성 당시 상태

## 2026-10-24 시험대비 창의 상세 해설

최신은 [22번 보완/검증](../22_시험대비창_상세해설_보완.md)이다. 전체204문항의 문항별 풀이와 객관식218보기별 상세 설명을 작성하고, 코드181문항을 실제로 실행해1,735단계 기록을 넣었다. PDF는 선택 출처로 남기며 해설은 오프라인 HTML 안에 내장한다.

`node practice-source/build.mjs`는 두 해설 원본 JSON과 작성자 코드 실행에서 HTML/MD를 다시 만든다. `python3 practice-source/verify-detailed-solutions.py`는5,631검사, `browser-detailed-solutions.js`는 독립 프로필에서204문항의 해설 열람·표시·저장·채점·재풀이·인쇄를2,550검사했다. 결과는 detailed-solutions-static.json·detailed-solutions-execution.json·browser-detailed-solutions.json이다. 실제 사용자 답안은 건드리지 않는다. 커밋·푸시 없음.

---

## 2026-10-22 강조점별 직접 평가 보완

최신은 [19번 검수](../19_파일입출력_강조점별_문항보완.md)다. 개념/해설에 포함된 것과 실제 빈칸/질문에서 평가하는 것을 분리해27항목을 대조했다. 추가12문항/입력은 practice-source/file-transcript-questions.mjs, 대조 원본은 file-assessment-coverage.json이다.

`python3 practice-source/verify-file-assessment.py`는 새 코드 실제 실행·예외·파일 보존·정답/MD·조건/대응과 기존192문항 객체 불변을301검사로 확인한다. browser-file-assessment.js는 **별도 검수 프로필**의 문제 페이지에서 새12문항 및 기존192개 답안 재현 fixture를 검사한다. 실제 사용자 풀이 브라우저에서 실행하지 않는다. 결과는 file-assessment-execution.json과 file-assessment-browser.json(163검사)이다. 추가 전 은행/이전 제작 파일을 보존했으며 푸시하지 않았다.

---

## 2026-10-21 파일 입출력 전사/공통 기준

최신은 [18번 보완/검증](../18_파일입출력_전사보완과_공통기준.md)이다. 제공 전사 원문91행과 교안의 차이를 분리하고 개념14곳·해설16곳을 보충했다. `python3 practice-source/verify-file-transcript.py`는 원문/행 대응·독립 Python 실행·기존192문항 보존·공통 MD4개를 검사한다. 결과는 `file-transcript-execution.json`이다.

`browser-file-transcript-practice.js`는 독립 검수 프로필의 문제 페이지에서, `browser-file-transcript-concepts.js`는 개념 페이지#BD-088에서 실행한다. 이전 답안 재현 fixture는 사용자 실제 브라우저에 넣지 않는다. 이번 문제152검사/개념59검사 결과는 `file-transcript-browser.json`이다. raw 원문·교정 문서·JSON/빌더·HTML/MD를 함께 유지한다. 푸시 없음.

---

## 2026-10-21 코드 예시 보완

최신 변경은 [17번 검수](../17_코드예시_제시와_검수.md)를 참고한다. `python3 practice-source/verify-code-examples.py`는 추가38예시를 실제로 실행한다. `browser-code-examples.js`는 별도 검수 프로필에서 기존 답안 보존·코드 표시·채점을 확인한다. 결과는 code-examples-execution.json과 code-examples-browser.json에 있다. 이전 전체 검수의 횟수와 구분한다.

---

# 빅데이터프로그래밍 종합 검수 재현

2026-10-20. 사용자 풀이 기록이 없는 독립 Playwright CLI 프로필에서만 브라우저 검사를 실행한다. 전체 검사는 검수 프로필의 풀이 상태를 초기화하거나 재현 fixture로 교체한다. 실제 학습 브라우저에서 실행하지 않는다.

시험대비 중간 폴더에서:

```sh
node concept-source/build.mjs
node practice-source/build.mjs
python3 concept-source/verify.py
python3 concept-source/audit_static.py
python3 practice-source/verify.py
python3 practice-source/audit-examples.py
python3 final-audit/content-audit.py
```

`statement-explanations.json`이 문장별 해설 원본이다. 기존 BC01~BC28의 해설은 개념 원본에서 가져온다. 나머지90문항의 해설을 코드 수정 후 갱신할 때는 `python3 practice-source/explain-statements.py`를 먼저 실행하고, 내용을 검토한 뒤 문제 빌더를 실행한다. 자동 설명의 줄 번호 일치와 교육적 타당성을 별도로 확인한다.

브라우저 검사는 과목 폴더를 임시 HTTP 서버로 제공하고, 새 검수 프로필에서 `07_시험대비/중간/practice/index.html`을 먼저 연 뒤 실행한다. 예:

```sh
bash 로컬 자료 경로
```

실행 순서와 결과:

- browser-all.js → browser-all.json: 전체192문항 실제 입력·채점·해설·줄별 설명·모바일·새로고침.
- browser-edge.js → browser-edge.json: 전용 정답 fixture를 만든 뒤 오답 재풀이·정밀 채점·초기화·단축키·반응형. 초기화 분기 검사는 confirm 반환값을 검수 페이지에서만 제어한다. 실제 네이티브 확인창 표시/취소는 별도 CLI click/dialog-dismiss로 확인했다.
- 기존 practice-source/browser-preview-audit.js → browser-preview.json: 미채점 정답 열람·목표 출력·구107문항 호환.
- browser-regressions.js → browser-regressions.json: 변경 전7개 채점 기록 보존·재풀이 호환·두 탭 동기화·보완한8문항의 정오·모든 보기 해설.
- browser-concepts.js → browser-concepts.json: 검색·98개 펼침·직접 링크·체크 저장/실패/복구/다른 탭·초기화·인쇄 상태·복사 대상 문자열·모바일 목차·PDF HTTP 연결. 복사 검사는 실제 클립보드를 바꾸지 않도록 writeText의 문자열 인수를 확인했다.
- browser-print.js → browser-print.json: 문제 화면 인쇄·인쇄 후 복원·저장 실패 안내·콘솔.

원문을 새로381쪽 시각 대조한 검수가 아니다. 기존 해시·98개 개념군·111개 예제군 대응을 재검사하고, 공지 p.2는 이번에도 텍스트와 화면을 대조했다. 미확보 ch5_practice.ipynb·최종 출제 페이지·실제 정답표·시험 종료 시각은 검증 완료로 처리하지 않았다.

원문·실습 입력은 변경하지 않았다. 실행 검사는 새 임시 폴더에서 수행하며 사용자 Jupyter 커널을 조작하지 않는다. 게시/푸시는 이 검수의 범위에 포함하지 않는다.
