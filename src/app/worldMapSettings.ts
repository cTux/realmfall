import {
  clearStoredSettingsSection,
  loadStoredSettingsSection,
  saveStoredSettingsSection,
} from './settingsStorage';
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

export function loadWorldMapSettings(): WorldMapSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_WORLD_MAP_SETTINGS;
  }

  return normalizeWorldMapSettings(loadStoredSettingsSection('worldMap'));
}

export function saveWorldMapSettings(settings: WorldMapSettings) {
  if (typeof window === 'undefined') return;

  const normalizedSettings = normalizeWorldMapSettings(settings);
  saveStoredSettingsSection(
    'worldMap',
    normalizedSettings as unknown as Record<string, unknown>,
  );
}

export function clearWorldMapSettings() {
  if (typeof window === 'undefined') return;
  clearStoredSettingsSection('worldMap');
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
  if (!isRecord(settings)) {
    return DEFAULT_WORLD_MAP_SETTINGS;
  }

  return {
    offsetX: normalizeFiniteNumber(
      settings.offsetX,
      DEFAULT_WORLD_MAP_SETTINGS.offsetX,
    ),
    offsetY: normalizeFiniteNumber(
      settings.offsetY,
      DEFAULT_WORLD_MAP_SETTINGS.offsetY,
    ),
    scale:
      typeof settings.scale === 'number' && Number.isFinite(settings.scale)
        ? clampWorldMapZoom(settings.scale)
        : DEFAULT_WORLD_MAP_SETTINGS.scale,
  };
}

function normalizeFiniteNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
