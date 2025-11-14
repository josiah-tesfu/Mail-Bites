import { RefObject, useEffect } from 'react';

export interface UseClickOutsideShouldHandleArgs {
  event: MouseEvent;
  target: HTMLElement | null;
  mouseDownTarget: HTMLElement | null;
  clickedInsideRef: boolean;
  mouseDownInsideRef: boolean;
}

interface UseClickOutsideOptions {
  isEnabled?: boolean;
  shouldHandle?: (args: UseClickOutsideShouldHandleArgs) => boolean;
}

/**
 * Invokes `handler` when a document click should be treated as "outside" the
 * provided element. Consumers can override the default logic (which only checks
 * ref containment) via `shouldHandle`.
 */
export function useClickOutside<T extends HTMLElement>(
  ref: RefObject<T> | null,
  handler: (event: MouseEvent) => void,
  options?: UseClickOutsideOptions
): void {
  useEffect(() => {
    if (options?.isEnabled === false) {
      return;
    }

    let mouseDownTarget: HTMLElement | null = null;

    const handleMouseDown = (event: MouseEvent) => {
      mouseDownTarget = event.target as HTMLElement | null;
    };

    const handleClick = (event: MouseEvent) => {
      const node = ref?.current ?? null;
      const target = event.target as HTMLElement | null;
      const clickedInsideRef = Boolean(node && target && node.contains(target));
      const mouseDownInsideRef = Boolean(
        node && mouseDownTarget && node.contains(mouseDownTarget)
      );

      const shouldHandle =
        options?.shouldHandle?.({
          event,
          target,
          mouseDownTarget,
          clickedInsideRef,
          mouseDownInsideRef
        }) ?? (!clickedInsideRef && !mouseDownInsideRef);

      if (!shouldHandle) {
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
  }, [ref, handler, options?.isEnabled, options?.shouldHandle]);
}
