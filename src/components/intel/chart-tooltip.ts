/**
 * One shared hover/focus tooltip for every report chart. A mark opts in with
 * data-tip-value (the bold line) and data-tip-label (the context line). Text is set
 * with textContent only: labels come from data files and are treated as untrusted.
 * Tooltips enhance; every value is also in the mark's aria-label and the table view.
 */

const OFFSET_PX = 14;
/** Shared through the global symbol registry so a re-executed script does not register twice. */
const ATTACHED_MARKER = Symbol.for('qinnovate.report.chartTooltips');
const MARK_SELECTOR = '[data-tip-value]';

function positionTooltip(tooltip: HTMLElement, clientX: number, clientY: number): void {
  const { width, height } = tooltip.getBoundingClientRect();
  const left = Math.min(clientX + OFFSET_PX, window.innerWidth - width - OFFSET_PX);
  const top = clientY - height - OFFSET_PX < 0 ? clientY + OFFSET_PX : clientY - height - OFFSET_PX;
  tooltip.style.left = `${Math.max(OFFSET_PX, left)}px`;
  tooltip.style.top = `${top}px`;
}

function fillTooltip(tooltip: HTMLElement, mark: Element): void {
  const value = document.createElement('strong');
  value.textContent = mark.getAttribute('data-tip-value') ?? '';
  const label = document.createElement('span');
  label.textContent = mark.getAttribute('data-tip-label') ?? '';
  tooltip.replaceChildren(value, label);
}

function markFrom(target: EventTarget | null): Element | null {
  return target instanceof Element ? target.closest(MARK_SELECTOR) : null;
}

/**
 * Registers document-level listeners once per document. The tooltip element is looked
 * up on every event because client-side navigation replaces the page body.
 */
export function attachChartTooltips(root: Document, tooltipId: string): void {
  if (Reflect.get(root, ATTACHED_MARKER) === true) return;
  Reflect.set(root, ATTACHED_MARKER, true);
  const tooltipEl = (): HTMLElement | null => root.getElementById(tooltipId);
  const hide = (): void => tooltipEl()?.setAttribute('data-visible', 'false');
  const show = (mark: Element, clientX: number, clientY: number): void => {
    const tooltip = tooltipEl();
    if (!tooltip) return;
    fillTooltip(tooltip, mark);
    tooltip.setAttribute('data-visible', 'true');
    positionTooltip(tooltip, clientX, clientY);
  };
  root.addEventListener('pointermove', (event) => {
    const mark = markFrom(event.target);
    if (mark) show(mark, event.clientX, event.clientY);
    else hide();
  });
  root.addEventListener('focusin', (event) => {
    const mark = markFrom(event.target);
    if (!mark) return;
    const box = mark.getBoundingClientRect();
    show(mark, box.left + box.width / 2, box.top);
  });
  root.addEventListener('focusout', hide);
  root.addEventListener('scroll', hide, { passive: true });
}
