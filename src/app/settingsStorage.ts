import {
  SETTINGS_SAVE_AREA_IDS,
  type SettingsSaveAreaId,
} from '../persistence/saveAreas';

const LEGACY_GRAPHICS_SETTINGS_STORAGE_KEY = 'realmfall-graphics-settings';

export type PersistedSettingsPayload = Partial<
  Record<SettingsSaveAreaId, Record<string, unknown>>
>;

export const PERSISTED_SETTINGS_STORAGE_KEYS = {
  audio: 'realmfall-settings-audio',
  graphics: 'realmfall-settings-graphics',
  worldMap: 'realmfall-settings-world-map',
} satisfies Record<SettingsSaveAreaId, string>;

export function loadStoredSettingsPayload() {
  const entries = SETTINGS_SAVE_AREA_IDS.flatMap((areaId) => {
    const areaPayload = loadStoredSettingsSection(areaId);
    return areaPayload ? ([[areaId, areaPayload]] as const) : [];
  });

  if (entries.length === 0) {
    return null;
  }

  return Object.fromEntries(entries) as PersistedSettingsPayload;
}

export function clearStoredSettingsSection(key: SettingsSaveAreaId) {
  window.localStorage.removeItem(PERSISTED_SETTINGS_STORAGE_KEYS[key]);

  if (key === 'graphics') {
    window.localStorage.removeItem(LEGACY_GRAPHICS_SETTINGS_STORAGE_KEY);
  }
}

export function loadStoredSettingsSection<T extends SettingsSaveAreaId>(
  key: T,
) {
  const payload = window.localStorage.getItem(
    PERSISTED_SETTINGS_STORAGE_KEYS[key],
  );
  if (!payload) {
    return null;
  }

  try {
    return JSON.parse(payload) as PersistedSettingsPayload[T];
  } catch {
    return null;
  }
}

export function saveStoredSettingsSection(
  key: SettingsSaveAreaId,
  value: Record<string, unknown>,
) {
  if (Object.keys(value).length === 0) {
    window.localStorage.removeItem(PERSISTED_SETTINGS_STORAGE_KEYS[key]);
  } else {
    window.localStorage.setItem(
      PERSISTED_SETTINGS_STORAGE_KEYS[key],
      JSON.stringify(value),
    );
  }

  if (key === 'graphics') {
    window.localStorage.removeItem(LEGACY_GRAPHICS_SETTINGS_STORAGE_KEY);
  }
}

export function clearStoredSettingsPayload() {
  SETTINGS_SAVE_AREA_IDS.forEach((areaId) => {
    window.localStorage.removeItem(PERSISTED_SETTINGS_STORAGE_KEYS[areaId]);
  });
  window.localStorage.removeItem(LEGACY_GRAPHICS_SETTINGS_STORAGE_KEY);
}
