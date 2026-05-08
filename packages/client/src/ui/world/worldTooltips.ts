import type { Enemy, StructureType, Tile } from '../../game/stateTypes';
import { buildEnemyTooltip, buildStructureTooltip } from '../tooltipContent';
import type { TooltipLine } from '@realmfall/ui';
import { tagTooltipLines } from '@realmfall/ui';

type WorldTooltipLine = Pick<
  TooltipLine,
  'kind' | 'text' | 'label' | 'value' | 'tone'
>;

export function enemyWorldTooltip(
  enemies: Enemy[],
  structure?: StructureType,
  showTags = true,
): { title: string; lines: WorldTooltipLine[] } | null {
  return buildEnemyTooltip<WorldTooltipLine>(enemies, structure, {
    text: (text) => ({ kind: 'text', text }),
    stat: (label, value) => ({ kind: 'stat', label, value }),
    tags: (tags) => tagTooltipLines(tags, showTags),
  });
}

export function structureWorldTooltip(
  tile: Tile,
  showTags = true,
): { title: string; lines: WorldTooltipLine[] } | null {
  return buildStructureTooltip<WorldTooltipLine>(tile, {
    text: (text) => ({ kind: 'text', text }),
    stat: (label, value) => ({ kind: 'stat', label, value }),
    tags: (tags) => tagTooltipLines(tags, showTags),
  });
}
