// The list Google reads to find every page. Live mode only: the draft preview publishes an empty list.
import { businesses, reviews, posts, profiles, events, byName, isClosed, href, url, IS_PREVIEW } from '../lib/data';
import { areaPages } from '../lib/helpers';
import { issues } from '../lib/issues';

const fixed = ['/', '/food', '/neighborhoods', '/things-to-do', '/videos', '/openings-and-closings', '/newsletters', '/make-it-home', '/find-your-fit', '/new-builds', '/relocation', '/apartments', '/commercial', '/international', '/off-market', '/tradition-realty-group', '/ask-dillon', '/local-directory', '/about', '/how-we-review', '/contact', '/privacy', '/disclosures'];
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function GET({ site }: { site?: URL }) {
  const origin = site || new URL('https://traditionlocal.com');
  const out = new Set<string>();
  const add = (p: string) => out.add(p.endsWith('/') ? p : p + '/');
  if (!IS_PREVIEW) {
    for (const p of fixed) add(url(p));
    for (const b of businesses()) if (!isClosed(b)) add(href(b));
    for (const r of reviews()) { const b = byName(r.profile); if (!b || !isClosed(b)) add(href(r)); }
    for (const p of profiles.filter((x) => x.type === 'Place' || x.type === 'Subdivision')) if (!isClosed(p)) add(href(p));
    for (const p of areaPages()) add(href(p));
    for (const e of events()) add(href(e));
    for (const p of posts()) add(href(p));
    for (const s of issues) add(url('/newsletters/' + s.slug));
  }
  const rows = [...out].sort().map((p) => '  <url><loc>' + esc(new URL(p, origin).href) + '</loc></url>').join('\n');
  const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + rows + (rows ? '\n' : '') + '</urlset>\n';
  return new Response(xml, { headers: { 'Content-Type': 'application/xml' } });
}
