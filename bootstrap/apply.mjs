// Applies bootstrap/files.json: new files, small patches, cut and replace, and removals. Checks results against checksums.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const j = JSON.parse(fs.readFileSync('bootstrap/files.json', 'utf8'));
for (const [p, c] of Object.entries(j.__files || {})) { fs.mkdirSync(path.dirname(p) || '.', { recursive: true }); fs.writeFileSync(p, c); }
for (const x of j.__patches || []) {
  const t = fs.readFileSync(x.path, 'utf8');
  if (t.split(x.find).length !== 2) throw new Error('Patch not found exactly once in ' + x.path + ': ' + x.find.slice(0, 60));
  fs.writeFileSync(x.path, t.replace(x.find, () => x.replace));
}
// Cut: replace everything from one marker through another marker with new text.
for (const c of j.__cuts || []) {
  const t = fs.readFileSync(c.path, 'utf8');
  const a = t.indexOf(c.from);
  if (a < 0 || t.indexOf(c.from, a + 1) >= 0) throw new Error('Cut start not found exactly once in ' + c.path + ': ' + c.from.slice(0, 60));
  const b = t.indexOf(c.to, a);
  if (b < 0 || t.indexOf(c.to, b + 1) >= 0) throw new Error('Cut end not found exactly once in ' + c.path + ': ' + c.to.slice(0, 60));
  fs.writeFileSync(c.path, t.slice(0, a) + c.replace + t.slice(b + c.to.length));
}
for (const [p, want] of Object.entries(j.__expect || {})) {
  const got = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0, 12);
  if (got !== want) throw new Error('Checksum mismatch for ' + p + ': ' + got + ' expected ' + want);
}
for (const p of j.__delete || []) fs.rmSync(p, { recursive: true, force: true });
fs.rmSync('bootstrap', { recursive: true, force: true });
console.log('files ' + Object.keys(j.__files || {}).length + ', patches ' + (j.__patches || []).length + ', cuts ' + (j.__cuts || []).length + ', removed ' + (j.__delete || []).length);
