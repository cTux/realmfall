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
      soundEffects: {
        ...DEFAULT_AUDIO_SETTINGS.soundEffects,
        pop: false,
        swoosh: false,
      },
      theme: 'crisp',
      volume: 0.6,
    });

    expect(
      JSON.parse(window.localStorage.getItem('settings') ?? 'null'),
    ).toEqual({
      audio: {
        muted: true,
        respectReducedMotion: false,
        soundEffects: {
          ...DEFAULT_AUDIO_SETTINGS.soundEffects,
          pop: false,
          swoosh: false,
        },
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
          soundEffects: {
            warning: false,
          },
          theme: 'crisp',
        },
      }),
    );

    expect(loadAudioSettings()).toEqual({
      ...DEFAULT_AUDIO_SETTINGS,
      muted: true,
      soundEffects: {
        ...DEFAULT_AUDIO_SETTINGS.soundEffects,
        warning: false,
      },
      theme: 'crisp',
    });
  });

  it('normalizes malformed persisted audio settings', () => {
    window.localStorage.setItem(
      'settings',
      JSON.stringify({
        audio: {
          muted: 'yes',
          respectReducedMotion: null,
          soundEffects: {
            pop: 'no',
            swoosh: false,
          },
          theme: 'broken',
          volume: 4,
        },
      }),
    );

    expect(loadAudioSettings()).toEqual({
      ...DEFAULT_AUDIO_SETTINGS,
      soundEffects: {
        ...DEFAULT_AUDIO_SETTINGS.soundEffects,
        swoosh: false,
      },
      volume: 1,
    });
  });

  it('stores normalized audio settings', () => {
    saveAudioSettings({
      muted: false,
      respectReducedMotion: true,
      soundEffects: {
        ...DEFAULT_AUDIO_SETTINGS.soundEffects,
        click: false,
      },
      theme: 'soft',
      volume: 3,
    });

    expect(
      JSON.parse(window.localStorage.getItem('settings') ?? 'null'),
    ).toEqual({
      audio: {
        muted: false,
        respectReducedMotion: true,
        soundEffects: {
          ...DEFAULT_AUDIO_SETTINGS.soundEffects,
          click: false,
        },
        theme: 'soft',
        volume: 1,
      },
    });
  });

  it('clears only the audio settings section', () => {
    window.localStorage.setItem(
      'settings',
      JSON.stringify({
        audio: {
          muted: true,
          respectReducedMotion: false,
          soundEffects: {
            ...DEFAULT_AUDIO_SETTINGS.soundEffects,
            error: false,
          },
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
