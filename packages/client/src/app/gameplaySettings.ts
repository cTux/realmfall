import {
  isStoredSettingsRecord,
  normalizeStoredBoolean,
} from './settingsNormalization';
import { createSettingsSectionStore } from './settingsSectionStore';

export interface GameplaySettings {
  autoGatherResources: boolean;
  autoLoot: boolean;
  autoStartCombat: boolean;
}

export interface GameplaySettingsToggleOptionDefinition {
  key: keyof GameplaySettings;
  labelKey: string;
  descriptionKey: string;
}

export const DEFAULT_GAMEPLAY_SETTINGS: GameplaySettings = {
  autoGatherResources: false,
  autoLoot: false,
  autoStartCombat: false,
};

const gameplaySettingsStore = createSettingsSectionStore({
  areaId: 'gameplay',
  defaults: DEFAULT_GAMEPLAY_SETTINGS,
  normalize: normalizeGameplaySettings,
});

export const GAMEPLAY_SETTINGS_TOGGLE_OPTIONS: GameplaySettingsToggleOptionDefinition[] =
  [
    {
      key: 'autoLoot',
      labelKey: 'ui.settings.gameplay.autoLoot.label',
      descriptionKey: 'ui.settings.gameplay.autoLoot.description',
    },
    {
      key: 'autoStartCombat',
      labelKey: 'ui.settings.gameplay.autoStartCombat.label',
      descriptionKey: 'ui.settings.gameplay.autoStartCombat.description',
    },
    {
      key: 'autoGatherResources',
      labelKey: 'ui.settings.gameplay.autoGatherResources.label',
      descriptionKey: 'ui.settings.gameplay.autoGatherResources.description',
    },
  ];

export function loadGameplaySettings() {
  return gameplaySettingsStore.load();
}

export function saveGameplaySettings(settings: GameplaySettings) {
  gameplaySettingsStore.save(settings);
}

export function clearGameplaySettings() {
  gameplaySettingsStore.clear();
}

function normalizeGameplaySettings(settings: unknown): GameplaySettings {
  if (!isStoredSettingsRecord(settings)) {
    return DEFAULT_GAMEPLAY_SETTINGS;
  }

  return {
    autoGatherResources: normalizeStoredBoolean(
      settings.autoGatherResources,
      DEFAULT_GAMEPLAY_SETTINGS.autoGatherResources,
    ),
    autoLoot: normalizeStoredBoolean(
      settings.autoLoot,
      DEFAULT_GAMEPLAY_SETTINGS.autoLoot,
    ),
    autoStartCombat: normalizeStoredBoolean(
      settings.autoStartCombat,
      DEFAULT_GAMEPLAY_SETTINGS.autoStartCombat,
    ),
  };
}
