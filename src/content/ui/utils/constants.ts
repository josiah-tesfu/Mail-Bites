import type { ActionType, PreviewActionType, ComposerActionType, ToolbarActionType } from './actionTypes';

export const ACTION_ICON_MAP: Record<ActionType, string> = {
  archive: 'archive-button.png',
  delete: 'delete-button.png'
};

export const ACTION_LABELS: Record<ActionType, string> = {
  archive: 'Archive conversation',
  delete: 'Delete conversation'
};

export const PREVIEW_ACTION_ICON_MAP: Record<PreviewActionType, string> = {
  reply: 'reply-button.png',
  forward: 'forward-button.png'
};

export const PREVIEW_ACTION_LABELS: Record<PreviewActionType, string> = {
  reply: 'Reply to conversation',
  forward: 'Forward conversation'
};

export const COMPOSER_ACTION_ICON_MAP: Record<ComposerActionType, string> = {
  send: 'send-button.png',
  delete: 'delete-button.png'
};

export const COMPOSER_ACTION_LABELS: Record<ComposerActionType, string> = {
  send: 'Send message',
  delete: 'Discard message'
};

export const TOOLBAR_ACTION_ICON_MAP: Record<ToolbarActionType, string> = {
  'new-email': 'new-email-button.png',
  search: 'search-button.png',
  'more-things': 'more-things.png'
};

export const TOOLBAR_ACTION_LABELS: Record<ToolbarActionType, string> = {
  'new-email': 'Compose new email',
  search: 'Search emails',
  'more-things': 'More actions'
};

export function resolveAssetPath(filename: string): string {
  if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(filename);
  }
  return filename;
}
