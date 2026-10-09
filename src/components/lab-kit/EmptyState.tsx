import type { ReactNode } from 'react';
import HatchSwatch from './HatchSwatch';

interface NotAssessedProps {
  /** Nothing is shown because nothing of this kind has been assessed. */
  reason: 'not-assessed';
  /** What was not assessed, in the product's own words. */
  detail: ReactNode;
  action?: ReactNode;
}

interface NothingShownProps {
  /** Nothing is shown because of something the reader chose: a filter, a search, a device with no parts. */
  reason: 'nothing-shown';
  /** Says why, for example "No technique matches these filters". */
  title: string;
  /** What to do next. Required, so the place never just looks clean. */
  action: ReactNode;
  detail?: ReactNode;
}

type Props = NotAssessedProps | NothingShownProps;

const NOT_ASSESSED_TITLE = 'Not assessed';

/** What an empty place says. Either "not assessed", with the hatch, or why it is empty and what to do. */
export default function EmptyState(props: Props) {
  const isNotAssessed = props.reason === 'not-assessed';
  return (
    <div className="lab-empty" role="status" data-reason={props.reason}>
      <p className="lab-empty-title">{isNotAssessed && <HatchSwatch />}{isNotAssessed ? NOT_ASSESSED_TITLE : props.title}</p>
      {props.detail !== undefined && <p>{props.detail}</p>}
      {props.action !== undefined && <div>{props.action}</div>}
    </div>
  );
}
