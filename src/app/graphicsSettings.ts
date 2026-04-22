import {
  clearStoredSettingsSection,
  loadStoredSettingsSection,
  saveStoredSettingsSection,
} from './settingsStorage';

export type GraphicsPresetId =
  | 'quality'
  | 'balanced'
  | 'performance'
  | 'custom';

export type GraphicsResolutionCap = 1 | 1.5 | 2;

export interface GraphicsSettings {
  preset: GraphicsPresetId;
  resolutionCap: GraphicsResolutionCap;
  antialias: boolean;
  autoDensity: boolean;
  clearBeforeRender: boolean;
  preserveDrawingBuffer: boolean;
  premultipliedAlpha: boolean;
  showTerrainBackgrounds: boolean;
  useContextAlpha: boolean;
}

type PresetGraphicsSettings = Omit<GraphicsSettings, 'preset'>;

type GraphicsToggleSettingKey = Exclude<
  keyof GraphicsSettings,
  'preset' | 'resolutionCap'
>;

export interface GraphicsSettingsOptionDefinition {
  key: GraphicsToggleSettingKey;
  labelKey: string;
  descriptionKey: string;
}

export interface GraphicsPresetOptionDefinition {
  value: Exclude<GraphicsPresetId, 'custom'>;
  labelKey: string;
  descriptionKey: string;
}

const GRAPHICS_PRESET_SETTINGS = {
  quality: {
    resolutionCap: 2,
    antialias: true,
    autoDensity: true,
    clearBeforeRender: true,
    preserveDrawingBuffer: false,
    premultipliedAlpha: true,
    showTerrainBackgrounds: true,
    useContextAlpha: true,
  },
  balanced: {
    resolutionCap: 1.5,
    antialias: true,
    autoDensity: true,
    clearBeforeRender: true,
    preserveDrawingBuffer: false,
    premultipliedAlpha: true,
    showTerrainBackgrounds: true,
    useContextAlpha: true,
  },
  performance: {
    resolutionCap: 1,
    antialias: false,
    autoDensity: true,
    clearBeforeRender: true,
    preserveDrawingBuffer: false,
    premultipliedAlpha: true,
    showTerrainBackgrounds: true,
    useContextAlpha: true,
  },
} satisfies Record<Exclude<GraphicsPresetId, 'custom'>, PresetGraphicsSettings>;

export const DEFAULT_GRAPHICS_SETTINGS: GraphicsSettings =
  applyGraphicsPreset('balanced');

export const GRAPHICS_PRESET_OPTIONS: GraphicsPresetOptionDefinition[] = [
  {
    value: 'quality',
    labelKey: 'ui.settings.graphics.preset.quality.label',
    descriptionKey: 'ui.settings.graphics.preset.quality.description',
  },
  {
    value: 'balanced',
    labelKey: 'ui.settings.graphics.preset.balanced.label',
    descriptionKey: 'ui.settings.graphics.preset.balanced.description',
  },
  {
    value: 'performance',
    labelKey: 'ui.settings.graphics.preset.performance.label',
    descriptionKey: 'ui.settings.graphics.preset.performance.description',
  },
];

export function applyGraphicsPreset(
  preset: Exclude<GraphicsPresetId, 'custom'>,
) {
  return {
    preset,
    ...GRAPHICS_PRESET_SETTINGS[preset],
  } satisfies GraphicsSettings;
}

export function deriveGraphicsPreset(
  settings: Omit<GraphicsSettings, 'preset'> | GraphicsSettings,
): GraphicsPresetId {
  const comparableSettings = stripPreset(settings);

  for (const preset of Object.keys(GRAPHICS_PRESET_SETTINGS) as Array<
    Exclude<GraphicsPresetId, 'custom'>
  >) {
    if (
      graphicsSettingsEqual(
        comparableSettings,
        GRAPHICS_PRESET_SETTINGS[preset],
      )
    ) {
      return preset;
    }
  }

  return 'custom';
}

export function getGraphicsRenderResolution(
  settings: Pick<GraphicsSettings, 'resolutionCap'>,
  devicePixelRatio: number,
) {
  return Math.min(Math.max(devicePixelRatio || 1, 1), settings.resolutionCap);
}

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
    key: 'showTerrainBackgrounds',
    labelKey: 'ui.settings.graphics.showTerrainBackgrounds.label',
    descriptionKey: 'ui.settings.graphics.showTerrainBackgrounds.description',
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

  return normalizeGraphicsSettings(loadStoredSettingsSection('graphics'));
}

export function saveGraphicsSettings(settings: GraphicsSettings) {
  if (typeof window === 'undefined') return;

  const normalizedSettings = normalizeGraphicsSettings(settings);
  saveStoredSettingsSection(
    'graphics',
    normalizedSettings as unknown as Record<string, unknown>,
  );
}

export function clearGraphicsSettings() {
  if (typeof window === 'undefined') return;
  clearStoredSettingsSection('graphics');
}

function normalizeGraphicsSettings(settings: unknown): GraphicsSettings {
  if (!isRecord(settings)) {
    return DEFAULT_GRAPHICS_SETTINGS;
  }

  const fallbackPreset = normalizePreset(settings.preset);
  const presetDefaults =
    fallbackPreset && fallbackPreset !== 'custom'
      ? applyGraphicsPreset(fallbackPreset)
      : DEFAULT_GRAPHICS_SETTINGS;
  const normalizedSettings = {
    resolutionCap: normalizeResolutionCap(
      settings.resolutionCap,
      presetDefaults.resolutionCap,
    ),
    antialias: normalizeBooleanSetting(
      settings.antialias,
      presetDefaults.antialias,
    ),
    autoDensity: normalizeBooleanSetting(
      settings.autoDensity,
      presetDefaults.autoDensity,
    ),
    clearBeforeRender: normalizeBooleanSetting(
      settings.clearBeforeRender,
      presetDefaults.clearBeforeRender,
    ),
    preserveDrawingBuffer: normalizeBooleanSetting(
      settings.preserveDrawingBuffer,
      presetDefaults.preserveDrawingBuffer,
    ),
    premultipliedAlpha: normalizeBooleanSetting(
      settings.premultipliedAlpha,
      presetDefaults.premultipliedAlpha,
    ),
    showTerrainBackgrounds: normalizeBooleanSetting(
      settings.showTerrainBackgrounds,
      presetDefaults.showTerrainBackgrounds,
    ),
    useContextAlpha: normalizeBooleanSetting(
      settings.useContextAlpha,
      presetDefaults.useContextAlpha,
    ),
  } satisfies PresetGraphicsSettings;

  return {
    preset: deriveGraphicsPreset(normalizedSettings),
    ...normalizedSettings,
  };
}

function normalizeBooleanSetting(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function normalizeResolutionCap(
  value: unknown,
  fallback: GraphicsResolutionCap,
): GraphicsResolutionCap {
  return value === 1 || value === 1.5 || value === 2 ? value : fallback;
}

function normalizePreset(value: unknown): GraphicsPresetId | null {
  return value === 'quality' ||
    value === 'balanced' ||
    value === 'performance' ||
    value === 'custom'
    ? value
    : null;
}

function stripPreset(
  settings: Omit<GraphicsSettings, 'preset'> | GraphicsSettings,
): PresetGraphicsSettings {
  return {
    resolutionCap: settings.resolutionCap,
    antialias: settings.antialias,
    autoDensity: settings.autoDensity,
    clearBeforeRender: settings.clearBeforeRender,
    preserveDrawingBuffer: settings.preserveDrawingBuffer,
    premultipliedAlpha: settings.premultipliedAlpha,
    showTerrainBackgrounds: settings.showTerrainBackgrounds,
    useContextAlpha: settings.useContextAlpha,
  };
}

function graphicsSettingsEqual(
  current: PresetGraphicsSettings,
  expected: PresetGraphicsSettings,
) {
  return (
    current.resolutionCap === expected.resolutionCap &&
    current.antialias === expected.antialias &&
    current.autoDensity === expected.autoDensity &&
    current.clearBeforeRender === expected.clearBeforeRender &&
    current.preserveDrawingBuffer === expected.preserveDrawingBuffer &&
    current.premultipliedAlpha === expected.premultipliedAlpha &&
    current.showTerrainBackgrounds === expected.showTerrainBackgrounds &&
    current.useContextAlpha === expected.useContextAlpha
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
