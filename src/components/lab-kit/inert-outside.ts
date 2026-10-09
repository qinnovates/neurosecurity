const INERT_ATTRIBUTE = 'inert';

/**
 * Makes everything outside `element` inert: it cannot be clicked, focused or reached by
 * assistive technology, while it stays fully visible. Used while a modal layer is open.
 * Returns the function that undoes it, which restores only what this call changed.
 */
export function makeOutsideInert(element: HTMLElement): () => void {
  const changed: Element[] = [];
  for (let node: HTMLElement | null = element; node !== null && node !== document.body; node = node.parentElement) {
    for (const sibling of Array.from(node.parentElement?.children ?? [])) {
      if (sibling === node || sibling.hasAttribute(INERT_ATTRIBUTE)) continue;
      sibling.setAttribute(INERT_ATTRIBUTE, '');
      changed.push(sibling);
    }
  }
  return () => {
    for (const sibling of changed) sibling.removeAttribute(INERT_ATTRIBUTE);
  };
}
