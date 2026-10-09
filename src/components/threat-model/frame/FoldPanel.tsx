import { useId, type ReactNode } from 'react';

interface Props {
  title: string;
  /** How many things the panel holds, printed beside the title. Leave out where there is nothing to count. */
  count?: number;
  /** One line that says what the panel is, shown whether it is open or not. */
  summary?: string;
  isOpen: boolean;
  onToggle: () => void;
  /** Shown under the summary whether the panel is open or not: what must never be folded out of sight. */
  alwaysShown?: ReactNode;
  children: ReactNode;
}

/**
 * A panel that folds to its title, its count and one line. The content stays in the page
 * while folded, so paper prints it; only the fold hides it on screen.
 */
export default function FoldPanel({ title, count, summary, isOpen, onToggle, alwaysShown, children }: Props) {
  const bodyId = useId();
  return (
    <section className="lab-panel model-fold" data-open={isOpen}>
      <h3 className="model-fold-head">
        <button type="button" className="model-fold-toggle" aria-expanded={isOpen} aria-controls={bodyId} onClick={onToggle}>
          <svg className="model-fold-chevron" width="10" height="10" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><path d="M3 1.5 L7 5 L3 8.5" /></svg>
          <span className="lab-panel-title">{title}</span>
          {count !== undefined && <span className="lab-figure model-fold-count">{count}</span>}
        </button>
      </h3>
      {summary !== undefined && <p className="lab-soft model-fold-summary" title={summary}>{summary}</p>}
      {alwaysShown}
      <div id={bodyId} className="model-fold-body" hidden={!isOpen}>{children}</div>
    </section>
  );
}
