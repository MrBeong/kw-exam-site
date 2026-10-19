"""Check answer/scoring compatibility and source/mock synchronization after option edits.

Length ratios are review prompts, not a psychometric measure of difficulty.
Run from any directory: python3 final-audit/verify_distractors.py [exam-root]
"""
from pathlib import Path
import json, re, statistics, sys

E = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent
A = E / 'final-audit'
B = {b: json.loads((E / b / 'questions.json').read_text()) for b in ['multiple-choice', 'mock-exam']}
baseline = json.loads((A / 'distractor-baseline.json').read_text())
delta = json.loads((A / 'distractor-changes.json').read_text())
revisions = json.loads((A / 'handcalc-compatibility.json').read_text()) if (A / 'handcalc-compatibility.json').exists() else {}
essay_revisions = {t['id']:t for t in json.loads((A/'essay-revision.json').read_text())['mockChanges']}
detail_revisions = {t['id']: t for t in json.loads((A/'detail-recall-mock-changes.json').read_text())}
r_line_revisions={t['id']:t for t in json.loads((A/'r-line-revision.json').read_text())['mockChanges']}
checks, failures, length_flags = [], [], []

def check(ok, label):
    (checks if ok else failures).append(label)

def length(s):
    s = re.sub(r'\\(?:mathrm|text|operatorname)\{([^}]+)\}', r'\1', s)
    s = re.sub(r'\\(?:left|right|,|!|;|\(|\))', '', s)
    s = re.sub(r'\\[A-Za-z]+', 'x', s)
    return len(re.sub(r'[\s{}]', '', s))

for bank, qs in B.items():
    check([q['id'] for q in qs] == [q['id'] for q in baseline[bank]], bank + ' stable question inventory/order')
    for q, before in zip(qs, baseline[bank]):
        for key, value in before.items():
            if q.get('questionRevision') == 'hand-calc-2026-10-18' and q['id'] in revisions:
                value = revisions[q['id']]['after'].get(key)
                if key in ['options', 'statements']:
                    value = [{'id': o['id'], 'correct': o['correct']} for o in value]
            if q.get('detailRevision') and q['id'] in detail_revisions:
                value = detail_revisions[q['id']]['after'].get(key)
            if q['id'] in essay_revisions:
                value = essay_revisions[q['id']]['after'].get(key)
            if q['id'] in r_line_revisions:
                value=r_line_revisions[q['id']]['after'].get(key)
            actual = q.get(key)
            if key in ['options', 'statements']:
                actual = [{'id': o['id'], 'correct': o['correct']} for o in actual]
            check(actual == value, q['id'] + ' stable ' + key)
        for o in q.get('options', []) + q.get('statements', []):
            check(bool(o['text'].strip()) and len(o.get('explanation', '').strip()) >= 8, q['id'] + '/' + o['id'] + ' statement and rationale')
        if q.get('options'):
            ts = [length(o['text']) for o in q['options'] if o['correct']]
            fs = [length(o['text']) for o in q['options'] if not o['correct']]
            ratio = statistics.mean(ts) / statistics.mean(fs)
            if min(ts + fs) >= 15 and not .67 <= ratio <= 1.5:
                length_flags.append({'bank': bank, 'id': q['id'], 'correctToIncorrectMean': round(ratio, 3)})
            check(len({o['text'] for o in q['options']}) == len(q['options']), q['id'] + ' distinct options')
        if bank == 'mock-exam' and q.get('options'):
            check([int(i) for i in re.findall(r'\d+', q['answer'])] == [i for i, o in enumerate(q['options'], 1) if o['correct']], q['id'] + ' printed answer matches preserved option order')

sources = {q['id']: q for q in B['multiple-choice']}
for q in B['mock-exam']:
    if q.get('originId') in sources:
        src = sources[q['originId']]
        check(not q['variant'], q['id'] + ' objective source is not a numeric variant')
        check({o['id']: o for o in q['options']} == {o['id']: o for o in src['options']}, q['id'] + ' all four options/rationales match source')
        check(q['prompt'] == src['stem'], q['id'] + ' question conditions match source')
        if src.get('optionRevision'):
            check(q.get('optionRevision') == src['optionRevision'], q['id'] + ' revision synchronized')
            check(q['explanation'] == [src['explanation']] and q['commonMistakes'] == src['commonMistakes'], q['id'] + ' full solution synchronized')

for bank, key in [('multiple-choice', 'sourceChanged'), ('mock-exam', 'mockChanged')]:
    check([q['id'] for q in B[bank] if q.get('optionRevision')] == delta[key], bank + ' revision manifest complete')
for id, forbidden in {
    'MC076': ['23명은 반응시간 단위'],
    'MC049': ['최소 14개'],
    'MC086': ['혈압'],
}.items():
    for phrase in forbidden:
        check(phrase not in json.dumps(sources[id], ensure_ascii=False), id + ' removed misleading distractor: ' + phrase)
check('ID}>0' in sources['MC067']['stem'], 'MC067 explicit positive ID comparison condition')
check(not length_flags, 'no substantive mean-length outliers in either direction')

result = {'status': 'fail' if failures else 'pass', 'checksPassed': len(checks), 'failures': failures,
          'reviewed': delta['reviewed'], 'sourceRevised': len(delta['sourceChanged']), 'mockRevised': len(delta['mockChanged']),
          'lengthFlags': length_flags,
          'limitations': 'Length is a review heuristic. Plausibility, unique answers, and curriculum fit require content review; no student-response difficulty estimates are claimed.'}
print(json.dumps(result, ensure_ascii=False))
sys.exit(bool(failures))
