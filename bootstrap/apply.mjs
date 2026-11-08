// Replaces the old site files with the redesign files listed in bootstrap/files.json.
import fs from 'node:fs';
import path from 'node:path';
const files = JSON.parse(fs.readFileSync('bootstrap/files.json', 'utf8'));
for (const d of ['src', 'scripts', 'content', 'data']) fs.rmSync(d, { recursive: true, force: true });
for (const f of ['package-lock.json', '.pages.yml', 'public/CNAME']) fs.rmSync(f, { force: true });
for (const [p, c] of Object.entries(files)) { fs.mkdirSync(path.dirname(p) || '.', { recursive: true }); fs.writeFileSync(p, c); }
fs.rmSync('bootstrap', { recursive: true, force: true });
console.log('wrote ' + Object.keys(files).length + ' files');
