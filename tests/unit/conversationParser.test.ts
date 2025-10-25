import { describe, expect, it } from 'vitest';
import { extractConversationData } from '@/content/ui/conversationParser';

interface RowOptions {
  sender?: string;
  subject?: string;
  snippet?: string;
  date?: string;
  threadId?: string;
  unread?: boolean;
}

function buildConversationRow({
  sender = 'Alice',
  subject = 'Hello World',
  snippet = '- Preview of the message',
  date = 'Jun 5',
  threadId = 'thread-123',
  unread = false
}: RowOptions = {}) {
  const row = document.createElement('tr');
  row.className = 'zA';
  row.classList.add(unread ? 'zE' : 'yO');
  if (threadId) {
    row.setAttribute('data-legacy-thread-id', threadId);
  }

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
}

describe('extractConversationData', () => {
  it('extracts core fields from a Gmail conversation row', () => {
    const row = buildConversationRow();

    const conversation = extractConversationData(row, 'fallback-id');

    expect(conversation).not.toBeNull();
    expect(conversation?.id).toBe('thread-123');
    expect(conversation?.sender).toBe('Alice');
    expect(conversation?.subject).toBe('Hello World');
    expect(conversation?.snippet).toBe('Preview of the message');
    expect(conversation?.date).toBe('Jun 5');
    expect(conversation?.isUnread).toBe(false);
    expect(conversation?.mode).toBe('read');
  });

  it('uses fallback id and sensible defaults when data is missing', () => {
    const row = buildConversationRow({
      sender: '',
      subject: 'Subject only',
      snippet: '',
      date: '',
      threadId: '',
      unread: true
    });

    const conversation = extractConversationData(row, 'row-0');

    expect(conversation).not.toBeNull();
    expect(conversation?.id).toBe('row-0');
    expect(conversation?.sender).toBe('');
    expect(conversation?.subject).toBe('Subject only');
    expect(conversation?.snippet).toBe('');
    expect(conversation?.date).toBe('');
    expect(conversation?.isUnread).toBe(true);
    expect(conversation?.mode).toBe('read');
  });

  it('returns null when both sender and subject are missing', () => {
    const row = buildConversationRow({
      sender: '',
      subject: ''
    });

    const conversation = extractConversationData(row, 'row-1');

    expect(conversation).toBeNull();
  });
});
