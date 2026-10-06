import { useEffect, useRef } from 'react';

/**
 * Adds the `is-visible` class once an element scrolls into view, pairing
 * with the .reveal / .reveal-scale / .reveal-left / .reveal-right CSS
 * transitions in index.css. Used across the landing page for scroll-in
 * entrance animations without pulling in a full animation library.
 */
export default function useReveal(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible');
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-visible');
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, ...options }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return ref;
}
