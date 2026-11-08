// Local videos. Two sources, merged: video links pasted into the Video column of any sheet row,
// and the channel list in data/videos.csv. Newest first.
import { readTable, profiles, href } from './data';

export type Video = {
  id: string; title: string; display: string; duration: string; source: string;
  tour: boolean; thumb: string; place: string; placeName: string;
};

const ytId = (u: string) => (String(u || '').match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/))([\w-]{11})/) || [])[1] || '';
const norm = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '');
// A tidy title for the page: no hashtags or emoji. The full title stays on YouTube.
const clean = (t: string) => t.replace(/#\w+/g, '').replace(/[\p{Extended_Pictographic}\u200d\ufe0f\u{1F1E6}-\u{1F1FF}]/gu, '').replace(/\s+/g, ' ').replace(/\s*\|\s*(?=\||$)/g, '').replace(/\s*[|]\s*$/, '').trim();

const places = profiles.filter((p) => ['Business', 'Place'].includes(p.type) && norm(p.name).length >= 7);
const findPlace = (title: string, named: string) => {
  const direct = named ? profiles.find((p) => p.name === named) : undefined;
  if (direct) return direct;
  const t = norm(title);
  return places.filter((p) => t.includes(norm(p.name))).sort((a, b) => norm(b.name).length - norm(a.name).length)[0];
};
const make = (id: string, title: string, duration: string, source: string, named: string): Video => {
  const p = findPlace(title, named);
  return { id, title, display: clean(title) || title, duration, source, tour: /walking tour|tour|spotlight/i.test(title), thumb: 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg', place: p ? href(p) : '', placeName: p ? p.name : '' };
};

// Links pasted on a sheet row (Profiles or Content), shown first.
const fromSheet: Video[] = [];
const seen = new Set<string>();
for (const r of [...readTable('profiles.csv').map((x) => ({ title: x.name, named: x.name, video: x.video })), ...readTable('content.csv').map((x) => ({ title: x.title, named: x.profile, video: x.video }))]) {
  for (const u of (r.video || '').split(/[\n|;,\s]+/)) {
    const id = ytId(u); if (!id || seen.has(id)) continue;
    seen.add(id); fromSheet.push(make(id, r.title || r.named, '', 'Sheet', r.named));
  }
}
const fromChannel: Video[] = readTable('videos.csv').filter((r) => r.id && r.title && !seen.has(r.id)).map((r) => { seen.add(r.id); return make(r.id, r.title, r.duration, r.source, r.profile); });
export const videos: Video[] = [...fromSheet, ...fromChannel];
