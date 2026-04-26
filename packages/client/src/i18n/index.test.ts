import { afterEach, describe, expect, it, vi } from 'vitest';

async function importI18nModule() {
  vi.resetModules();
  vi.doMock('./locales/en.json?url', () => ({
    default: '/assets/misc/en-test.json',
  }));

  return import('./index');
}

describe('i18n loader', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.doUnmock('./locales/en.json?url');
  });

  it('fetches the locale asset and updates translations', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        'game.crafting.learnRecipe': 'You learn the {recipe} recipe.',
      }),
    });

    vi.stubGlobal('fetch', fetchMock);

    const { getCurrentLanguage, loadI18n, t } = await importI18nModule();

    await loadI18n();

    expect(fetchMock).toHaveBeenCalledWith('/assets/misc/en-test.json');
    expect(getCurrentLanguage()).toBe('en');
    expect(
      t('game.crafting.learnRecipe', {
        recipe: 'Trail Ration',
      }),
    ).toBe('You learn the Trail Ration recipe.');
  });

  it('throws when the locale is unsupported', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const { loadI18n } = await importI18nModule();

    await expect(loadI18n('fr')).rejects.toThrow('Unsupported locale: fr');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('throws when the locale asset request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
      }),
    );

    const { loadI18n } = await importI18nModule();

    await expect(loadI18n()).rejects.toThrow('Failed to load locale asset: en');
  });
});
