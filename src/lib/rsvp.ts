// Which events take RSVPs. Only Tradition Local's own events do.
// Add the tag rsvp to an event in the sheet to turn RSVPs on, or no-rsvp to turn them off.
export const hostsRsvp = (e: { title: string; tags: string[]; eventLink?: string; eventType?: string }) => {
  const tags = (e.tags || []).map((t) => String(t).toLowerCase());
  if (tags.includes('no-rsvp')) return false;
  if (tags.includes('rsvp')) return true;
  return !e.eventLink && !e.eventType && /coffee\s*(&|and)\s*conversations|tasting tour|meet,?\s*eat/i.test(e.title);
};
