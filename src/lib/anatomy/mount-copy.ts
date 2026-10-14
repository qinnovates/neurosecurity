/**
 * The sentences beside the button that asks for the 3D view on a page other
 * than the explorer: what the button offers, that it is loading, that it could
 * not load, and where to choose when nothing is chosen. None of them limits
 * what the atlas says, and they are held apart from limits-copy.ts for one
 * reason: the button ships with the page, and the whole limit table must not
 * load on a page's first visit to say four sentences. This module imports
 * nothing and nothing in the explorer imports it. A snapshot holds the
 * sentences word for word (limits-copy.test.ts).
 */
export const MOUNT_COPY = {
  ask: 'Draws this on an average brain, with what the picture cannot tell you beside it. Nothing is fetched until you ask.',
  loading: 'Loading the 3D view…',
  failed: 'The 3D view could not be loaded. The list on this page is unchanged.',
  choose_in_list: 'Choose a band or region in the list on this page to mark it in the picture.',
} as const;
