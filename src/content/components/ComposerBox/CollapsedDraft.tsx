import React, { memo } from 'react';
import {
  ACTION_ICON_MAP,
  ACTION_LABELS,
  resolveAssetPath
} from '../../ui/utils/constants';

interface CollapsedDraftProps {
  recipient: string;
  subject: string;
  timestamp: number;
  onDelete: () => void;
}

const CollapsedDraft: React.FC<CollapsedDraftProps> = memo(({
  recipient,
  subject,
  timestamp,
  onDelete
}) => {

  return (
    <>
      <div className="mail-bites-item-header" style={{ cursor: 'pointer' }}>
        <div className="mail-bites-header-main">
          <span className="mail-bites-sender">
            {recipient.trim() || '(No sender)'}
          </span>
          <span className="mail-bites-subject">
            {subject.trim() || '(No subject)'}
          </span>
        </div>
        <div className="mail-bites-header-right">
          <span className="mail-bites-date">
            {new Date(timestamp).toLocaleTimeString([], {
              hour: 'numeric',
              minute: '2-digit'
            })}
          </span>
          <div className="mail-bites-actions">
            <button
              type="button"
              className="mail-bites-action mail-bites-action-delete"
              title={ACTION_LABELS.delete}
              aria-label={ACTION_LABELS.delete}
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
            >
              <img
                src={resolveAssetPath(ACTION_ICON_MAP.delete)}
                alt=""
                decoding="async"
                loading="lazy"
              />
            </button>
          </div>
        </div>
      </div>
    </>
  );
});

CollapsedDraft.displayName = 'CollapsedDraft';

export { CollapsedDraft };
export default CollapsedDraft;
