import { useId, type ReactNode } from 'react';

interface Props {
  title: string;
  /** Controls that act on the panel's content, shown beside the title. */
  actions?: ReactNode;
  children: ReactNode;
}

/** A titled region. Flat, one hairline, no shadow: the frame every part of a Lab screen sits in. */
export default function Panel({ title, actions, children }: Props) {
  const titleId = useId();
  return (
    <section className="lab-panel" aria-labelledby={titleId}>
      <div className="lab-panel-head">
        <h2 className="lab-panel-title" id={titleId}>{title}</h2>
        {actions}
      </div>
      <div className="lab-panel-body">{children}</div>
    </section>
  );
}
