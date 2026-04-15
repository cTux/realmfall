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

const GRAPHICS_SETTINGS_STORAGE_KEY = 'realmfall-graphics-settings';

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
    const payload = window.localStorage.getItem(GRAPHICS_SETTINGS_STORAGE_KEY);
    if (!payload) {
      return DEFAULT_GRAPHICS_SETTINGS;
    }

    return {
      ...DEFAULT_GRAPHICS_SETTINGS,
      ...(JSON.parse(payload) as Partial<GraphicsSettings>),
    };
  } catch {
    return DEFAULT_GRAPHICS_SETTINGS;
  }
}

export function saveGraphicsSettings(settings: GraphicsSettings) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(
    GRAPHICS_SETTINGS_STORAGE_KEY,
    JSON.stringify(settings),
  );
}

export function clearGraphicsSettings() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(GRAPHICS_SETTINGS_STORAGE_KEY);
}
