import type { LimitSentence } from '@/lib/anatomy/limits-copy';

interface Props {
  limit: LimitSentence;
  /** Ties the sentence to the control it limits, through that control's aria-describedby. */
  id?: string;
}

/** One limit sentence, beside the thing it limits. The only component that puts limit wording on screen. */
export default function LimitNote({ limit, id }: Props) {
  return <p className="atlas-limit" id={id} data-limit-id={limit.id}>{limit.text}</p>;
}
