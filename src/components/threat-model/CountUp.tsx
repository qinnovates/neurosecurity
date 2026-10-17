import { useCountTransition } from '@/components/lab-kit/motion/use-count-transition';

/** A number that swaps at once and is flagged for a moment when it changes, so a filter's effect is seen as well as read. */
export default function CountUp({ value }: { value: number }) {
  const { value: shown, hasChanged } = useCountTransition(value);
  return <span className="tm-count" data-changed={hasChanged}>{shown}</span>;
}
