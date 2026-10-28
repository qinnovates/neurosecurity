import { useEffect } from 'react';

const STYLESHEET_ATTRIBUTE = 'data-atlas-view-styles';

/**
 * Links stylesheets from this site by address, once per page however many
 * views it holds. A lazy chunk uses this instead of importing its styles: a
 * stylesheet imported there would be linked from every page that can reach the
 * chunk and so load on its first visit.
 *
 * @param urls the addresses the build gave the stylesheets (`?url` imports)
 */
export function useViewStylesheets(urls: readonly string[]): void {
  useEffect(() => {
    for (const url of urls) {
      const isLinked = [...document.head.querySelectorAll(`link[${STYLESHEET_ATTRIBUTE}]`)].some((link) => link.getAttribute('href') === url);
      if (isLinked) continue;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.setAttribute(STYLESHEET_ATTRIBUTE, 'true');
      document.head.append(link);
    }
  }, [urls]);
}
