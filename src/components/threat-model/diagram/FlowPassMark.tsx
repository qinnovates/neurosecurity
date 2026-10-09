import type { PassDirection } from './payload-tags';

interface Props {
  /** The connection's line. */
  path: string;
  direction: PassDirection;
  onDone: () => void;
}

/**
 * One pass of flow along a connection. The stylesheet runs it exactly once; when it ends the
 * mark is removed, so nothing is animating while the reader does nothing. Remount it with a
 * new key to run it again.
 */
export default function FlowPassMark({ path, direction, onDone }: Props) {
  return (
    <path className="lab-diagram-pass" d={path} pathLength={100} data-flow-pass={direction} aria-hidden="true" onAnimationEnd={onDone} />
  );
}
