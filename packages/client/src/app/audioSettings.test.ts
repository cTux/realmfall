import {
  clearAudioSettings,
  DEFAULT_AUDIO_SETTINGS,
  loadAudioSettings,
  saveAudioSettings,
} from './audioSettings';
import { PERSISTED_SETTINGS_STORAGE_KEYS } from './settingsStorage';

describe('audio settings persistence', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('stores audio settings in the audio save area', () => {
    saveAudioSettings({
      musicMuted: true,
      muted: true,
      respectReducedMotion: false,
      soundEffects: {
        ...DEFAULT_AUDIO_SETTINGS.soundEffects,
        pop: false,
        swoosh: false,
      },
      theme: 'crisp',
      musicVolume: 0.6,
      uiVolume: 0.6,
      voiceVolume: 0.6,
      voice: {
        actorId: 'karen-cenon',
        events: {
          ...DEFAULT_AUDIO_SETTINGS.voice.events,
          combatAttack: false,
        },
      },
    });

    expect(
      JSON.parse(
        window.localStorage.getItem(PERSISTED_SETTINGS_STORAGE_KEYS.audio) ??
          'null',
      ),
    ).toEqual({
      musicMuted: true,
      muted: true,
      respectReducedMotion: false,
      soundEffects: {
        ...DEFAULT_AUDIO_SETTINGS.soundEffects,
        pop: false,
        swoosh: false,
      },
      theme: 'crisp',
      musicVolume: 0.6,
      uiVolume: 0.6,
      voiceVolume: 0.6,
      voice: {
        actorId: 'karen-cenon',
        events: {
          ...DEFAULT_AUDIO_SETTINGS.voice.events,
          combatAttack: false,
        },
      },
    });
  });

  it('merges persisted audio settings with defaults', () => {
    window.localStorage.setItem(
      PERSISTED_SETTINGS_STORAGE_KEYS.audio,
      JSON.stringify({
        musicMuted: true,
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
      }),
    );

    expect(loadAudioSettings()).toEqual({
      ...DEFAULT_AUDIO_SETTINGS,
      musicMuted: true,
      muted: true,
      soundEffects: {
        ...DEFAULT_AUDIO_SETTINGS.soundEffects,
        warning: false,
      },
      theme: 'crisp',
      musicVolume: DEFAULT_AUDIO_SETTINGS.musicVolume,
      uiVolume: DEFAULT_AUDIO_SETTINGS.uiVolume,
      voiceVolume: DEFAULT_AUDIO_SETTINGS.voiceVolume,
      voice: {
        actorId: 'sean-lenhart',
        events: {
          ...DEFAULT_AUDIO_SETTINGS.voice.events,
          playerDeath: false,
        },
      },
    });
  });

  it('migrates legacy master volume to all category volumes', () => {
    window.localStorage.setItem(
      PERSISTED_SETTINGS_STORAGE_KEYS.audio,
      JSON.stringify({
        muted: false,
        musicMuted: false,
        respectReducedMotion: true,
        soundEffects: {
          ...DEFAULT_AUDIO_SETTINGS.soundEffects,
        },
        theme: 'soft',
        volume: 0.45,
        voice: {
          actorId: DEFAULT_AUDIO_SETTINGS.voice.actorId,
          events: {
            ...DEFAULT_AUDIO_SETTINGS.voice.events,
          },
        },
      }),
    );

    expect(loadAudioSettings()).toEqual({
      ...DEFAULT_AUDIO_SETTINGS,
      musicVolume: 0.45,
      uiVolume: 0.45,
      voiceVolume: 0.45,
    });
  });

  it('normalizes malformed persisted audio settings', () => {
    window.localStorage.setItem(
      PERSISTED_SETTINGS_STORAGE_KEYS.audio,
      JSON.stringify({
        muted: 'yes',
        musicMuted: 'quiet',
        respectReducedMotion: null,
        soundEffects: {
          pop: 'no',
          swoosh: false,
        },
        theme: 'broken',
        musicVolume: 'loud',
        uiVolume: 2,
        voiceVolume: -1,
        voice: {
          actorId: 'broken',
          events: {
            combatAttack: 'loud',
            combatEnd: false,
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
      musicVolume: DEFAULT_AUDIO_SETTINGS.musicVolume,
      uiVolume: 1,
      voiceVolume: 0,
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
      musicMuted: false,
      muted: false,
      respectReducedMotion: true,
      soundEffects: {
        ...DEFAULT_AUDIO_SETTINGS.soundEffects,
        click: false,
      },
      theme: 'soft',
      musicVolume: 3,
      uiVolume: 3,
      voiceVolume: 3,
      voice: {
        actorId: 'alex-brodie',
        events: {
          ...DEFAULT_AUDIO_SETTINGS.voice.events,
          combatExertion: false,
        },
      },
    });

    expect(
      JSON.parse(
        window.localStorage.getItem(PERSISTED_SETTINGS_STORAGE_KEYS.audio) ??
          'null',
      ),
    ).toEqual({
      musicMuted: false,
      muted: false,
      respectReducedMotion: true,
      soundEffects: {
        ...DEFAULT_AUDIO_SETTINGS.soundEffects,
        click: false,
      },
      theme: 'soft',
      musicVolume: 1,
      uiVolume: 1,
      voiceVolume: 1,
      voice: {
        actorId: 'alex-brodie',
        events: {
          ...DEFAULT_AUDIO_SETTINGS.voice.events,
          combatExertion: false,
        },
      },
    });
  });

  it('clears only the audio save area', () => {
    window.localStorage.setItem(
      PERSISTED_SETTINGS_STORAGE_KEYS.audio,
      JSON.stringify({
        musicMuted: true,
        muted: true,
        respectReducedMotion: false,
        soundEffects: {
          ...DEFAULT_AUDIO_SETTINGS.soundEffects,
          error: false,
        },
        theme: 'crisp',
        musicVolume: 0.6,
        uiVolume: 0.6,
        voiceVolume: 0.6,
        voice: {
          actorId: 'meghan-christian',
          events: {
            ...DEFAULT_AUDIO_SETTINGS.voice.events,
            playerDamaged: false,
          },
        },
      }),
    );
    window.localStorage.setItem(
      PERSISTED_SETTINGS_STORAGE_KEYS.graphics,
      JSON.stringify({
        antialias: false,
      }),
    );

    clearAudioSettings();

    expect(
      window.localStorage.getItem(PERSISTED_SETTINGS_STORAGE_KEYS.audio),
    ).toBeNull();
    expect(
      JSON.parse(
        window.localStorage.getItem(PERSISTED_SETTINGS_STORAGE_KEYS.graphics) ??
          'null',
      ),
    ).toEqual({
      antialias: false,
    });
  });
});
