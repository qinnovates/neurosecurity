import { useEffect, useRef } from 'react';

/** Runs `react` after a render in which `value` differs from the render before. Never on the first render, so nothing happens on load. */
export function useOnChange<Value>(value: Value, react: (value: Value, previous: Value) => void): void {
  const previous = useRef(value);
  useEffect(() => {
    if (Object.is(previous.current, value)) return;
    const before = previous.current;
    previous.current = value;
    react(value, before);
  });
}
