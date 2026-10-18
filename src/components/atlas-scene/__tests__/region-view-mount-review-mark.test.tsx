// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { IndexReviewState } from '@/lib/anatomy/anatomy-index-types';
import { limitSentence } from '@/lib/anatomy/limits-copy';
import { MOUNT_COPY } from '@/lib/anatomy/mount-copy';
import RegionViewMount from '../RegionViewMount';
import { readLinksReview, readUncolouredLimit } from '../build-technique-colouring';

afterEach(cleanup);

const UNREVIEWED_LINKS: IndexReviewState = { state: 'ai_drafted_unreviewed', mark: 'AI-drafted, unreviewed' };
const MARK_TEXT = 'AI-drafted, unreviewed';
const NAMED_REGIONS_TECHNIQUE = 'QIF-T0034';
const NO_NEURAL_BAND_TECHNIQUE = 'QIF-T0004';
const technique = (techniqueId: string) => ({ kind: 'technique', techniqueId }) as const;

function renderBuiltMount(techniqueId: string) {
  return render(<RegionViewMount lens={technique(techniqueId)} nothingColoured={readUncolouredLimit(techniqueId)} linksReview={readLinksReview(techniqueId)} loadPanel={() => new Promise(() => undefined)} />);
}

describe('the review mark beside a technique page\'s drafted links, before the view is asked for', () => {
  it('shows the mark with the sentence, on a technique with named regions, as the page is built', () => {
    const { container } = renderBuiltMount(NAMED_REGIONS_TECHNIQUE);
    expect(container.querySelector('[data-mount-note="nothing-coloured"]')).not.toBeNull();
    expect(container.querySelector('[data-mount-note="links-review"] [data-ai-drafted="true"]')?.textContent).toBe(MARK_TEXT);
    expect(container.textContent).toContain(MOUNT_COPY.links_review);
  });

  it('shows the mark on a technique in the index whose links name no region', () => {
    const { container } = render(<RegionViewMount lens={technique('QIF-T0001')} nothingColoured={limitSentence('view_nothing_coloured_none_named')} linksReview={UNREVIEWED_LINKS} />);
    expect(container.querySelector('[data-mount-note="links-review"]')?.textContent).toContain(MARK_TEXT);
  });

  it('shows no mark, and the no-neural-band sentence, on a technique outside the index', () => {
    const { container } = renderBuiltMount(NO_NEURAL_BAND_TECHNIQUE);
    expect(container.querySelector('[data-mount-note="nothing-coloured"]')?.textContent).toBe('No region links were drafted for this technique: the catalog gives it no neural band.');
    expect(container.querySelector('[data-mount-note="links-review"]')).toBeNull();
    expect(container.textContent).not.toContain(MARK_TEXT);
    expect(container.textContent).not.toContain('drafted links');
  });

  it('keeps the mark while the view loads and after it fails to load', async () => {
    const { container } = render(<RegionViewMount lens={technique('QIF-T0001')} linksReview={UNREVIEWED_LINKS} loadPanel={async () => { throw new Error('chunk missing'); }} />);
    fireEvent.click(screen.getByRole('button', { name: 'Show the 3D view' }));
    await waitFor(() => expect(container.querySelector('[data-mount-note="links-review"]')).not.toBeNull());
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(container.querySelector('[data-mount-note="links-review"]')?.textContent).toContain(MARK_TEXT);
  });
});
