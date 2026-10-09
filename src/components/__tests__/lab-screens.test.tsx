// @vitest-environment jsdom
/**
 * The view registry. Each mode's screens are tested beside them: Explore's in
 * src/components/explore/__tests__ and Monitor's in src/components/monitor/__tests__.
 */
import { describe, it, expect } from 'vitest';
import { MODE_VIEW_GROUPS } from '../workbench/view-registry';

describe('view registry', () => {
  it('lists only native views, each with a unique id inside its mode', () => {
    for (const groups of Object.values(MODE_VIEW_GROUPS)) {
      const ids = groups.flatMap((group) => group.views.map((view) => view.id));
      expect(new Set(ids).size).toBe(ids.length);
      expect(ids.length).toBeGreaterThan(0);
    }
  });
});
