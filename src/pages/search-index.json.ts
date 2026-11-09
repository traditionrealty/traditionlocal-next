// The list the search box reads. Built with the site, so it always matches what is published.
import { businesses, profiles, reviews, events, byName, href, url, dateText, eventDates } from '../lib/data';
import { areaPages, category, isFood } from '../lib/helpers';
import { videos, channelVideos } from '../lib/videos';
import { openings, whenText } from '../lib/openings';

type Row = { k: string; t: string; u: string; s?: string; x?: string };
const clip = (s: string, n: number) => (s || '').replace(/\s+/g, ' ').trim().slice(0, n);
const rows: Row[] = [];

for (const b of businesses()) rows.push({ k: b.status === 'Closed' ? 'closed' : isFood(b) ? 'food' : 'biz', t: b.name, u: href(b), s: [category(b), b.area].filter(Boolean).join(', '), x: clip(b.summary || b.description, 110) });
for (const r of reviews()) { const b = byName(r.profile); rows.push({ k: 'review', t: b ? b.name : r.title, u: href(r), s: 'Review' + (r.reviewDate ? ', ' + dateText(r.reviewDate) : ''), x: clip(r.summary || r.body, 140) }); }
for (const p of profiles.filter((p) => p.type === 'Place')) rows.push({ k: 'thing', t: p.name, u: href(p), s: [p.subCategory, p.area].filter(Boolean).join(', '), x: clip(p.summary || p.description, 110) });
for (const p of areaPages()) rows.push({ k: 'area', t: p.name, u: href(p), s: p.region || p.type, x: clip([p.summary, p.bestFor].filter(Boolean).join(' '), 140) });
for (const p of profiles.filter((p) => p.type === 'Subdivision')) rows.push({ k: 'sub', t: p.name, u: href(p), s: p.area, x: clip(p.summary, 100) });
for (const e of events()) rows.push({ k: 'event', t: e.title, u: href(e), s: [eventDates(e), e.venue || e.profile].filter(Boolean).join(', '), x: clip(e.summary, 110) });
for (const v of [...videos, ...channelVideos.flatMap((c) => c.videos)]) rows.push({ k: 'video', t: v.display, u: url('/videos'), s: 'Video' + (v.duration ? ', ' + v.duration : ''), x: '' });
for (const o of openings) rows.push({ k: 'opening', t: o.name, u: url('/openings-and-closings'), s: [o.area, whenText(o)].filter(Boolean).join(', '), x: clip(o.detail, 110) });

const pages: [string, string, string][] = [
  ['Food', '/food', 'Where to eat. Reviews, ratings, and cuisines'],
  ['Neighborhoods', '/neighborhoods', 'Area guides and subdivision profiles'],
  ['Things to do', '/things-to-do', 'Events, calendar, and places to visit'],
  ['Videos', '/videos', 'Walks, coffee runs, and reviews on YouTube'],
  ['Openings and closings', '/openings-and-closings', 'What just opened, what is coming, and what closed'],
  ['Newsletters', '/newsletters', 'In the Loop and Locally Plus'],
  ['Make it home', '/make-it-home', 'Moving, renting, or buying'],
  ['Find your fit', '/find-your-fit', 'Match neighborhoods to what you love'],
  ['New builds', '/new-builds', 'Newer and master planned communities'],
  ['Relocation', '/relocation', 'Moving to Houston'],
  ['Apartment locating', '/apartments', 'Help finding a rental'],
  ['Commercial real estate', '/commercial', 'Buying, selling, or leasing space'],
  ['International clients', '/international', 'Moving to or buying in Houston from abroad'],
  ['Tradition Realty Group', '/tradition-realty-group', 'Dillon Loren real estate'],
  ['Ask Dillon', '/ask-dillon', 'Questions about an area'],
  ['Local Directory', '/local-directory', 'Providers we know and trust'],
  ['Meet Sara and Dillon', '/about', 'About Tradition Local'],
  ['How we review places', '/how-we-review', 'Our ratings and promises'],
  ['Account', '/account', 'Your saved places, followed areas, and Locally choices'],
  ['Contact', '/contact', 'Say hello'],
  ['Privacy', '/privacy', 'How we handle your information'],
  ['Texas real estate disclosures', '/disclosures', 'Required Texas notices'],
];
for (const [t, p, x] of pages) rows.push({ k: 'page', t, u: url(p), s: 'Page', x });

export const GET = () => new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
