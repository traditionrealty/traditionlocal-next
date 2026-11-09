// The draft preview must not appear in search results. Live mode allows everything except private pages, and points to the sitemap.
import { IS_PREVIEW, url } from '../lib/data';
export function GET({ site }: { site?: URL }) {
  const map = new URL(url('/sitemap.xml'), site || new URL('https://www.traditionlocal.com')).href;
  const body = IS_PREVIEW
    ? 'User-agent: *\nDisallow: /\n'
    : 'User-agent: *\nAllow: /\nDisallow: ' + url('/account') + '\nDisallow: ' + url('/locally') + '\nDisallow: ' + url('/search') + '\n\nSitemap: ' + map + '\n';
  return new Response(body, { headers: { 'Content-Type': 'text/plain' } });
}
