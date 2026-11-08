// Reads the two CSV files exported from the "Simple Master" sheet and turns them into
// profiles (places, businesses, neighborhoods) and content (reviews, events).
// The exporter only writes approved public fields, so nothing private reaches the site.
import fs from 'node:fs';
import path from 'node:path';

export type Profile = {
  slug: string; name: string; type: string; area: string; summary: string; description: string;
  status: string; address: string; website: string; phone: string; postalCity: string;
  heroImage: string; heroAlt: string; heroCredit: string; heroRights: string; gallery: string[];
  faqs: { q: string; a: string }[]; typicalHomes: string; localTake: string; bestFor: string;
  schools: string; zips: string; region: string; subCategory: string; tags: string[];
  show: Record<string, boolean>; published: boolean;
};
export type Content = {
  slug: string; type: string; title: string; profile: string; summary: string; body: string;
  author: string; reviewDate: string; rating: string; heroImage: string; heroAlt: string; heroCredit: string;
  heroRights: string; gallery: string[]; starts: string; ends: string; eventLink: string; cost: string;
  venue: string; address: string; city: string; zip: string; eventType: string; startTime: string; endTime: string; tags: string[];
  faqs: { q: string; a: string }[]; published: boolean;
};

// preview shows drafts and media that still needs review. production shows only what is approved.
export const MODE = (process.env.SITE_MODE || 'preview') as 'preview' | 'production';
export const IS_PREVIEW = MODE === 'preview';

function parseCSV(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f.length || row.length) { row.push(f); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim() !== ''));
}
function readTable(file: string): Record<string, string>[] {
  const p = path.join(process.cwd(), 'data', file);
  if (!fs.existsSync(p)) return [];
  const [head, ...rows] = parseCSV(fs.readFileSync(p, 'utf8'));
  return rows.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] || '').trim()])));
}
const slugify = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const list = (s: string) => (s || '').split(/\s*[|;\n]\s*/).map((x) => x.trim()).filter(Boolean);
function faqs(s: string) {
  // One cell: a question line followed by an answer, repeated, separated by a blank line.
  return (s || '').split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean).map((b) => {
    const [q, ...a] = b.split('\n'); return { q: q.replace(/^Q:\s*/i, '').trim(), a: a.join(' ').replace(/^A:\s*/i, '').trim() };
  }).filter((x) => x.q && x.a);
}
const on = (v: string) => (v || '').toLowerCase() === 'active';

const rawProfiles = readTable('profiles.csv');
const rawContent = readTable('content.csv');

export const profiles: Profile[] = rawProfiles.filter((r) => r.name).map((r) => ({
  slug: r.slug || slugify(r.name), name: r.name, type: r.type, area: r.area, summary: r.summary, description: r.description,
  status: r.status, address: r.address, website: r.website, phone: r.phone, postalCity: r.postal_city,
  heroImage: r.hero_image, heroAlt: r.hero_alt, heroCredit: r.hero_credit, heroRights: r.hero_rights, gallery: list(r.gallery),
  faqs: faqs(r.faqs), typicalHomes: r.typical_homes, localTake: r.local_take, bestFor: r.best_for, schools: r.school_district,
  zips: r.zip_codes, region: r.region, subCategory: r.sub_category, tags: list(r.tags),
  show: { living: on(r.show_living), reviews: on(r.show_reviews), nearby: on(r.show_nearby), events: on(r.show_events), newsletter: on(r.show_newsletter), faq: on(r.show_faq), media: on(r.show_media) },
  published: (r.page_status || '').toLowerCase() === 'published',
})).filter((p) => IS_PREVIEW || p.published);

export const content: Content[] = rawContent.filter((r) => r.title).map((r) => ({
  slug: r.slug || slugify(r.title), type: r.type, title: r.title, profile: r.profile, summary: r.summary, body: r.body, author: r.author,
  reviewDate: r.review_date, rating: r.rating, heroImage: r.hero_image, heroAlt: r.hero_alt, heroCredit: r.hero_credit, heroRights: r.hero_rights,
  gallery: list(r.gallery), starts: r.starts, ends: r.ends, eventLink: r.event_link, cost: r.cost, venue: r.venue_name, address: r.address,
  city: r.city, zip: r.zip_code, eventType: r.event_type, startTime: r.start_time, endTime: r.end_time, tags: list(r.tags), faqs: faqs(r.faqs),
  published: (r.page_status || '').toLowerCase() === 'published',
})).filter((c) => IS_PREVIEW || c.published);

export const byName = (name: string) => profiles.find((p) => p.name === name);
export const ofType = (...t: string[]) => profiles.filter((p) => t.includes(p.type));
export const businesses = () => ofType('Business');
export const reviewsFor = (name: string) => content.filter((c) => c.type === 'Review' && c.profile === name);
export const eventsAt = (name: string) => content.filter((c) => c.type === 'Event' && c.profile === name);
export const inArea = (area: string, type: string) => profiles.filter((p) => p.type === type && p.area === area);
export const reviews = () => content.filter((c) => c.type === 'Review');
export const events = () => content.filter((c) => c.type === 'Event');

// Where each kind of page lives.
const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
export const url = (p: string) => BASE + p;
export function pathFor(e: Profile | Content): string {
  if ('title' in e) return e.type === 'Event' ? `/events/${e.slug}` : e.type === 'Article' ? `/post/${e.slug}` : `/reviews/${e.slug}`;
  switch (e.type) {
    case 'Business': return `/food/${e.slug}`;
    case 'Place': return `/things-to-do/${e.slug}`;
    case 'Subdivision': return `/subdivisions/${e.slug}`;
    default: return `/neighborhoods/${e.slug}`; // Neighborhood, City, Area
  }
}
export const href = (e: Profile | Content) => url(pathFor(e));

// Media: only show images that are approved (or any in preview). Drive links cannot be embedded,
// so they show a placeholder until the image is mirrored into the site.
export function media(e: { heroImage: string; heroAlt: string; heroCredit: string; heroRights: string }) {
  const src = e.heroImage || '';
  const embeddable = /^\//.test(src) || /^https:\/\/(thumb\.)?(upload\.)?wikimedia\.org/.test(src) || /^https:\/\/[^/]*wikimedia\.org/.test(src);
  const approved = e.heroRights.toLowerCase() === 'approved';
  if (!src || !embeddable || (!approved && !IS_PREVIEW)) return null;
  return { src: /^\//.test(src) ? url(src) : src, alt: e.heroAlt || '', credit: e.heroCredit || '', needsReview: !approved };
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function toDate(s: string): Date | null {
  const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s || ''); if (m) return new Date(+m[3], +m[1] - 1, +m[2]);
  const d = new Date(s); return isNaN(+d) ? null : d;
}
export const dateText = (s: string) => { const d = toDate(s); return d ? `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}` : s; };
export function eventDates(e: Content) {
  const a = toDate(e.starts), b = toDate(e.ends || e.starts); if (!a) return '';
  const same = b && +a === +b;
  return same || !b ? `${MONTHS[a.getMonth()]} ${a.getDate()}` : `${MONTHS[a.getMonth()]} ${a.getDate()} to ${MONTHS[b.getMonth()]} ${b.getDate()}`;
}
export function upcomingEvents(limit = 6, today = new Date()) {
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return events().map((e) => ({ e, a: toDate(e.starts), b: toDate(e.ends || e.starts) })).filter((x) => x.b && x.b >= t)
    .sort((x, y) => +(x.a || 0) - +(y.a || 0)).slice(0, limit).map((x) => x.e);
}
export const stars = (r: string) => (Number(r) > 0 ? Number(r) : 0);
