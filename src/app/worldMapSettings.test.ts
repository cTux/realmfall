import {
  clearWorldMapSettings,
  loadWorldMapSettings,
  saveWorldMapSettings,
} from './worldMapSettings';
import { PERSISTED_SETTINGS_STORAGE_KEYS } from './settingsStorage';

describe('world map settings persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores world map scale and offsets in the world map save area', () => {
    saveWorldMapSettings({
      offsetX: 120,
      offsetY: -48,
      scale: 1.75,
    });

    expect(
      JSON.parse(
        window.localStorage.getItem(PERSISTED_SETTINGS_STORAGE_KEYS.worldMap) ??
          'null',
      ),
    ).toEqual({
      offsetX: 120,
      offsetY: -48,
      scale: 1.75,
    });
  });

  it('loads normalized world map settings from the world map save area', () => {
    window.localStorage.setItem(
      PERSISTED_SETTINGS_STORAGE_KEYS.worldMap,
      JSON.stringify({
        offsetX: 45,
        offsetY: -30,
        scale: 9,
      }),
    );

    expect(loadWorldMapSettings()).toEqual({
      offsetX: 45,
      offsetY: -30,
      scale: 2.5,
    });
  });

  it('clears only the world map save area', () => {
    window.localStorage.setItem(
      PERSISTED_SETTINGS_STORAGE_KEYS.audio,
      JSON.stringify({ muted: true }),
    );
    window.localStorage.setItem(
      PERSISTED_SETTINGS_STORAGE_KEYS.worldMap,
      JSON.stringify({ offsetX: 10, offsetY: 20, scale: 1.2 }),
    );

    clearWorldMapSettings();

    expect(
      JSON.parse(
        window.localStorage.getItem(PERSISTED_SETTINGS_STORAGE_KEYS.audio) ??
          'null',
      ),
    ).toEqual({
      muted: true,
    });
    expect(
      window.localStorage.getItem(PERSISTED_SETTINGS_STORAGE_KEYS.worldMap),
    ).toBeNull();
  });
});
