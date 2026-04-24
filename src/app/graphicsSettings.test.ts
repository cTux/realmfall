import {
  applyGraphicsPreset,
  clearGraphicsSettings,
  DEFAULT_GRAPHICS_SETTINGS,
  loadGraphicsSettings,
  MAX_WORLD_RENDER_FPS,
  MIN_WORLD_RENDER_FPS,
  saveGraphicsSettings,
} from './graphicsSettings';
import { PERSISTED_SETTINGS_STORAGE_KEYS } from './settingsStorage';

describe('graphics settings persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores graphics settings in the graphics save area', () => {
    saveGraphicsSettings(applyGraphicsPreset('performance'));

    expect(
      JSON.parse(
        window.localStorage.getItem(PERSISTED_SETTINGS_STORAGE_KEYS.graphics) ??
          'null',
      ),
    ).toEqual(applyGraphicsPreset('performance'));
    expect(
      window.localStorage.getItem('realmfall-graphics-settings'),
    ).toBeNull();
  });

  it('ignores retired legacy graphics settings', () => {
    window.localStorage.setItem(
      'realmfall-graphics-settings',
      JSON.stringify({
        antialias: false,
        preserveDrawingBuffer: true,
      }),
    );

    expect(loadGraphicsSettings()).toEqual(DEFAULT_GRAPHICS_SETTINGS);
    expect(
      window.localStorage.getItem(PERSISTED_SETTINGS_STORAGE_KEYS.graphics),
    ).toBeNull();
  });

  it('falls back to defaults for malformed persisted values', () => {
    window.localStorage.setItem(
      PERSISTED_SETTINGS_STORAGE_KEYS.graphics,
      JSON.stringify({
        preset: 'performance',
        antialias: 'no',
        premultipliedAlpha: 1,
      }),
    );

    expect(loadGraphicsSettings()).toEqual(applyGraphicsPreset('performance'));
  });

  it('clamps persisted world render FPS into the supported graphics range', () => {
    window.localStorage.setItem(
      PERSISTED_SETTINGS_STORAGE_KEYS.graphics,
      JSON.stringify({
        ...applyGraphicsPreset('balanced'),
        preset: 'custom',
        worldRenderFps: 999,
      }),
    );

    expect(loadGraphicsSettings()).toEqual({
      ...applyGraphicsPreset('balanced'),
      preset: 'custom',
      worldRenderFps: MAX_WORLD_RENDER_FPS,
    });
  });

  it('sanitizes malformed values before storing graphics settings', () => {
    saveGraphicsSettings({
      preset: 'custom',
      resolutionCap: 7 as unknown as 1,
      worldRenderFps: 12,
      antialias: false,
      autoDensity: false,
      clearBeforeRender: 'later' as unknown as boolean,
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
      showTerrainBackgrounds: false,
      useContextAlpha: false,
    });

    expect(
      JSON.parse(
        window.localStorage.getItem(PERSISTED_SETTINGS_STORAGE_KEYS.graphics) ??
          'null',
      ),
    ).toEqual({
      preset: 'custom',
      resolutionCap: DEFAULT_GRAPHICS_SETTINGS.resolutionCap,
      worldRenderFps: MIN_WORLD_RENDER_FPS,
      antialias: false,
      autoDensity: false,
      clearBeforeRender: DEFAULT_GRAPHICS_SETTINGS.clearBeforeRender,
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
      showTerrainBackgrounds: false,
      useContextAlpha: false,
    });
  });

  it('clears the graphics save area and retired legacy key', () => {
    window.localStorage.setItem(
      PERSISTED_SETTINGS_STORAGE_KEYS.audio,
      JSON.stringify({ muted: true }),
    );
    window.localStorage.setItem(
      PERSISTED_SETTINGS_STORAGE_KEYS.graphics,
      JSON.stringify({ antialias: false }),
    );
    window.localStorage.setItem(
      'realmfall-graphics-settings',
      JSON.stringify({ antialias: false }),
    );

    clearGraphicsSettings();

    expect(
      window.localStorage.getItem(PERSISTED_SETTINGS_STORAGE_KEYS.graphics),
    ).toBeNull();
    expect(
      JSON.parse(
        window.localStorage.getItem(PERSISTED_SETTINGS_STORAGE_KEYS.audio) ??
          'null',
      ),
    ).toEqual({ muted: true });
    expect(
      window.localStorage.getItem('realmfall-graphics-settings'),
    ).toBeNull();
  });
});
