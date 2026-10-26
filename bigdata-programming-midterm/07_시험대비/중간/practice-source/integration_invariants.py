"""Exact post-integration corrections; no unrelated question or answer may change."""
import copy,json
from noncode_invariants import restore_before_noncode
from functools import lru_cache
from pathlib import Path
ROOT=Path(__file__).resolve().parent.parent
@lru_cache(maxsize=1)
def integration_review():return json.loads((ROOT/'practice-source/integration-review.json').read_text())
@lru_cache(maxsize=1)
def before_integration():return json.loads((ROOT/'previous/before-post-integration-audit-2026-10-25/practice-source/questions.json').read_text())
def integration_display(display):
 r=integration_review();result=copy.deepcopy(display)
 if result.get('revision')!=r['baselineRevision']:return result
 for c in r['displayChanges']:
  assert result['questions'][c['id']]==c['before'],'stale integration display '+c['id']
  result['questions'][c['id']]=copy.deepcopy(c['after'])
 result.update(copy.deepcopy(r['afterDisplayMetadata']));return result
def before_integration_display(display):
 r=integration_review()
 if display.get('revision')!=r['id']:return display
 result=copy.deepcopy(display)
 for c in r['displayChanges']:
  assert result['questions'][c['id']]==c['after'],'unreviewed integration display '+c['id']
  result['questions'][c['id']]=copy.deepcopy(c['before'])
 result.update(copy.deepcopy(r['beforeDisplayMetadata']));return result
def expected_integration():
 old=before_integration();r=integration_review();result=copy.deepcopy(old);changes={c['id']:c for c in r['questionChanges']}
 for c in changes.values():
  assert next(q for q in old['bank']if q['id']==c['id'])==c['before'],'stale integration before '+c['id']
  assert c['before']['code']==c['after']['code']and not c['before'].get('originalBlank'),'source code or original changed'
 result['bank']=[copy.deepcopy(changes[q['id']]['after'])if q['id']in changes else q for q in result['bank']]
 result['revision']=r['id'];result['integrationReview']=copy.deepcopy(r);result['questionDisplay']=integration_display(result['questionDisplay'])
 return result
def validate_integration(data):
 try:data=restore_before_noncode(data)
 except AssertionError:return False
 if 'integrationReview'not in data:return data.get('revision')!=integration_review()['id']
 return data==expected_integration()
def restore_before_integration(data):
 data=restore_before_noncode(data)
 if 'integrationReview'not in data:return data
 assert validate_integration(data),'unreviewed post-integration change'
 return copy.deepcopy(before_integration())
