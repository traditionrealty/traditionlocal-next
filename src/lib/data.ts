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
  show: Record<string, boolean>; published: boolean; spotlight: boolean;
};
export type Content = {
  slug: string; type: string; title: string; profile: string; summary: string; body: string;
  author: string; reviewDate: string; rating: string; heroImage: string; heroAlt: string; heroCredit: string;
  heroRights: string; gallery: string[]; starts: string; ends: string; eventLink: string; cost: string;
  venue: string; address: string; city: string; zip: string; eventType: string; startTime: string; endTime: string; tags: string[];
  faqs: { q: string; a: string }[]; published: boolean; showMedia: boolean; saraPick: boolean;
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
export function readTable(file: string): Record<string, string>[] {
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
// A tick box in the sheet comes through as TRUE (or yes, or active).
const ticked = (v: string) => /^(true|yes|y|1|active)$/i.test((v || '').trim());

const rawProfiles = readTable('profiles.csv');
const rawContent = readTable('content.csv');
// Events have their own file (data/events.csv). Older exports kept them in content.csv, so that still works when events.csv is missing.
const rawEvents = readTable('events.csv');
const contentRows = rawEvents.length ? [...rawContent.filter((r) => r.type !== 'Event'), ...rawEvents.map((r) => ({ ...r, type: 'Event' }))] : rawContent;

// The sheet can send dates as 2026-04-26 or as 4/26/2026. The pages read month/day/year, so convert once, here.
const usDate = (s: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '').trim()); return m ? (+m[2]) + '/' + (+m[3]) + '/' + m[1] : s; };

export const profiles: Profile[] = rawProfiles.filter((r) => r.name).map((r) => ({
  slug: r.slug || slugify(r.name), name: r.name, type: r.type, area: r.area, summary: r.summary, description: r.description,
  status: r.status, address: r.address, website: r.website, phone: r.phone, postalCity: r.postal_city,
  heroImage: r.hero_image, heroAlt: r.hero_alt, heroCredit: r.hero_credit, heroRights: r.hero_rights, gallery: list(r.gallery),
  faqs: faqs(r.faqs), typicalHomes: r.typical_homes, localTake: r.local_take, bestFor: r.best_for, schools: r.school_district,
  zips: r.zip_codes, region: r.region, subCategory: r.sub_category, tags: list(r.tags),
  show: { living: on(r.show_living), reviews: on(r.show_reviews), nearby: on(r.show_nearby), events: on(r.show_events), newsletter: on(r.show_newsletter), faq: on(r.show_faq), media: on(r.show_media) },
  published: (r.page_status || '').toLowerCase() === 'published', spotlight: ticked(r.spotlight),
})).filter((p) => IS_PREVIEW || p.published);

export const content: Content[] = contentRows.filter((r) => r.title).map((r) => ({
  slug: r.slug || slugify(r.title), type: r.type, title: r.title, profile: r.profile, summary: r.summary, body: r.body, author: r.author,
  reviewDate: r.review_date, rating: r.rating, heroImage: r.hero_image, heroAlt: r.hero_alt, heroCredit: r.hero_credit, heroRights: r.hero_rights,
  gallery: list(r.gallery), starts: usDate(r.starts), ends: usDate(r.ends), eventLink: r.event_link, cost: r.cost, venue: r.venue_name, address: r.address,
  city: r.city, zip: r.zip_code, eventType: r.event_type, startTime: r.start_time, endTime: r.end_time, tags: list(r.tags), faqs: faqs(r.faqs),
  published: (r.page_status || '').toLowerCase() === 'published', showMedia: on(r.show_media),
  // The "Sara's pick" checkbox in the Content tab. A ticked box arrives as TRUE.
  saraPick: /^(true|yes|x|1)$/i.test((r.sara_pick || '').trim()),
})).filter((c) => IS_PREVIEW || c.published);

export const byName = (name: string) => profiles.find((p) => p.name === name);
export const ofType = (...t: string[]) => profiles.filter((p) => t.includes(p.type));
export const businesses = () => ofType('Business');
export const reviewsFor = (name: string) => content.filter((c) => c.type === 'Review' && c.profile === name);
export const eventsAt = (name: string) => content.filter((c) => c.type === 'Event' && c.profile === name);
export const inArea = (area: string, type: string) => profiles.filter((p) => p.type === type && p.area === area);
export const reviews = () => content.filter((c) => c.type === 'Review');
// Any version of closed: Closed, Permanently closed, Temporarily closed, Closed for good, Out of business, and so on.
// Closed places stay on their own pages and in the closed area, and are left out of searches, filters, and picks.
const CLOSED = /\bclosed\b|\bclosure\b|out of business|shut\s*down|shuttered|no longer (open|operating)|defunct|ceased operat/i;
export const isClosed = (p?: { status?: string } | null) => !!p && CLOSED.test(p.status || '');
// Reviews for places that are still open. A review of a closed place is only found in the closed area.
export const liveReviews = () => reviews().filter((r) => !isClosed(byName(r.profile)));
export const events = () => content.filter((c) => c.type === 'Event');
// Articles, Guides, and any other written piece from the Content tab that is not a review or an event.
export const posts = () => content.filter((c) => c.type !== 'Review' && c.type !== 'Event');

// Where each kind of page lives.
const BASE = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
export const url = (p: string) => BASE + p;
export function pathFor(e: Profile | Content): string {
  if ('title' in e) return e.type === 'Event' ? `/events/${e.slug}` : e.type === 'Review' ? `/reviews/${e.slug}` : `/post/${e.slug}`; // Articles, Guides, and any other written piece live under /post
  switch (e.type) {
    case 'Business': return `/food/${e.slug}`;
    case 'Place': return `/things-to-do/${e.slug}`;
    case 'Subdivision': return `/subdivisions/${e.slug}`;
    default: return `/neighborhoods/${e.slug}`; // Neighborhood, City, Area
  }
}
export const href = (e: Profile | Content) => url(pathFor(e));

// Photos that are copied into the site. Two sources, both optional:
//  1. public/images/BATCH n/<slug>/01.jpg, 02.jpg ... one folder per page, named by the page slug.
//  2. src/data/image-map.json, written by the "Copy Drive photos" workflow: { "<Drive file id>": "/images/drive/<id>.jpg" }.
// The Approved rule below still decides what is shown on the live site.
const IMG_ROOT = path.join(process.cwd(), 'public', 'images');
const folderPhotos = new Map<string, string[]>();
try {
  for (const batch of fs.readdirSync(IMG_ROOT, { withFileTypes: true })) {
    if (!batch.isDirectory() || !/^BATCH /i.test(batch.name)) continue;
    for (const dir of fs.readdirSync(path.join(IMG_ROOT, batch.name), { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      const files = fs.readdirSync(path.join(IMG_ROOT, batch.name, dir.name)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort();
      if (files.length) folderPhotos.set(dir.name, files.map((f) => ['', 'images', batch.name, dir.name, f].map((s, i) => (i ? encodeURIComponent(s) : s)).join('/')));
    }
  }
} catch { /* no photo folders yet */ }
let driveMap: Record<string, string> = {};
try { driveMap = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src', 'data', 'image-map.json'), 'utf-8')); } catch { /* no copied Drive photos yet */ }
const driveId = (s: string) => ((s || '').match(/\/d\/([A-Za-z0-9_-]{20,})/) || (s || '').match(/[?&]id=([A-Za-z0-9_-]{20,})/) || [])[1] || '';
const embeddable = (s: string) => /^\//.test(s) || /^https:\/\/[^/]*wikimedia\.org/.test(s);
// The shared "Permanently closed" graphic. A permanently closed place with no photo of its own shows it. Places with any image keep theirs.
const CLOSED_IMAGE = fs.existsSync(path.join(IMG_ROOT, 'drive', '1pI_VdVVlUyWvmhpF9S_RMPVhL4XC4MCd.jpg')) ? url('/images/drive/1pI_VdVVlUyWvmhpF9S_RMPVhL4XC4MCd.jpg') : '';
// Swap a Drive link for its copied version when there is one.
const copied = (s: string) => driveMap[driveId(s)] || s;

// Media: only show images that are approved (or any in preview). Drive links cannot be embedded, so a Drive photo
// shows only once it has been copied into the site (by the map or by a photo folder named after the page).
export function media(e: { heroImage: string; heroAlt: string; heroCredit: string; heroRights: string; slug?: string; status?: string; name?: string }) {
  let src = copied(e.heroImage || '');
  if ((!src || !embeddable(src)) && e.slug && folderPhotos.has(e.slug)) src = folderPhotos.get(e.slug)![0];
  const approved = e.heroRights.toLowerCase() === 'approved';
  if (!src && CLOSED_IMAGE && isClosed(e) && !/temporar/i.test(e.status || '') && !(e.heroImage || '').trim()) return { src: CLOSED_IMAGE, alt: 'Permanently closed notice' + (e.name ? ' for ' + e.name : ''), credit: '', needsReview: false };
  if (!src || !embeddable(src) || (!approved && !IS_PREVIEW)) return null;
  return { src: /^\//.test(src) ? url(src) : src, alt: e.heroAlt || '', credit: e.heroCredit || '', needsReview: !approved };
}

// Gallery photos follow the same rule as the hero: copied photos (site paths) and Wikimedia, approved only in production.
export function galleryMedia(e: { gallery: string[]; heroRights: string; heroAlt: string; heroCredit: string; slug?: string }) {
  const approved = e.heroRights.toLowerCase() === 'approved';
  if (!approved && !IS_PREVIEW) return [];
  let list = (e.gallery || []).map(copied).filter(embeddable);
  if (!list.length && e.slug && folderPhotos.has(e.slug)) list = folderPhotos.get(e.slug)!;
  return list.map((s) => ({ src: /^\//.test(s) ? url(s) : s, alt: e.heroAlt || '', credit: e.heroCredit || '' }));
}

// Site wide pictures from the "Site Images" tab (data/site_images.csv): the home hero and the About portraits.
// They follow the same Approved rule as every other photo.
const siteRows = readTable('site_images.csv');
export function siteImage(slot: string) {
  const r = siteRows.find((x) => (x.slot || '').toLowerCase() === slot);
  return r ? media({ heroImage: r.image || '', heroAlt: r.alt || '', heroCredit: r.credit || '', heroRights: r.rights || '' }) : null;
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
