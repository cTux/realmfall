import type { Terrain } from '../../../game/state';
import { formatTerrainLabel as formatLocalizedTerrainLabel } from '../../../i18n/labels';

export function formatTerrainLabel(terrain: Terrain) {
  return formatLocalizedTerrainLabel(terrain);
}
