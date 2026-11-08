// Applies bootstrap/files.json: new files, small patches, and removals.
import fs from 'node:fs';
import path from 'node:path';
const j = JSON.parse(fs.readFileSync('bootstrap/files.json', 'utf8'));
for (const [p, c] of Object.entries(j.__files || {})) { fs.mkdirSync(path.dirname(p) || '.', { recursive: true }); fs.writeFileSync(p, c); }
for (const x of j.__patches || []) {
  const t = fs.readFileSync(x.path, 'utf8');
  if (t.split(x.find).length !== 2) throw new Error('Patch not found exactly once in ' + x.path + ': ' + x.find.slice(0, 60));
  fs.writeFileSync(x.path, t.replace(x.find, () => x.replace));
}
for (const p of j.__delete || []) fs.rmSync(p, { recursive: true, force: true });
fs.rmSync('bootstrap', { recursive: true, force: true });
console.log('files ' + Object.keys(j.__files || {}).length + ', patches ' + (j.__patches || []).length + ', removed ' + (j.__delete || []).length);
