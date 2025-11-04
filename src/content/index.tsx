import { StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';

import { ensureManropeFont } from './fontLoader';
import { logger } from './logger';
import { resetComposerStore, resetConversationStore, resetToolbarStore } from './store';
import { MinimalInboxRenderer } from './ui/minimalInboxRenderer';
import { GmailViewTracker, type ViewContext } from './viewTracker';

const ROOT_ID = 'mail-bites-root';

declare global {
  interface Window {
    mailBites?: {
      mount: () => void;
      unmount: () => void;
    };
  }
}

let root: Root | null = null;
let hostElement: HTMLElement | null = null;

const MailBitesApp = ({ host }: { host: HTMLElement }) => {
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<MinimalInboxRenderer | null>(null);
  const activeMainElementRef = useRef<HTMLElement | null>(null);
  const hasWarnedMissingMainRef = useRef(false);
  const [viewContext, setViewContext] = useState<ViewContext | null>(null);
  const [mainElement, setMainElement] = useState<HTMLElement | null>(null);
  const [isOverlayVisible, setOverlayVisible] = useState(false);

  if (!rendererRef.current) {
    rendererRef.current = new MinimalInboxRenderer();
  }

  useEffect(() => {
    ensureManropeFont();
  }, []);

  useEffect(() => {
    const tracker = new GmailViewTracker((context) => {
      setViewContext(context);
      setMainElement(context.mainElement ?? null);
      setOverlayVisible(Boolean(context.mainElement));

      if (!context.mainElement) {
        if (!hasWarnedMissingMainRef.current) {
          logger.warn(
            'Gmail main container is unavailable; deferring initialization.',
            context.url
          );
          hasWarnedMissingMainRef.current = true;
        }
        return;
      }

      hasWarnedMissingMainRef.current = false;
      logger.info('Mail Bites ready for rendering.', {
        url: context.url,
        descriptor: context.hash || context.path
      });
    });

    tracker.start();

    return () => {
      tracker.stop();
    };
  }, []);

  useEffect(() => {
    host.style.display = isOverlayVisible ? 'block' : 'none';
  }, [host, isOverlayVisible]);

  useEffect(() => {
    const overlayRoot = overlayRef.current;
    const renderer = rendererRef.current;

    if (!overlayRoot || !renderer) {
      return;
    }

    if (!viewContext || !viewContext.mainElement) {
      renderer.reset();
      overlayRoot.innerHTML = '';
      activeMainElementRef.current = null;
      resetConversationStore();
      resetToolbarStore();
      resetComposerStore();
      return;
    }

    const previousMain = activeMainElementRef.current;
    const currentMain = viewContext.mainElement;

    if (previousMain && previousMain !== currentMain) {
      resetConversationStore();
      resetToolbarStore();
      resetComposerStore();
      renderer.reset();
      overlayRoot.innerHTML = '';
    }

    if (!previousMain && mainElement) {
      resetConversationStore();
      resetToolbarStore();
      resetComposerStore();
    }

    activeMainElementRef.current = currentMain;

    overlayRoot.innerHTML = '';
    renderer.render(viewContext, overlayRoot);
  }, [mainElement, viewContext]);

  useEffect(() => {
    return () => {
      const overlayRoot = overlayRef.current;
      rendererRef.current?.reset();
      resetConversationStore();
      resetToolbarStore();
      resetComposerStore();

      if (overlayRoot) {
        overlayRoot.innerHTML = '';
      }

      host.style.display = 'none';
    };
  }, [host]);

  return (
    <div
      ref={overlayRef}
      className="mail-bites-overlay"
      data-mail-bites="overlay"
      aria-hidden={!isOverlayVisible}
    />
  );
};

const unmount = () => {
  if (root) {
    root.unmount();
    root = null;
  }

  const host = hostElement ?? document.getElementById(ROOT_ID);
  if (host && host.parentElement) {
    host.parentElement.removeChild(host);
  }

  hostElement = null;
};

const ensureOverlayHost = (): HTMLElement => {
  const existing = document.getElementById(ROOT_ID);
  if (existing instanceof HTMLElement) {
    existing.dataset.mailBites = 'overlay';
    existing.classList.add('mail-bites-overlay');
    if (!existing.style.display) {
      existing.style.display = 'none';
    }
    return existing;
  }

  const element = document.createElement('div');
  element.id = ROOT_ID;
  element.dataset.mailBites = 'overlay';
  element.className = 'mail-bites-overlay';
  element.style.display = 'none';
  document.body?.appendChild(element);
  return element;
};

const mount = () => {
  hostElement = ensureOverlayHost();

  if (!root) {
    root = createRoot(hostElement);
  }

  root.render(
    <StrictMode>
      <MailBitesApp host={hostElement} />
    </StrictMode>
  );
};

const bootstrap = () => {
  mount();
};

window.mailBites = {
  mount,
  unmount
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
} else {
  bootstrap();
}
