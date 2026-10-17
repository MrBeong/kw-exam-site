# 실제 R 실행 검증

R 4.6.0 / lawstat 3.6 / jsonlite 2.0.0으로 실행했다. R은 Homebrew에, 추가 패키지는 표준 사용자 라이브러리 `~/Library/R/arm64/4.6/library`에 설치되어 있다. 임시 폴더에 의존하지 않는다.

시험대비 중간 폴더에서:

```sh
python3 final-audit/r-execution/run.py
```

새 환경에서는 R을 설치하고 `Rscript --vanilla -e 'install.packages(c("lawstat", "jsonlite"), repos="https://cloud.r-project.org")'`로 의존 패키지를 준비한다. 다른 라이브러리를 사용할 경우 PSY_R_LIBRARY를 지정할 수 있다.

- run.py는 현재 questions.json에서 빈칸 정답을 복원하며, modelCode와 일치하는지 먼저 검사한다. 실행마다 현재 자료·코드 해시를 기록한다.
- `RC001.R` 등의 파일은 **문제의 준비 코드 + 완성 답안**이다. `Rscript --vanilla RC001.R`로 직접 재실행할 수 있다. 그래프 문항은 R의 기본 장치에 그린다.
- `*-answer.R`는 빈칸을 복원한 답안 부분만 보존한다. verify_case.R는 각 문항의 JSON에 제시된 준비 코드를 먼저 실행하고 이 답안을 실행한다.
- `*-console.txt`는 실제 R 출력, `*-result.json`은 문항별 판정·수치·경고·검사 항목이다. results.json은 40문항 전체 결과다.
- 회귀 12행의 CSV는 제공 regression1.xlsx에서 다시 추출한다. 원본 엑셀 해시도 results.json에 기록한다.
- 수업 원자료가 없는 키·전후 수행시간·Hick 자료는 **문제에 전체 공개한 구성자료**다. 원래 수업 데이터라고 주장하지 않는다. 제공한 p값과 R²의 반올림값도 이 자료의 실제 출력과 비교한다.
- R은 빈 환경을 사용한 새 프로세스에서 문항별로 실행한다. 사용자 답안을 실행하는 웹 자동 채점 기능은 추가하지 않았다.

완전 적합인 작은 Hick 예제의 예상 경고는 결과에 보존했다. 경고를 임의로 없애거나 통계적 추론의 근거로 사용하지 않는다.
