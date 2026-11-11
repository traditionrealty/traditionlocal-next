// Shared lookups and groupings for the page types.
import { profiles, content, ofType, reviewsFor, stars, isClosed } from './data';
import type { Profile, Content } from './data';

export const norm = (s: string) => (s || '').toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '');
// Some older rows keep lists as ['A', 'B']. Show them as plain text.
export const cleanList = (s: string) => (s || '').replace(/^\[|\]$/g, '').replace(/['"]/g, '').replace(/\s*,\s*/g, ', ').trim();

export const AREA_TYPES = ['Neighborhood', 'City', 'Area'];
export const areaPages = () => ofType(...AREA_TYPES);
export const bizIn = (name: string) => profiles.filter((p) => p.type === 'Business' && p.area === name && !isClosed(p));
export const subsIn = (name: string) => profiles.filter((p) => p.type === 'Subdivision' && p.area === name);
export const placesIn = (name: string) => profiles.filter((p) => p.type === 'Place' && p.area === name && !isClosed(p));
export const topRating = (name: string) => reviewsFor(name).reduce((m, r) => Math.max(m, stars(r.rating)), 0);
// Tags come from the sheet as slugs like coffee-and-tea. Show them as plain words.
export const category = (p: Profile) => {
  const raw = (p.tags[0] || p.subCategory || '').replace(/-/g, ' ').replace(/\band\b/g, '&').trim();
  return raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : '';
};

// The Business type also holds salons, shops, and services. Food pages only use food and drink.
const FOOD_WORDS = ['restaurant', 'food', 'cafe', 'coffee', 'bakery', 'bakeries', 'dessert', 'donut', 'doughnut', 'ice cream', 'frozen yogurt', 'creper', 'candy', 'chocolate', 'cake', 'cookie', 'brew', 'juice', 'smoothie',
  'deli', 'grocery', 'supermarket', 'farmers market', 'butcher', 'catering', 'brunch', 'breakfast', 'sandwich', 'pizza', 'burger', 'bbq', 'barbecue', 'sushi', 'steak', 'seafood', 'noodle', 'buffet', 'grill', 'eatery',
  'diner', 'bistro', 'tavern', 'wine', 'cocktail', 'vegan', 'vegetarian', 'boba', 'bubble tea', 'tapas', 'taco', 'wings', 'chicken', 'gelato', 'tea room', 'bagel', 'pancake', 'waffle', 'dumpling', 'soup', 'salad', 'lounge',
  'thai', 'vietnam', 'chinese', 'japan', 'korea', 'indian', 'ramen', 'dim sum', 'asian', 'taiwan', 'malay', 'filipin', 'pakistan', 'hot pot', 'middle eastern', 'mediterranean', 'persian', 'iranian', 'halal', 'turkish', 'greek',
  'lebanese', 'moroccan', 'afghan', 'falafel', 'kebab', 'mexican', 'tex-mex', 'tex mex', 'latin', 'cuban', 'peru', 'argentin', 'caribbean', 'salvador', 'venezuel', 'colombia', 'brazil', 'empanada', 'french', 'italian', 'german', 'spanish',
  'british', 'polish', 'czech', 'european', 'american', 'southern', 'cajun', 'creole', 'ethiopian', 'nigerian', 'african'];
const FOOD_TOKENS = new Set(['bar', 'bars', 'pub', 'pubs', 'tea', 'pho', 'deli']);
export function isFood(p: Profile): boolean {
  const c = (p.tags.join(' ') + ' ' + p.subCategory).toLowerCase();
  if (!c.trim()) return false;
  return FOOD_WORDS.some((w) => c.includes(w)) || c.split(/[^a-z-]+/).some((t) => FOOD_TOKENS.has(t));
}
export const foodIn = (name: string) => bizIn(name).filter(isFood);

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
  latin: ['mexican', 'tex-mex', 'tex mex', 'taco', 'latin', 'cuban', 'peru', 'argentin', 'caribbean', 'salvador', 'venezuel', 'colombia', 'brazil', 'empanada'],
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

// Times are stored as 24 hour HH:MM. People read 12 hour times, so "19:30" shows as "7:30 PM". Anything that is not HH:MM is shown as written.
export const to12 = (t: string) => { const m = /^(\d{1,2}):(\d{2})$/.exec((t || '').trim()); if (!m) return (t || '').trim(); const h = +m[1]; return ((h % 12) || 12) + ':' + m[2] + ' ' + (h < 12 ? 'AM' : 'PM'); };
export const timeRange = (a: string, b: string) => [a, b].filter(Boolean).map(to12).join(' to ');
