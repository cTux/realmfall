import {
  isStoredSettingsRecord,
  normalizeStoredBoolean,
  normalizeStoredFiniteNumber,
} from './settingsNormalization';
import { createSettingsSectionStore } from './settingsSectionStore';
import {
  DEFAULT_WORLD_RENDER_FPS,
  MAX_WORLD_RENDER_FPS,
  MIN_WORLD_RENDER_FPS,
  WORLD_RENDER_FPS_STEP,
} from '../ui/world/renderCadence';

export {
  DEFAULT_WORLD_RENDER_FPS,
  MAX_WORLD_RENDER_FPS,
  MIN_WORLD_RENDER_FPS,
  WORLD_RENDER_FPS_STEP,
};

export type GraphicsPresetId =
  | 'quality'
  | 'balanced'
  | 'performance'
  | 'custom';

export type GraphicsResolutionCap = 1 | 1.5 | 2;
export type GraphicsPerformanceImpact = 'high' | 'medium' | 'low';

export const MIN_CLOUD_TRANSPARENCY = 0;
export const MAX_CLOUD_TRANSPARENCY = 100;

export interface GraphicsSettings {
  preset: GraphicsPresetId;
  resolutionCap: GraphicsResolutionCap;
  worldRenderFps: number;
  showClouds: boolean;
  cloudTransparency: number;
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
  'preset' | 'resolutionCap' | 'worldRenderFps' | 'cloudTransparency'
>;

export interface GraphicsSettingsOptionDefinition {
  key: GraphicsToggleSettingKey;
  labelKey: string;
  descriptionKey: string;
  performanceImpact: GraphicsPerformanceImpact;
  reloadRequired?: boolean;
}

export interface GraphicsPresetOptionDefinition {
  value: Exclude<GraphicsPresetId, 'custom'>;
  labelKey: string;
  descriptionKey: string;
  performanceImpact: GraphicsPerformanceImpact;
  reloadRequired?: boolean;
}

const GRAPHICS_PRESET_SETTINGS = {
  quality: {
    resolutionCap: 2,
    worldRenderFps: DEFAULT_WORLD_RENDER_FPS,
    showClouds: true,
    cloudTransparency: MIN_CLOUD_TRANSPARENCY,
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
    worldRenderFps: DEFAULT_WORLD_RENDER_FPS,
    showClouds: true,
    cloudTransparency: MIN_CLOUD_TRANSPARENCY,
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
    worldRenderFps: DEFAULT_WORLD_RENDER_FPS,
    showClouds: true,
    cloudTransparency: MIN_CLOUD_TRANSPARENCY,
    antialias: false,
    autoDensity: true,
    clearBeforeRender: true,
    preserveDrawingBuffer: false,
    premultipliedAlpha: true,
    showTerrainBackgrounds: true,
    useContextAlpha: true,
  },
} satisfies Record<Exclude<GraphicsPresetId, 'custom'>, PresetGraphicsSettings>;

const LEGACY_GRAPHICS_SETTINGS_STORAGE_KEY = 'realmfall-graphics-settings';

export const DEFAULT_GRAPHICS_SETTINGS: GraphicsSettings =
  applyGraphicsPreset('balanced');

const graphicsSettingsStore = createSettingsSectionStore({
  areaId: 'graphics',
  defaults: DEFAULT_GRAPHICS_SETTINGS,
  normalize: normalizeGraphicsSettings,
  onSave: clearLegacyGraphicsSettings,
  onClear: clearLegacyGraphicsSettings,
});

export const GRAPHICS_PRESET_OPTIONS: GraphicsPresetOptionDefinition[] = [
  {
    value: 'quality',
    labelKey: 'ui.settings.graphics.preset.quality.label',
    descriptionKey: 'ui.settings.graphics.preset.quality.description',
    performanceImpact: 'high',
    reloadRequired: true,
  },
  {
    value: 'balanced',
    labelKey: 'ui.settings.graphics.preset.balanced.label',
    descriptionKey: 'ui.settings.graphics.preset.balanced.description',
    performanceImpact: 'medium',
    reloadRequired: true,
  },
  {
    value: 'performance',
    labelKey: 'ui.settings.graphics.preset.performance.label',
    descriptionKey: 'ui.settings.graphics.preset.performance.description',
    performanceImpact: 'low',
    reloadRequired: true,
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

export function normalizeWorldRenderFps(
  value: unknown,
  fallback = DEFAULT_WORLD_RENDER_FPS,
) {
  const numericValue = typeof value === 'number' ? value : Number.NaN;

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(
    MAX_WORLD_RENDER_FPS,
    Math.max(MIN_WORLD_RENDER_FPS, Math.round(numericValue)),
  );
}

export function getWorldRenderFpsPerformanceImpact(
  fps: number,
): GraphicsPerformanceImpact {
  if (fps >= 151) {
    return 'high';
  }

  if (fps >= 91) {
    return 'medium';
  }

  return 'low';
}

export function normalizeCloudTransparency(
  value: unknown,
  fallback = MIN_CLOUD_TRANSPARENCY,
) {
  return Math.min(
    MAX_CLOUD_TRANSPARENCY,
    Math.max(
      MIN_CLOUD_TRANSPARENCY,
      Math.round(normalizeStoredFiniteNumber(value, fallback)),
    ),
  );
}

export const GRAPHICS_SETTINGS_OPTIONS: GraphicsSettingsOptionDefinition[] = [
  {
    key: 'showClouds',
    labelKey: 'ui.settings.graphics.showClouds.label',
    descriptionKey: 'ui.settings.graphics.showClouds.description',
    performanceImpact: 'medium',
  },
  {
    key: 'antialias',
    labelKey: 'ui.settings.graphics.antialias.label',
    descriptionKey: 'ui.settings.graphics.antialias.description',
    performanceImpact: 'medium',
    reloadRequired: true,
  },
  {
    key: 'autoDensity',
    labelKey: 'ui.settings.graphics.autoDensity.label',
    descriptionKey: 'ui.settings.graphics.autoDensity.description',
    performanceImpact: 'medium',
    reloadRequired: true,
  },
  {
    key: 'clearBeforeRender',
    labelKey: 'ui.settings.graphics.clearBeforeRender.label',
    descriptionKey: 'ui.settings.graphics.clearBeforeRender.description',
    performanceImpact: 'low',
    reloadRequired: true,
  },
  {
    key: 'preserveDrawingBuffer',
    labelKey: 'ui.settings.graphics.preserveDrawingBuffer.label',
    descriptionKey: 'ui.settings.graphics.preserveDrawingBuffer.description',
    performanceImpact: 'high',
    reloadRequired: true,
  },
  {
    key: 'premultipliedAlpha',
    labelKey: 'ui.settings.graphics.premultipliedAlpha.label',
    descriptionKey: 'ui.settings.graphics.premultipliedAlpha.description',
    performanceImpact: 'low',
    reloadRequired: true,
  },
  {
    key: 'showTerrainBackgrounds',
    labelKey: 'ui.settings.graphics.showTerrainBackgrounds.label',
    descriptionKey: 'ui.settings.graphics.showTerrainBackgrounds.description',
    performanceImpact: 'medium',
  },
  {
    key: 'useContextAlpha',
    labelKey: 'ui.settings.graphics.useContextAlpha.label',
    descriptionKey: 'ui.settings.graphics.useContextAlpha.description',
    performanceImpact: 'low',
    reloadRequired: true,
  },
];

export function loadGraphicsSettings() {
  return graphicsSettingsStore.load();
}

export function saveGraphicsSettings(settings: GraphicsSettings) {
  graphicsSettingsStore.save(settings);
}

export function clearGraphicsSettings() {
  graphicsSettingsStore.clear();
}

function normalizeGraphicsSettings(settings: unknown): GraphicsSettings {
  if (!isStoredSettingsRecord(settings)) {
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
    worldRenderFps: normalizeWorldRenderFps(
      settings.worldRenderFps,
      presetDefaults.worldRenderFps,
    ),
    showClouds: normalizeStoredBoolean(
      settings.showClouds,
      presetDefaults.showClouds,
    ),
    cloudTransparency: normalizeCloudTransparency(
      settings.cloudTransparency,
      presetDefaults.cloudTransparency,
    ),
    antialias: normalizeStoredBoolean(
      settings.antialias,
      presetDefaults.antialias,
    ),
    autoDensity: normalizeStoredBoolean(
      settings.autoDensity,
      presetDefaults.autoDensity,
    ),
    clearBeforeRender: normalizeStoredBoolean(
      settings.clearBeforeRender,
      presetDefaults.clearBeforeRender,
    ),
    preserveDrawingBuffer: normalizeStoredBoolean(
      settings.preserveDrawingBuffer,
      presetDefaults.preserveDrawingBuffer,
    ),
    premultipliedAlpha: normalizeStoredBoolean(
      settings.premultipliedAlpha,
      presetDefaults.premultipliedAlpha,
    ),
    showTerrainBackgrounds: normalizeStoredBoolean(
      settings.showTerrainBackgrounds,
      presetDefaults.showTerrainBackgrounds,
    ),
    useContextAlpha: normalizeStoredBoolean(
      settings.useContextAlpha,
      presetDefaults.useContextAlpha,
    ),
  } satisfies PresetGraphicsSettings;

  return {
    preset: deriveGraphicsPreset(normalizedSettings),
    ...normalizedSettings,
  };
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
    worldRenderFps: settings.worldRenderFps,
    showClouds: settings.showClouds,
    cloudTransparency: settings.cloudTransparency,
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
    current.worldRenderFps === expected.worldRenderFps &&
    current.showClouds === expected.showClouds &&
    current.cloudTransparency === expected.cloudTransparency &&
    current.antialias === expected.antialias &&
    current.autoDensity === expected.autoDensity &&
    current.clearBeforeRender === expected.clearBeforeRender &&
    current.preserveDrawingBuffer === expected.preserveDrawingBuffer &&
    current.premultipliedAlpha === expected.premultipliedAlpha &&
    current.showTerrainBackgrounds === expected.showTerrainBackgrounds &&
    current.useContextAlpha === expected.useContextAlpha
  );
}

function clearLegacyGraphicsSettings() {
  window.localStorage.removeItem(LEGACY_GRAPHICS_SETTINGS_STORAGE_KEY);
}
