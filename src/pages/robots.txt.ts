import { IS_PREVIEW } from '../lib/data';
export function GET() {
  // The preview must not appear in search results. Production allows everything.
  return new Response(IS_PREVIEW ? 'User-agent: *\nDisallow: /\n' : 'User-agent: *\nAllow: /\n', { headers: { 'Content-Type': 'text/plain' } });
}
