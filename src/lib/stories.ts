// Stories are Content rows of type Article. Newest first.
import { content, dateText } from './data';
import type { Content } from './data';

const toTime = (s: string) => { const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s || ''); return m ? new Date(+m[3], +m[1] - 1, +m[2]).getTime() : 0; };
export const stories = (): Content[] => content.filter((c) => c.type === 'Article').sort((a, b) => toTime(b.reviewDate) - toTime(a.reviewDate));
export const storyDate = (s: Content) => (s.reviewDate ? dateText(s.reviewDate) : '');
export const readMinutes = (s: Content) => Math.max(1, Math.round(s.body.split(/\s+/).filter(Boolean).length / 200));
export const TOPIC_NAMES: Record<string, string> = { food: 'Food', neighborhoods: 'Neighborhoods', travel: 'Travel', spotlight: 'Spotlight', announcement: 'Announcements', newsletter: 'Newsletter' };
export const topicName = (t: string) => TOPIC_NAMES[t] || t.charAt(0).toUpperCase() + t.slice(1);
// Plain text bodies: blank lines separate paragraphs, "## " starts a heading, "- " starts a list.
export function blocks(body: string): { kind: 'h' | 'p' | 'ul'; text: string; items?: string[] }[] {
  return body.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean).map((b) => {
    if (/^#{1,3}\s/.test(b)) return { kind: 'h' as const, text: b.replace(/^#{1,3}\s+/, '') };
    const lines = b.split('\n');
    if (lines.every((l) => /^[-*]\s+/.test(l.trim()))) return { kind: 'ul' as const, text: '', items: lines.map((l) => l.trim().replace(/^[-*]\s+/, '')) };
    return { kind: 'p' as const, text: b.replace(/\n/g, ' ') };
  });
}
