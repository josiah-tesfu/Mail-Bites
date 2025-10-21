import { describe, expect, it, beforeEach } from 'vitest';
import { ensureManropeFont } from '@/content/fontLoader';

describe('ensureManropeFont', () => {
  beforeEach(() => {
    const existing = document.getElementById('mail-bites-font-manrope');
    if (existing && existing.parentElement) {
      existing.parentElement.removeChild(existing);
    }
  });

  it('injects a stylesheet link into the document head', () => {
    ensureManropeFont();

    const link = document.getElementById(
      'mail-bites-font-manrope'
    ) as HTMLLinkElement | null;

    expect(link).not.toBeNull();
    expect(link?.rel).toBe('stylesheet');
    expect(link?.href).toContain('fonts.googleapis.com');
  });

  it('does not inject multiple links when called repeatedly', () => {
    ensureManropeFont();
    ensureManropeFont();

    const links = document.querySelectorAll('#mail-bites-font-manrope');
    expect(links).toHaveLength(1);
  });
});
