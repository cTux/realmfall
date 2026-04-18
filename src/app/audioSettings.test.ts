import {
  clearAudioSettings,
  DEFAULT_AUDIO_SETTINGS,
  loadAudioSettings,
  saveAudioSettings,
} from './audioSettings';

describe('audio settings persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores audio settings inside the shared settings payload', () => {
    saveAudioSettings({
      muted: true,
      respectReducedMotion: false,
      theme: 'crisp',
      volume: 0.6,
    });

    expect(
      JSON.parse(window.localStorage.getItem('settings') ?? 'null'),
    ).toEqual({
      audio: {
        muted: true,
        respectReducedMotion: false,
        theme: 'crisp',
        volume: 0.6,
      },
    });
  });

  it('merges persisted audio settings with defaults', () => {
    window.localStorage.setItem(
      'settings',
      JSON.stringify({
        audio: {
          muted: true,
          theme: 'crisp',
        },
      }),
    );

    expect(loadAudioSettings()).toEqual({
      ...DEFAULT_AUDIO_SETTINGS,
      muted: true,
      theme: 'crisp',
    });
  });

  it('clears only the audio settings section', () => {
    window.localStorage.setItem(
      'settings',
      JSON.stringify({
        audio: {
          muted: true,
          respectReducedMotion: false,
          theme: 'crisp',
          volume: 0.6,
        },
        graphics: {
          antialias: false,
        },
      }),
    );

    clearAudioSettings();

    expect(
      JSON.parse(window.localStorage.getItem('settings') ?? 'null'),
    ).toEqual({
      graphics: {
        antialias: false,
      },
    });
  });
});
