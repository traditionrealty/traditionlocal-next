// The neighborhood spotlight on the home page.
// 1. A row in data/spotlight.csv wins: a guide (slug) or an article (link and title). The newest date comes first.
// 2. With no rows, the spotlight rotates weekly through the neighborhood guides.
import { readTable, href, url } from './data';
import { areaPages, foodIn, subsIn } from './helpers';

export type Spot = { title: string; summary: string; bestFor: string; homes: string; region: string; label: string; cta: string; link: string; external: boolean; date: string; places: number; subs: number };

const clip = (s: string, n: number) => { const t = (s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + '...' : t; };
const when = (s: string) => {
  const t = String(s || '').trim();
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t), iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  const d = us ? new Date(+us[3], +us[1] - 1, +us[2]) : iso ? new Date(+iso[1], +iso[2] - 1, +iso[3]) : null;
  return d && !isNaN(+d) ? +d : 0;
};
const show = (ms: number) => (ms ? new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');

const guides = areaPages();
const fromGuide = (p: any, over: Record<string, string> = {}): Spot => ({
  title: over.title || p.name, summary: clip(over.summary || p.summary, 170), bestFor: clip(p.bestFor, 120), homes: clip(p.typicalHomes, 110), region: p.region || '',
  label: over.label || 'Neighborhood guide', cta: 'Read the ' + p.name + ' guide', link: href(p), external: false, date: show(when(over.date)),
  places: foodIn(p.name).length, subs: subsIn(p.name).length,
});

const rows = readTable('spotlight.csv').filter((r) => r.slug || r.link).sort((a, b) => when(b.date) - when(a.date));
const picked: Spot[] = [];
for (const r of rows) {
  const g = r.slug ? guides.find((p) => p.slug === r.slug) : null;
  if (g) picked.push(fromGuide(g, r));
  else if (/^(https?:\/\/|\/)/.test(r.link || '') && r.title) {
    const ext = /^https?:/.test(r.link);
    picked.push({ title: r.title, summary: clip(r.summary, 200), bestFor: '', homes: '', region: '', label: r.label || 'Article', cta: 'Read the article', link: ext ? r.link : url(r.link), external: ext, date: show(when(r.date)), places: 0, subs: 0 });
  }
}

const pool = guides.filter((p) => p.summary && p.bestFor && p.typicalHomes);
const step = Math.max(1, Math.floor(pool.length / 12));
const rotation = pool.filter((_, i) => i % step === 0).slice(0, 12).map((p) => fromGuide(p, { label: 'Featured guide' }));

export const rotating = picked.length === 0;
export const spots: Spot[] = picked.length ? picked.slice(0, 1) : rotation;
