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
    return {
      ...DEFAULT_AUDIO_SETTINGS,
      ...loadStoredSettingsPayload()?.audio,
    } as AudioSettings;
  } catch {
    return DEFAULT_AUDIO_SETTINGS;
  }
}

export function saveAudioSettings(settings: AudioSettings) {
  if (typeof window === 'undefined') return;

  updateStoredSettingsPayload((current) => ({
    ...current,
    audio: settings as unknown as Record<string, unknown>,
  }));
}

export function clearAudioSettings() {
  if (typeof window === 'undefined') return;
  clearStoredSettingsSection('audio');
}
