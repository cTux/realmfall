import {
  isStoredSettingsRecord,
  normalizeStoredFiniteNumber,
} from './settingsNormalization';
import { createSettingsSectionStore } from './settingsSectionStore';

export interface InterfaceSettings {
  windowTransparency: number;
}

export interface InterfaceSettingsRangeOptionDefinition {
  key: keyof InterfaceSettings;
  labelKey: string;
  descriptionKey: string;
}

export const DEFAULT_INTERFACE_SETTINGS: InterfaceSettings = {
  windowTransparency: 0,
};

const interfaceSettingsStore = createSettingsSectionStore({
  areaId: 'interface',
  defaults: DEFAULT_INTERFACE_SETTINGS,
  normalize: normalizeInterfaceSettings,
});

export const INTERFACE_SETTINGS_RANGE_OPTIONS: InterfaceSettingsRangeOptionDefinition[] =
  [
    {
      key: 'windowTransparency',
      labelKey: 'ui.settings.interface.windowTransparency.label',
      descriptionKey: 'ui.settings.interface.windowTransparency.description',
    },
  ];

export function loadInterfaceSettings() {
  return interfaceSettingsStore.load();
}

export function saveInterfaceSettings(settings: InterfaceSettings) {
  interfaceSettingsStore.save(settings);
}

export function clearInterfaceSettings() {
  interfaceSettingsStore.clear();
}

export function normalizeWindowTransparency(
  value: unknown,
  fallback = DEFAULT_INTERFACE_SETTINGS.windowTransparency,
) {
  return Math.min(
    100,
    Math.max(0, Math.round(normalizeStoredFiniteNumber(value, fallback))),
  );
}

function normalizeInterfaceSettings(settings: unknown): InterfaceSettings {
  if (!isStoredSettingsRecord(settings)) {
    return DEFAULT_INTERFACE_SETTINGS;
  }

  return {
    windowTransparency: normalizeWindowTransparency(
      settings.windowTransparency,
    ),
  };
}
