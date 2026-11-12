// The real estate feed on the Tradition Realty Group page.
// Written updates come from data/realestate.csv (example = yes rows show only in the draft preview).
// Articles and guides from the Content tab join them when the Author is Tradition Realty Group.
// They are mixed with the latest videos from Dillon Loren and Tradition Realty Group.
import { readTable, IS_PREVIEW, url, posts as contentPosts, href } from './data';
import { channelVideos } from './videos';
import type { Video } from './videos';

export type Post = { title: string; summary: string; link: string; external: boolean; date: string; ts: number; label: string; source: string; example: boolean };
export type FeedItem = { type: 'post'; post: Post } | { type: 'video'; v: Video };

const clip = (s: string, n: number) => { const t = (s || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n).replace(/\s+\S*$/, '') + '...' : t; };
const when = (s: string) => {
  const t = String(s || '').trim();
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t), iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(t);
  const d = us ? new Date(+us[3], +us[1] - 1, +us[2]) : iso ? new Date(+iso[1], +iso[2] - 1, +iso[3]) : null;
  return d && !isNaN(+d) ? +d : 0;
};
const show = (ms: number) => (ms ? new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '');

const updates: Post[] = readTable('realestate.csv')
  .filter((r) => r.title)
  .filter((r) => IS_PREVIEW || !/^(yes|true)$/i.test((r.example || '').trim()))
  .map((r) => {
    const ext = /^https?:\/\//.test(r.link || '');
    return { title: r.title, summary: clip(r.summary, 200), link: ext ? r.link : /^\//.test(r.link || '') ? url(r.link) : '', external: ext, date: show(when(r.date)), ts: when(r.date), label: r.kind || 'Update', source: r.source || '', example: /^(yes|true)$/i.test((r.example || '').trim()) };
  })
  .sort((a, b) => b.ts - a.ts);

// Every Article or Guide in the Content tab written by Tradition Realty Group. It links to its own page on the site.
const articles: Post[] = contentPosts()
  .filter((c) => /^tradition realty group$/i.test((c.author || '').trim()))
  .map((c) => ({ title: c.title, summary: clip(c.summary || c.body, 200), link: href(c), external: false, date: show(when(c.reviewDate)), ts: when(c.reviewDate), label: c.type, source: '', example: false }));

const posts: Post[] = [...updates, ...articles].sort((a, b) => b.ts - a.ts);

const vids: Video[] = ['dillon', 'trg'].map((k) => (channelVideos.find((c) => c.key === k)?.videos || []).slice(0, 3));
const videos: Video[] = [];
for (let i = 0; i < 3; i++) for (const list of vids) if (list[i]) videos.push(list[i]);

export const feed: FeedItem[] = [];
for (let i = 0; i < Math.max(posts.length, videos.length); i++) {
  if (posts[i]) feed.push({ type: 'post', post: posts[i] });
  if (videos[i]) feed.push({ type: 'video', v: videos[i] });
}
export const feedHasPosts = posts.length > 0, feedHasVideos = videos.length > 0;
