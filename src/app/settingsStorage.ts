const SETTINGS_STORAGE_KEY = 'settings';
const LEGACY_GRAPHICS_SETTINGS_STORAGE_KEY = 'realmfall-graphics-settings';

export interface PersistedSettingsPayload {
  audio?: Record<string, unknown>;
  graphics?: Record<string, unknown>;
}

export function loadStoredSettingsPayload() {
  const payload = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!payload) {
    return null;
  }

  return JSON.parse(payload) as PersistedSettingsPayload;
}

export function loadLegacyGraphicsSettingsPayload() {
  const payload = window.localStorage.getItem(
    LEGACY_GRAPHICS_SETTINGS_STORAGE_KEY,
  );
  if (!payload) {
    return null;
  }

  return JSON.parse(payload) as Record<string, unknown>;
}

export function updateStoredSettingsPayload(
  updater: (current: PersistedSettingsPayload) => PersistedSettingsPayload,
) {
  saveStoredSettingsPayload(updater(loadStoredSettingsPayload() ?? {}));
}

export function clearStoredSettingsSection(
  key: keyof PersistedSettingsPayload,
) {
  const current = loadStoredSettingsPayload();
  if (!current) {
    if (key === 'graphics') {
      window.localStorage.removeItem(LEGACY_GRAPHICS_SETTINGS_STORAGE_KEY);
    }
    return;
  }

  const next = { ...current };
  delete next[key];
  saveStoredSettingsPayload(next);

  if (key === 'graphics') {
    window.localStorage.removeItem(LEGACY_GRAPHICS_SETTINGS_STORAGE_KEY);
  }
}

export function clearStoredSettingsPayload() {
  window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_GRAPHICS_SETTINGS_STORAGE_KEY);
}

function saveStoredSettingsPayload(settings: PersistedSettingsPayload) {
  const sanitized = Object.fromEntries(
    Object.entries(settings).filter(
      ([, value]) => value && Object.keys(value).length > 0,
    ),
  ) as PersistedSettingsPayload;

  if (Object.keys(sanitized).length === 0) {
    window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
  } else {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify(sanitized),
    );
  }

  window.localStorage.removeItem(LEGACY_GRAPHICS_SETTINGS_STORAGE_KEY);
}
