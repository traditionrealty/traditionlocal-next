import fs from 'node:fs';
import { defineConfig } from 'astro/config';

// Old addresses that now live somewhere new. data/redirects.json maps an old path to its new path.
const base = (process.env.BASE_PATH || '/').replace(/\/$/, '');
let moved = {};
try { moved = JSON.parse(fs.readFileSync('data/redirects.json', 'utf8')); } catch {}
// A real page always wins over an old address, so skip any redirect that would cover a page we publish.
const csv = (file) => {
  try {
    const t = fs.readFileSync(file, 'utf8'); const rows = []; let row = [], cur = '', q = false;
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (q) { if (c === '"') { if (t[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(cur); cur = ''; }
      else if (c === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
      else if (c !== '\r') cur += c;
    }
    if (cur || row.length) { row.push(cur); rows.push(row); }
    const h = rows[0] || [];
    return rows.slice(1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i] || ''])));
  } catch { return []; }
};
const groups = { Business: 'food', Place: 'things-to-do', Subdivision: 'subdivisions', Area: 'neighborhoods', City: 'neighborhoods', Neighborhood: 'neighborhoods', Event: 'events', Review: 'reviews' };
const isLive = (r) => process.env.SITE_MODE !== 'production' || /^published$/i.test(r.page_status || '');
const pages = new Set([...csv('data/profiles.csv'), ...csv('data/content.csv')].filter((r) => r.slug && groups[r.type] && isLive(r)).map((r) => '/' + groups[r.type] + '/' + r.slug));
const redirects = Object.fromEntries(Object.entries(moved).filter(([from]) => !pages.has(from.replace(/\/$/, ''))).map(([from, to]) => [from, base + to]));

// The GitHub Pages workflow sets SITE_URL and BASE_PATH.
// Preview:  https://traditionrealty.github.io/traditionlocal-next
// Live:     https://www.traditionlocal.com
export default defineConfig({
  site: process.env.SITE_URL || 'https://www.traditionlocal.com',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  redirects,
});
