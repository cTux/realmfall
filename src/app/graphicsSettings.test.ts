import {
  applyGraphicsPreset,
  clearGraphicsSettings,
  DEFAULT_GRAPHICS_SETTINGS,
  loadGraphicsSettings,
  saveGraphicsSettings,
} from './graphicsSettings';

describe('graphics settings persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores graphics settings inside the shared settings payload', () => {
    saveGraphicsSettings(applyGraphicsPreset('performance'));

    expect(
      JSON.parse(window.localStorage.getItem('settings') ?? 'null'),
    ).toEqual({
      graphics: applyGraphicsPreset('performance'),
    });
    expect(
      window.localStorage.getItem('realmfall-graphics-settings'),
    ).toBeNull();
  });

  it('migrates legacy graphics settings into the shared settings payload', () => {
    window.localStorage.setItem(
      'realmfall-graphics-settings',
      JSON.stringify({
        antialias: false,
        preserveDrawingBuffer: true,
      }),
    );

    expect(loadGraphicsSettings()).toEqual({
      ...DEFAULT_GRAPHICS_SETTINGS,
      preset: 'custom',
      antialias: false,
      preserveDrawingBuffer: true,
    });
    expect(
      JSON.parse(window.localStorage.getItem('settings') ?? 'null'),
    ).toEqual({
      graphics: {
        ...DEFAULT_GRAPHICS_SETTINGS,
        preset: 'custom',
        antialias: false,
        preserveDrawingBuffer: true,
      },
    });
    expect(
      window.localStorage.getItem('realmfall-graphics-settings'),
    ).toBeNull();
  });

  it('falls back to defaults for malformed persisted values', () => {
    window.localStorage.setItem(
      'settings',
      JSON.stringify({
        graphics: {
          preset: 'performance',
          antialias: 'no',
          premultipliedAlpha: 1,
        },
      }),
    );

    expect(loadGraphicsSettings()).toEqual(applyGraphicsPreset('performance'));
  });

  it('sanitizes malformed values before storing graphics settings', () => {
    saveGraphicsSettings({
      preset: 'custom',
      resolutionCap: 7 as unknown as 1,
      antialias: false,
      autoDensity: false,
      clearBeforeRender: 'later' as unknown as boolean,
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
      showTerrainBackgrounds: false,
      useContextAlpha: false,
    });

    expect(
      JSON.parse(window.localStorage.getItem('settings') ?? 'null'),
    ).toEqual({
      graphics: {
        preset: 'custom',
        resolutionCap: DEFAULT_GRAPHICS_SETTINGS.resolutionCap,
        antialias: false,
        autoDensity: false,
        clearBeforeRender: DEFAULT_GRAPHICS_SETTINGS.clearBeforeRender,
        preserveDrawingBuffer: true,
        premultipliedAlpha: false,
        showTerrainBackgrounds: false,
        useContextAlpha: false,
      },
    });
  });

  it('clears both current and legacy settings keys', () => {
    window.localStorage.setItem(
      'settings',
      JSON.stringify({ audio: { muted: true }, graphics: {} }),
    );
    window.localStorage.setItem(
      'realmfall-graphics-settings',
      JSON.stringify({ antialias: false }),
    );

    clearGraphicsSettings();

    expect(
      JSON.parse(window.localStorage.getItem('settings') ?? 'null'),
    ).toEqual({
      audio: { muted: true },
    });
    expect(
      window.localStorage.getItem('realmfall-graphics-settings'),
    ).toBeNull();
  });
});
