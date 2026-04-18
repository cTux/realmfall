import {
  clearStoredSettingsSection,
  loadLegacyGraphicsSettingsPayload,
  loadStoredSettingsPayload,
  updateStoredSettingsPayload,
} from './settingsStorage';

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

    if (!loadStoredSettingsPayload() && loadLegacyGraphicsSettingsPayload()) {
      saveGraphicsSettings(loadedGraphicsSettings);
    }

    return loadedGraphicsSettings;
  } catch {
    return DEFAULT_GRAPHICS_SETTINGS;
  }
}

export function saveGraphicsSettings(settings: GraphicsSettings) {
  if (typeof window === 'undefined') return;

  updateStoredSettingsPayload((current) => ({
    ...current,
    graphics: settings as unknown as Record<string, unknown>,
  }));
}

export function clearGraphicsSettings() {
  if (typeof window === 'undefined') return;
  clearStoredSettingsSection('graphics');
}

function loadPersistedSettings(): PersistedSettings {
  const currentSettings = loadStoredSettingsPayload();
  if (currentSettings) {
    return {
      graphics:
        currentSettings.graphics as Partial<GraphicsSettings> | undefined,
    };
  }

  const legacyPayload = loadLegacyGraphicsSettingsPayload();
  if (!legacyPayload) {
    return {};
  }

  return {
    graphics: legacyPayload as Partial<GraphicsSettings>,
  };
}

interface PersistedSettings {
  graphics?: Partial<GraphicsSettings>;
}
