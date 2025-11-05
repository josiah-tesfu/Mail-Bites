import React, { memo, useState } from 'react';

interface CollapsedDraftProps {
  recipient: string;
  subject: string;
  timestamp: number;
  onExpand: () => void;
}

const CollapsedDraft: React.FC<CollapsedDraftProps> = memo(({
  recipient,
  subject,
  timestamp,
  onExpand
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`mail-bites-item-header${isHovered ? ' is-hovered' : ''}`}
      onClick={onExpand}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: 'pointer' }}
    >
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
      </div>
    </div>
  );
});

CollapsedDraft.displayName = 'CollapsedDraft';

export { CollapsedDraft };
export default CollapsedDraft;
