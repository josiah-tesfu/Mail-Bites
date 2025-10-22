import { describe, expect, it } from 'vitest';
import { MinimalInboxRenderer } from '@/content/ui/minimalInboxRenderer';
import type { ViewContext } from '@/content/viewTracker';

const buildConversationRow = ({
  sender,
  subject,
  snippet,
  date,
  unread,
  threadId
}: {
  sender: string;
  subject: string;
  snippet: string;
  date: string;
  unread: boolean;
  threadId: string;
}) => {
  const row = document.createElement('tr');
  row.className = unread ? 'zA zE' : 'zA yO';
  row.setAttribute('data-legacy-thread-id', threadId);

  const senderCell = document.createElement('td');
  const senderSpan = document.createElement('span');
  senderSpan.className = 'yP';
  senderSpan.textContent = sender;
  senderCell.appendChild(senderSpan);

  const subjectCell = document.createElement('td');
  const subjectSpan = document.createElement('span');
  subjectSpan.className = 'bog';
  subjectSpan.textContent = subject;
  subjectCell.appendChild(subjectSpan);

  const snippetCell = document.createElement('td');
  const snippetSpan = document.createElement('span');
  snippetSpan.className = 'y2';
  snippetSpan.textContent = snippet;
  snippetCell.appendChild(snippetSpan);

  const dateCell = document.createElement('td');
  dateCell.className = 'xW';
  const dateSpan = document.createElement('span');
  dateSpan.textContent = date;
  dateCell.appendChild(dateSpan);

  row.appendChild(senderCell);
  row.appendChild(subjectCell);
  row.appendChild(snippetCell);
  row.appendChild(dateCell);

  return row;
};

const buildViewContext = (rows: HTMLTableRowElement[]): ViewContext => {
  const main = document.createElement('div');
  main.setAttribute('role', 'main');

  const table = document.createElement('table');
  const tbody = document.createElement('tbody');
  rows.forEach((row) => tbody.appendChild(row));
  table.appendChild(tbody);
  main.appendChild(table);

  return {
    url: 'https://mail.google.com/mail/u/0/#inbox',
    hash: '#inbox',
    path: '/mail/u/0/',
    timestamp: Date.now(),
    mainElement: main
  };
};

describe('MinimalInboxRenderer', () => {
  it('renders only unread conversations and dismisses them on action click', () => {
    const unreadRow = buildConversationRow({
      sender: 'Unread Sender',
      subject: 'Unread Subject',
      snippet: '- preview',
      date: 'Jan 1',
      unread: true,
      threadId: 'thread-unread'
    });

    const readRow = buildConversationRow({
      sender: 'Read Sender',
      subject: 'Read Subject',
      snippet: '- preview',
      date: 'Jan 2',
      unread: false,
      threadId: 'thread-read'
    });

    const context = buildViewContext([unreadRow, readRow]);

    const renderer = new MinimalInboxRenderer();
    const overlayRoot = document.createElement('div');

    renderer.render(context, overlayRoot);

    const items = overlayRoot.querySelectorAll('article.mail-bites-item');
    expect(items).toHaveLength(1);
    expect(items[0]?.dataset.conversationId).toBe('thread-unread');

    const action = items[0]?.querySelector<HTMLButtonElement>(
      '.mail-bites-action-archive'
    );
    expect(action).not.toBeNull();

    action?.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const remaining = overlayRoot.querySelectorAll('article.mail-bites-item');
    expect(remaining).toHaveLength(0);
  });
});
