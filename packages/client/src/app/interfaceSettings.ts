import {
  isStoredSettingsRecord,
  normalizeStoredFiniteNumber,
} from './settingsNormalization';
import {
  DEFAULT_INTERFACE_FONT_FAMILY,
  isInterfaceFontFamily,
  type InterfaceFontFamily,
} from './interfaceFonts';
import { createSettingsSectionStore } from './settingsSectionStore';

export interface InterfaceSettings {
  fontFamily: InterfaceFontFamily;
  windowTransparency: number;
}

export interface InterfaceSettingsRangeOptionDefinition {
  key: keyof InterfaceSettings;
  labelKey: string;
  descriptionKey: string;
}

export const DEFAULT_INTERFACE_SETTINGS: InterfaceSettings = {
  fontFamily: DEFAULT_INTERFACE_FONT_FAMILY,
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
    fontFamily: isInterfaceFontFamily(settings.fontFamily)
      ? settings.fontFamily
      : DEFAULT_INTERFACE_SETTINGS.fontFamily,
    windowTransparency: normalizeWindowTransparency(
      settings.windowTransparency,
    ),
  };
}
