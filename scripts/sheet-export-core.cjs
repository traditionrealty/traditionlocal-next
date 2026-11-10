// Turns rows from the Simple Master sheet into the two public data files the site reads.
// Plain functions only, so the same code runs inside the sheet (Apps Script) and in Node for tests.
// Private columns (editor notes, sources, record IDs, example flags, media notes) are never copied.

var PROFILE_COLUMNS = ['slug', 'name', 'type', 'area', 'summary', 'description', 'status', 'address', 'website', 'phone', 'postal_city', 'hero_image', 'hero_alt',
  'hero_credit', 'hero_rights', 'gallery', 'video', 'faqs', 'typical_homes', 'local_take', 'best_for', 'school_district', 'zip_codes', 'region', 'sub_category', 'tags',
  'show_living', 'show_reviews', 'show_nearby', 'show_events', 'show_newsletter', 'show_faq', 'show_media', 'page_status'];
var CONTENT_COLUMNS = ['slug', 'type', 'title', 'profile', 'summary', 'body', 'author', 'review_date', 'rating', 'hero_image', 'hero_alt', 'hero_credit', 'hero_rights',
  'gallery', 'video', 'starts', 'ends', 'timezone', 'event_link', 'faqs', 'cost', 'venue_name', 'address', 'city', 'zip_code', 'event_type', 'start_time', 'end_time',
  'tags', 'show_media', 'show_faq', 'page_status'];

function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
// Editor notes hold a few public facts as "Key: value" lines. Only these keys are read, nothing else leaves the sheet.
function noteValue(notes, key) {
  var lines = String(notes || '').split('\n');
  for (var i = 0; i < lines.length; i++) {
    var m = lines[i].match(/^\s*([A-Za-z_ ]+?)\s*:\s*(.*)$/);
    if (m && m[1].toLowerCase() === key.toLowerCase()) return m[2].trim();
  }
  return '';
}
function cleanZip(z) { return String(z || '').replace(/\.0\b/g, '').trim(); }
function lower(v) { return String(v || '').trim().toLowerCase(); }

// rows: array of objects keyed by the sheet's header names. options: { mode: 'preview' | 'production' }
function toPublicProfiles(rows, options) {
  var production = options && options.mode === 'production';
  var out = [];
  rows.forEach(function (r) {
    if (!String(r['Name'] || '').trim()) return;
    if (production && (lower(r['Page']) !== 'published' || lower(r['Example']) === 'yes')) return;
    var n = r['Editor notes'];
    out.push({
      slug: r['Slug'] || slugify(r['Name']), name: r['Name'], type: r['Profile type'], area: r['Area'], summary: r['Summary'], description: r['Full description'],
      status: r['Business status'], address: r['Address'], website: r['Website'], phone: r['Phone'], postal_city: r['Postal city'],
      hero_image: r['Hero image'], hero_alt: r['Image alt text'], hero_credit: r['Media credit'], hero_rights: r['Media rights'], gallery: r['Gallery'], video: r['Video'],
      faqs: r['FAQs'], typical_homes: r['Typical homes'], local_take: r['Local take'], best_for: noteValue(n, 'Best For'), school_district: noteValue(n, 'School District'),
      zip_codes: cleanZip(noteValue(n, 'Zip Codes')), region: noteValue(n, 'Region'), sub_category: noteValue(n, 'Sub Category'), tags: noteValue(n, 'Tags'),
      show_living: r['Living section'], show_reviews: r['Reviews section'], show_nearby: r['Nearby section'], show_events: r['Events section'],
      show_newsletter: r['Newsletter section'], show_faq: r['FAQ section'], show_media: r['Media section'], page_status: r['Page']
    });
  });
  return out;
}
function toPublicContent(rows, options) {
  var production = options && options.mode === 'production';
  var out = [];
  rows.forEach(function (r) {
    if (!String(r['Title'] || '').trim()) return;
    if (production && (lower(r['Page']) !== 'published' || lower(r['Example']) === 'yes')) return;
    var n = r['Editor notes'];
    out.push({
      slug: r['Slug'] || slugify(r['Title']), type: r['Content type'], title: r['Title'], profile: r['Profile'], summary: r['Summary'], body: r['Body'], author: r['Author'],
      review_date: dateText(r['Original review date']), rating: r['Rating'], hero_image: r['Hero image'], hero_alt: r['Image alt text'], hero_credit: r['Media credit'],
      hero_rights: r['Media rights'], gallery: r['Gallery'], video: r['Video'], starts: dateText(r['Starts']), ends: dateText(r['Ends']), timezone: r['Time zone'],
      event_link: r['Event link'], faqs: r['FAQs'], cost: noteValue(n, 'cost'), venue_name: noteValue(n, 'venue_name'), address: noteValue(n, 'address'),
      city: noteValue(n, 'city'), zip_code: cleanZip(noteValue(n, 'zip_code')), event_type: noteValue(n, 'event_type'), start_time: noteValue(n, 'start_time'),
      end_time: noteValue(n, 'end_time'), tags: noteValue(n, 'tags'), show_media: r['Media section'], show_faq: r['FAQ section'], page_status: r['Page']
    });
  });
  return out;
}
// Dates may arrive as real dates (from the sheet) or as text. The site reads M/D/YYYY.
function dateText(v) {
  if (v === null || v === undefined || v === '') return '';
  if (Object.prototype.toString.call(v) === '[object Date]') return (v.getMonth() + 1) + '/' + v.getDate() + '/' + v.getFullYear();
  return String(v).trim();
}
var EVENT_COLUMNS = ['slug', 'title', 'profile', 'summary', 'body', 'author', 'hero_image', 'hero_alt', 'hero_credit', 'hero_rights', 'gallery', 'video',
  'starts', 'ends', 'timezone', 'event_link', 'faqs', 'cost', 'venue_name', 'address', 'city', 'zip_code', 'event_type', 'start_time', 'end_time', 'tags',
  'show_media', 'show_faq', 'page_status'];

// Events have their own tab. Venue, address, times and cost come from their own columns.
// Older rows that keep them as "key: value" lines in Editor notes still work.
function toPublicEvents(rows, options) {
  var production = options && options.mode === 'production';
  var out = [];
  rows.forEach(function (r) {
    if (!String(r['Title'] || '').trim()) return;
    if (production && (lower(r['Page']) !== 'published' || lower(r['Example']) === 'yes')) return;
    var n = r['Editor notes'];
    function pick(col, key) { return String(r[col] || '').trim() || noteValue(n, key); }
    out.push({
      type: 'Event', slug: r['Slug'] || slugify(r['Title']), title: r['Title'], profile: r['Profile'], summary: r['Summary'], body: r['Body'], author: r['Author'],
      hero_image: r['Hero image'], hero_alt: r['Image alt text'], hero_credit: r['Media credit'], hero_rights: r['Media rights'], gallery: r['Gallery'], video: r['Video'],
      starts: dateText(r['Starts']), ends: dateText(r['Ends']), timezone: r['Time zone'], event_link: r['Event link'], faqs: r['FAQs'],
      cost: pick('Cost', 'cost'), venue_name: pick('Venue', 'venue_name'), address: pick('Address', 'address'), city: pick('City', 'city'),
      zip_code: cleanZip(pick('Zip code', 'zip_code')), event_type: pick('Event type', 'event_type'), start_time: pick('Start time', 'start_time'),
      end_time: pick('End time', 'end_time'), tags: pick('Tags', 'tags'), show_media: r['Media section'], show_faq: r['FAQ section'], page_status: r['Page']
    });
  });
  return out;
}

function csvCell(v) {
  var s = (v === null || v === undefined) ? '' : String(v);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function toCSV(rows, columns) {
  var lines = [columns.join(',')];
  rows.forEach(function (r) { lines.push(columns.map(function (c) { return csvCell(r[c]); }).join(',')); });
  return lines.join('\n') + '\n';
}
if (typeof module !== 'undefined') module.exports = { PROFILE_COLUMNS: PROFILE_COLUMNS, CONTENT_COLUMNS: CONTENT_COLUMNS, toPublicProfiles: toPublicProfiles, toPublicContent: toPublicContent, toPublicEvents: toPublicEvents, EVENT_COLUMNS: EVENT_COLUMNS, toCSV: toCSV, slugify: slugify };
