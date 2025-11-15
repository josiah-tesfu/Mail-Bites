# Inline Collapsed Marker (Archive)

This keeps the previous inline composer collapse treatment—a centered horizontal line with hover animation—so it can be reused later without digging through history.

## Component (React)

```tsx
import React from 'react';

interface InlineCollapsedMarkerProps {
  onExpand: () => void;
}

const InlineCollapsedMarker: React.FC<InlineCollapsedMarkerProps> = ({ onExpand }) => {
  return (
    <button
      type="button"
      className="mail-bites-inline-marker"
      onClick={(event) => {
        event.stopPropagation();
        onExpand();
      }}
      aria-label="Expand draft"
      title="Expand draft"
    >
      <span className="mail-bites-inline-marker-line" aria-hidden="true">
        <span className="mail-bites-inline-marker-line-inner" />
      </span>
    </button>
  );
};

InlineCollapsedMarker.displayName = 'InlineCollapsedMarker';

export { InlineCollapsedMarker };
export default InlineCollapsedMarker;
```

## Styles

Add these to `content.css` when needed:

```css
.mail-bites-inline-marker-container {
  border: none;
  background: transparent;
  padding: 32px 0;
  min-height: 110px;
  display: flex;
  align-items: stretch;
  justify-content: center;
  box-sizing: border-box;
  position: relative;
}

.mail-bites-inline-marker {
  appearance: none;
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background: transparent;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  --mail-bites-inline-marker-scale: 1;
  box-sizing: border-box;
}

.mail-bites-inline-marker:focus-visible {
  outline: none;
}

.mail-bites-inline-marker-container:hover .mail-bites-inline-marker,
.mail-bites-inline-marker:focus-visible {
  --mail-bites-inline-marker-scale: 1.2;
}

.mail-bites-inline-marker:active {
  --mail-bites-inline-marker-scale: 1;
}

.mail-bites-inline-marker-line {
  width: 33%;
  max-width: 260px;
  min-width: 160px;
  height: 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  animation: mail-bites-inline-marker-hover 1s cubic-bezier(0.5, 0, 0.5, 1) infinite alternate;
}

.mail-bites-inline-marker-line-inner {
  width: 100%;
  height: 100%;
  border-radius: 999px;
  background: #1f1f1f;
  opacity: 0.4;
  transform: scaleX(var(--mail-bites-inline-marker-scale));
  transition: opacity 0.2s ease, background-color 0.2s ease, transform 0.25s ease;
}

.mail-bites-inline-marker-container:hover .mail-bites-inline-marker-line-inner,
.mail-bites-inline-marker:focus-visible .mail-bites-inline-marker-line-inner {
  opacity: 1;
}

.mail-bites-inline-marker:focus-visible .mail-bites-inline-marker-line-inner {
  box-shadow: 0 0 0 2px rgba(26, 115, 232, 0.35);
}
```

## Animation

Include this keyframe in `animations.css` when re-enabling:

```css
@keyframes mail-bites-inline-marker-hover {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-6px);
  }
}
```
