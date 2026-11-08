// Dillon's own featured listings. One row per home in data/listings.csv.
// Example rows (example = yes) show only in the draft preview, never on the live site.
import { readTable, IS_PREVIEW } from './data';

export type Listing = { address: string; city: string; price: string; status: string; facts: string; summary: string; photo: string; link: string; example: boolean };

const money = (v: string) => { const n = Number(String(v || '').replace(/[^0-9.]/g, '')); return n ? '$' + n.toLocaleString('en-US') : ''; };
const SHOW = ['active', 'coming soon', 'under contract'];
const plural = (n: string, one: string, many: string) => (n ? n + ' ' + (Number(n) === 1 ? one : many) : '');

export const listings: Listing[] = readTable('listings.csv')
  .filter((r) => r.address && SHOW.includes((r.status || '').trim().toLowerCase()))
  .filter((r) => IS_PREVIEW || !/^(yes|true)$/i.test((r.example || '').trim()))
  .map((r) => ({
    address: r.address, city: r.city, price: money(r.price), status: r.status.trim(),
    facts: [plural(r.beds, 'bed', 'beds'), plural(r.baths, 'bath', 'baths'), r.sqft ? Number(r.sqft).toLocaleString('en-US') + ' sq ft' : ''].filter(Boolean).join(', '),
    summary: r.summary || '', photo: /^https:\/\/(?!drive\.google)/.test(r.photo || '') || /^\//.test(r.photo || '') ? r.photo : '', link: /^https?:\/\//.test(r.link || '') ? r.link : '',
    example: /^(yes|true)$/i.test((r.example || '').trim()),
  }));
