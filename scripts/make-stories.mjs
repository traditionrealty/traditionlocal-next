// Builds data/stories.csv from the old site's stories saved in legacy/content.csv.
// These stories are already live on the current site, so they are marked Published. The sheet export never touches this file.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const core = createRequire(import.meta.url)('./sheet-export-core.cjs');
function parseCSV(text) { const rows = []; let row = [], f = '', q = false; for (let i = 0; i < text.length; i++) { const c = text[i]; if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; } else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else if (c !== '\r') f += c; } if (f.length || row.length) { row.push(f); rows.push(row); } return rows.filter((r) => r.some((x) => x !== '')); }
const objs = (t) => { const [h, ...r] = parseCSV(t); return r.map((x) => Object.fromEntries(h.map((k, i) => [k, x[i] || '']))); };
const note = (n, key) => { for (const l of String(n || '').split('\n')) { const m = l.match(/^\s*([A-Za-z_ ]+?)\s*:\s*(.*)$/); if (m && m[1].toLowerCase() === key.toLowerCase()) return m[2].trim(); } return ''; };
const mdy = (iso) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? `${+m[2]}/${+m[3]}/${m[1]}` : ''; };
const rows = objs(fs.readFileSync('legacy/content.csv', 'utf8')).filter((r) => r['Content type'] === 'Article' && r['Title']);
const pub = core.toPublicContent(rows, { mode: 'preview' });
const out = pub.map((p, i) => ({ ...p, review_date: mdy(note(rows[i]['Editor notes'], 'Published')), tags: note(rows[i]['Editor notes'], 'Categories'), hero_rights: p.hero_image ? 'Approved' : '', page_status: 'Published' }));
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/stories.csv', core.toCSV(out, core.CONTENT_COLUMNS));
console.log('wrote data/stories.csv with ' + out.length + ' stories');
