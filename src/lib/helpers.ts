// Shared lookups and groupings for the page types.
import { profiles, content, ofType, reviewsFor, stars } from './data';
import type { Profile, Content } from './data';

export const norm = (s: string) => (s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '');
// Some older rows keep lists as ['A', 'B']. Show them as plain text.
export const cleanList = (s: string) => (s || '').replace(/^\[|\]$/g, '').replace(/['"]/g, '').replace(/\s*,\s*/g, ', ').trim();

export const AREA_TYPES = ['Neighborhood', 'City', 'Area'];
export const areaPages = () => ofType(...AREA_TYPES);
export const bizIn = (name: string) => profiles.filter((p) => p.type === 'Business' && p.area === name);
export const subsIn = (name: string) => profiles.filter((p) => p.type === 'Subdivision' && p.area === name);
export const placesIn = (name: string) => profiles.filter((p) => p.type === 'Place' && p.area === name);
export const topRating = (name: string) => reviewsFor(name).reduce((m, r) => Math.max(m, stars(r.rating)), 0);
export const category = (p: Profile) => p.tags[0] || p.subCategory || '';

// Food groupings
const has = (cat: string, words: string[]) => { const c = cat.toLowerCase(); return words.some((w) => c.includes(w)); };
export const FOOD_TABS: [string, string][] = [['all', 'All food and drink'], ['coffee', 'Coffee and cafes'], ['restaurant', 'Restaurants'], ['sweets', 'Bakeries and sweets'], ['market', 'Markets']];
export function foodTab(p: Profile): string {
  const c = category(p);
  if (has(c, ['coffee', 'tea', 'cafe', 'roaster'])) return 'coffee';
  if (has(c, ['bakery', 'bakeries', 'dessert', 'donut', 'ice cream', 'frozen yogurt', 'creper', 'candy', 'chocolate', 'cake'])) return 'sweets';
  if (has(c, ['market', 'grocery', 'butcher', 'farmers'])) return 'market';
  return 'restaurant';
}
export const WORLD: [string, string][] = [['all', 'All'], ['asia', 'Asian'], ['mideast', 'Middle Eastern and Mediterranean'], ['latin', 'Latin American and Caribbean'],
  ['europe', 'European'], ['america', 'American and Southern'], ['africa', 'African']];
const REGION_WORDS: Record<string, string[]> = {
  asia: ['thai', 'vietnam', 'chinese', 'japan', 'korea', 'indian', 'sushi', 'ramen', 'noodle', 'dim sum', 'asian', 'taiwan', 'malay', 'filipin', 'pho', 'pakistan', 'hot pot', 'dumpling'],
  mideast: ['middle eastern', 'mediterranean', 'persian', 'iranian', 'halal', 'turkish', 'greek', 'lebanese', 'moroccan', 'afghan', 'falafel', 'kebab'],
  latin: ['mexican', 'tex-mex', 'taco', 'latin', 'cuban', 'peru', 'argentin', 'caribbean', 'salvador', 'venezuel', 'colombia', 'brazil', 'empanada'],
  europe: ['french', 'italian', 'german', 'spanish', 'creper', 'pizza', 'british', 'polish', 'czech', 'european', 'tapas'],
  america: ['american', 'southern', 'bbq', 'barbecue', 'burger', 'diner', 'cajun', 'creole', 'steak', 'brunch', 'breakfast', 'sandwich', 'chicken', 'seafood'],
  africa: ['ethiopian', 'nigerian', 'african', 'senegal', 'ghana'],
};
export function cuisineRegion(p: Profile): string {
  const c = category(p).toLowerCase(); if (!c) return '';
  for (const [r, words] of Object.entries(REGION_WORDS)) if (words.some((w) => c.includes(w))) return r;
  return '';
}

// Things to do
export const venuePlace = (e: Content) => { const k = norm(e.profile || e.venue); return k ? profiles.find((p) => p.type === 'Place' && norm(p.name) === k) : undefined; };
export const eventsAtPlace = (pl: Profile) => content.filter((c) => c.type === 'Event' && (norm(c.profile) === norm(pl.name) || (c.venue && norm(c.venue.split(',')[0]) === norm(pl.name))));
export const REGIONS = ['Central', 'West', 'North', 'South', 'East', 'Suburbs', 'Coast'];
