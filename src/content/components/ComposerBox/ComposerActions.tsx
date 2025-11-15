import React, { memo } from 'react';
import type { ComposerActionType } from '../../ui/types/actionTypes';
import {
  COMPOSER_ACTION_ICON_MAP,
  COMPOSER_ACTION_LABELS,
  ACTION_ICON_MAP,
  ACTION_LABELS,
  resolveAssetPath
} from '../../ui/utils/constants';

interface ComposerActionsProps {
  onSend: () => void;
  onClose: () => void;
  onDelete: () => void;
  onAttach?: () => void;
  isSending?: boolean;
  canSend?: boolean;
}

const ComposerActions: React.FC<ComposerActionsProps> = memo(({
  onSend,
  onClose,
  onDelete,
  onAttach,
  isSending = false,
  canSend = true
}) => {
  const handleClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    e.preventDefault();
    action();
  };

  return (
    <div className="mail-bites-action-row mail-bites-action-row--composer">
      <div className="mail-bites-composer-actions-left">
        <button
          type="button"
          className="mail-bites-action-button mail-bites-composer-action-send"
          title={COMPOSER_ACTION_LABELS.send}
          aria-label={COMPOSER_ACTION_LABELS.send}
          onClick={(e) => handleClick(e, onSend)}
          disabled={!canSend || isSending}
        >
          <img
            src={resolveAssetPath(COMPOSER_ACTION_ICON_MAP.send)}
            alt=""
            decoding="async"
            loading="lazy"
          />
        </button>

        <button
          type="button"
          className="mail-bites-action-button mail-bites-composer-action-close"
          title={COMPOSER_ACTION_LABELS.close}
          aria-label={COMPOSER_ACTION_LABELS.close}
          onClick={(e) => handleClick(e, onClose)}
        >
          <img
            src={resolveAssetPath(COMPOSER_ACTION_ICON_MAP.close)}
            alt=""
            decoding="async"
            loading="lazy"
          />
        </button>

        <button
          type="button"
          className="mail-bites-action-button mail-bites-composer-action-attachments"
          title={COMPOSER_ACTION_LABELS.attachments}
          aria-label={COMPOSER_ACTION_LABELS.attachments}
          onClick={(e) => handleClick(e, onAttach || (() => {}))}
        >
          <img
            src={resolveAssetPath(COMPOSER_ACTION_ICON_MAP.attachments)}
            alt=""
            decoding="async"
            loading="lazy"
          />
        </button>
      </div>

      <button
        type="button"
        className="mail-bites-action-button mail-bites-composer-action-delete"
        title={ACTION_LABELS.delete}
        aria-label={ACTION_LABELS.delete}
        onClick={(e) => handleClick(e, onDelete)}
      >
        <img
          src={resolveAssetPath(ACTION_ICON_MAP.delete)}
          alt=""
          decoding="async"
          loading="lazy"
        />
      </button>
    </div>
  );
});

ComposerActions.displayName = 'ComposerActions';

export { ComposerActions };
export default ComposerActions;
