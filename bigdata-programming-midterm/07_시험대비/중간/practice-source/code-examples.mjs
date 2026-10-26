// 실행·상태 판단에 필요한 예시를 실제 Python 문법으로 제공한다.
// 정답·보기·개념 대응을 바꾸지 않는 표시 보완이다. 예상 출력은 제출 전에 표시하지 않는다.
const examples = {
  "BM02": {
    "prompt": "다음 세 셀을 같은 커널에서 1 → 2 → 3 순서로 실행했다. 셀 3의 출력은?",
    "code": "# 셀 1\nx = 3\n\n# 셀 2\nx + 4\n\n# 셀 3\nprint(x)",
    "codeLabel": "Notebook · 셀 1 → 2 → 3"
  },
  "BM05": {
    "prompt": "주석 위치에 보기의 대입문 하나를 넣고 실행한다. 마지막 줄에서 TypeError를 일으키는 대입문은?",
    "code": "# 보기의 대입문 하나를 이 위치에 넣는다.\nprint(sum([1, 2, 3]))"
  },
  "BM07": {
    "prompt": "다음 코드가 출력하는 세 값을 순서대로 고르시오.",
    "code": "print(-7 // 4)\nprint(-7 % 4)\nprint(int(-1.75))"
  },
  "BM08": {
    "prompt": "다음 코드가 출력하는 두 값을 순서대로 고르시오.",
    "code": "print(2 ** 3 ** 2)\nprint(2 ^ 3)"
  },
  "BM09": {
    "prompt": "다음 두 포함 검사의 결과를 순서대로 고르시오.",
    "code": "print(\"Py\" in \"Python\")\nprint(\"P\" in [\"Python\"])"
  },
  "BM12": {
    "prompt": "다음 코드가 차례대로 출력하는 값은?",
    "code": "for value in range(5, 0, -2):\n    print(value)"
  },
  "BM13": {
    "prompt": "다음 코드에서 value에 저장될 수 있는 값의 범위는?",
    "code": "import random\n\nvalue = random.randrange(1, 7)"
  },
  "BM15": {
    "prompt": "다음 코드 실행 후 result에 저장되는 값은?",
    "code": "def rectangle_area(length=2, width=3):\n    return length * width\n\nresult = rectangle_area(width=5)"
  },
  "BM18": {
    "prompt": "stops의 원소 하나를 조회할 때, stops[인덱스]에 사용할 수 없는 인덱스는?",
    "code": "stops = [\"A\", \"B\", \"C\", \"D\", \"E\", \"F\"]"
  },
  "BM19": {
    "prompt": "다음 코드 실행 후 a의 내용과 길이는?",
    "code": "a = [1, 2]\na.append([3, 4])\n\nprint(a)\nprint(len(a))"
  },
  "BM20": {
    "prompt": "다음 코드가 출력하는 taken과 data의 값은?",
    "code": "data = [10, 20, 20, 30]\ndata.remove(20)\ntaken = data.pop(1)\n\nprint(taken)\nprint(data)"
  },
  "BM21": {
    "prompt": "다음 코드 실행 후 result와 scores의 상태는?",
    "code": "scores = [30, 10, 20]\nresult = scores.sort()\n\nprint(result)\nprint(scores)"
  },
  "BM23": {
    "prompt": "다음 코드의 마지막 줄이 출력하는 키 목록은?",
    "code": "d = {\"foo\": 1, \"bar\": 2}\nd[\"foo\"] = 9\nd[\"baz\"] = 3\n\nprint(list(d))"
  },
  "BM24": {
    "prompt": "새 키 baz를 추가한 뒤, keys_view와 keys_list 중 새 키를 포함하는 것은?",
    "code": "d = {\"foo\": 1, \"bar\": 2}\nkeys_view = d.keys()\nkeys_list = list(d.keys())\n\nd[\"baz\"] = 3"
  },
  "BM25": {
    "prompt": "다음 코드 실행 후 result의 값과 d의 상태는?",
    "code": "d = {\"one\": \"하나\"}\nresult = d.get(\"four\", \"없음\")\n\nprint(result)\nprint(d)"
  },
  "BM27": {
    "prompt": "같은 파일에서 read()를 두 번 호출했다. second에 저장되는 값은?",
    "code": "with open(\"sample.txt\", \"w\", encoding=\"utf-8\") as out:\n    out.write(\"A\\nB\\n\")\n\nwith open(\"sample.txt\", encoding=\"utf-8\") as f:\n    first = f.read()\n    second = f.read()"
  },
  "BM28": {
    "prompt": "아래 line에서 이름 앞뒤의 공백은 보존하고, 마지막 개행만 제거하는 식은?",
    "code": "line = \"  Alice  \\n\""
  },
  "BM29": {
    "prompt": "마지막 두 문장을 실행할 때, f.closed의 출력값과 f.read()의 결과는?",
    "code": "with open(\"sample.txt\", \"w\", encoding=\"utf-8\") as out:\n    out.write(\"A\")\n\nwith open(\"sample.txt\", encoding=\"utf-8\") as f:\n    text = f.read()\n\nprint(f.closed)\nf.read()"
  },
  "BM30": {
    "prompt": "다음 코드가 출력하는 문자열 길이와 바이트 길이는?",
    "code": "text = \"가\"\ndata = text.encode(\"utf-8\")\n\nprint(len(text))\nprint(len(data))"
  },
  "BM31": {
    "prompt": "다음 코드를 실행하고 파일을 닫은 뒤, sample.txt에 저장된 내용은?",
    "code": "with open(\"sample.txt\", \"w\", encoding=\"utf-8\") as f:\n    f.write(\"Hello\")\n    f.write(\"Python\")"
  },
  "BM32": {
    "prompt": "a[0]과 s[0]에 대입을 시도했다. 두 대입의 결과를 바르게 연결한 것은?",
    "code": "a = [1, 2]\ns = \"ab\"\n\na[0] = 9\ns[0] = \"z\""
  },
  "BM33": {
    "prompt": "다음 코드의 출력은?",
    "code": "value = 123.456\nprint(f\"{value:.2f}\")"
  },
  "BM34": {
    "prompt": "코드에 명시한 실행 조건에서 sample.txt를 찾는 기준 폴더는?",
    "code": "# 현재 작업 폴더: /course/data\n# 실행 중인 스크립트: /course/src/main.py\nwith open(\"sample.txt\", encoding=\"utf-8\") as f:\n    text = f.read()"
  },
  "BM38": {
    "prompt": "커널을 재시작한 뒤 아래 셀만 실행했다. 실행 결과는?",
    "code": "# 커널 재시작 후 실행하는 첫 셀\nprint(x)",
    "codeLabel": "Notebook · 커널 재시작 후 첫 셀"
  },
  "BM39": {
    "prompt": "다음 코드가 출력하는 두 리스트를 순서대로 고르시오.",
    "code": "a = {1, 2, 3}\nb = {3, 4}\n\nprint(sorted(a | b))\nprint(sorted(a & b))"
  },
  "BM41": {
    "prompt": "다음 코드가 출력하는 두 문자열 표현을 순서대로 고르시오.",
    "code": "print(repr(max(\"Hello world\")))\nprint(repr(min(\"Hello world\")))"
  },
  "BM42": {
    "prompt": "다음 코드의 출력은?",
    "code": "d = {\"foo\": 1, \"bar\": 2}\nprint(list(d.items()))"
  },
  "BM43": {
    "prompt": "다음 변환을 시도했을 때의 결과는?",
    "code": "value = int(\"20.5\")"
  },
  "BM44": {
    "prompt": "첫 번째 print의 결과와 두 번째 print를 평가할 때의 결과를 바르게 연결한 것은?",
    "code": "print(list(range(5, 0)))\nprint(list(range(1, 5, 0)))"
  },
  "BM47": {
    "prompt": "마지막 대입문을 실행했을 때의 결과는?",
    "code": "t = (23, \"abc\", 4.56, (2, 3), \"def\")\nt[2] = 3.14"
  },
  "BM49": {
    "prompt": "다음 코드가 출력하는 세 값을 순서대로 고르시오.",
    "code": "d = {\"one\": 0}\n\nprint(d.get(\"one\", 99))\nprint(d.get(\"four\", 99))\nprint(len(d))"
  },
  "BM50": {
    "prompt": "실행 전 log.txt는 빈 파일이다. 다음 코드를 실행한 뒤 파일의 최종 내용은?",
    "code": "for repeat in range(2):\n    with open(\"log.txt\", \"a\", encoding=\"utf-8\") as f:\n        f.write(\"RUN\\n\")"
  },
  "BS02": {
    "prompt": "다음 코드의 덧셈에서 발생하는 예외 이름을 쓰시오.",
    "code": "message = \"Hi\" + 3"
  },
  "BS03": {
    "prompt": "다음 나눗셈에서 발생하는 예외 이름을 쓰시오.",
    "code": "result = 10 / 0"
  },
  "BS04": {
    "prompt": "새 커널에서 아래 셀만 실행했다. 발생하는 예외 이름을 쓰시오.",
    "code": "print(score)",
    "codeLabel": "Notebook · 새 커널의 첫 셀"
  },
  "BS05": {
    "prompt": "입력값이 20일 때, value의 Python 자료형 이름을 쓰시오.",
    "code": "value = input(\"값: \")",
    "input": [
      "20"
    ]
  },
  "BS09": {
    "prompt": "함수 호출이 끝난 뒤 result에 저장되는 값을 쓰시오.",
    "code": "def show_value():\n    print(10)\n\nresult = show_value()"
  },
  "BS16": {
    "prompt": "value를 정수가 아닌 한 원소 튜플로 저장하려면, 1 바로 뒤에 어떤 기호 한 글자를 추가해야 하는지 쓰시오.",
    "code": "value = (1)"
  }
};
export function addCodeExamples(bank){
  for(const [id,example] of Object.entries(examples)){
    const question=bank.find(q=>q.id===id);
    if(!question)throw Error(`코드 예시 대상 누락: ${id}`);
    Object.assign(question,{codeLabel:'제시 코드 · Python'},example);
  }
}
export const exampleIds=Object.keys(examples);
