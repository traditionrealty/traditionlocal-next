// tl-forms: handles the Ask Dillon and Contact forms for Tradition Local.
// It is its own Cloudflare Worker, so it never touches the newsletter Worker.
//
// Create a Worker named tl-forms, paste this file in, then add these settings
// (Workers and Pages, tl-forms, Settings, Variables and Secrets):
//   RESEND_API_KEY   Secret. Your Resend API key.
//   ALLOWED_ORIGINS  Text. https://traditionrealty.github.io,https://www.traditionlocal.com,https://traditionlocal.com
//   FROM             Text. Tradition Local <noreply@mail.traditionlocals.com>
//   ASK_TO           Text. Where Ask Dillon requests are emailed.
//   CONTACT_TO       Text. Where Contact messages are emailed.
//   REPLY_TO         Text. The address people can reply to.
//   SUPABASE_URL     Text. Your Supabase project address.
//   SUPABASE_KEY     Text. Your Supabase publishable key.
//   SIGNUP_URL       Text. https://tl-newsletter-signup.bold-bush-f938.workers.dev
//   SITE_URL         Text. https://www.traditionlocal.com
// Run supabase/requests.sql once in Supabase, so requests have a place to be saved.

const MAX_BODY = 20000;
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const REASONS = ['A question', 'Suggest a place', 'List an event', 'Partnerships or press', 'Something else'];

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, n);
const list = (v, n, each) => (Array.isArray(v) ? v : []).map((x) => clean(x, each)).filter(Boolean).slice(0, n);
const host = (s) => { try { return new URL(/^https?:/.test(s) ? s : 'https://' + s).hostname; } catch (e) { return ''; } };

function cors(req, env) {
  const origin = req.headers.get('Origin') || '';
  const allowed = new Set(String(env.ALLOWED_ORIGINS || '').split(',').map((s) => host(s.trim())).filter(Boolean));
  const ok = !!origin && allowed.has(host(origin));
  return { ok, headers: { 'Access-Control-Allow-Origin': ok ? origin : 'null', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' } };
}
const reply = (body, status, headers) => new Response(JSON.stringify(body), { status, headers: { ...headers, 'Content-Type': 'application/json' } });

async function send(env, msg) {
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(msg) });
  if (!r.ok) throw new Error('resend ' + r.status);
}
async function save(env, row) {
  const r = await fetch(String(env.SUPABASE_URL).replace(/\/$/, '') + '/rest/v1/requests', { method: 'POST', headers: { apikey: env.SUPABASE_KEY, Authorization: 'Bearer ' + env.SUPABASE_KEY, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(row) });
  if (!r.ok) throw new Error('supabase ' + r.status);
}
async function subscribe(env, email, site) {
  if (!env.SIGNUP_URL) return;
  try { await fetch(env.SIGNUP_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'email=' + encodeURIComponent(email) + '&company=&return=' + encodeURIComponent(site + '/'), redirect: 'manual' }); } catch (e) { /* the signup is a bonus, never block the request */ }
}
const table = (pairs) => '<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:15px">' + pairs.filter((p) => p[1]).map(([k, v]) => '<tr><td style="padding:6px 16px 6px 0;color:#5F6672;vertical-align:top">' + esc(k) + '</td><td style="padding:6px 0;color:#1D1A6D">' + esc(v).replace(/\n/g, '<br>') + '</td></tr>').join('') + '</table>';

async function ask(d, env, ctx, headers) {
  const first = clean(d.first_name, 80), email = clean(d.email, 160).toLowerCase(), note = clean(d.note, 2000);
  const areas = list(d.areas, 12, 60), topics = list(d.topics, 12, 60), address = clean(d.address, 200), wantsLoop = d.subscribe === true;
  if (!first || !EMAIL.test(email) || !areas.length) return reply({ ok: false, error: 'invalid' }, 422, headers);
  const row = { kind: 'ask', name: first, email, message: note, details: { areas, topics, address, subscribe: wantsLoop } };
  const html = table([['Name', first], ['Email', email], ['Areas', areas.join(', ')], ['Topics', topics.join(', ')], ['Address', address], ['Note', note], ['Also wants In the Loop', wantsLoop ? 'Yes' : 'No']]);
  const done = await Promise.allSettled([save(env, row), send(env, { from: env.FROM, to: env.ASK_TO, reply_to: email, subject: 'New Ask Dillon request from ' + first, html })]);
  if (done.every((x) => x.status === 'rejected')) return reply({ ok: false, error: 'unavailable' }, 502, headers);
  const site = String(env.SITE_URL || 'https://www.traditionlocal.com').replace(/\/$/, '');
  ctx.waitUntil(send(env, { from: env.FROM, to: email, reply_to: env.REPLY_TO, subject: 'Your request is in', html: '<p>Hi ' + esc(first) + ',</p><p>Thank you for reaching out. Dillon reads every request and will reply personally.</p><p>While you wait, you can explore neighborhoods at <a href="' + site + '/neighborhoods">' + site + '/neighborhoods</a>.</p><p>Tradition Local</p>' }).catch(() => {}));
  if (wantsLoop) ctx.waitUntil(subscribe(env, email, site));
  return reply({ ok: true }, 200, headers);
}

async function contact(d, env, ctx, headers) {
  const name = clean(d.name, 100), email = clean(d.email, 160).toLowerCase(), message = clean(d.message, 3000);
  const reason = REASONS.includes(clean(d.reason, 60)) ? clean(d.reason, 60) : 'Something else';
  if (!name || !EMAIL.test(email) || message.length < 3) return reply({ ok: false, error: 'invalid' }, 422, headers);
  const row = { kind: 'contact', name, email, message, details: { reason } };
  const html = table([['Name', name], ['Email', email], ['About', reason], ['Message', message]]);
  const done = await Promise.allSettled([save(env, row), send(env, { from: env.FROM, to: env.CONTACT_TO, reply_to: email, subject: 'New message from ' + name + ': ' + reason, html })]);
  if (done.every((x) => x.status === 'rejected')) return reply({ ok: false, error: 'unavailable' }, 502, headers);
  ctx.waitUntil(send(env, { from: env.FROM, to: email, reply_to: env.REPLY_TO, subject: 'We got your message', html: '<p>Hi ' + esc(name) + ',</p><p>Thank you for writing to Tradition Local. We read every message and will reply soon.</p><p>Tradition Local</p>' }).catch(() => {}));
  return reply({ ok: true }, 200, headers);
}

export default {
  async fetch(req, env, ctx) {
    const { ok, headers } = cors(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: ok ? 204 : 403, headers });
    const path = new URL(req.url).pathname.replace(/\/+$/, '');
    if (req.method !== 'POST' || !ok || (path !== '/ask' && path !== '/contact')) return reply({ ok: false }, ok ? 404 : 403, headers);
    let data;
    try { const txt = await req.text(); if (txt.length > MAX_BODY) throw new Error('too big'); data = JSON.parse(txt); } catch (e) { return reply({ ok: false, error: 'bad_request' }, 400, headers); }
    if (!data || typeof data !== 'object') return reply({ ok: false, error: 'bad_request' }, 400, headers);
    if (clean(data.company, 50)) return reply({ ok: true }, 200, headers);
    return path === '/ask' ? ask(data, env, ctx, headers) : contact(data, env, ctx, headers);
  }
};
