// Applies the small changes listed in bootstrap/files.json.
import fs from 'node:fs';
const files = JSON.parse(fs.readFileSync('bootstrap/files.json', 'utf8'));
for (const x of files.__patches) {
  const t = fs.readFileSync(x.path, 'utf8');
  if (t.split(x.find).length !== 2) throw new Error('Patch not found exactly once in ' + x.path + ': ' + x.find.slice(0, 60));
  fs.writeFileSync(x.path, t.replace(x.find, () => x.replace));
}
fs.rmSync('bootstrap', { recursive: true, force: true });
console.log('applied ' + files.__patches.length + ' patches');
