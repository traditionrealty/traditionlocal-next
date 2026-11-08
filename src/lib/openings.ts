// New openings, places to watch, and closings. Read from data/openings.csv.
// Preview shows every row. The live site shows only rows marked verified, so nothing unchecked goes public.
import { readTable, byName, businesses, href, IS_PREVIEW } from './data';

export type Opening = {
  kind: 'open' | 'watch' | 'closed'; name: string; area: string; detail: string; date: string; dateNote: string;
  link: string; source: string; sourceUrl: string; checked: string; verified: boolean; profile: string;
};

const yes = (v: string) => /^(yes|true|verified)$/i.test((v || '').trim());
const all: Opening[] = readTable('openings.csv').filter((r) => r.name && r.kind).map((r) => ({
  kind: r.kind.toLowerCase() as Opening['kind'], name: r.name, area: r.area, detail: r.detail, date: r.date, dateNote: r.date_note,
  link: r.link, source: r.source, sourceUrl: r.source_url, checked: r.checked, verified: yes(r.verified), profile: r.profile,
}));
export const openings: Opening[] = all.filter((o) => IS_PREVIEW || o.verified);

const DAY = 86400000;
const stamp = (s: string) => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); return m ? +new Date(+m[1], +m[2] - 1, +m[3]) : 0; };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Recent ones only: opened in the last 60 days, closed in the last 75, and upcoming places until two weeks after the date.
export function openingsOf(kind: Opening['kind'], today = new Date()) {
  const t0 = +new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const rows = openings.filter((o) => o.kind === kind);
  if (kind === 'open') return rows.filter((o) => !stamp(o.date) || stamp(o.date) >= t0 - 60 * DAY).sort((a, b) => stamp(b.date) - stamp(a.date));
  if (kind === 'closed') return rows.filter((o) => !stamp(o.date) || stamp(o.date) >= t0 - 75 * DAY).sort((a, b) => stamp(b.date) - stamp(a.date));
  return rows.filter((o) => !stamp(o.date) || stamp(o.date) >= t0 - 14 * DAY).sort((a, b) => (stamp(a.date) || 9e15) - (stamp(b.date) || 9e15));
}

export const whenText = (o: Opening) => {
  if (o.dateNote) return o.dateNote;
  const t = stamp(o.date); if (!t) return '';
  const d = new Date(t); return MONTHS[d.getMonth()] + ' ' + d.getDate();
};
// A page on this site, when the place is one we have a profile for.
export const profileHref = (o: Opening) => { const p = byName(o.profile || o.name); return p ? href(p) : ''; };
// Places we reviewed that the sheet marks closed.
export const closedReviewed = () => businesses().filter((b) => b.status === 'Closed').sort((a, b) => a.name.localeCompare(b.name));
export const lastChecked = () => {
  const t = stamp(openings.map((o) => o.checked).filter(Boolean).sort().slice(-1)[0] || '');
  if (!t) return '';
  const d = new Date(t); return MONTHS[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
};
