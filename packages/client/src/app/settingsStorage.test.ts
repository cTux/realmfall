import { clearAudioSettings } from './audioSettings';
import { clearGraphicsSettings } from './graphicsSettings';
import { PERSISTED_SETTINGS_STORAGE_KEYS } from './settingsStorage';
import { clearWorldMapSettings } from './worldMapSettings';

describe('settings storage recovery', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('treats malformed shared settings as empty when clearing audio', () => {
    window.localStorage.setItem('settings', '{not-json');
    window.localStorage.setItem(
      PERSISTED_SETTINGS_STORAGE_KEYS.audio,
      JSON.stringify({ muted: true }),
    );

    expect(() => clearAudioSettings()).not.toThrow();
    expect(window.localStorage.getItem('settings')).toBe('{not-json');
    expect(
      window.localStorage.getItem(PERSISTED_SETTINGS_STORAGE_KEYS.audio),
    ).toBeNull();
  });

  it('treats malformed shared settings as empty when clearing graphics', () => {
    window.localStorage.setItem('settings', '{not-json');
    window.localStorage.setItem(
      PERSISTED_SETTINGS_STORAGE_KEYS.graphics,
      JSON.stringify({ antialias: false }),
    );
    window.localStorage.setItem(
      'realmfall-graphics-settings',
      JSON.stringify({ antialias: false }),
    );

    expect(() => clearGraphicsSettings()).not.toThrow();
    expect(window.localStorage.getItem('settings')).toBe('{not-json');
    expect(
      window.localStorage.getItem(PERSISTED_SETTINGS_STORAGE_KEYS.graphics),
    ).toBeNull();
    expect(
      window.localStorage.getItem('realmfall-graphics-settings'),
    ).toBeNull();
  });

  it('treats malformed shared settings as empty when clearing world map', () => {
    window.localStorage.setItem('settings', '{not-json');
    window.localStorage.setItem(
      PERSISTED_SETTINGS_STORAGE_KEYS.worldMap,
      JSON.stringify({ offsetX: 10, offsetY: 20, scale: 1.2 }),
    );

    expect(() => clearWorldMapSettings()).not.toThrow();
    expect(window.localStorage.getItem('settings')).toBe('{not-json');
    expect(
      window.localStorage.getItem(PERSISTED_SETTINGS_STORAGE_KEYS.worldMap),
    ).toBeNull();
  });
});
