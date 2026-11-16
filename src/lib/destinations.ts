// Featured destinations for the Destinations page spotlight and the International Clients page.
// One row per place in data/destinations.csv. status: ready (the guide is open) or soon. A row with status hidden is skipped.
// featured = yes marks the big spotlight card on the International Clients page. guide is the page path, for example /portugal.
import { readTable } from './data';

export type Dest = { city: string; country: string; region: string; tags: string[]; guide: string; ready: boolean; featured: boolean; color: string };

const tints = ['#FFE29A', '#E6EEF8', '#E8F5EC', '#FFF4D6'];

export const destinations: Dest[] = readTable('destinations.csv')
  .filter((r) => r.city && !/^hid/i.test((r.status || '').trim()))
  .map((r, i) => {
    const ready = /^ready$/i.test((r.status || '').trim()) && !!(r.guide || '').trim();
    return {
      city: r.city.trim(), country: (r.country || '').trim(), region: (r.region || '').trim(),
      tags: (r.tags || '').split('|').map((t) => t.trim()).filter(Boolean),
      guide: ready ? r.guide.trim() : '', ready, featured: /^(yes|true)$/i.test((r.featured || '').trim()),
      color: (r.color || '').trim() || tints[i % tints.length],
    };
  });
