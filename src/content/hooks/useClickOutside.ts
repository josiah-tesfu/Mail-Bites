import { RefObject, useEffect } from 'react';

interface UseClickOutsideOptions {
  isEnabled?: boolean;
}

/**
 * Invokes `handler` whenever a click occurs outside the provided element.
 * Tracks the original mousedown target to avoid firing when a drag starts
 * inside and ends outside (matching the legacy behavior).
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T>,
  handler: (event: MouseEvent) => void,
  options?: UseClickOutsideOptions
): void {
  useEffect(() => {
    if (options?.isEnabled === false) {
      return;
    }

    let mouseDownInside = false;

    const handleMouseDown = (event: MouseEvent) => {
      const node = ref.current;
      if (!node) {
        mouseDownInside = false;
        return;
      }
      const target = event.target as Node | null;
      mouseDownInside = Boolean(target && node.contains(target));
    };

    const handleClick = (event: MouseEvent) => {
      const node = ref.current;
      if (!node) {
        return;
      }

      const target = event.target as Node | null;
      const clickedInside = Boolean(target && node.contains(target));

      if (clickedInside || mouseDownInside) {
        return;
      }

      handler(event);
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('click', handleClick);
    };
  }, [ref, handler, options?.isEnabled]);
}
