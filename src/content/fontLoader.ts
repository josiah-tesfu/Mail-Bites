/**
 * Ensures the Manrope font family is available within the Gmail document.
 * The font is loaded by injecting a Google Fonts stylesheet link into
 * the document head. Subsequent calls are no-ops.
 */
const FONT_LINK_ID = 'mail-bites-font-manrope';
const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap';

export function ensureManropeFont(): void {
  if (document.getElementById(FONT_LINK_ID)) {
    return;
  }

  const link = document.createElement('link');
  link.id = FONT_LINK_ID;
  link.rel = 'stylesheet';
  link.href = FONT_HREF;
  link.crossOrigin = 'anonymous';

  const target = document.head ?? document.documentElement;
  target.appendChild(link);
}
