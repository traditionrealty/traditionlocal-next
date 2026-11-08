// Writes the files listed in bootstrap/files.json, applies small patches, and fills the preview data.
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
const files = JSON.parse(fs.readFileSync('bootstrap/files.json', 'utf8'));
const patches = files.__patches || []; delete files.__patches;
for (const [p, c] of Object.entries(files)) { fs.mkdirSync(path.dirname(p) || '.', { recursive: true }); fs.writeFileSync(p, c); }
for (const x of patches) {
  const t = fs.readFileSync(x.path, 'utf8');
  if (!t.includes(x.find)) throw new Error('Patch not found in ' + x.path + ': ' + x.find.slice(0, 60));
  fs.writeFileSync(x.path, t.replace(x.find, x.replace));
}
fs.rmSync('bootstrap', { recursive: true, force: true });
execSync('node scripts/legacy-to-public.mjs', { stdio: 'inherit' });
console.log('wrote ' + Object.keys(files).length + ' files and applied ' + patches.length + ' patches');
