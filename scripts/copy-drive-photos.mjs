// Copies Approved photos from Google Drive into the site, so the live site can show them.
// Reads data/*.csv for rows marked Approved, finds the Drive file ids in Hero image and Gallery,
// downloads each photo with a read only service account, shrinks it, and saves it as public/images/drive/<id>.jpg.
// It records every copy in src/data/image-map.json, which the site uses to swap a Drive link for the copied photo.
//
// MODE=check  only tests that each photo can be reached. Nothing is downloaded or changed.
// MODE=copy   downloads and saves photos (LIMIT caps how many per run, so big jobs can be done in chunks).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const MODE = process.env.MODE || 'check';
const LIMIT = parseInt(process.env.LIMIT || '0', 10) || Infinity;
const MOCK = process.env.MOCK === '1';
const OUT_DIR = path.join('public', 'images', 'drive');
const MAP_FILE = path.join('src', 'data', 'image-map.json');
const MAX_BYTES = 40 * 1024 * 1024;

function parseCSV(text) {
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  return rows;
}
const ids = (s) => [...(s || '').matchAll(/(?:\/d\/|[?&]id=)([A-Za-z0-9_-]{20,})/g)].map((m) => m[1]);

// 1. Which photos are wanted: Approved rows on published pages, hero and gallery.
const wanted = new Map(); // id -> first row name that uses it
for (const file of ['profiles.csv', 'content.csv', 'events.csv']) {
  const p = path.join('data', file);
  if (!fs.existsSync(p)) continue;
  const R = parseCSV(fs.readFileSync(p, 'utf-8').replace(/^\uFEFF/, ''));
  const h = R[0], ix = (k) => h.indexOf(k);
  const nameCol = ix('name') >= 0 ? ix('name') : ix('title');
  for (const r of R.slice(1)) {
    if ((r[ix('page_status')] || '').toLowerCase() !== 'published') continue;
    if ((r[ix('hero_rights')] || '').toLowerCase() !== 'approved') continue;
    for (const id of [...ids(r[ix('hero_image')]), ...ids(r[ix('gallery')])]) if (!wanted.has(id)) wanted.set(id, r[nameCol] || file);
  }
}
let map = {};
try { map = JSON.parse(fs.readFileSync(MAP_FILE, 'utf-8')); } catch {}
const todo = [...wanted.keys()].filter((id) => !(map[id] && fs.existsSync(path.join('public', map[id]))));
console.log(`Approved Drive photos wanted: ${wanted.size}. Already copied: ${wanted.size - todo.length}. To do: ${todo.length}.`);

// 2. Google sign in with a service account (no extra packages).
const b64 = (b) => Buffer.from(b).toString('base64url');
async function token() {
  if (MOCK) return 'mock';
  const key = JSON.parse(process.env.GDRIVE_SA_KEY || '{}');
  if (!key.client_email || !key.private_key) throw new Error('GDRIVE_SA_KEY is missing or is not the service account JSON.');
  const now = Math.floor(Date.now() / 1000);
  const head = b64(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const body = b64(JSON.stringify({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/drive.readonly', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3300 }));
  const sig = crypto.createSign('RSA-SHA256').update(head + '.' + body).sign(key.private_key, 'base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: head + '.' + body + '.' + sig }) });
  const j = await r.json();
  if (!j.access_token) throw new Error('Google sign in failed: ' + JSON.stringify(j).slice(0, 200));
  return j.access_token;
}
async function api(url, tok, tries = 3) {
  for (let t = 1; t <= tries; t++) {
    const r = await fetch(url, { headers: { Authorization: 'Bearer ' + tok } });
    if (r.status === 429 || r.status >= 500) { await new Promise((s) => setTimeout(s, 1500 * t)); continue; }
    return r;
  }
  return fetch(url, { headers: { Authorization: 'Bearer ' + tok } });
}

const results = { ok: [], noAccess: [], notImage: [], tooBig: [], failed: [] };
async function one(id, tok, sharp) {
  const label = `${wanted.get(id)} (${id})`;
  try {
    const mr = MOCK ? { status: 200, json: async () => ({ mimeType: 'image/jpeg', size: '1000' }) } : await api(`https://www.googleapis.com/drive/v3/files/${id}?fields=mimeType,size,name&supportsAllDrives=true`, tok);
    if (mr.status === 404 || mr.status === 403) return results.noAccess.push(label);
    if (mr.status !== 200) return results.failed.push(label + ' meta ' + mr.status);
    const meta = await mr.json();
    if (!/^image\//.test(meta.mimeType || '')) return results.notImage.push(label + ' ' + meta.mimeType);
    if (Number(meta.size || 0) > MAX_BYTES) return results.tooBig.push(label);
    if (MODE === 'check') return results.ok.push(label);
    const dr = MOCK ? { status: 200, arrayBuffer: async () => (await sharp({ create: { width: 3000, height: 2000, channels: 3, background: '#2a6' } }).jpeg().toBuffer()) } : await api(`https://www.googleapis.com/drive/v3/files/${id}?alt=media&supportsAllDrives=true`, tok);
    if (dr.status !== 200) return results.failed.push(label + ' download ' + dr.status);
    const buf = Buffer.from(await dr.arrayBuffer());
    fs.mkdirSync(OUT_DIR, { recursive: true });
    await sharp(buf).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 78, mozjpeg: true }).toFile(path.join(OUT_DIR, id + '.jpg'));
    map[id] = `/images/drive/${id}.jpg`;
    results.ok.push(label);
  } catch (e) { results.failed.push(label + ' ' + String(e.message).slice(0, 80)); }
}

const tok = await token();
const sharp = MODE === 'copy' ? (await import('sharp')).default : null;
const batch = todo.slice(0, LIMIT);
let next = 0;
await Promise.all(Array.from({ length: 4 }, async () => { while (next < batch.length) await one(batch[next++], tok, sharp); }));

if (MODE === 'copy') {
  fs.mkdirSync(path.dirname(MAP_FILE), { recursive: true });
  fs.writeFileSync(MAP_FILE, JSON.stringify(Object.fromEntries(Object.entries(map).sort()), null, 1) + '\n');
}
const lines = [
  `## Drive photos: ${MODE === 'check' ? 'access check (nothing was changed)' : 'copy'}`, '',
  `- Checked this run: ${batch.length} of ${todo.length} still to do`,
  `- ${MODE === 'check' ? 'Reachable' : 'Copied'}: **${results.ok.length}**`,
  `- Not shared with the service account, or deleted: **${results.noAccess.length}**`,
  `- Not an image file: ${results.notImage.length}`, `- Too large to copy: ${results.tooBig.length}`, `- Other failures: ${results.failed.length}`,
];
for (const [k, v] of Object.entries({ 'Not shared or deleted': results.noAccess, 'Not an image': results.notImage, 'Too large': results.tooBig, 'Failed': results.failed })) if (v.length) lines.push('', `### ${k} (first 30)`, ...v.slice(0, 30).map((x) => '- ' + x));
console.log(lines.join('\n'));
if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n') + '\n');
if (MODE === 'copy' && results.ok.length === 0 && batch.length > 0) process.exit(1);
