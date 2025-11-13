import { describe, expect, it, beforeEach } from 'vitest';

import { syncConversations } from '@/content/gmail/syncConversations';
import { useConversationStore, resetConversationStore } from '@/content/store';
import type { ViewContext } from '@/content/viewTracker';

const createRow = (options: {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  date: string;
  isUnread?: boolean;
}): HTMLTableRowElement => {
  const row = document.createElement('tr');
  row.className = options.isUnread === false ? 'zA yO' : 'zA zE';
  row.setAttribute('data-legacy-thread-id', options.id);

  const sender = document.createElement('span');
  sender.className = 'yP';
  sender.textContent = options.sender;
  row.appendChild(sender);

  const subject = document.createElement('span');
  subject.className = 'bog';
  subject.textContent = options.subject;
  row.appendChild(subject);

  const snippet = document.createElement('span');
  snippet.className = 'y2';
  snippet.textContent = `- ${options.snippet}`;
  row.appendChild(snippet);

  const date = document.createElement('span');
  date.className = 'xW';
  date.textContent = options.date;
  row.appendChild(date);

  return row;
};

describe('syncConversations', () => {
  beforeEach(() => {
    resetConversationStore();
  });

  it('populates the conversation store when rows exist', () => {
    const main = document.createElement('div');
    main.appendChild(
      createRow({
        id: 'thread-1',
        sender: 'Sender',
        subject: 'Subject',
        snippet: 'Snippet',
        date: '10:00 AM',
        isUnread: true
      })
    );

    const context = {
      mainElement: main,
      url: 'https://mail.google.com/mail/u/0/#inbox',
      hash: '#inbox',
      path: '/mail/u/0/',
      timestamp: Date.now()
    } satisfies ViewContext;

    syncConversations(context);

    const conversations = useConversationStore.getState().conversations;
    expect(conversations).toHaveLength(1);
    expect(conversations[0]).toMatchObject({
      id: 'thread-1',
      sender: 'Sender',
      subject: 'Subject',
      snippet: 'Snippet',
      date: '10:00 AM',
      isUnread: true
    });
  });

  it('resets the store when main element is missing', () => {
    const context = {
      mainElement: null,
      url: 'https://mail.google.com/mail/u/0/#inbox',
      hash: '#inbox',
      path: '/mail/u/0/',
      timestamp: Date.now()
    } satisfies ViewContext;

    useConversationStore.getState().setConversations([
      {
        id: 'thread-2',
        sender: 'Sender',
        subject: 'Subject',
        snippet: 'Snippet',
        date: '10:00 AM',
        isUnread: true,
        mode: 'read'
      }
    ]);

    syncConversations(context);

    expect(useConversationStore.getState().conversations).toHaveLength(0);
  });
});
