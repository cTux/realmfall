import type { Terrain } from '../../../game/stateTypes';
import { formatTerrainLabel as formatLocalizedTerrainLabel } from '../../../i18n/labels';

export function formatTerrainLabel(terrain: Terrain) {
  return formatLocalizedTerrainLabel(terrain);
}
