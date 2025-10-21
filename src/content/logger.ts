/**
 * Shared logging utilities for the Mail Bites content script.
 *
 * The Chrome extension lives entirely inside Gmail's DOM, so writing to the
 * console with a consistent prefix makes it easier to filter messages while
 * debugging or instructing future contributors.
 */

const LOG_PREFIX = '[Mail Bites]';

export interface Logger {
  info: (...payload: unknown[]) => void;
  warn: (...payload: unknown[]) => void;
  error: (...payload: unknown[]) => void;
}

/**
 * Lightweight wrapper around the browser console that namespaces output.
 */
export const logger: Logger = {
  info: (...payload) => console.info(LOG_PREFIX, ...payload),
  warn: (...payload) => console.warn(LOG_PREFIX, ...payload),
  error: (...payload) => console.error(LOG_PREFIX, ...payload)
};
