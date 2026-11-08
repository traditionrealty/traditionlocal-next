// Applies bootstrap/files.json: new files, small patches, block reordering, and removals.
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
// Reorder: cut a stretch of a file into blocks at known start lines, then put them back in a new order (new text allowed).
for (const r of j.__reorder || []) {
  const t = fs.readFileSync(r.path, 'utf8');
  const first = t.indexOf(r.first), last = t.indexOf(r.last);
  if (first < 0 || last < first) throw new Error('Reorder range not found in ' + r.path);
  const body = t.slice(first, last);
  const at = r.blocks.map((b) => {
    const i = body.indexOf(b.start);
    if (i < 0 || body.indexOf(b.start, i + 1) >= 0) throw new Error('Block start not found exactly once: ' + b.name);
    return i;
  });
  const order = at.map((_, k) => k).sort((a, b) => at[a] - at[b]);
  const piece = {};
  order.forEach((k, n) => { piece[r.blocks[k].name] = body.slice(at[k], n + 1 < order.length ? at[order[n + 1]] : body.length); });
  const out = r.out.map((o) => { if (o.text !== undefined) return o.text; if (!(o.keep in piece)) throw new Error('Unknown block: ' + o.keep); return piece[o.keep]; });
  fs.writeFileSync(r.path, t.slice(0, first) + out.join('') + t.slice(last));
}
for (const [p, want] of Object.entries(j.__expect || {})) {
  const got = crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0, 12);
  if (got !== want) throw new Error('Checksum mismatch for ' + p + ': ' + got + ' expected ' + want);
}
for (const p of j.__delete || []) fs.rmSync(p, { recursive: true, force: true });
fs.rmSync('bootstrap', { recursive: true, force: true });
console.log('files ' + Object.keys(j.__files || {}).length + ', patches ' + (j.__patches || []).length + ', reordered ' + (j.__reorder || []).length + ', removed ' + (j.__delete || []).length);
