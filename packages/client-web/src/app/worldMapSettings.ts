import {
  isStoredSettingsRecord,
  normalizeStoredFiniteNumber,
} from './settingsNormalization';
import { createSettingsSectionStore } from './settingsSectionStore';
import {
  clampWorldMapZoom,
  DEFAULT_WORLD_MAP_CAMERA,
  type WorldMapCameraState,
} from '../ui/world/worldMapCamera';

export interface WorldMapSettings {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export const DEFAULT_WORLD_MAP_SETTINGS: WorldMapSettings = {
  offsetX: DEFAULT_WORLD_MAP_CAMERA.panX,
  offsetY: DEFAULT_WORLD_MAP_CAMERA.panY,
  scale: DEFAULT_WORLD_MAP_CAMERA.zoom,
};

const worldMapSettingsStore = createSettingsSectionStore({
  areaId: 'worldMap',
  defaults: DEFAULT_WORLD_MAP_SETTINGS,
  normalize: normalizeWorldMapSettings,
});

export function loadWorldMapSettings(): WorldMapSettings {
  return worldMapSettingsStore.load();
}

export function saveWorldMapSettings(settings: WorldMapSettings) {
  worldMapSettingsStore.save(settings);
}

export function clearWorldMapSettings() {
  worldMapSettingsStore.clear();
}

export function worldMapCameraToSettings(
  camera: WorldMapCameraState,
): WorldMapSettings {
  return {
    offsetX: camera.panX,
    offsetY: camera.panY,
    scale: camera.zoom,
  };
}

export function worldMapSettingsToCamera(
  settings: WorldMapSettings,
): WorldMapCameraState {
  return {
    panX: settings.offsetX,
    panY: settings.offsetY,
    zoom: settings.scale,
  };
}

function normalizeWorldMapSettings(settings: unknown): WorldMapSettings {
  if (!isStoredSettingsRecord(settings)) {
    return DEFAULT_WORLD_MAP_SETTINGS;
  }

  return {
    offsetX: normalizeStoredFiniteNumber(
      settings.offsetX,
      DEFAULT_WORLD_MAP_SETTINGS.offsetX,
    ),
    offsetY: normalizeStoredFiniteNumber(
      settings.offsetY,
      DEFAULT_WORLD_MAP_SETTINGS.offsetY,
    ),
    scale: clampWorldMapZoom(
      normalizeStoredFiniteNumber(
        settings.scale,
        DEFAULT_WORLD_MAP_SETTINGS.scale,
      ),
    ),
  };
}
