/**
 * The value once it has stopped changing for `ms` (a debounce for rendering). Sliders and tickers change many
 * times a second; announcing or computing on the settled value keeps screen readers and expensive work calm.
 *
 *   const settled = useSettled(text, 700);
 *
 * Starts equal to `value` (nothing to wait for on the first render).
 */
import { useEffect, useState } from 'react';

export function useSettled<T>(value: T, ms: number): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    if (Object.is(value, settled)) return;
    const id = setTimeout(() => setSettled(() => value), ms);
    return () => clearTimeout(id);
  }, [value, settled, ms]);
  return settled;
}
