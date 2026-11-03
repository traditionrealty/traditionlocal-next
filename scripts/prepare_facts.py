"""Adds verified business facts (street address, ZIP, phone, weekly hours) to src/data/businesses.json.
Source: data/raw/business-facts.csv. Only businesses listed there are changed, and only with facts that were verified."""
import csv, json
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
path = ROOT / 'src' / 'data' / 'businesses.json'
businesses = json.load(open(path, encoding='utf-8'))
by_slug = {b['slug']: b for b in businesses}
DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
n = 0
for r in csv.DictReader(open(ROOT / 'data' / 'raw' / 'business-facts.csv', encoding='utf-8-sig')):
    b = by_slug.get(r['slug'])
    if not b:
        continue
    if r['address']:
        b['address'] = r['address']
    if r['zip']:
        b['zip'] = r['zip']
    if r['phone']:
        b['phone'] = r['phone']
    hours = [r['hours_' + d] for d in DAYS]
    b['hours'] = hours if any(hours) else None
    b['factsVerified'] = r['verified']
    n += 1
json.dump(businesses, open(path, 'w', encoding='utf-8'), ensure_ascii=False)
print('business facts applied:', n)
