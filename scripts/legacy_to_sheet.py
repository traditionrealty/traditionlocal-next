#!/usr/bin/env python3
"""Reshape the old Tradition Local site data into the columns of the Simple Master sheet.

Usage: python legacy_to_sheet.py <old-repo-folder> <output-folder>
The old repo must already have run its own data step (python scripts/prepare_data.py),
which writes src/data/*.json. This script only reads those files and the CSV sources in data/raw.
Output: legacy/profiles.csv and legacy/content.csv, with the same headers as the sheet.
"""
import csv, html, json, re, sys
from pathlib import Path

OLD = Path(sys.argv[1]); OUT = Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
D = OLD / 'src' / 'data'; RAW = OLD / 'data' / 'raw'
SRC = 'Live site repo, workbook v.10.3.26'
NOTE = 'Imported from the live site. Facts need review.'

PROFILE_HEADERS = ['Name', 'Profile type', 'Area', 'Summary', 'Page', 'Related', 'Full description', 'Business status', 'Address', 'Website', 'Phone',
    'Postal city', 'Hero image', 'Gallery', 'Video', 'Image alt text', 'Media credit', 'Media rights', 'Media notes', 'Media section', 'FAQs', 'FAQ section',
    'Typical homes', 'Local take', 'Living section', 'Reviews section', 'Nearby section', 'Events section', 'Newsletter section', 'Editor notes', 'Source',
    'Record ID', 'Slug', 'Example']
CONTENT_HEADERS = ['Title', 'Content type', 'Profile', 'Summary', 'Page', 'Related', 'Body', 'Author', 'Original review date', 'Rating', 'Hero image', 'Gallery',
    'Video', 'Image alt text', 'Media credit', 'Media rights', 'Media notes', 'Media section', 'Starts', 'Ends', 'Time zone', 'Event link', 'FAQs', 'FAQ section',
    'Editor notes', 'Source', 'Record ID', 'Slug', 'Example']

def load(name, default=None):
    p = D / name
    return json.loads(p.read_text()) if p.exists() else (default if default is not None else [])
def csv_rows(name):
    p = RAW / name
    return list(csv.DictReader(p.open(encoding='utf-8'))) if p.exists() else []
def s(v): return '' if v is None else str(v).strip()
def mdy(iso):
    m = re.match(r'(\d{4})-(\d{2})-(\d{2})', s(iso)); return f'{int(m.group(2))}/{int(m.group(3))}/{m.group(1)}' if m else s(iso)
def text_of(h):
    h = re.sub(r'(?i)<br\s*/?>|</p>|</li>|</h\d>', '\n\n', s(h)); h = re.sub(r'<[^>]+>', '', h)
    return re.sub(r'\n{3,}', '\n\n', html.unescape(h)).strip()
def first_sentences(t, n=200):
    t = re.sub(r'\s+', ' ', s(t)); return t if len(t) <= n else t[:n].rsplit(' ', 1)[0].rstrip(',;:') + '.'

areas = load('areas.json'); area_name = {a['slug']: a['name'] for a in areas}
facts = {r['slug']: r for r in csv_rows('business-facts.csv')}
tiers = {r['slug']: r for r in csv_rows('business-rating-tiers.csv')}
DAYS = [('mon', 'Mon'), ('tue', 'Tue'), ('wed', 'Wed'), ('thu', 'Thu'), ('fri', 'Fri'), ('sat', 'Sat'), ('sun', 'Sun')]

profiles, content = [], []
def P(**k):
    row = {h: '' for h in PROFILE_HEADERS}; row.update(k); row.setdefault('Page', 'Draft'); row['Page'] = row['Page'] or 'Draft'
    row['Example'] = 'no'; row['Source'] = row.get('Source') or SRC; profiles.append(row)
def C(**k):
    row = {h: '' for h in CONTENT_HEADERS}; row.update(k); row['Page'] = row['Page'] or 'Draft'
    row['Example'] = 'no'; row['Source'] = row.get('Source') or SRC; content.append(row)

# ---- Businesses
for b in load('businesses.json'):
    f = facts.get(b['slug'], {}); t = tiers.get(b['slug'], {})
    hours = '; '.join(f"{lab} {f['hours_' + k]}" for k, lab in DAYS if f.get('hours_' + k))
    notes = [NOTE, 'Sub Category: ' + (b['categories'][0] if b.get('categories') else ''), 'Tags: ' + '|'.join(b.get('categories') or []),
             'Legacy slug: ' + b['slug']]
    if b.get('saraPick'): notes.append("Sara's Pick: yes")
    if t.get('rating_tier'): notes.append('Legacy rating tier: ' + t['rating_tier'])
    if hours: notes.append('Hours: ' + hours + (' (verified ' + f['verified'] + ')' if f.get('verified') else ''))
    area = area_name.get(b.get('area') or '', '') or s(b.get('neighborhood')) or s(b.get('city'))
    P(**{'Name': b['name'], 'Profile type': 'Business', 'Area': area, 'Summary': s(b.get('description')), 'Business status': 'Closed' if b.get('closed') else '',
         'Address': s(f.get('address') or b.get('address')), 'Website': s(b.get('website')), 'Phone': s(f.get('phone') or b.get('phone')),
         'Postal city': s(f.get('city') or b.get('city')), 'Reviews section': 'active' if b.get('review') else 'hidden', 'Nearby section': 'active',
         'Media section': 'hidden', 'FAQ section': 'hidden', 'Living section': 'hidden', 'Events section': 'hidden', 'Newsletter section': 'hidden',
         'Editor notes': '\n'.join(notes), 'Record ID': 'legacy-biz-' + b['slug'], 'Slug': b['slug']})

# ---- Areas (neighborhoods, cities, areas)
for a in areas:
    notes = [NOTE, 'Region: ' + s(a.get('region')), 'Best For: ' + s(a.get('bestFor')), 'School District: ' + s(a.get('schools')), 'Legacy slug: ' + a['slug']]
    P(**{'Name': a['name'], 'Profile type': a['type'], 'Area': area_name.get(a.get('parent') or '', ''), 'Summary': s(a.get('vibe')),
         'Typical homes': s(a.get('homes')), 'Local take': s(a.get('take')), 'Living section': 'active', 'Nearby section': 'active',
         'Reviews section': 'hidden', 'Events section': 'hidden', 'Newsletter section': 'hidden', 'FAQ section': 'hidden', 'Media section': 'hidden',
         'Editor notes': '\n'.join(n for n in notes if not n.endswith(': ')), 'Record ID': 'legacy-loc-' + a['slug'], 'Slug': a['slug']})

# ---- Subdivisions, with the neighborhood guide text when there is one
guides = {g['slug']: g for g in load('neighborhoods.json')}
for d in load('subdivisions.json'):
    g = guides.get(d['slug'], {})
    notes = [NOTE, 'Historical prices, schools and copy need review.', 'Zip Codes: ' + s(d.get('zipCodes') or g.get('zips')), 'Price Range: ' + s(d.get('priceRange') or g.get('priceRange')),
             'Price Per Sqft: ' + s(d.get('pricePerSqft') or g.get('pricePerSqft')), 'HOA: ' + s(d.get('hoa') or g.get('hoa')),
             'School District: ' + s(d.get('schools') or g.get('schools')), 'Legacy slug: ' + d['slug']]
    P(**{'Name': d['name'], 'Profile type': 'Subdivision', 'Area': area_name.get(d.get('area') or '', '') or s(d.get('city')), 'Summary': s(d.get('description') or g.get('summary')),
         'Postal city': s(d.get('city')), 'Living section': 'hidden', 'Reviews section': 'hidden', 'Nearby section': 'hidden', 'Events section': 'hidden',
         'Newsletter section': 'hidden', 'FAQ section': 'hidden', 'Media section': 'hidden',
         'Editor notes': '\n'.join(n for n in notes if not n.endswith(': ')), 'Record ID': 'legacy-sub-' + d['slug'], 'Slug': d['slug']})

# ---- Places (things to do)
for t in csv_rows('things-to-do.csv'):
    notes = [NOTE, 'Sub Category: ' + s(t.get('original_type') or t.get('type')), 'Legacy status: ' + s(t.get('status')), 'Verified: ' + s(t.get('last_verified')), 'Legacy slug: ' + s(t.get('slug'))]
    P(**{'Name': t['name'], 'Profile type': 'Place', 'Area': s(t.get('area_name')), 'Address': s(t.get('address')), 'Website': s(t.get('website')), 'Postal city': s(t.get('city')),
         'Business status': {'open': 'Open', 'closed': 'Closed'}.get(s(t.get('status')).lower(), ''), 'Events section': 'hidden', 'Nearby section': 'active',
         'Reviews section': 'hidden', 'Newsletter section': 'hidden', 'FAQ section': 'hidden', 'Media section': 'hidden', 'Living section': 'hidden',
         'Editor notes': '\n'.join(n for n in notes if not n.endswith(': ')), 'Record ID': 'legacy-' + s(t.get('thing_id')), 'Slug': s(t.get('slug'))})

# ---- Reviews
biz = {b['slug']: b for b in load('businesses.json')}
for r in load('reviews.json'):
    b = biz.get(r['businessSlug']); 
    if not b: continue
    date = s(r.get('date')); body = s(r.get('text'))
    notes = [NOTE, 'Legacy tier: ' + s(r.get('tier')), 'Scope: ' + s(r.get('scope')), 'Status: ' + s(r.get('status')), 'Legacy review id: ' + r['id'], 'Legacy business slug: ' + r['businessSlug']]
    C(**{'Title': f"Review: {b['name']} \u2014 {date}" if date else f"Review: {b['name']}", 'Content type': 'Review', 'Profile': b['name'], 'Summary': first_sentences(body),
         'Body': body, 'Author': s(r.get('reviewer')), 'Original review date': mdy(date), 'Rating': s(b.get('stars')) if str(b.get('stars') or '').replace('.', '').isdigit() else '',
         'Media section': 'hidden', 'FAQ section': 'hidden', 'Time zone': 'America/Chicago', 'Editor notes': '\n'.join(notes), 'Record ID': r['id'], 'Slug': 'legacy-' + r['id']})

# ---- Events (area events and Tradition Local events)
for e in load('area-events.json'):
    notes = [NOTE, 'event_type: ' + s(e.get('cat')), 'venue_name: ' + s(e.get('venue')), 'featured: ' + ('yes' if e.get('feat') else 'no'), 'Legacy id: ' + s(e.get('id'))]
    C(**{'Title': s(e['title']), 'Content type': 'Event', 'Summary': s(e.get('note')), 'Starts': mdy(e.get('date')), 'Ends': mdy(e.get('end') or e.get('date')), 'Time zone': 'America/Chicago',
         'Event link': s(e.get('url')), 'Media section': 'hidden', 'FAQ section': 'hidden', 'Editor notes': '\n'.join(notes), 'Source': s(e.get('source')) or SRC,
         'Record ID': 'legacy-evt-' + s(e.get('id')), 'Slug': 'legacy-evt-' + s(e.get('id'))})
for e in load('events.json'):
    notes = [NOTE, 'Tradition Local event', 'venue_name: ' + s(e.get('venue')), 'address: ' + s(e.get('location')), 'When: ' + s(e.get('when')), 'Legacy slug: ' + e['slug']]
    C(**{'Title': s(e['title']), 'Content type': 'Event', 'Summary': first_sentences(text_of(e.get('about'))), 'Body': text_of(e.get('about')), 'Starts': mdy(e.get('date')), 'Ends': mdy(e.get('date')),
         'Time zone': 'America/Chicago', 'Media section': 'hidden', 'FAQ section': 'hidden', 'Editor notes': '\n'.join(notes), 'Record ID': 'legacy-tl-' + e['slug'], 'Slug': e['slug']})

# ---- Articles (stories)
for p in load('posts.json'):
    cats = p.get('categories') or []
    notes = [NOTE, 'Published: ' + s(p.get('date')), 'Updated: ' + s(p.get('updated')), 'Categories: ' + '|'.join(cats), 'Legacy path: ' + s(p.get('path'))]
    img = s(p.get('image')); img = img if img.startswith(('/images', '/media', 'http')) else ''
    C(**{'Title': s(p['title']), 'Content type': 'Article', 'Summary': s(p.get('description')), 'Body': text_of(p.get('html')), 'Author': s(p.get('author')), 'Hero image': img,
         'Image alt text': s(p.get('imageAlt')), 'Media rights': 'Needs review' if img else '', 'Media section': 'hidden', 'FAQ section': 'hidden',
         'Editor notes': '\n'.join(notes), 'Record ID': 'legacy-post-' + p['slug'], 'Slug': p['slug']})

def write(name, headers, rows):
    with (OUT / name).open('w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=headers, quoting=csv.QUOTE_MINIMAL); w.writeheader(); w.writerows(rows)
write('profiles.csv', PROFILE_HEADERS, profiles); write('content.csv', CONTENT_HEADERS, content)
from collections import Counter
print('profiles', len(profiles), dict(Counter(r['Profile type'] for r in profiles)))
print('content', len(content), dict(Counter(r['Content type'] for r in content)))
