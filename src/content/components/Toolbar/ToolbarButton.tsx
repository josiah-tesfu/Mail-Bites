import { forwardRef, useState } from 'react';

import {
  TOOLBAR_ACTION_ICON_MAP,
  TOOLBAR_ACTION_LABELS,
  resolveAssetPath
} from '../../ui/utils/constants';

export type ToolbarButtonType = 'new-email' | 'search' | 'unread' | 'read' | 'draft';

export interface ToolbarButtonProps {
  type: ToolbarButtonType;
  isActive?: boolean;
  isDisabled?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
}

export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(({
  type,
  isActive = false,
  isDisabled = false,
  onClick,
  ariaLabel,
  className = ''
}, ref) => {
  const [isHovered, setIsHovered] = useState(false);

  const baseClass = `mail-bites-action mail-bites-toolbar-action-${type}`;
  const classes = [baseClass, className].filter(Boolean).join(' ');

  const label = ariaLabel || TOOLBAR_ACTION_LABELS[type] || '';
  const iconSrc = resolveAssetPath(TOOLBAR_ACTION_ICON_MAP[type] || '');

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    if (!isDisabled && onClick) {
      onClick();
    }
  };

  return (
    <button
      ref={ref}
      type="button"
      className={classes}
      title={label}
      aria-label={label}
      disabled={isDisabled}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img src={iconSrc} alt="" decoding="async" loading="lazy" />
    </button>
  );
});

ToolbarButton.displayName = 'ToolbarButton';
