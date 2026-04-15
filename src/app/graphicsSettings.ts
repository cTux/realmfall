export interface GraphicsSettings {
  antialias: boolean;
  autoDensity: boolean;
  clearBeforeRender: boolean;
  preserveDrawingBuffer: boolean;
  premultipliedAlpha: boolean;
  useContextAlpha: boolean;
}

export interface GraphicsSettingsOptionDefinition {
  key: keyof GraphicsSettings;
  labelKey: string;
  descriptionKey: string;
}

interface PersistedSettings {
  graphics?: Partial<GraphicsSettings>;
}

const SETTINGS_STORAGE_KEY = 'settings';
const LEGACY_GRAPHICS_SETTINGS_STORAGE_KEY = 'realmfall-graphics-settings';

export const DEFAULT_GRAPHICS_SETTINGS: GraphicsSettings = {
  antialias: true,
  autoDensity: true,
  clearBeforeRender: true,
  preserveDrawingBuffer: false,
  premultipliedAlpha: true,
  useContextAlpha: true,
};

export const GRAPHICS_SETTINGS_OPTIONS: GraphicsSettingsOptionDefinition[] = [
  {
    key: 'antialias',
    labelKey: 'ui.settings.graphics.antialias.label',
    descriptionKey: 'ui.settings.graphics.antialias.description',
  },
  {
    key: 'autoDensity',
    labelKey: 'ui.settings.graphics.autoDensity.label',
    descriptionKey: 'ui.settings.graphics.autoDensity.description',
  },
  {
    key: 'clearBeforeRender',
    labelKey: 'ui.settings.graphics.clearBeforeRender.label',
    descriptionKey: 'ui.settings.graphics.clearBeforeRender.description',
  },
  {
    key: 'preserveDrawingBuffer',
    labelKey: 'ui.settings.graphics.preserveDrawingBuffer.label',
    descriptionKey: 'ui.settings.graphics.preserveDrawingBuffer.description',
  },
  {
    key: 'premultipliedAlpha',
    labelKey: 'ui.settings.graphics.premultipliedAlpha.label',
    descriptionKey: 'ui.settings.graphics.premultipliedAlpha.description',
  },
  {
    key: 'useContextAlpha',
    labelKey: 'ui.settings.graphics.useContextAlpha.label',
    descriptionKey: 'ui.settings.graphics.useContextAlpha.description',
  },
];

export function loadGraphicsSettings() {
  if (typeof window === 'undefined') {
    return DEFAULT_GRAPHICS_SETTINGS;
  }

  try {
    const settings = loadPersistedSettings();
    const loadedGraphicsSettings = {
      ...DEFAULT_GRAPHICS_SETTINGS,
      ...settings.graphics,
    };

    if (
      !window.localStorage.getItem(SETTINGS_STORAGE_KEY) &&
      window.localStorage.getItem(LEGACY_GRAPHICS_SETTINGS_STORAGE_KEY)
    ) {
      savePersistedSettings({ graphics: loadedGraphicsSettings });
    }

    return loadedGraphicsSettings;
  } catch {
    return DEFAULT_GRAPHICS_SETTINGS;
  }
}

export function saveGraphicsSettings(settings: GraphicsSettings) {
  if (typeof window === 'undefined') return;

  const currentSettings = loadStoredSettingsPayload();
  savePersistedSettings({
    ...currentSettings,
    graphics: settings,
  });
}

export function clearGraphicsSettings() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SETTINGS_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_GRAPHICS_SETTINGS_STORAGE_KEY);
}

function loadPersistedSettings(): PersistedSettings {
  const currentSettings = loadStoredSettingsPayload();
  if (currentSettings) {
    return currentSettings;
  }

  const legacyPayload = window.localStorage.getItem(
    LEGACY_GRAPHICS_SETTINGS_STORAGE_KEY,
  );
  if (!legacyPayload) {
    return {};
  }

  return {
    graphics: JSON.parse(legacyPayload) as Partial<GraphicsSettings>,
  };
}

function loadStoredSettingsPayload(): PersistedSettings | null {
  const payload = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
  if (!payload) {
    return null;
  }

  return JSON.parse(payload) as PersistedSettings;
}

function savePersistedSettings(settings: PersistedSettings) {
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  window.localStorage.removeItem(LEGACY_GRAPHICS_SETTINGS_STORAGE_KEY);
}
