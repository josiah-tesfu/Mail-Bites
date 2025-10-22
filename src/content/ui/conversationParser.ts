import type { ConversationRow } from './types';

export interface ConversationData {
  id: string;
  sender: string;
  subject: string;
  snippet: string;
  date: string;
  isUnread: boolean;
}

/**
 * Extracts a stable conversation identifier from the Gmail table row.
 */
function extractConversationId(row: ConversationRow, fallbackId: string): string {
  const directId =
    row.getAttribute('data-legacy-thread-id') ??
    row.getAttribute('data-legacy-last-msg-id') ??
    row.getAttribute('data-legacy-msg-id') ??
    row.id;

  return directId?.trim() || fallbackId;
}

function getTextContent(
  row: ConversationRow,
  selector: string,
  fallback: string = ''
): string {
  const element = row.querySelector<HTMLElement>(selector);
  if (!element || !element.textContent) {
    return fallback;
  }
  return element.textContent.trim();
}

function extractSender(row: ConversationRow): string {
  const sender =
    getTextContent(row, 'span.yP') ||
    getTextContent(row, 'span.zF') ||
    getTextContent(row, 'span.yX.xY');

  return sender;
}

function extractSubject(row: ConversationRow): string {
  return getTextContent(row, 'span.bog');
}

function extractSnippet(row: ConversationRow): string {
  const rawSnippet = getTextContent(row, 'span.y2');
  if (!rawSnippet) {
    return '';
  }

  // Gmail prefixes snippets with a dash and space ("- Snippet...").
  return rawSnippet.replace(/^\s*-\s*/, '');
}

function extractDate(row: ConversationRow): string {
  const dateText =
    getTextContent(row, 'td.xW span') ||
    getTextContent(row, 'span.xW span') ||
    getTextContent(row, 'td.xW') ||
    getTextContent(row, 'span.xW');

  return dateText;
}

function extractUnreadState(row: ConversationRow): boolean {
  // Gmail marks unread rows with the `zE` class; read rows use `yO`.
  return row.classList.contains('zE');
}

/**
 * Parses a Gmail conversation row (`tr.zA`) into a simplified data object that
 * Mail Bites can render. Returns `null` when both sender and subject cannot be
 * determined (indicating an unsupported DOM shape).
 */
export function extractConversationData(
  row: ConversationRow,
  fallbackId: string
): ConversationData | null {
  const sender = extractSender(row);
  const subject = extractSubject(row);
  const snippet = extractSnippet(row);
  const date = extractDate(row);

  if (!sender && !subject) {
    return null;
  }

  return {
    id: extractConversationId(row, fallbackId),
    sender,
    subject,
    snippet,
    date,
    isUnread: extractUnreadState(row)
  };
}
