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
  fontSize: number;
  interfaceScale: number;
  windowTransparency: number;
}

export interface InterfaceSettingsRangeOptionDefinition {
  key: Extract<
    keyof InterfaceSettings,
    'fontSize' | 'interfaceScale' | 'windowTransparency'
  >;
  min: number;
  max: number;
  step: number;
  labelKey: string;
  descriptionKey: string;
  valueKey: string;
}

export const DEFAULT_INTERFACE_SETTINGS: InterfaceSettings = {
  fontFamily: DEFAULT_INTERFACE_FONT_FAMILY,
  fontSize: 100,
  interfaceScale: 100,
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
      key: 'fontSize',
      min: 75,
      max: 150,
      step: 1,
      labelKey: 'ui.settings.interface.fontSize.label',
      descriptionKey: 'ui.settings.interface.fontSize.description',
      valueKey: 'ui.settings.interface.fontSize.value',
    },
    {
      key: 'interfaceScale',
      min: 75,
      max: 150,
      step: 1,
      labelKey: 'ui.settings.interface.interfaceScale.label',
      descriptionKey: 'ui.settings.interface.interfaceScale.description',
      valueKey: 'ui.settings.interface.interfaceScale.value',
    },
    {
      key: 'windowTransparency',
      min: 0,
      max: 100,
      step: 1,
      labelKey: 'ui.settings.interface.windowTransparency.label',
      descriptionKey: 'ui.settings.interface.windowTransparency.description',
      valueKey: 'ui.settings.interface.windowTransparency.value',
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
  return normalizeInterfacePercent(value, fallback, 0, 100);
}

function normalizeInterfaceSettings(settings: unknown): InterfaceSettings {
  if (!isStoredSettingsRecord(settings)) {
    return DEFAULT_INTERFACE_SETTINGS;
  }

  return {
    fontFamily: isInterfaceFontFamily(settings.fontFamily)
      ? settings.fontFamily
      : DEFAULT_INTERFACE_SETTINGS.fontFamily,
    fontSize: normalizeInterfacePercent(
      settings.fontSize,
      DEFAULT_INTERFACE_SETTINGS.fontSize,
      75,
      150,
    ),
    interfaceScale: normalizeInterfacePercent(
      settings.interfaceScale,
      DEFAULT_INTERFACE_SETTINGS.interfaceScale,
      75,
      150,
    ),
    windowTransparency: normalizeWindowTransparency(
      settings.windowTransparency,
    ),
  };
}

function normalizeInterfacePercent(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  return Math.min(
    max,
    Math.max(min, Math.round(normalizeStoredFiniteNumber(value, fallback))),
  );
}
