"""Builds src/data/things.json (places to visit: parks, museums, murals, landmarks) from data/raw/things-to-do.csv.
Only rows marked publish = Yes are included. Set THINGS_PREVIEW=1 to include Hold rows when previewing locally."""
import csv, json, os, re
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
rows = list(csv.DictReader(open(ROOT / 'data' / 'raw' / 'things-to-do.csv', encoding='utf-8-sig')))
preview = os.environ.get('THINGS_PREVIEW') == '1'
TYPES = {'park': 'Parks and nature', 'museum': 'Museums', 'attraction': 'Landmarks and sites', 'arts': 'Public art and arts', 'family': 'Family fun',
         'trail': 'Trails', 'activity': 'Activities', 'market': 'Markets', 'other': 'More to see'}
out = []
for r in rows:
    if r['publish'] != 'Yes' and not preview:
        continue
    out.append({
        'id': r['thing_id'], 'slug': r['slug'], 'name': r['name'], 'type': r['type'], 'typeLabel': TYPES.get(r['type'], r['type'].title()),
        'area': r['area_slug'], 'areaName': r['area_name'], 'address': r['address'], 'city': r['city'], 'state': r['state'], 'zip': r['zip'],
        'county': r['county'], 'website': r['website'], 'status': r['status'], 'kind': r['original_type'],
        'note': r['status_note'] if r['status'] != 'open' else '', 'verified': r['last_verified'],
    })
# New or split places (rice, upper-kirby...) may not have their own page yet. Attach them to the combined area page that
# contains the name, so the link still works until the split pages exist.
site_areas = [a['slug'] for a in json.load(open(ROOT / 'src' / 'data' / 'areas.json'))]
for t in out:
    if t['area'] and t['area'] not in site_areas:
        hit = [s for s in site_areas if re.search(r'(^|-)' + re.escape(t['area']) + r'(-|$)', s)]
        t['area'] = hit[0] if hit else ''
out.sort(key=lambda t: t['name'].lower())
(ROOT / 'src' / 'data' / 'things.json').write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding='utf-8')
print('things to do', len(out), '| linked to an area:', sum(1 for t in out if t['area']))
