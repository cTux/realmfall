import {
  gatheringBonusChance,
  gatheringYieldBonus,
  getStructureConfig,
  isGatheringStructure,
  skillLevelThreshold,
  type Enemy,
  type Item,
  type SkillName,
  type StructureType,
  type Tile,
} from '../game/state';
import { HOME_SCROLL_ITEM_NAME } from '../game/config';

export interface TooltipLine {
  text?: string;
  label?: string;
  value?: string;
  current?: number;
  max?: number;
  kind?: 'text' | 'stat' | 'bar';
  tone?: 'positive' | 'negative' | 'item' | 'section';
}

export function comparisonLines(item: Item, equipped?: Item) {
  if (item.kind === 'consumable' || item.kind === 'resource') return [];
  const compare = equipped ?? { power: 0, defense: 0, maxHp: 0 };
  return [
    { label: 'Attack', value: item.power - compare.power },
    { label: 'Defense', value: item.defense - compare.defense },
    { label: 'Max Health', value: item.maxHp - compare.maxHp },
  ].filter((line) => line.value !== 0);
}

export function itemTooltipLines(item: Item, equipped?: Item): TooltipLine[] {
  if (item.kind === 'consumable') {
    return [{ kind: 'text', text: consumableEffectDescription(item) }];
  }

  const lines: TooltipLine[] =
    item.kind === 'resource'
      ? []
      : [
          {
            kind: 'text',
            text: `${item.rarity.toUpperCase()} TIER ${item.tier} ${itemTypeLabel(item)}`,
          },
        ];

  if (item.kind === 'resource') {
    lines.push({ kind: 'stat', label: 'Type', value: 'Resource' });
  } else {
    if (item.power !== 0)
      lines.push({
        kind: 'stat',
        label: 'Attack',
        value: `+${item.power}`,
        tone: 'item',
      });
    if (item.defense !== 0)
      lines.push({
        kind: 'stat',
        label: 'Defense',
        value: `+${item.defense}`,
        tone: 'item',
      });
    if (item.maxHp !== 0)
      lines.push({
        kind: 'stat',
        label: 'Max Health',
        value: `+${item.maxHp}`,
        tone: 'item',
      });
  }

  if (item.quantity > 1) {
    lines.push({ kind: 'stat', label: 'Qty', value: `${item.quantity}` });
  }

  if (equipped) {
    const deltas = comparisonLines(item, equipped);

    lines.push({
      kind: 'text',
      text: 'Comparing to equipped',
      tone: 'section',
    });

    if (deltas.length === 0) {
      lines.push({
        kind: 'text',
        text: 'Same as equipped',
      });
    } else {
      deltas.forEach((line) => {
        lines.push({
          kind: 'stat',
          label: `${line.label} Change`,
          value: `${line.value >= 0 ? '+' : ''}${line.value}`,
          tone: line.value < 0 ? 'negative' : 'item',
        });
      });
    }
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
        { kind: 'stat', label: 'Level', value: `${enemy.tier}` },
        { kind: 'stat', label: 'Enemies', value: '1' },
      ],
    };
  }

  const maxTier = Math.max(...enemies.map((enemy) => enemy.tier));

  return {
    title: structure === 'dungeon' ? structureTitle('dungeon') : 'Enemy Party',
    lines: [
      { kind: 'stat', label: 'Level', value: `${maxTier}` },
      { kind: 'stat', label: 'Enemies', value: `${enemies.length}` },
    ],
  };
}

export function structureTooltip(
  tile: Tile,
): { title: string; lines: TooltipLine[] } | null {
  if (!tile.structure) return null;

  if (isGatheringStructure(tile.structure)) {
    return {
      title: structureTitle(tile.structure),
      lines: [{ kind: 'text', text: structureDescription(tile.structure) }],
    };
  }

  return {
    title: structureTitle(tile.structure),
    lines: [{ kind: 'text', text: structureDescription(tile.structure) }],
  };
}

export function skillTooltip(skill: SkillName, level: number): TooltipLine[] {
  const nextLevelXp = skillLevelThreshold(level);

  if (isGatheringSkill(skill)) {
    return [
      {
        kind: 'text',
        text: 'Improves gathering actions tied to this skill.',
      },
      {
        kind: 'stat',
        label: 'Base Yield Bonus',
        value: `+${gatheringYieldBonus(level)}`,
        tone: 'item',
      },
      {
        kind: 'stat',
        label: 'Extra Resource Chance',
        value: `${Math.round(gatheringBonusChance(level) * 100)}%`,
        tone: 'item',
      },
      {
        kind: 'text',
        text: `Next level needs ${nextLevelXp} XP in this skill.`,
      },
    ];
  }

  return [
    {
      kind: 'text',
      text: 'Used to track recipe practice and level progression for this profession.',
    },
    {
      kind: 'text',
      text: 'Skill level does not change recipe costs, output, or quality directly yet.',
    },
    {
      kind: 'text',
      text: `Next level needs ${nextLevelXp} XP in this skill.`,
    },
  ];
}

function consumableEffectDescription(item: Item) {
  if (item.name === HOME_SCROLL_ITEM_NAME) {
    return 'Use to return instantly to your hearthmark.';
  }

  const effects = [
    item.healing > 0 ? `recover ${item.healing} HP` : null,
    item.hunger > 0 ? `restore ${item.hunger} hunger` : null,
    (item.thirst ?? 0) > 0 ? `restore ${item.thirst} thirst` : null,
  ].filter((effect): effect is string => Boolean(effect));

  if (effects.length === 0) return 'Use to trigger its effect.';
  if (effects.length === 1) return `Use to ${effects[0]}.`;
  if (effects.length === 2) return `Use to ${effects[0]} and ${effects[1]}.`;
  return `Use to ${effects[0]}, ${effects[1]}, and ${effects[2]}.`;
}

function itemTypeLabel(item: Item) {
  if (item.kind === 'weapon') return 'WEAPON';
  if (item.kind === 'artifact') {
    return item.slot ? `${slotLabel(item.slot)} ARTIFACT` : 'ARTIFACT';
  }
  if (item.kind === 'armor') {
    return item.slot ? `${slotLabel(item.slot)} ARMOR` : 'ARMOR';
  }
  return item.kind.toUpperCase();
}

function slotLabel(slot: NonNullable<Item['slot']>) {
  switch (slot) {
    case 'ringLeft':
      return 'LEFT RING';
    case 'ringRight':
      return 'RIGHT RING';
    default:
      return slot
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .toUpperCase();
  }
}

function structureTitle(structure: StructureType) {
  return getStructureConfig(structure).title;
}

function structureDescription(structure: StructureType) {
  return getStructureConfig(structure).description;
}

function isGatheringSkill(skill: SkillName) {
  return (
    skill === 'logging' ||
    skill === 'mining' ||
    skill === 'skinning' ||
    skill === 'fishing'
  );
}
