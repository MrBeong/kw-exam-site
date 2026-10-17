# -*- coding: utf-8 -*-
"""다지선다 원본 JSON을 검증하고 독립 실행 HTML·문제집·개념 대응표를 생성한다."""
from pathlib import Path
from collections import Counter
import json
import re

BASE = Path(__file__).resolve().parent
EXAM = BASE.parent

def build():
    assert all((EXAM/'assets'/n).is_file() for n in ['study-math.js','study-math.css','mathjax/tex-svg-3.2.2.js'])
    questions = json.loads((BASE / "questions.json").read_text())
    concepts = json.loads((BASE / "concepts.json").read_text())
    ids = {c["id"] for c in concepts}
    assert len(ids) == len(concepts) == 188
    assert len({q["id"] for q in questions}) == len(questions)
    covered = set()
    for q in questions:
        assert len(q["options"]) == 4, q["id"]
        assert len({o["id"] for o in q["options"]}) == 4, q["id"]
        assert len({o["text"] for o in q["options"]}) == 4, q["id"]
        correct = sum(o["correct"] for o in q["options"])
        assert correct in (2, 3) if q["type"] == "multi" else correct == 1, q["id"]
        assert all(o["explanation"] and len(o["explanation"]) >= 20 for o in q["options"]), q["id"]
        assert q["conceptIds"] and set(q["conceptIds"]) <= ids, q["id"]
        covered.update(q["conceptIds"])
    assert covered == ids, sorted(ids - covered)
    ox = (EXAM / "ox/index.html").read_text()
    ox_chapters = re.findall(r'^  q\("([^"\n]+)",R`', ox, re.M)
    assert len(ox_chapters) == len(concepts)
    assert [c["chapter"] for c in concepts] == ox_chapters
    html = (BASE / "template.html").read_text()
    for token, value in [("__QUESTION_DATA__", questions), ("__CONCEPT_DATA__", concepts)]:
        html = html.replace(token, json.dumps(value, ensure_ascii=False).replace("</", "<\\/"))
    assert "__QUESTION_DATA__" not in html
    (BASE / "index.html").write_text(html)
    counts = Counter(q["type"] for q in questions)
    lines = ["# 인터랙티브심리학 중간고사 · 다지선다 문제와 해설", "",
             "작성·검증일: 2026-10-17", "",
             f"총 {len(questions)}문항: 단일선택 {counts['single']} · 복수정답 {counts['multi']} · 사례형 {counts['case']}. 모두 자체 제작한 예상문항이며 실제 기출 원문이 아니다.", "",
             "범위: 기존 OX001–OX188 개념 목록, 7개 학습 단원. 지문·보기·해설은 한글, 영문 용어와 R 코드 표기는 원형을 유지한다.", "",
             "문제집의 보기 순서는 HTML의 고정 보기 순서와 같다. 실전 혼합 모드는 문항 순서만 섞는다.", ""]
    for q in questions:
        lines += [f"## {q['id']} · {q['chapter']} · {q['type']}", "", q["stem"], ""]
        if q.get("visual"):
            lines += [f"[그림·표가 포함된 웹 문항](multiple-choice/index.html?question={q['id']})", ""]
        lines += [f"{i}. {o['text']}" for i, o in enumerate(q["options"], 1)]
        lines += ["", "**정답: " + ", ".join(str(i) for i, o in enumerate(q["options"], 1) if o["correct"]) + "번**", ""]
        lines += [f"- {i}번 {'✓' if o['correct'] else '×'}: {o['explanation']}" for i, o in enumerate(q["options"], 1)]
        lines += ["", f"근거: {q['source']}  ", "개념 대응: " + ", ".join(q["conceptIds"]), ""]
    (EXAM / "07_다지선다_문제와해설.md").write_text("\n".join(lines) + "\n")
    lines = ["# 다지선다 개념 대응 및 제작 검증", "", "검증일: 2026-10-17", "",
             f"기존 OX 원자 개념 {len(concepts)}개 중 {len(covered)}개 대응, 누락 {len(ids-covered)}개 (`coverageMissingAfterSupplement = 0`).", "",
             "이번 전수 검증의 기준은 기존 OX001–OX188 목록이다. 원본 교안·전사 전체를 이번 단계에서 새로 감사했다는 의미는 아니며, 새 자료가 추가되면 개념 목록과 문항을 함께 보완한다.", "",
             "## 문항 구성", "", "| 단원 | 단일 | 복수 | 사례 | 합계 |", "|---|---:|---:|---:|---:|"]
    for chapter in dict.fromkeys(c["chapter"] for c in concepts):
        ch = Counter(q["type"] for q in questions if q["chapter"] == chapter)
        lines.append(f"| {chapter} | {ch['single']} | {ch['multi']} | {ch['case']} | {sum(ch.values())} |")
    lines += ["", f"그림·표 문제 {sum('visual' in q for q in questions)}개. 135문항은 전수 훈련용 문제은행의 크기이며 실제 시험 문항 수의 추정치가 아니다.", "",
              "## 변별력·보기 설계", "",
              "- 정의를 그대로 보여 준 뒤 확인하게 하지 않고 사례 분류, 개념 쌍 비교, 계산 연쇄, 출력 판독으로 묻는다.",
              "- 오답은 Equivocation/Noise·Deficiency/Contamination 치환, 로그 변환 누락, 분모·단위·부호 역전, 자유도 오류, p값·R² 과잉 해석에서 만든다.",
              "- 복수정답은 4개 보기 각각을 판단해야 한다. 일부 정답만 고르거나 오답 하나를 더 고르면 오답 처리한다.",
              "- 528개 보기 모두에 정답 근거 또는 오답 원인과 바로잡은 설명을 수록했다.",
              "- 단일·사례형의 정답 위치는 1~4번에 27·28·28·28개로 분산한다. 보기 ID를 유지해 재접속 후 저장 답안이 엇갈리지 않게 한다.",
              "- 시각 자료는 스마트글래스 4조건, 혼동행렬 전체, 반대 라벨 매핑, Donders 세 과업, Fitts 두 표적, ANOVA·R 출력 등 문항의 모든 비교 조건을 묶어 제시한다.", "",
              "## 교안 표현의 적용 조건", "",
              "- Sternberg의 YES/self-terminating·NO/exhaustive는 교안 p.31의 설명 모형을 묻는 조건으로 한정했다.",
              "- 정규성 p>0.05는 기각하지 못함이며 정규성 증명이 아니다. n≥20도 교안의 경험칙이다.",
              "- 독립표본의 등분산 요건은 교안의 pooled 방식에 해당한다. R 기본 Welch와 구별한다.",
              "- 신호의 크기 강조만으로 고정된 확률 분포의 Shannon 엔트로피가 바뀌지는 않는다.",
              "- N 단위의 코 하중을 교안이 pressure라 표기한 점을 해설에 구분했다. 휜 동전 중복도는 제시된 근삿값으로 계산한다.", "",
              "## 초기화와 저장", "",
              "- OX·다지선다 초기화는 각 단계의 답안과 정오만 지우며 북마크와 다른 단계의 기록을 보존한다.",
              "- 메인의 두 초기화 버튼을 실제 상태 초기화 함수에 연결했다. 개념 체크리스트는 보존한다.",
              "- 정답 자동 이동은 다지선다에서 기본 해제하여 보기별 해설을 읽을 수 있게 했다. 원하면 켤 수 있다.",
              "- HTML은 문제·개념 데이터를 내장해 로컬 file://로 열어도 문제를 불러온다. HTTP에서는 OX iframe의 실제 목록도 교차 대조한다.", "",
              "## 개념별 대응표", "", "| 개념 ID | 단원·주제 | 대응 문항 |", "|---|---|---|"]
    for c in concepts:
        linked = [q["id"] for q in questions if c["id"] in q["conceptIds"]]
        lines.append(f"| {c['id']} | {c['chapter']} · {c['kind']} | {', '.join(linked)} |")
    lines += ["", "## 재생성", "", "`python3 multiple-choice/build.py`를 시험대비 중간 폴더에서 실행한다. JSON 원본을 수정한 뒤 HTML·문제집·대응표를 함께 다시 만든다.", ""]
    (EXAM / "08_다지선다_개념대응표.md").write_text("\n".join(lines))
    print(json.dumps({"questions": len(questions), "types": dict(counts), "concepts": len(concepts), "missing": sorted(ids-covered), "options": sum(len(q["options"]) for q in questions), "visuals": sum("visual" in q for q in questions)}, ensure_ascii=False))

if __name__ == "__main__":
    build()
