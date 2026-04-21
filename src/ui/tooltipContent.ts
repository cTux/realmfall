import { t } from '../i18n';
import { formatEnemyRarityLabel } from '../i18n/labels';
import {
  enemyRarityIndex,
  getStructureConfig,
  type Enemy,
  type StructureType,
  type Tile,
} from '../game/state';

interface TooltipLineFactory<Line> {
  stat: (label: string, value: string) => Line;
  tags: (tags?: string[]) => Line[];
  text: (text: string) => Line;
}

export function buildEnemyTooltip<Line>(
  enemies: Enemy[],
  structure: StructureType | undefined,
  lineFactory: TooltipLineFactory<Line>,
): { title: string; lines: Line[] } | null {
  if (enemies.length === 0) {
    return null;
  }

  if (enemies.length === 1 && structure !== 'dungeon') {
    const [enemy] = enemies;
    return {
      title: enemy.name,
      lines: [
        lineFactory.stat(t('ui.tooltip.level'), `${enemy.tier}`),
        lineFactory.stat(
          t('ui.tooltip.rarity'),
          formatEnemyRarityLabel(enemy.rarity ?? 'common'),
        ),
        lineFactory.stat(t('ui.tooltip.enemies'), '1'),
        ...lineFactory.tags(enemy.tags),
      ],
    };
  }

  const maxTier = Math.max(...enemies.map((enemy) => enemy.tier));
  const highestRarity = enemies.reduce<'common' | NonNullable<Enemy['rarity']>>(
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
      lineFactory.stat(t('ui.tooltip.level'), `${maxTier}`),
      lineFactory.stat(
        t('ui.tooltip.rarity'),
        formatEnemyRarityLabel(highestRarity),
      ),
      lineFactory.stat(t('ui.tooltip.enemies'), `${enemies.length}`),
      ...lineFactory.tags(
        enemies.flatMap((enemy) => enemy.tags ?? []).filter(uniqueTag),
      ),
    ],
  };
}

export function buildStructureTooltip<Line>(
  tile: Tile,
  lineFactory: TooltipLineFactory<Line>,
): { title: string; lines: Line[] } | null {
  if (!tile.structure) {
    return null;
  }

  const config = getStructureConfig(tile.structure);

  return {
    title: config.title,
    lines: [
      lineFactory.text(config.description),
      ...lineFactory.tags(config.tags),
    ],
  };
}

function uniqueTag(tag: string, index: number, values: string[]) {
  return values.indexOf(tag) === index;
}
