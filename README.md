# Tradition Local, next site

A redesign built from the "Simple Master" Google Sheet. The live site is not touched by this repo.

## How it works
1. The sheet's Profiles and Content tabs are exported as two CSV files with approved public fields only.
2. The files live in `data/profiles.csv` and `data/content.csv`.
3. `src/lib/data.ts` reads them. Pages are built from the rows: Food, Reviews, Neighborhoods, Things to do, and more.
4. GitHub Actions builds and publishes the site.

## Modes
- `SITE_MODE=preview` (default): shows drafts, hides nothing, adds a "Draft preview" ribbon and blocks search engines.
- `SITE_MODE=production`: shows only rows marked Published and media marked Approved.

## Public export columns (the contract for the sheet exporter)
profiles.csv: slug, name, type, area, summary, description, status, address, website, phone, postal_city, hero_image, hero_alt,
hero_credit, hero_rights, gallery, video, faqs, typical_homes, local_take, best_for, school_district, zip_codes, region,
sub_category, tags, show_living, show_reviews, show_nearby, show_events, show_newsletter, show_faq, show_media, page_status

content.csv: slug, type, title, profile, summary, body, author, review_date, rating, hero_image, hero_alt, hero_credit, hero_rights,
gallery, video, starts, ends, timezone, event_link, faqs, cost, venue_name, address, city, zip_code, event_type, start_time,
end_time, tags, show_media, show_faq, page_status

Never exported: editor notes, sources, example flags, record IDs, media notes and rights notes.
Lists (gallery, tags) are separated with a vertical bar. FAQs are a question line, then an answer, with a blank line between pairs.

## Page addresses
Food `/food/[slug]`, reviews `/reviews/[slug]`, places `/things-to-do/[slug]`, events `/events/[slug]`,
neighborhoods, cities and areas `/neighborhoods/[slug]`, subdivisions `/subdivisions/[slug]`.
