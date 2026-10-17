import type { ReactNode } from 'react';

/** The page that holds the site's one brain scene, drawn from licensed atlas meshes. */
export const ATLAS_EXPLORER_PATH = '/atlas/anatomy/';

interface AtlasExplorerLinkProps {
  children: ReactNode;
  className?: string;
}

/**
 * A plain link to the atlas explorer, for every page that used to draw its own brain.
 * The explorer has its own layout without the client router, so the link asks for a full page load.
 */
export default function AtlasExplorerLink({ children, className }: AtlasExplorerLinkProps) {
  return <a href={ATLAS_EXPLORER_PATH} className={className} data-astro-reload>{children}</a>;
}
