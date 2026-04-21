import {
  clearWorldMapSettings,
  loadWorldMapSettings,
  saveWorldMapSettings,
} from './worldMapSettings';

describe('world map settings persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores world map scale and offsets in the shared settings payload', () => {
    saveWorldMapSettings({
      offsetX: 120,
      offsetY: -48,
      scale: 1.75,
    });

    expect(
      JSON.parse(window.localStorage.getItem('settings') ?? 'null'),
    ).toEqual({
      worldMap: {
        offsetX: 120,
        offsetY: -48,
        scale: 1.75,
      },
    });
  });

  it('loads normalized world map settings from the shared settings payload', () => {
    window.localStorage.setItem(
      'settings',
      JSON.stringify({
        worldMap: {
          offsetX: 45,
          offsetY: -30,
          scale: 9,
        },
      }),
    );

    expect(loadWorldMapSettings()).toEqual({
      offsetX: 45,
      offsetY: -30,
      scale: 2.5,
    });
  });

  it('clears only the world map settings section', () => {
    window.localStorage.setItem(
      'settings',
      JSON.stringify({
        audio: { muted: true },
        worldMap: { offsetX: 10, offsetY: 20, scale: 1.2 },
      }),
    );

    clearWorldMapSettings();

    expect(
      JSON.parse(window.localStorage.getItem('settings') ?? 'null'),
    ).toEqual({
      audio: { muted: true },
    });
  });
});
