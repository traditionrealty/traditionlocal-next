// Things you can change without touching page code. Carried over from the live site.
export const config = {
  contactEmail: 'traditionlocal@gmail.com',
  youtube: 'https://www.youtube.com/@TraditionLocal',
  social: {
    facebook: 'https://www.facebook.com/TraditionLocal',
    instagram: 'https://www.instagram.com/traditionguides/',
    tiktok: 'https://www.tiktok.com/@traditionlocal',
    x: 'https://x.com/TraditionLocal',
    youtube: 'https://www.youtube.com/@traditionlocal',
  },
  // Set to true to make search a members only feature once sign in exists.
  searchMembersOnly: false,
  // The newsletter signup service the live site already uses. It accepts a normal form post.
  newsletterAction: 'https://tl-newsletter-signup.bold-bush-f938.workers.dev',
  formsAction: 'https://tl-forms.bold-bush-f938.workers.dev',
  // Pop-ups are built but switched off. Change enabled to true when you are ready for visitors to see them.
  // To try them first: add ?popup=newsletter to any page address, or ?popup=on to see the real behavior on your own device.
  popups: { enabled: false },
  // Pictures on the Food cards, the same way the home page shows them. cardPhotos shows them. cardMapPhotos also uses the Google Maps
  // screenshot for places that have no real photo. To try the other setting on your own device: /food/?photos=on (real photos only) or /food/?photos=all.
  cardPhotos: true,
  cardMapPhotos: true,
  mark: '/tradition-local-mark.svg', // the approved Tradition Local mark, shown beside the name in the header. Leave empty to hide it.
  // Member sign in (Supabase Auth). The publishable key is meant to be public: the database rules keep each member's details private.
  supabase: { url: 'https://fwjjfwnpdberayqtrkaa.supabase.co', key: 'sb_publishable_Fe0lWzuNVeB62KHS14z10w_XwpWKhxd' },
  brokerage: { name: 'Tradition Realty Group', url: 'https://traditionrealtygroup.kw.com/' },
};
