import type { ThemeName } from '@rexa-developer/tiks';
import {
  clearStoredSettingsSection,
  loadStoredSettingsPayload,
  updateStoredSettingsPayload,
} from './settingsStorage';

export interface AudioSettings {
  muted: boolean;
  respectReducedMotion: boolean;
  theme: ThemeName;
  volume: number;
}

export interface AudioThemeOptionDefinition {
  labelKey: string;
  value: ThemeName;
}

export interface AudioSettingsToggleOptionDefinition {
  key: 'muted' | 'respectReducedMotion';
  labelKey: string;
  descriptionKey: string;
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  muted: false,
  respectReducedMotion: true,
  theme: 'soft',
  volume: 0.3,
};

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

export function loadAudioSettings() {
  if (typeof window === 'undefined') {
    return DEFAULT_AUDIO_SETTINGS;
  }

  try {
    return normalizeAudioSettings(loadStoredSettingsPayload()?.audio);
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

export function saveAudioSettings(settings: AudioSettings) {
  if (typeof window === 'undefined') return;

  const normalizedSettings = normalizeAudioSettings(settings);
  updateStoredSettingsPayload((current) => ({
    ...current,
    audio: normalizedSettings as unknown as Record<string, unknown>,
  }));
}

export function clearAudioSettings() {
  if (typeof window === 'undefined') return;
  clearStoredSettingsSection('audio');
}

function normalizeAudioSettings(settings: unknown): AudioSettings {
  if (!isRecord(settings)) {
    return DEFAULT_AUDIO_SETTINGS;
  }

  return {
    muted:
      typeof settings.muted === 'boolean'
        ? settings.muted
        : DEFAULT_AUDIO_SETTINGS.muted,
    respectReducedMotion:
      typeof settings.respectReducedMotion === 'boolean'
        ? settings.respectReducedMotion
        : DEFAULT_AUDIO_SETTINGS.respectReducedMotion,
    theme: isThemeName(settings.theme)
      ? settings.theme
      : DEFAULT_AUDIO_SETTINGS.theme,
    volume:
      typeof settings.volume === 'number' && Number.isFinite(settings.volume)
        ? clampVolume(settings.volume)
        : DEFAULT_AUDIO_SETTINGS.volume,
  };
}

function clampVolume(volume: number) {
  return Math.min(1, Math.max(0, volume));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isThemeName(value: unknown): value is ThemeName {
  return value === 'soft' || value === 'crisp';
}
