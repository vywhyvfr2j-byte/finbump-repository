import { useEffect, useState } from 'react';

// Debounces a fast-changing value (e.g. search input) so downstream
// filtering / API calls only run after the user pauses typing.
// Default delay is 250ms — short enough to feel instant, long enough to
// skip intermediate keystrokes on a long query.
export function useDebounce(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}