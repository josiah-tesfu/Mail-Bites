import type { ActionType, PreviewActionType, ComposerActionType, ToolbarActionType } from '../types/actionTypes';

export const ACTION_ICON_MAP: Record<ActionType, string> = {
  archive: 'archive-button.svg',
  delete: 'delete-button.svg'
};

export const ACTION_LABELS: Record<ActionType, string> = {
  archive: 'Archive conversation',
  delete: 'Delete conversation'
};

export const PREVIEW_ACTION_ICON_MAP: Record<PreviewActionType, string> = {
  reply: 'reply-button.svg',
  forward: 'forward-button.svg'
};

export const PREVIEW_ACTION_LABELS: Record<PreviewActionType, string> = {
  reply: 'Reply to conversation',
  forward: 'Forward conversation'
};

export const COMPOSER_ACTION_ICON_MAP: Record<ComposerActionType, string> = {
  send: 'send-button.svg',
  delete: 'close-draft.svg'
};

export const COMPOSER_ACTION_LABELS: Record<ComposerActionType, string> = {
  send: 'Send message',
  delete: 'Close draft'
};

export const TOOLBAR_ACTION_ICON_MAP: Record<ToolbarActionType, string> = {
  'new-email': 'new-email-button.svg',
  search: 'search-button.svg',
  read: 'read-button.svg',
  unread: 'unread-button.svg',
  draft: 'draft-button.svg'
};

export const TOOLBAR_ACTION_LABELS: Record<ToolbarActionType, string> = {
  'new-email': 'Compose new email',
  search: 'Search emails',
  read: 'Read emails',
  unread: 'Unread emails',
  draft: 'Drafts'
};

export function resolveAssetPath(filename: string): string {
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(filename);
  }
  return filename;
}
