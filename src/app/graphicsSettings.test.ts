import {
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
    saveGraphicsSettings({
      antialias: false,
      autoDensity: false,
      clearBeforeRender: false,
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
      useContextAlpha: false,
    });

    expect(
      JSON.parse(window.localStorage.getItem('settings') ?? 'null'),
    ).toEqual({
      graphics: {
        antialias: false,
        autoDensity: false,
        clearBeforeRender: false,
        preserveDrawingBuffer: true,
        premultipliedAlpha: false,
        useContextAlpha: false,
      },
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
      antialias: false,
      preserveDrawingBuffer: true,
    });
    expect(
      JSON.parse(window.localStorage.getItem('settings') ?? 'null'),
    ).toEqual({
      graphics: {
        ...DEFAULT_GRAPHICS_SETTINGS,
        antialias: false,
        preserveDrawingBuffer: true,
      },
    });
    expect(
      window.localStorage.getItem('realmfall-graphics-settings'),
    ).toBeNull();
  });

  it('clears both current and legacy settings keys', () => {
    window.localStorage.setItem('settings', JSON.stringify({ graphics: {} }));
    window.localStorage.setItem(
      'realmfall-graphics-settings',
      JSON.stringify({ antialias: false }),
    );

    clearGraphicsSettings();

    expect(window.localStorage.getItem('settings')).toBeNull();
    expect(
      window.localStorage.getItem('realmfall-graphics-settings'),
    ).toBeNull();
  });
});
