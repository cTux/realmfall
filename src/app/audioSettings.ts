import type { ThemeName } from '@rexa-developer/tiks';
import {
  isStoredSettingsRecord,
  normalizeStoredBoolean,
  normalizeStoredFiniteNumber,
} from './settingsNormalization';
import { createSettingsSectionStore } from './settingsSectionStore';
import {
  VOICE_PLAYBACK_EVENT_OPTIONS,
  type VoicePlaybackEventId,
} from './audio/voiceEvents';
import {
  VOICE_ACTOR_OPTIONS,
  isVoiceActorId,
  type VoiceActorId,
} from './audio/voiceActors';

export interface AudioSettings {
  musicMuted: boolean;
  muted: boolean;
  respectReducedMotion: boolean;
  soundEffects: AudioSoundEffectsSettings;
  theme: ThemeName;
  volume: number;
  voice: VoiceSettings;
}

export interface AudioSoundEffectsSettings {
  click: boolean;
  error: boolean;
  hover: boolean;
  notify: boolean;
  pop: boolean;
  success: boolean;
  swoosh: boolean;
  toggle: boolean;
  warning: boolean;
}

export interface VoiceSettings {
  actorId: VoiceActorId;
  events: VoiceEventSettings;
}

export type VoiceEventSettings = Record<VoicePlaybackEventId, boolean>;

export interface AudioThemeOptionDefinition {
  labelKey: string;
  value: ThemeName;
}

export interface AudioSettingsToggleOptionDefinition {
  key: 'muted' | 'musicMuted' | 'respectReducedMotion';
  labelKey: string;
  descriptionKey: string;
}

export interface AudioSettingsSoundEffectOptionDefinition {
  key: keyof AudioSoundEffectsSettings;
  labelKey: string;
  descriptionKey: string;
}

export interface AudioVoiceEventOptionDefinition {
  key: keyof VoiceEventSettings;
  labelKey: string;
  descriptionKey: string;
}

export const DEFAULT_AUDIO_SOUND_EFFECTS: AudioSoundEffectsSettings = {
  click: true,
  error: true,
  hover: true,
  notify: true,
  pop: true,
  success: true,
  swoosh: true,
  toggle: true,
  warning: true,
};

export const DEFAULT_VOICE_EVENT_SETTINGS: VoiceEventSettings = {
  combatAttack: true,
  combatEnd: true,
  combatExertion: true,
  playerDamaged: true,
  playerDeath: true,
};

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  musicMuted: false,
  muted: false,
  respectReducedMotion: true,
  soundEffects: DEFAULT_AUDIO_SOUND_EFFECTS,
  theme: 'soft',
  volume: 0.3,
  voice: {
    actorId: VOICE_ACTOR_OPTIONS[0]!.id,
    events: DEFAULT_VOICE_EVENT_SETTINGS,
  },
};

const audioSettingsStore = createSettingsSectionStore({
  areaId: 'audio',
  defaults: DEFAULT_AUDIO_SETTINGS,
  normalize: normalizeAudioSettings,
});

export const AUDIO_THEME_OPTIONS: AudioThemeOptionDefinition[] = [
  {
    value: 'soft',
    labelKey: 'ui.settings.audio.theme.soft',
  },
  {
    value: 'crisp',
    labelKey: 'ui.settings.audio.theme.crisp',
  },
];

export const AUDIO_SETTINGS_TOGGLE_OPTIONS: AudioSettingsToggleOptionDefinition[] =
  [
    {
      key: 'musicMuted',
      labelKey: 'ui.settings.audio.musicMuted.label',
      descriptionKey: 'ui.settings.audio.musicMuted.description',
    },
    {
      key: 'muted',
      labelKey: 'ui.settings.audio.muted.label',
      descriptionKey: 'ui.settings.audio.muted.description',
    },
    {
      key: 'respectReducedMotion',
      labelKey: 'ui.settings.audio.respectReducedMotion.label',
      descriptionKey: 'ui.settings.audio.respectReducedMotion.description',
    },
  ];

export const AUDIO_SETTINGS_SOUND_EFFECT_OPTIONS: AudioSettingsSoundEffectOptionDefinition[] =
  [
    {
      key: 'hover',
      labelKey: 'ui.settings.audio.soundEffects.hover.label',
      descriptionKey: 'ui.settings.audio.soundEffects.hover.description',
    },
    {
      key: 'click',
      labelKey: 'ui.settings.audio.soundEffects.click.label',
      descriptionKey: 'ui.settings.audio.soundEffects.click.description',
    },
    {
      key: 'toggle',
      labelKey: 'ui.settings.audio.soundEffects.toggle.label',
      descriptionKey: 'ui.settings.audio.soundEffects.toggle.description',
    },
    {
      key: 'pop',
      labelKey: 'ui.settings.audio.soundEffects.pop.label',
      descriptionKey: 'ui.settings.audio.soundEffects.pop.description',
    },
    {
      key: 'swoosh',
      labelKey: 'ui.settings.audio.soundEffects.swoosh.label',
      descriptionKey: 'ui.settings.audio.soundEffects.swoosh.description',
    },
    {
      key: 'notify',
      labelKey: 'ui.settings.audio.soundEffects.notify.label',
      descriptionKey: 'ui.settings.audio.soundEffects.notify.description',
    },
    {
      key: 'success',
      labelKey: 'ui.settings.audio.soundEffects.success.label',
      descriptionKey: 'ui.settings.audio.soundEffects.success.description',
    },
    {
      key: 'warning',
      labelKey: 'ui.settings.audio.soundEffects.warning.label',
      descriptionKey: 'ui.settings.audio.soundEffects.warning.description',
    },
    {
      key: 'error',
      labelKey: 'ui.settings.audio.soundEffects.error.label',
      descriptionKey: 'ui.settings.audio.soundEffects.error.description',
    },
  ];

export const AUDIO_SETTINGS_VOICE_EVENT_OPTIONS: AudioVoiceEventOptionDefinition[] =
  VOICE_PLAYBACK_EVENT_OPTIONS.map((option) => ({
    key: option.key,
    labelKey: option.labelKey,
    descriptionKey: option.descriptionKey,
  }));

export function loadAudioSettings() {
  return audioSettingsStore.load();
}

export function saveAudioSettings(settings: AudioSettings) {
  audioSettingsStore.save(settings);
}

export function clearAudioSettings() {
  audioSettingsStore.clear();
}

function normalizeAudioSettings(settings: unknown): AudioSettings {
  if (!isStoredSettingsRecord(settings)) {
    return DEFAULT_AUDIO_SETTINGS;
  }

  return {
    musicMuted: normalizeStoredBoolean(
      settings.musicMuted,
      DEFAULT_AUDIO_SETTINGS.musicMuted,
    ),
    muted: normalizeStoredBoolean(settings.muted, DEFAULT_AUDIO_SETTINGS.muted),
    respectReducedMotion: normalizeStoredBoolean(
      settings.respectReducedMotion,
      DEFAULT_AUDIO_SETTINGS.respectReducedMotion,
    ),
    soundEffects: normalizeAudioSoundEffects(settings.soundEffects),
    theme: isThemeName(settings.theme)
      ? settings.theme
      : DEFAULT_AUDIO_SETTINGS.theme,
    volume: clampVolume(
      normalizeStoredFiniteNumber(
        settings.volume,
        DEFAULT_AUDIO_SETTINGS.volume,
      ),
    ),
    voice: normalizeVoiceSettings(settings.voice),
  };
}

function clampVolume(volume: number) {
  return Math.min(1, Math.max(0, volume));
}

function normalizeAudioSoundEffects(
  soundEffects: unknown,
): AudioSoundEffectsSettings {
  if (!isStoredSettingsRecord(soundEffects)) {
    return DEFAULT_AUDIO_SOUND_EFFECTS;
  }

  return {
    click: normalizeStoredBoolean(
      soundEffects.click,
      DEFAULT_AUDIO_SOUND_EFFECTS.click,
    ),
    error: normalizeStoredBoolean(
      soundEffects.error,
      DEFAULT_AUDIO_SOUND_EFFECTS.error,
    ),
    hover: normalizeStoredBoolean(
      soundEffects.hover,
      DEFAULT_AUDIO_SOUND_EFFECTS.hover,
    ),
    notify: normalizeStoredBoolean(
      soundEffects.notify,
      DEFAULT_AUDIO_SOUND_EFFECTS.notify,
    ),
    pop: normalizeStoredBoolean(
      soundEffects.pop,
      DEFAULT_AUDIO_SOUND_EFFECTS.pop,
    ),
    success: normalizeStoredBoolean(
      soundEffects.success,
      DEFAULT_AUDIO_SOUND_EFFECTS.success,
    ),
    swoosh: normalizeStoredBoolean(
      soundEffects.swoosh,
      DEFAULT_AUDIO_SOUND_EFFECTS.swoosh,
    ),
    toggle: normalizeStoredBoolean(
      soundEffects.toggle,
      DEFAULT_AUDIO_SOUND_EFFECTS.toggle,
    ),
    warning: normalizeStoredBoolean(
      soundEffects.warning,
      DEFAULT_AUDIO_SOUND_EFFECTS.warning,
    ),
  };
}

function normalizeVoiceSettings(voice: unknown): VoiceSettings {
  if (!isStoredSettingsRecord(voice)) {
    return DEFAULT_AUDIO_SETTINGS.voice;
  }

  return {
    actorId: isVoiceActorId(voice.actorId)
      ? voice.actorId
      : DEFAULT_AUDIO_SETTINGS.voice.actorId,
    events: normalizeVoiceEventSettings(voice.events),
  };
}

function normalizeVoiceEventSettings(events: unknown): VoiceEventSettings {
  if (!isStoredSettingsRecord(events)) {
    return DEFAULT_VOICE_EVENT_SETTINGS;
  }

  return Object.fromEntries(
    VOICE_PLAYBACK_EVENT_OPTIONS.map((option) => [
      option.key,
      normalizeStoredBoolean(
        events[option.key],
        DEFAULT_VOICE_EVENT_SETTINGS[option.key],
      ),
    ]),
  ) as VoiceEventSettings;
}

function isThemeName(value: unknown): value is ThemeName {
  return value === 'soft' || value === 'crisp';
}
