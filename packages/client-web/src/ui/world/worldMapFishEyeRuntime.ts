import type { Filter } from 'pixi.js';

export const WORLD_MAP_FISHEYE_ENABLED = false as const;

export function createWorldMapFishEyeFilter() {
  return null;
}

export function updateWorldMapFishEyeFilter(
  _filter?: unknown,
  _screen?: unknown,
  _center?: unknown,
) {}

export function mapWorldMapFishEyeDisplayPointToSourcePoint<T>(
  point: T,
  _screen?: unknown,
  _center?: unknown,
) {
  return point;
}

export type WorldMapFishEyeFilter = Filter | null;
