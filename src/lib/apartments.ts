// Apartment communities. One row per community in data/apartments.csv.
// Example rows (example = yes) show only in the draft preview, never on the live site.
import { readTable, IS_PREVIEW } from './data';

export type Apartment = { name: string; area: string; city: string; from: number; fromText: string; rentLine: string; beds: string[]; bedsLine: string; pets: boolean; summary: string; photo: string; link: string; example: boolean; search: string };

const num = (v: string) => Number(String(v || '').replace(/[^0-9.]/g, '')) || 0;
const money = (n: number) => '$' + n.toLocaleString('en-US');
const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '...' : s);

export const apartments: Apartment[] = readTable('apartments.csv')
  .filter((r) => r.name)
  .filter((r) => IS_PREVIEW || !/^(yes|true)$/i.test((r.example || '').trim()))
  .map((r) => {
    const shown = String(r.beds || '').split(/[|;]/).map((t) => t.trim()).filter(Boolean);
    const beds = [...new Set(shown.map((t) => (/^studio$/i.test(t) ? 'studio' : Number(t) >= 3 ? '3' : t)))];
    const from = num(r.rent_from), to = num(r.rent_to);
    return {
      name: r.name, area: r.area || '', city: r.city || '', from, fromText: from ? money(from) : '',
      rentLine: from && to && to !== from ? money(from) + ' to ' + money(to) + ' a month' : from ? 'From ' + money(from) + ' a month' : '',
      beds, bedsLine: shown.length ? shown.join(', ') + (shown.some((t) => !/^studio$/i.test(t)) ? ' bedrooms' : '') : '',
      pets: /^(yes|true)$/i.test((r.pets || '').trim()), summary: clip(r.summary || '', 150),
      photo: /^https:\/\/(?!drive\.google)/.test(r.photo || '') ? r.photo : '', link: /^https?:\/\//.test(r.link || '') ? r.link : '',
      example: /^(yes|true)$/i.test((r.example || '').trim()),
      search: [r.name, r.area, r.city, r.address].join(' ').toLowerCase(),
    };
  })
  .sort((a, b) => a.name.localeCompare(b.name));
