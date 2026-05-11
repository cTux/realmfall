import type { Terrain } from '@realmfall/core/game/stateTypes';
import {
  formatTerrainDescription as formatLocalizedTerrainDescription,
  formatTerrainLabel as formatLocalizedTerrainLabel,
} from '../../../i18n/labels';

export function formatTerrainLabel(terrain: Terrain) {
  return formatLocalizedTerrainLabel(terrain);
}

export function formatTerrainDescription(terrain: Terrain) {
  return formatLocalizedTerrainDescription(terrain);
}
