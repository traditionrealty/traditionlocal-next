// Dillon's featured listings. They come from the Simple Master: every row in the Profiles tab with the profile type
// "Feature Listing" and the page set to Published. (In the draft preview, drafts show too.)
// The status is read from the start of the Summary ("Active — ...", "Coming Soon — ...", "Pending — ...", "New Construction — ..."),
// the price only when the first line of the Full description lists one, and the beds, baths, and square feet from "Typical homes".
import { profiles, media } from './data';

export type Listing = {
  slug: string; address: string; city: string; price: string; priceNote: string; status: string; facts: string;
  summary: string; photo: string; alt: string; link: string; linkLabel: string;
};

const ORDER = ['active', 'coming soon', 'new construction', 'pending'];
const LABEL: Record<string, string> = { 'active': 'Active', 'coming soon': 'Coming soon', 'new construction': 'New construction', 'pending': 'Pending' };

// "Pending — A three bedroom ..." gives the status and the sentence after it.
export function splitSummary(summary: string, description: string): { status: string; text: string } {
  const m = /^\s*([^\u2014\u2013|:]{3,24}?)\s*[\u2014\u2013]\s*([\s\S]+)$/.exec(summary || '');
  if (m) return { status: m[1].trim().toLowerCase(), text: m[2].trim() };
  const first = ((description || '').split('\n')[0] || '').split('|')[0].trim().toLowerCase();
  return { status: first, text: (summary || '').trim() };
}

export function factsFrom(th: string): string {
  const t = th || '';
  const beds = /(\d+)\s*bed(?:room)?s?\b/i.exec(t);
  let baths = '';
  const fh = /(\d+)\s*full\s*baths?(?:\s*\+\s*(\d+)\s*half\s*baths?)?/i.exec(t);
  if (fh) baths = String(Number(fh[1]) + (fh[2] ? 0.5 * Number(fh[2]) : 0));
  else { const g = /(\d+(?:\.\d+)?)\s*baths?\b/i.exec(t); if (g) baths = g[1]; }
  const sq = /(approx\.?\s*)?(\d[\d,]{2,6})\s*(?:sq\.?\s*ft|square feet)/i.exec(t);
  const parts = [
    beds ? `${beds[1]} ${beds[1] === '1' ? 'bed' : 'beds'}` : '',
    baths ? `${baths} ${baths === '1' ? 'bath' : 'baths'}` : '',
    sq ? `${sq[1] ? 'approx. ' : ''}${sq[2]} sq ft` : '',
  ].filter(Boolean);
  const out = parts.join(', ');
  return out && /^planned/i.test(t) ? 'Planned: ' + out : out;
}

function shorten(s: string, max = 200): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max); const end = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('.'));
  return end > 60 ? cut.slice(0, end + 1) : cut.replace(/\s+\S*$/, '') + '...';
}

export const listings: Listing[] = profiles
  .filter((p) => p.type === 'Feature Listing')
  .map((p) => {
    const { status, text } = splitSummary(p.summary, p.description);
    const parts = (p.address || '').split(',').map((s) => s.trim());
    const cityName = parts[1] || p.postalCity || '';
    const state = (parts[2] || 'TX').replace(/\s*\d{5}(-\d{4})?$/, '') || 'TX';
    const place = cityName ? `${cityName}, ${state}` : '';
    const city = p.area && p.area.toLowerCase() !== cityName.toLowerCase() ? [p.area, place].filter(Boolean).join(', ') : place;
    // A price shows only for homes that are still for sale, and only when the sheet lists one on the first line of the description.
    const first = (p.description || '').split('\n')[0] || '';
    const pm = /\$\s?(\d[\d,]{4,})(?:\s+as listed\s+([A-Za-z]+ \d{1,2}, \d{4}))?/.exec(first);
    const forSale = status === 'active' || status === 'new construction';
    const m = media(p);
    const link = /^https?:\/\//.test(p.website || '') ? p.website : '';
    return {
      slug: p.slug, address: p.name, city, status, price: pm && forSale ? '$' + pm[1] : '', priceNote: pm && forSale && pm[2] ? 'as listed ' + pm[2] : '',
      facts: factsFrom(p.typicalHomes), summary: shorten(text), photo: m ? m.src : '', alt: m ? m.alt || p.name : p.name,
      link, linkLabel: status === 'new construction' ? 'View the community' : 'View listing',
    };
  })
  .filter((l) => ORDER.includes(l.status))
  .sort((a, b) => ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || a.address.localeCompare(b.address))
  .map((l) => ({ ...l, status: LABEL[l.status] }));
