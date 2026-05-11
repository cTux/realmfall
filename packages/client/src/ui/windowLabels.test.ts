import { describe, expect, it, vi } from 'vitest';

describe('window labels', () => {
  it('defers translation lookups until label fields are read', async () => {
    vi.resetModules();
    const tMock = vi.fn((key: string) => `translated:${key}`);
    vi.doMock('../i18n', () => ({
      t: tMock,
    }));

    const { WINDOW_LABELS } = await import('./windowLabels');

    expect(tMock).toHaveBeenCalledTimes(0);

    const heroLabel = WINDOW_LABELS.hero;
    expect(heroLabel.plain).toBe('translated:ui.window.hero.plain');
    expect(heroLabel.prefix).toBe('translated:ui.window.hero.prefix');
    expect(heroLabel.hotkey).toBe('translated:ui.window.hero.hotkey');
    expect(heroLabel.suffix).toBe('translated:ui.window.hero.suffix');

    expect(tMock).toHaveBeenCalledTimes(4);
    vi.doUnmock('../i18n');
  });
});
