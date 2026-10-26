// BIG-023의 강조점 중 기존 문제의 직접 평가가 약했던 부분만 추가한다.
// 정답의 기준은 BIG-019 슬라이드 문법이다. 구두 lstrip/다음 차시 try/except는 출제하지 않는다.
export const fileQuestionFixtures={
  'bytes_left.txt':'ABC',
  'bytes_same.txt':'ABC',
  'bytes_right.txt':'ABD',
  'hours_pair.txt':'1 Susan 1.5 2.5\n2 Brad 2.0 3.0\n'
};
export const fileAssessmentId='2026-10-22-file-assessment-1';
export function addFileTranscriptQuestions(bank,data){
  const concepts=Object.fromEntries(data.sections.flatMap(s=>s.items).map(c=>[c.key,c]));
  const added=[];
  function add(type,id,keys,pages,lines,prompt,body){
    if(bank.some(q=>q.id===id))throw Error('Duplicate '+id);
    const q={id,type,keys,conceptIds:keys.map(k=>concepts[k].id),section:'files',prompt,source:'BIG-019',pages,
      priority:true,scope:'slides',level:type==='short'?'기본':'적용',
      codeLabel:'Python · 강의자료 기반 문제',
      original:'강의자료의 문법·동작을 바탕으로 구성한 예상문제. 원문 그대로의 기출이나 교수 정답표가 아니다.',
      files:[],...body,assessmentOrigin:{revision:fileAssessmentId,transcript:'BIG-023',lines}};
    bank.push(q);added.push(id);return q;
  }
  function mask(code,spec){
    const rows=code.split('\n'),blanks=spec.map(([line,answer,why],i)=>{
      const start=rows[line-1].indexOf(answer);if(start<0)throw Error('Missing blank '+line+' '+answer);
      return {line,start,end:start+answer.length,answer,why,number:i+1};
    });
    for(const b of [...blanks].reverse())rows[b.line-1]=rows[b.line-1].slice(0,b.start)+`⟦${b.number}⟧`+rows[b.line-1].slice(b.end);
    const template=rows.join('\n');if(template.replace(/⟦(\d+)⟧/g,(_,n)=>blanks[+n-1].answer)!==code)throw Error('Restore mismatch');
    return {code,template,blanks};
  }
  function code(id,keys,pages,lines,prompt,source,spec,goal,output,steps,more={}){
    return add('code',id,keys,pages,lines,prompt,{...mask(source,spec),goal,output,steps,input:[],written:{},...more});
  }
  code('BFC01',['read','file-position','slice','newline'],[11,13,14],[17,19,23,25],
    '파일에서 읽은 문자열의 앞 20문자를 확인하도록 빈칸을 완성하시오.',
`with open("phones.txt", encoding="utf-8") as infile:
    text = infile.read()
    print(repr(text[:20]))
    print(repr(infile.read()))`,
    [[2,'read','현재 위치부터 파일 끝까지 읽어 하나의 str을 text에 저장한다.'],
     [3,'text[:20]','파일 객체를 다시 읽는 것이 아니라 저장된 문자열의 인덱스0~19를 고른다. 개행도 한 문자다.']],
    '파일 전체를 text에 저장하고 그 앞 20문자를 repr로 표시한다. 이어서 같은 파일 객체에서 남은 내용을 읽어 repr로 표시한다.',
    "'홍길동 010-1234-5678\\n김철'\n''\n",
    [[1,'기본 r 모드와 UTF-8 인코딩으로 phones.txt를 연다.'],[2,'read()가 끝까지 소비하므로 파일 위치는 EOF가 된다.'],[3,'text[:20]은 메모리의 문자열 슬라이스다. repr는 포함된 개행을 보이게 표시하며 파일 위치를 바꾸지 않는다.'],[4,'파일 위치가 그대로 EOF이므로 read()는 빈 문자열을 반환한다.']],
    {files:['phones.txt'],conditions:['제시한 phones.txt를 처음부터 읽는다. 파일 읽기는 정상적으로 완료된다.']});
  code('BFC02',['read','file-position'],[13,15,16],[19,21,25,27,89],
    '첫 줄·남은 줄 목록·파일 끝을 차례로 읽도록 빈칸을 완성하시오.',
`with open("phones.txt", encoding="utf-8") as infile:
    first = infile.readline()
    remaining = infile.readlines()
    end = infile.read()
print(repr(first))
print(remaining)
print(repr(end))`,
    [[2,'readline','다음 한 줄을 개행을 포함한 str로 받는다.'],[3,'readlines','첫 줄 뒤부터 남은 두 줄을 문자열 리스트로 받는다.'],[4,'read','남은 줄을 이미 모두 소비한 EOF에서 빈 str을 받는다.']],
    'first에는 첫 줄 하나, remaining에는 나머지 줄의 리스트, end에는 마지막 읽기의 결과를 저장해 차례로 출력한다.',
    "'홍길동 010-1234-5678\\n'\n['김철수 010-1234-5679\\n', '김영희 010-1234-5680\\n']\n''\n",
    [[1,'새로 연 파일의 읽기 위치는 처음이다.'],[2,'첫 번째 줄을 읽어 그 다음 줄로 위치를 옮긴다.'],[3,'현재 위치의 남은 두 줄만 리스트에 담고 EOF까지 이동한다. 첫 줄을 다시 포함하지 않는다.'],[4,'EOF의 read()는 빈 문자열이다. 빈 리스트나 None이 아니다.'],[5,'repr로 첫 줄 끝 개행을 확인한다.'],[6,'remaining은 길이2의 list이며 각 원소에 개행이 남아 있다.'],[7,'end의 repr 표시는 두 작은따옴표다.']],
    {files:['phones.txt'],conditions:['세 메서드는 같은 파일 객체에서 제시된 순서대로 호출한다. 중간에 파일을 다시 열지 않는다.','4행은 현재 위치부터 끝까지의 내용을 하나의 문자열로 읽는 메서드를 사용한다.']});
  code('BFC03',['file-position','read'],[11,12,48,49],[17,89,91],
    '내용을 다 읽은 뒤 파일 처음의 두 문자를 다시 읽도록 빈칸을 완성하시오.',
`with open("letters.txt", encoding="utf-8") as f:
    text = f.read()
    f.seek(0)
    first = f.read(2)
print(repr(first))`,
    [[3,'seek','열린 파일 객체의 읽기 위치를 다시 지정한다. 문자열 슬라이스로 파일 위치를 바꾸지는 못한다.'],[3,'0','처음부터 다시 읽기 위해 지정할 위치다.']],
    '파일 전체를 읽은 뒤 같은 파일 객체를 처음으로 이동시켜 두 문자를 읽고 repr로 표시한다. 파일을 다시 여는 줄은 추가하지 않는다.',
    "'A\\n'\n",
    [[1,'letters.txt를 읽기 모드로 연다.'],[2,'전체 문자열은 text에 남고 파일 위치는 EOF에 도달한다.'],[3,'seek(0)으로 파일의 처음에 돌아간다. text 자체를 변경하는 호출이 아니다.'],[4,'처음의 A와 개행 두 문자를 str로 받는다.'],[5,'repr는 개행을 \\n으로 표시한다.']],
    {files:['letters.txt'],conditions:['letters.txt의 마지막 줄 개행도 파일에 포함된다. 같은 파일 객체 f를 계속 사용한다.']});
  code('BFC04',['hours','for','accumulate'],[24,25,26],[47,49,51,59,61],
    '각 사람의 시간만 합산하도록 빈칸에 들어갈 초기값을 쓰시오.',
`with open("hours.txt", encoding="utf-8") as infile:
    for line in infile:
        fields = line.split()
        name = fields[1]
        total = 0.0
        for text in fields[2:]:
            total += float(text)
        print(name, f"{total:.1f}")`,
    [[5,'0.0','바깥 반복이 다음 사람으로 넘어갈 때마다 합계를 실수0.0부터 다시 시작한다. 앞사람의 합계를 이어받지 않는다.']],
    '제시한 hours.txt의 ID와 이름은 합산에서 제외하고 사람별 소수 시간만 더해 소수점 첫째 자리까지 출력한다. 초기값은 슬라이드의 실수 리터럴 표기로 작성한다.',
    'Susan 31.4\nBrad 36.8\nJenn 39.5\n',
    [[1,'UTF-8 텍스트 파일을 읽는다.'],[2,'사람 한 명의 기록 한 줄씩 처리한다.'],[3,'공백을 구분자로 사용한다. 소수점은 시간 문자열 안에 남는다.'],[4,'두 번째 필드가 이름이다.'],[5,'사람이 바뀔 때마다 total을 다시 초기화한다.'],[6,'ID와 이름을 제외한 모든 시간 항목을 순회한다.'],[7,'각 시간 문자열을 float로 바꾼 뒤 그 사람의 total에 누적한다.'],[8,'현재 사람의 합계를 소수점 한 자리로 표시한다. 입력 파일을 수정하지 않는다.']],
    {files:['hours.txt'],codeLabel:'Python · 교안 p.26 코드 빈칸',original:'BIG-019 p.26 코드에서 사람별 초기값만 가린 문항. 입력/계산 결과는 교안과 동일하다.'});
  code('BFC05',['binary-copy','persist','read'],[42,43],[73,75,79,81],
    '두 파일의 바이트 내용이 같은지 확인하도록 빈칸을 완성하시오.',
`with open("bytes_left.txt", "rb") as f:
    original = f.read()
with open("bytes_same.txt", "rb") as f:
    copied = f.read()
print("바이트 일치:", original == copied)
print("원본 크기:", len(original))
print("복사본 크기:", len(copied))`,
    [[3,'"rb"','문자 해석이나 개행 변환 없이 bytes를 읽는 이진 읽기 모드다.'],[4,'read','파일의 모든 바이트를 읽어 copied에 저장한다.'],[5,'==','길이가 아니라 전체 bytes 내용의 동등성을 비교한다. is는 객체의 동일성을 검사하므로 이 목적과 다르다.']],
    '두 파일을 이진 모드로 읽어 바이트 내용의 일치 여부와 각각의 바이트 수를 출력한다. 파일을 변경하지 않는다.',
    '바이트 일치: True\n원본 크기: 3\n복사본 크기: 3\n',
    [[1,'첫 파일을 이진 읽기 모드로 연다. 이 모드에는 encoding을 지정하지 않는다.'],[2,'original은 길이3의 bytes다.'],[3,'비교할 두 번째 파일도 같은 이진 모드로 연다.'],[4,'두 번째 파일의 전체 bytes를 copied에 저장한다.'],[5,'==는 길이뿐 아니라 바이트의 값과 순서가 모두 같은지 확인한다.'],[6,'len(original)은 문자 수가 아니라 읽은 바이트 수다.'],[7,'두 번째 파일의 바이트 수도 따로 확인한다. 같은 크기라는 사실만으로 내용 일치를 증명할 수는 없다.']],
    {files:['bytes_left.txt','bytes_same.txt'],conditions:['두 파일은 문제용 비교 자료다. 각각 ASCII 문자 ABC만 저장되어 있으며 BOM과 마지막 줄 개행이 없다.']});

  add('short','BFS01',['close','read'],[14,19,20],[23,35,37,39],
    'with 블록을 벗어난 뒤에도 남아 있는 text의 자료형 이름을 쓰시오.',{
      files:['phones.txt'],conditions:['파일 읽기는 정상 완료된다. Python의 자료형 이름만 답한다.'],
      code:`with open("phones.txt", encoding="utf-8") as infile:
    text = infile.read()
print(text[:3])`,answer:'str',
      explain:'정답은 str이다. read()가 만든 문자열은 text가 참조한다. with 종료 시 닫히는 것은 파일이며 text 변수나 저장된 문자열이 삭제되지 않는다. 세 번째 줄은 홍길동을 정상 출력한다. 이 위치에서 infile.read()를 호출하는 상황과 구별한다.',
      steps:[[1,'파일을 열고 infile로 파일 객체를 참조한다.'],[2,'파일 전체를 하나의 str로 읽어 text에 저장한다.'],[3,'블록 밖에서 메모리의 text를 슬라이스해 출력하므로 정상 동작한다.']]});
  add('short','BFS02',['file-position','read'],[11,12,15],[15,17,25,89],
    '네 번째 readline()이 빈 문자열을 반환한 상태를 가리키는 영문 약어를 쓰시오.',{
      files:['blank.txt'],conditions:['제시된 blank.txt의 둘째 줄은 빈 줄이며 마지막 줄에도 개행이 있다. 메서드는 같은 객체에서 순서대로 호출한다.'],
      code:`with open("blank.txt", encoding="utf-8") as f:
    first = f.readline()
    second = f.readline()
    third = f.readline()
    fourth = f.readline()
print(repr(second))
print(repr(fourth))`,answer:'EOF',
      explain:'정답은 EOF(End Of File)다. 둘째 줄은 빈 줄이어도 개행 문자 하나를 가진 실제 데이터이므로 second는 "\\n"이다. 세 줄을 소비한 뒤의 fourth는 더 읽을 데이터가 없어 ""이다. 빈 줄과 파일 끝을 구분하며, EOF 문자가 모든 파일에 별도로 저장된다는 의미는 아니다.',
      steps:[[1,'파일 처음에서 읽기를 시작한다.'],[2,'A와 개행을 읽는다.'],[3,'빈 줄의 개행 한 문자를 읽는다.'],[4,'B와 마지막 개행을 읽고 파일 끝에 도달한다.'],[5,'EOF에서는 빈 문자열을 반환한다.'],[6,'빈 줄의 repr는 개행을 표시한다.'],[7,'EOF 결과의 repr는 빈 문자열을 표시한다.']]});
  add('short','BFS03',['open','file-errors'],[10,29],[11,61,63,67],
    '다음 코드가 파일을 열 때 발생하는 예외 클래스 이름을 쓰시오.',{
      files:['phones.txt'],conditions:['제시한 phones.txt가 이미 존재한다. 파일 경로와 접근 권한에는 문제가 없다.'],
      code:`with open("phones.txt", "x", encoding="utf-8") as out:
    out.write("NEW\\n")`,answer:'FileExistsError',
      explain:'정답은 FileExistsError다. x는 새 파일 전용 생성 모드이므로 같은 경로의 파일이 이미 있으면 열기 단계에서 실패한다. 두 번째 줄의 write는 실행되지 않으며 기존 phones.txt는 유지된다. r의 FileNotFoundError나 w의 기존 내용 비우기와 구별한다.',
      steps:[[1,'x 모드의 open이 기존 파일을 발견하면 즉시 FileExistsError를 발생시킨다. out에 새 파일 객체가 할당되어 블록에 진입한 상태가 아니다.'],[2,'파일 열기가 실패했으므로 이 문장은 실행되지 않는다.']]});

  add('mc','BFM01',['binary-copy','read','while'],[38,39,40,41],[75,77,79,81],
    '반복이 끝날 때까지 read(1024)와 dst.write(block)는 각각 몇 번 호출되는가?',{
      conditions:['sample.bin은 정확히 2500바이트인 일반 파일이다. sample_copy.bin은 존재하지 않으며 읽기·쓰기는 정상 완료된다. EOF를 확인하는 마지막 읽기도 호출 횟수에 포함한다.'],
      code:`with open("sample.bin", "rb") as src:
    with open("sample_copy.bin", "xb") as dst:
        while True:
            block = src.read(1024)
            if not block:
                break
            dst.write(block)`,
      options:['3회 / 3회','3회 / 2회','4회 / 3회','4회 / 4회'],correct:2,
      reasons:['데이터 블록은3개지만 종료 조건을 확인하는 네 번째 read 호출이 추가된다.','452바이트인 마지막 데이터 블록도 실제로 읽고 기록하며 EOF 확인 읽기도 필요하다.','1024·1024·452바이트를 읽어 세 번 기록하고, 네 번째 read의 b""에서 break한다.','네 번째 읽기의 빈 bytes는 if not block에서 걸려 write에 전달되지 않는다.'],
      explain:'read(1024)는 한 번에 최대1024바이트를 읽는다는 뜻이다. 반복 횟수가1024회라는 뜻도, 파일 전체 크기의 한계라는 뜻도 아니다.',
      steps:[[1,'이진 원본을 처음부터 읽는다.'],[2,'존재하지 않는 출력 파일을 이진 새 파일 전용 모드로 연다.'],[3,'EOF를 확인할 때까지 반복한다.'],[4,'연속한 네 호출의 반환 길이는1024,1024,452,0이다.'],[5,'길이0의 bytes는 거짓이다.'],[6,'빈 블록일 때 즉시 반복을 끝낸다.'],[7,'데이터가 있는 앞의 세 블록만 기록한다.']]});
  add('mc','BFM02',['newline','string'],[14,18],[23,25,31,33],
    '두 print 문장의 출력을 순서대로 나타낸 것은?',{
      conditions:['보기의 /는 첫 번째와 두 번째 출력 줄을 구분한다. 코드의 \\t와 \\n은 각각 탭과 개행 문자다.'],
      code:`line = "\\t,A,\\n"
shown = repr(line)
trimmed = line.strip()
print(repr(trimmed))
print(repr(line))`,
      options:["'A' / '\\t,A,\\n'","',A,' / '\\t,A,\\n'","',A,' / ',A,'","',A,\\n' / '\\t,A,\\n'"],correct:1,
      reasons:['기본 strip은 공백류를 제거한다. 쉼표는 공백류가 아니므로 A 양쪽의 쉼표가 남는다.','strip은 탭과 끝 개행을 제거한 새 문자열을 반환한다. repr와 strip 호출은 원래 line에 재대입하지 않으므로 line은 그대로다.','trimmed를 별도로 저장했으며 line에 대입하지 않았다. 원래 문자열까지 변경된 것으로 읽은 선택이다.','strip은 양끝의 공백류를 제거하므로 오른쪽 개행도 제거된다. 왼쪽만 제거한 결과가 아니다.'],
      steps:[[1,'line에는 앞 탭·가운데 쉼표와 A·끝 개행이 저장된다.'],[2,'repr의 표시 문자열을 shown에 저장한다. line의 내용은 변경되지 않는다.'],[3,'양끝 공백류를 제거한 새 str을 trimmed에 저장한다. 쉼표는 남는다.'],[4,'정리된 문자열을 repr로 표시한다.'],[5,'원래 line의 탭과 개행은 계속 남아 있음을 repr로 표시한다.']]});
  add('mc','BFM03',['hours','accumulate','for'],[24,25,26],[47,49,59,61],
    '다음 코드를 그대로 실행할 때 두 번째 사람의 출력 줄은?',{
      files:['hours_pair.txt'],conditions:['hours_pair.txt는 이 문항을 위해 수치를 단순화한 두 줄 입력이다. 제시된 초기화 위치를 포함해 코드를 그대로 실행한다.'],
      code:`total = 0.0
with open("hours_pair.txt", encoding="utf-8") as infile:
    for line in infile:
        fields = line.split()
        name = fields[1]
        for text in fields[2:]:
            total += float(text)
        print(name, f"{total:.1f}")`,
      options:['Brad 9.0','Brad 5.0','Brad 4.0','Brad 7.0'],correct:0,
      reasons:['Susan의4.0이 total에 남은 상태에서 Brad의2.0과3.0을 더하므로9.0이다.','사람별 합계라면5.0이지만 그 결과를 내려면 total 초기화를 바깥 사람 반복 안에서 매번 해야 한다.','4.0은 첫 사람의 합계다. 두 번째 사람의 시간도 for문에서 실제로 더한다.','앞사람의4.0에 마지막3.0만 더한 값이다. fields[2:]에는2.0과3.0이 모두 들어간다.'],
      explain:'교안 p.26은 total = 0.0을 사람 반복 안에 둔다. 이 문항은 그 위치를 밖으로 옮긴 변형이므로 교안의 정상 결과를 그대로 답하면 안 된다.',
      steps:[[1,'프로그램 전체에서 한 번만 total을0.0으로 만든다.'],[2,'두 사람의 기록이 있는 파일을 연다.'],[3,'첫 줄 다음 둘째 줄로 반복한다.'],[4,'공백으로 ID·이름·시간 문자열을 나눈다.'],[5,'현재 사람의 이름을 선택한다.'],[6,'해당 사람의 두 시간 항목을 순회한다.'],[7,'float로 바꿔 같은 total에 계속 더한다. 둘째 사람 전에 초기화하는 문장이 없다.'],[8,'첫 줄 Susan4.0, 둘째 줄 Brad9.0을 각각 소수점 한 자리로 출력한다.']]});
  add('mc','BFM04',['binary-copy','persist'],[42,43],[79,81],
    '두 print 문장의 출력값을 순서대로 연결한 것은?',{
      files:['bytes_left.txt','bytes_right.txt'],conditions:['두 준비 파일은 각각 ASCII 문자3개만 포함한다. BOM과 마지막 줄 개행은 없다.'],
      code:`with open("bytes_left.txt", "rb") as f:
    original = f.read()
with open("bytes_right.txt", "rb") as f:
    copied = f.read()
print(len(original) == len(copied))
print(original == copied)`,
      options:['True / True','False / False','False / True','True / False'],correct:3,
      reasons:['크기는 둘 다3바이트지만 마지막 바이트 C와 D가 다르다. 크기 같음을 내용 같음으로 확장했다.','길이는3과3으로 같다. 내용 비교가 거짓이라는 사실을 길이 비교에도 잘못 적용했다.','길이 비교와 내용 비교를 반대로 읽었다. 첫 비교는 참, 둘째 비교는 거짓이다.','len은 각각3이어서 첫 출력은True다. 전체 bytes는 b"ABC"와 b"ABD"로 달라 두 번째 출력은False다.'],
      steps:[[1,'첫 파일을 이진 읽기로 연다.'],[2,'original에 b"ABC"가 저장된다.'],[3,'비교할 둘째 파일을 이진 읽기로 연다.'],[4,'copied에 b"ABD"가 저장된다.'],[5,'두 bytes의 길이를 비교하면3 == 3이므로 True다.'],[6,'바이트의 값과 순서를 비교하면 마지막 값이 달라 False다. 크기 확인만으로 복사 성공을 판정하지 않는다.']]});
  return {id:fileAssessmentId,addedIds:added,scope:'BIG-019 강의자료 범위 내 보완. BIG-023은 강조점 근거이며 새 공식 범위 공지가 아니다.'};
}
