"""Exact reviewed MC/short corrections and removals, with frozen execution evidence."""
import copy,json
from pathlib import Path
from functools import lru_cache
ROOT=Path(__file__).resolve().parent.parent
@lru_cache(maxsize=1)
def noncode_review():return json.loads((ROOT/'practice-source/noncode-review.json').read_text())
@lru_cache(maxsize=1)
def before_noncode():return json.loads((ROOT/'previous/before-noncode-audit-2026-10-25/practice-source/questions.json').read_text())
def expected_noncode():
 r=noncode_review();old=before_noncode();result=copy.deepcopy(old);by={q['id']:q for q in old['bank']};changes={c['id']:c for c in r['changes']};retired={c['id']for c in r['retired']}
 for c in [*r['changes'],*r['retired']]:assert by[c['id']]==c['before']and c['before']['type']!='code','stale noncode audit '+c['id']
 result['bank']=[copy.deepcopy(changes[q['id']]['after'])if q['id']in changes else q for q in result['bank']if q['id']not in retired]+[copy.deepcopy(x['question'])for x in r['added']]
 result['counts']={t:r['expected'][t]for t in ['code','short','mc']};result['revision']=r['id'];result['noncodeReview']=copy.deepcopy(r)
 for id in retired:result['detailedSolutions'].pop(id)
 for c in r['detailedChanges']:
  assert c['before']==old['detailedSolutions'].get(c['id']),'stale detailed noncode review '+c['id']
  result['detailedSolutions'][c['id']]=copy.deepcopy(c['after'])
 return result
def validate_noncode(data):
 if 'noncodeReview'not in data:return data.get('revision')!=noncode_review()['id']
 return data==expected_noncode()
def restore_before_noncode(data):
 if 'noncodeReview'not in data:return data
 assert validate_noncode(data),'unreviewed MC/short audit change'
 return copy.deepcopy(before_noncode())
