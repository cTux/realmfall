import {
  isGatheringStructure,
  type Enemy,
  type Item,
  type ItemRarity,
  type StructureType,
  type Tile,
} from '../game/state';

export interface TooltipLine {
  text?: string;
  label?: string;
  value?: string;
  current?: number;
  max?: number;
  kind?: 'text' | 'stat' | 'bar';
  tone?: 'positive' | 'negative';
}

export function comparisonLines(item: Item, equipped?: Item) {
  if (item.kind === 'consumable' || item.kind === 'resource') return [];
  const compare = equipped ?? { power: 0, defense: 0, maxHp: 0 };
  return [
    { label: 'ATK', value: item.power - compare.power },
    { label: 'DEF', value: item.defense - compare.defense },
    { label: 'HP', value: item.maxHp - compare.maxHp },
  ].filter((line) => line.value !== 0);
}

export function itemTooltipLines(item: Item, equipped?: Item): TooltipLine[] {
  const lines: TooltipLine[] = [
    {
      kind: 'text',
      text: `LEVEL ${item.tier} ${item.rarity.toUpperCase()} ITEM`,
    },
  ];

  if (item.kind === 'consumable') {
    if (item.healing > 0)
      lines.push({ kind: 'stat', label: 'Heal', value: `${item.healing}` });
    if (item.hunger > 0)
      lines.push({ kind: 'stat', label: 'Food', value: `${item.hunger}` });
  } else if (item.kind === 'resource') {
    lines.push({ kind: 'stat', label: 'Type', value: 'Resource' });
  } else {
    if (item.power !== 0)
      lines.push({ kind: 'stat', label: 'ATK', value: `${item.power}` });
    if (item.defense !== 0)
      lines.push({ kind: 'stat', label: 'DEF', value: `${item.defense}` });
    if (item.maxHp !== 0)
      lines.push({ kind: 'stat', label: 'HP', value: `${item.maxHp}` });
  }

  if (item.quantity > 1) {
    lines.push({ kind: 'stat', label: 'Qty', value: `${item.quantity}` });
  }

  if (equipped) {
    comparisonLines(item, equipped).forEach((line) => {
      lines.push({
        kind: 'stat',
        label: `${line.label} Delta`,
        value: `${line.value >= 0 ? '+' : ''}${line.value}`,
        tone: line.value > 0 ? 'positive' : 'negative',
      });
    });
  }

  return lines;
}

export function enemyTooltip(
  enemies: Enemy[],
  structure?: StructureType,
): { title: string; lines: TooltipLine[] } | null {
  if (enemies.length === 0) return null;

  if (enemies.length === 1 && structure !== 'dungeon') {
    const [enemy] = enemies;
    return {
      title: enemy.name,
      lines: [
        {
          kind: 'text',
          text: `LEVEL ${enemy.tier} ${enemyRarity([enemy]).toUpperCase()} ENEMY`,
        },
        { kind: 'bar', label: 'HP', current: enemy.hp, max: enemy.maxHp },
        { kind: 'stat', label: 'ATK', value: `${enemy.attack}` },
        { kind: 'stat', label: 'DEF', value: `${enemy.defense}` },
      ],
    };
  }

  const totalHp = enemies.reduce((sum, enemy) => sum + enemy.hp, 0);
  const totalMaxHp = enemies.reduce((sum, enemy) => sum + enemy.maxHp, 0);
  const maxTier = Math.max(...enemies.map((enemy) => enemy.tier));
  const maxAttack = Math.max(...enemies.map((enemy) => enemy.attack));
  const maxDefense = Math.max(...enemies.map((enemy) => enemy.defense));
  const names = Array.from(new Set(enemies.map((enemy) => enemy.name))).join(
    ', ',
  );

  return {
    title: structure === 'dungeon' ? 'Dungeon' : 'Enemy Party',
    lines: [
      {
        kind: 'text',
        text: `LEVEL ${maxTier} ${enemyRarity(enemies).toUpperCase()} ENEMY`,
      },
      { kind: 'bar', label: 'HP', current: totalHp, max: totalMaxHp },
      { kind: 'stat', label: 'Count', value: `${enemies.length}` },
      { kind: 'stat', label: 'ATK', value: `${maxAttack}` },
      { kind: 'stat', label: 'DEF', value: `${maxDefense}` },
      { kind: 'stat', label: 'Types', value: names },
    ],
  };
}

export function structureTooltip(
  tile: Tile,
): { title: string; lines: TooltipLine[] } | null {
  if (!tile.structure) return null;

  if (isGatheringStructure(tile.structure)) {
    const skill =
      tile.structure === 'tree'
        ? 'Logging'
        : tile.structure === 'pond' || tile.structure === 'lake'
          ? 'Fishing'
          : 'Mining';
    const reward =
      tile.structure === 'tree'
        ? 'Logs'
        : tile.structure === 'copper-ore'
          ? 'Copper Ore'
          : tile.structure === 'iron-ore'
            ? 'Iron Ore'
            : tile.structure === 'coal-ore'
              ? 'Coal'
              : 'Raw Fish';

    return {
      title: structureTitle(tile.structure),
      lines: [
        { kind: 'text', text: 'GATHERING NODE' },
        {
          kind: 'bar',
          label: 'HP',
          current: tile.structureHp ?? tile.structureMaxHp ?? 0,
          max: tile.structureMaxHp ?? tile.structureHp ?? 0,
        },
        { kind: 'stat', label: 'Skill', value: skill },
        { kind: 'stat', label: 'Yield', value: reward },
      ],
    };
  }

  return {
    title: structureTitle(tile.structure),
    lines: [
      {
        kind: 'text',
        text:
          tile.structure === 'town'
            ? 'SAFE HAVEN'
            : tile.structure === 'forge'
              ? 'WORKSITE'
              : tile.structure === 'camp'
                ? 'COOKING SITE'
                : tile.structure === 'workshop'
                  ? 'CRAFTING SITE'
                  : 'DANGER ZONE',
      },
    ],
  };
}

function enemyRarity(enemies: Enemy[]): ItemRarity {
  if (enemies.some((enemy) => enemy.elite)) return 'rare';
  if (enemies.length >= 3) return 'uncommon';
  return 'common';
}

function structureTitle(structure: StructureType) {
  switch (structure) {
    case 'camp':
      return 'Campfire';
    case 'workshop':
      return 'Workshop';
    case 'copper-ore':
      return 'Copper Vein';
    case 'iron-ore':
      return 'Iron Vein';
    case 'coal-ore':
      return 'Coal Seam';
    default:
      return structure.charAt(0).toUpperCase() + structure.slice(1);
  }
}
