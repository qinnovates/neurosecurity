import { useCountTransition } from '@/components/lab-kit/motion/use-count-transition';

/** A number that runs to its new value when it changes, so a filter's effect is seen as well as read. */
export default function CountUp({ value }: { value: number }) {
  return <span className="tm-count">{useCountTransition(value)}</span>;
}
