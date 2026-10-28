// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest';
import { attachChartTooltips } from '../chart-tooltip';

const TOOLTIP_ID = 'viz-tooltip';

function renderFixture(label: string): HTMLElement {
  document.body.innerHTML = `<div id="${TOOLTIP_ID}"></div><span tabindex="0" data-tip-value="$250M" data-tip-label=""></span>`;
  const mark = document.querySelector<HTMLElement>('[data-tip-value]');
  if (!mark) throw new Error('fixture mark missing');
  mark.setAttribute('data-tip-label', label);
  return mark;
}

describe('chart tooltip', () => {
  beforeEach(() => attachChartTooltips(document, TOOLTIP_ID));

  it('shows the value and label on keyboard focus and hides on blur', () => {
    const mark = renderFixture('Precision Neuroscience, Series D');
    mark.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    const tooltip = document.getElementById(TOOLTIP_ID);
    expect(tooltip?.getAttribute('data-visible')).toBe('true');
    expect(tooltip?.querySelector('strong')?.textContent).toBe('$250M');
    mark.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
    expect(tooltip?.getAttribute('data-visible')).toBe('false');
  });

  it('renders labels as text, never as markup', () => {
    const mark = renderFixture('<img src=x onerror=alert(1)>');
    mark.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    const tooltip = document.getElementById(TOOLTIP_ID);
    expect(tooltip?.querySelector('img')).toBeNull();
    expect(tooltip?.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('finds the tooltip element again after the page body is replaced', () => {
    renderFixture('first page');
    const mark = renderFixture('second page');
    mark.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
    expect(document.getElementById(TOOLTIP_ID)?.textContent).toContain('second page');
  });
});
