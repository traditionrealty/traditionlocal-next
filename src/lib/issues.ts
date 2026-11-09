// Past issues of In the Loop. Each issue is a text file in data/issues, named by date, like 2026-11-08.txt.
// Optional first lines: "Title:" and "Preview:", then a blank line. Everything after that is the issue.
import fs from 'node:fs';

export type Issue = { slug: string; title: string; preview: string; body: string; date: string; ts: number };

const long = (y: number, m: number, d: number) => new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

function load(): Issue[] {
  let names: string[] = [];
  try { names = fs.readdirSync('data/issues').filter((n) => /^\d{4}-\d{2}-\d{2}.*\.txt$/.test(n)); } catch { return []; }
  return names.map((n) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(n) as RegExpExecArray;
    const lines = fs.readFileSync('data/issues/' + n, 'utf8').replace(/\r/g, '').split('\n');
    const head: Record<string, string> = {};
    let i = 0;
    while (i < lines.length && /^(title|preview|subject):/i.test(lines[i])) {
      const k = lines[i].split(':')[0].toLowerCase();
      head[k === 'subject' ? 'title' : k] = lines[i].slice(lines[i].indexOf(':') + 1).trim();
      i++;
    }
    const date = long(+m[1], +m[2], +m[3]);
    return { slug: n.replace(/\.txt$/, ''), title: head.title || 'In the Loop for ' + date, preview: head.preview || '', body: lines.slice(i).join('\n').trim(), date, ts: +new Date(+m[1], +m[2] - 1, +m[3]) };
  }).sort((a, b) => b.ts - a.ts);
}

export const issues: Issue[] = load();

// Blank lines split the issue. A short line with no ending punctuation is a heading.
export const blocks = (body: string) => body.split(/\n\s*\n/).map((p) => p.replace(/\s*\n\s*/g, ' ').trim()).filter(Boolean).map((t) => {
  const heading = t.length <= 48 && !/[.,:;?!]$/.test(t) && !/^\d/.test(t);
  return { kind: heading ? (t === t.toUpperCase() ? 'h2' : 'h3') : 'p', text: heading && t === t.toUpperCase() ? t.charAt(0) + t.slice(1).toLowerCase() : t };
});
