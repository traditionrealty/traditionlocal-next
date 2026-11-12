// The businesses the Local Directory search reads. Built with the site, so it always matches what is published.
import { businesses, isClosed, href, reviewsFor } from '../lib/data';
import { category, isFood, topRating } from '../lib/helpers';

const rows = businesses()
  .filter((b) => !isClosed(b))
  .map((b) => ({ n: b.name, k: category(b), a: b.area || '', u: href(b), f: isFood(b) ? 1 : 0, r: reviewsFor(b.name).length ? 1 : 0, s: topRating(b.name) }))
  .sort((a, b) => a.n.localeCompare(b.n));

export const GET = () => new Response(JSON.stringify(rows), { headers: { 'Content-Type': 'application/json' } });
