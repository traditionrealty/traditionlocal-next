// Builds data/profiles.csv and data/content.csv from the old site data saved in legacy/.
// This only fills the preview with realistic rows until the sheet is connected. The sheet export replaces these files.
import fs from 'node:fs';
import { createRequire } from 'node:module';
const core = createRequire(import.meta.url)('./sheet-export-core.cjs');
function parseCSV(text) { const rows = []; let row = [], f = '', q = false; for (let i = 0; i < text.length; i++) { const c = text[i]; if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; } else if (c === '"') q = true; else if (c === ',') { row.push(f); f = ''; } else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; } else if (c !== '\r') f += c; } if (f.length || row.length) { row.push(f); rows.push(row); } return rows.filter((r) => r.some((x) => x !== '')); }
const objs = (t) => { const [h, ...r] = parseCSV(t); return r.map((x) => Object.fromEntries(h.map((k, i) => [k, x[i] || '']))); };
const P = objs(fs.readFileSync('legacy/profiles.csv', 'utf8')), C = objs(fs.readFileSync('legacy/content.csv', 'utf8')).filter((r) => r['Content type'] !== 'Article'); // stories live in data/stories.csv
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/profiles.csv', core.toCSV(core.toPublicProfiles(P, { mode: 'preview' }), core.PROFILE_COLUMNS));
fs.writeFileSync('data/content.csv', core.toCSV(core.toPublicContent(C, { mode: 'preview' }), core.CONTENT_COLUMNS));
console.log('wrote data/profiles.csv and data/content.csv');
