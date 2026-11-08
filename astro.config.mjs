import fs from 'node:fs';
import { defineConfig } from 'astro/config';

// Old addresses that now live somewhere new. data/redirects.json maps an old path to its new path.
const base = (process.env.BASE_PATH || '/').replace(/\/$/, '');
let moved = {};
try { moved = JSON.parse(fs.readFileSync('data/redirects.json', 'utf8')); } catch {}
const redirects = Object.fromEntries(Object.entries(moved).map(([from, to]) => [from, base + to]));

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
