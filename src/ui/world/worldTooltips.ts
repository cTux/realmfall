import { t } from '../../i18n';
import type { Enemy, StructureType, Tile } from '../../game/stateTypes';
import { buildEnemyTooltip, buildStructureTooltip } from '../tooltipContent';

type WorldTooltipLine = {
  text?: string;
  label?: string;
  value?: string;
  kind?: 'text' | 'stat';
};

export function enemyWorldTooltip(
  enemies: Enemy[],
  structure?: StructureType,
): { title: string; lines: WorldTooltipLine[] } | null {
  return buildEnemyTooltip(enemies, structure, {
    text: (text) => ({ kind: 'text', text }),
    stat: (label, value) => ({ kind: 'stat', label, value }),
    tags: tagTooltipLines,
  });
}

export function structureWorldTooltip(
  tile: Tile,
): { title: string; lines: WorldTooltipLine[] } | null {
  return buildStructureTooltip(tile, {
    text: (text) => ({ kind: 'text', text }),
    stat: (label, value) => ({ kind: 'stat', label, value }),
    tags: tagTooltipLines,
  });
}

function tagTooltipLines(tags?: string[]): WorldTooltipLine[] {
  if (!tags || tags.length === 0) return [];

  return [
    {
      kind: 'text',
      text: t('ui.tooltip.tags', { tags: tags.join(', ') }),
    },
  ];
}
