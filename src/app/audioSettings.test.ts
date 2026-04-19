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
      voice: {
        actorId: 'karen-cenon',
        events: {
          ...DEFAULT_AUDIO_SETTINGS.voice.events,
          combatAttack: false,
        },
      },
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
        voice: {
          actorId: 'karen-cenon',
          events: {
            ...DEFAULT_AUDIO_SETTINGS.voice.events,
            combatAttack: false,
          },
        },
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
          voice: {
            actorId: 'sean-lenhart',
            events: {
              playerDeath: false,
            },
          },
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
      voice: {
        actorId: 'sean-lenhart',
        events: {
          ...DEFAULT_AUDIO_SETTINGS.voice.events,
          playerDeath: false,
        },
      },
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
          voice: {
            actorId: 'broken',
            events: {
              combatStart: 'loud',
              combatEnd: false,
            },
          },
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
      voice: {
        ...DEFAULT_AUDIO_SETTINGS.voice,
        events: {
          ...DEFAULT_AUDIO_SETTINGS.voice.events,
          combatEnd: false,
        },
      },
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
      voice: {
        actorId: 'alex-brodie',
        events: {
          ...DEFAULT_AUDIO_SETTINGS.voice.events,
          worldEvent: false,
        },
      },
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
        voice: {
          actorId: 'alex-brodie',
          events: {
            ...DEFAULT_AUDIO_SETTINGS.voice.events,
            worldEvent: false,
          },
        },
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
          voice: {
            actorId: 'meghan-christian',
            events: {
              ...DEFAULT_AUDIO_SETTINGS.voice.events,
              actionRejected: false,
            },
          },
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
