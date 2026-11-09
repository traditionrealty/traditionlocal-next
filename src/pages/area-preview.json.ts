// A lean list the home page reads when someone picks an area: the guide basics and the top rated places there.
import { href } from '../lib/data';
import { areaPages, foodIn, subsIn, topRating } from '../lib/helpers';

const clip = (s: string, n: number) => { const t = (s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + '...' : t; };

export const GET = () => {
  const rows = areaPages().map((p) => {
    const food = foodIn(p.name).filter((b) => b.status !== 'Closed');
    const top = food.map((b) => ({ b, r: topRating(b.name) })).filter((x) => x.r > 0).sort((a, b) => b.r - a.r || a.b.name.localeCompare(b.b.name)).slice(0, 3).map((x) => [x.b.name, x.r, href(x.b)]);
    return { n: p.name, g: p.region || '', s: clip(p.summary, 170), b: clip(p.bestFor, 120), h: clip(p.typicalHomes, 110), u: href(p), p: food.length, d: subsIn(p.name).length, t: top };
  }).sort((a, b) => a.n.localeCompare(b.n));
  return new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
};
