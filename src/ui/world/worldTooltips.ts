import { t } from '../../i18n';
import { formatEnemyRarityLabel } from '../../i18n/labels';
import {
  enemyRarityIndex,
  getStructureConfig,
  type Enemy,
  type StructureType,
  type Tile,
} from '../../game/state';

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
  if (enemies.length === 0) return null;

  if (enemies.length === 1 && structure !== 'dungeon') {
    const [enemy] = enemies;
    return {
      title: enemy.name,
      lines: [
        { kind: 'stat', label: t('ui.tooltip.level'), value: `${enemy.tier}` },
        {
          kind: 'stat',
          label: t('ui.tooltip.rarity'),
          value: formatEnemyRarityLabel(enemy.rarity ?? 'common'),
        },
        { kind: 'stat', label: t('ui.tooltip.enemies'), value: '1' },
        ...tagTooltipLines(enemy.tags),
      ],
    };
  }

  const maxTier = Math.max(...enemies.map((enemy) => enemy.tier));
  const highestRarity = enemies.reduce<'common' | Enemy['rarity']>(
    (current, enemy) =>
      enemyRarityIndex(enemy.rarity) > enemyRarityIndex(current)
        ? (enemy.rarity ?? 'common')
        : current,
    'common',
  );

  return {
    title:
      structure === 'dungeon'
        ? getStructureConfig('dungeon').title
        : t('ui.combat.enemyPartyTitle'),
    lines: [
      { kind: 'stat', label: t('ui.tooltip.level'), value: `${maxTier}` },
      {
        kind: 'stat',
        label: t('ui.tooltip.rarity'),
        value: formatEnemyRarityLabel(highestRarity ?? 'common'),
      },
      {
        kind: 'stat',
        label: t('ui.tooltip.enemies'),
        value: `${enemies.length}`,
      },
      ...tagTooltipLines(
        enemies.flatMap((enemy) => enemy.tags ?? []).filter(uniqueTag),
      ),
    ],
  };
}

export function structureWorldTooltip(
  tile: Tile,
): { title: string; lines: WorldTooltipLine[] } | null {
  if (!tile.structure) return null;
  const config = getStructureConfig(tile.structure);

  return {
    title: config.title,
    lines: [
      { kind: 'text', text: config.description },
      ...tagTooltipLines(config.tags),
    ],
  };
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

function uniqueTag(tag: string, index: number, values: string[]) {
  return values.indexOf(tag) === index;
}
