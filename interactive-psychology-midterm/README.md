# 인터랙티브심리학 중간고사 시험대비

2026년 10월 19일 18:00–20:00 중간고사(1~6주차) 대비용 자체 제작 학습 자료입니다.

- `index.html`: 개념 정리, 단답·서술·R 코드 작성, 오답 정리
- `ox/index.html`: O/X 188문항
- `multiple-choice/index.html`: 다지선다 135문항
- `mock-exam/index.html`: 120분·32문항·100점 기출형 예상시험 5세트
- 전체 589문항, 기존 185개 개념과 보충영상 사례 3개를 포함한 188개 개념

## 오답만 다시 풀기

각 문제 유형의 **오답 탭**(단답·서술·R은 **오답·애매**)에서만 버튼을 표시합니다. 단답·서술·R의 오답 재풀이는 자기평가 `다시 풀기` 문항만 포함하고 `애매함`은 제외합니다. 객관식은 정오 결과, 기출형은 최신 채점 결과와 복습 표시를 기준으로 모읍니다.

새 답안과 해설이 닫힌 상태로 시작하며 진행 상황은 브라우저에 저장됩니다. 다시 채점해 해결한 문제는 다음 재풀이 회차에서 빠집니다. 다른 상태 탭으로 이동하거나 재풀이를 종료하면 미채점 문항은 이전 답안으로 복원합니다. 제출한 모의시험 답안은 연습 모드의 재풀이와 별도로 보존합니다.

주관식·R 코드는 상세 해설과 항목별 기준에 따라 자기채점합니다. 웹 화면에서 R을 실행하거나 자유 서술의 의미를 자동 판정하지 않습니다. 모든 R 모범 코드는 별도 실제 R 실행으로 검증했습니다.

## 재생성

이 폴더에서 Python 3로 순서대로 실행합니다. Node 빌드나 외부 CDN은 필요하지 않습니다.

```sh
python3 multiple-choice/build.py
python3 written/build.py
python3 mock-exam/build.py
python3 final-audit/verify_content.py
python3 final-audit/collect_formulas.py
```

R 실행 검증은 R 및 `lawstat`, `jsonlite`가 설치된 환경에서 실행합니다. 검증에 사용한 원본 엑셀 파일은 `final-audit/fixtures/regression1.xlsx`에 포함되어 있습니다.

```sh
python3 final-audit/r-execution/run.py
```

`final-audit/wrong-retry-ui.js`, `wrong-retry-edges.js`, `release-ui.js`는 Playwright CLI의 `run-code --filename`으로 실행하는 브라우저 검증입니다. 별도의 격리 프로필을 사용해야 합니다. 이 스크립트는 학습 저장소를 연습 데이터로 초기화합니다. 전체 검증에서는 이 폴더를 HTTP로 제공한 뒤 첫 학습 페이지를 연 상태에서 실행하세요.

학습 기록은 해당 브라우저·origin의 localStorage에 저장되므로 로컬 파일과 GitHub Pages, 다른 기기·브라우저의 기록은 분리됩니다. 초기화는 문제 유형별로 적용하며 북마크와 다른 유형의 기록은 보존합니다.
