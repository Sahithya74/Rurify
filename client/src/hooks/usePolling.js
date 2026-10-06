import { useEffect, useRef } from 'react';

/**
 * Runs `callback` immediately and then every `intervalMs`. This is the
 * "automatic inventory synchronization" mechanism for the MVP (Section 5
 * of the spec) — the backend architecture is structured so a future
 * Socket.IO layer could replace this without changing callers.
 */
export default function usePolling(callback, intervalMs = 10000, deps = []) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    let cancelled = false;
    const tick = () => {
      if (!cancelled) callbackRef.current();
    };
    tick();
    const id = setInterval(tick, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intervalMs, ...deps]);
}
