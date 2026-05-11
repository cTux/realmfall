import type { SettingsSaveAreaId } from '../persistence/saveAreas';
import {
  clearStoredSettingsSection,
  loadStoredSettingsSection,
  saveStoredSettingsSection,
} from './settingsStorage';

interface SettingsSectionStoreOptions<T extends object> {
  areaId: SettingsSaveAreaId;
  defaults: T;
  normalize: (value: unknown) => T;
  onSave?: () => void;
  onClear?: () => void;
}

export function createSettingsSectionStore<T extends object>({
  areaId,
  defaults,
  normalize,
  onSave,
  onClear,
}: SettingsSectionStoreOptions<T>) {
  return {
    load() {
      if (typeof window === 'undefined') {
        return defaults;
      }

      return normalize(loadStoredSettingsSection(areaId));
    },
    save(value: T) {
      if (typeof window === 'undefined') {
        return;
      }

      const normalizedValue = normalize(value);
      saveStoredSettingsSection(
        areaId,
        normalizedValue as Record<string, unknown>,
      );
      onSave?.();
    },
    clear() {
      if (typeof window === 'undefined') {
        return;
      }

      clearStoredSettingsSection(areaId);
      onClear?.();
    },
  };
}
