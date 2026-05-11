import {
  GAMEPLAY_LABEL_KEYS,
  GRAPHICS_LABEL_KEYS,
  TAB_LABEL_KEYS,
} from './keys';

export type SettingsTab = keyof typeof TAB_LABEL_KEYS;
export type GraphicsSettingId = keyof typeof GRAPHICS_LABEL_KEYS;
export type GameplaySettingId = keyof typeof GAMEPLAY_LABEL_KEYS;
export type AudioSoundEffectId = 'pop';
export type VoiceEventId = 'combatAttack';
export type ImpactLevel = 'high' | 'low' | 'medium';

export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
