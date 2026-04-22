export const ENCRYPTED_SAVE_AREA_IDS = ['game', 'ui'] as const;

export type EncryptedSaveAreaId = (typeof ENCRYPTED_SAVE_AREA_IDS)[number];

export const SETTINGS_SAVE_AREA_IDS = [
  'audio',
  'graphics',
  'worldMap',
] as const;

export type SettingsSaveAreaId = (typeof SETTINGS_SAVE_AREA_IDS)[number];

export const RESETTABLE_SAVE_AREA_IDS = [
  ...ENCRYPTED_SAVE_AREA_IDS,
  ...SETTINGS_SAVE_AREA_IDS,
] as const;

export type ResettableSaveAreaId = (typeof RESETTABLE_SAVE_AREA_IDS)[number];

export function isEncryptedSaveAreaId(
  value: ResettableSaveAreaId,
): value is EncryptedSaveAreaId {
  return value === 'game' || value === 'ui';
}
