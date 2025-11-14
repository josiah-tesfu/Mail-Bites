import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { useClickOutside, type UseClickOutsideShouldHandleArgs } from '@/content/hooks/useClickOutside';

const Harness = ({
  isEnabled,
  onOutside,
  shouldHandle
}: {
  isEnabled: boolean;
  onOutside: (event: MouseEvent) => void;
  shouldHandle?: (args: UseClickOutsideShouldHandleArgs) => boolean;
}) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  useClickOutside(overlayRef, onOutside, { isEnabled, shouldHandle });

  return (
    <div data-testid="wrapper">
      <div data-testid="overlay" ref={overlayRef}>
        <button data-testid="inside-button">Inside</button>
      </div>
    </div>
  );
};

describe('useClickOutside', () => {
  let container: HTMLDivElement;
  let root: Root;
  let outsideNode: HTMLButtonElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    outsideNode = document.createElement('button');
    outsideNode.dataset.testid = 'outside';
    document.body.appendChild(outsideNode);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    outsideNode.remove();
    container.remove();
  });

  const renderHook = (
    isEnabled: boolean,
    handler: (event: MouseEvent) => void,
    shouldHandle?: (args: UseClickOutsideShouldHandleArgs) => boolean
  ) => {
    act(() => {
      root.render(<Harness isEnabled={isEnabled} onOutside={handler} shouldHandle={shouldHandle} />);
    });
  };

  const click = (node: HTMLElement) => {
    node.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  };

  it('calls handler when clicking outside the referenced element', () => {
    const handler = vi.fn();
    renderHook(true, handler);

    click(outsideNode);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not call handler when clicking inside the referenced element', () => {
    const handler = vi.fn();
    renderHook(true, handler);

    const insideButton = container.querySelector('[data-testid="inside-button"]') as HTMLElement;
    click(insideButton);

    expect(handler).not.toHaveBeenCalled();
  });

  it('ignores drags that start inside and end outside', () => {
    const handler = vi.fn();
    renderHook(true, handler);

    const insideButton = container.querySelector('[data-testid="inside-button"]') as HTMLElement;

    insideButton.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    outsideNode.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(handler).not.toHaveBeenCalled();
  });

  it('respects the isEnabled flag', () => {
    const handler = vi.fn();
    renderHook(false, handler);

    click(outsideNode);
    expect(handler).not.toHaveBeenCalled();
  });

  it('uses custom shouldHandle logic when provided', () => {
    const handler = vi.fn();
    const shouldHandle = vi.fn(({ target }) => {
      return !(target?.dataset.testid === 'special');
    });

    const specialButton = document.createElement('button');
    specialButton.dataset.testid = 'special';
    document.body.appendChild(specialButton);

    renderHook(true, handler, shouldHandle);

    click(specialButton);
    expect(handler).not.toHaveBeenCalled();
    expect(shouldHandle).toHaveBeenCalled();

    click(outsideNode);
    expect(handler).toHaveBeenCalledTimes(1);

    specialButton.remove();
  });
});
