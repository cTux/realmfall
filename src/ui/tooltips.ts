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
import { HOME_SCROLL_ITEM_NAME_KEY } from '../game/config';
import { t } from '../i18n';

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
    { label: t('ui.tooltip.attack'), value: item.power - compare.power },
    { label: t('ui.tooltip.defense'), value: item.defense - compare.defense },
    { label: t('ui.tooltip.maxHealth'), value: item.maxHp - compare.maxHp },
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
            text: t('ui.tooltip.itemTier', {
              rarity: item.rarity.toUpperCase(),
              tier: item.tier,
              type: itemTypeLabel(item),
            }),
          },
        ];

  if (item.kind === 'resource') {
    lines.push({
      kind: 'stat',
      label: t('ui.tooltip.type'),
      value: t('ui.itemKind.resource.label'),
    });
  } else {
    if (item.power !== 0)
      lines.push({
        kind: 'stat',
        label: t('ui.tooltip.attack'),
        value: `+${item.power}`,
        tone: 'item',
      });
    if (item.defense !== 0)
      lines.push({
        kind: 'stat',
        label: t('ui.tooltip.defense'),
        value: `+${item.defense}`,
        tone: 'item',
      });
    if (item.maxHp !== 0)
      lines.push({
        kind: 'stat',
        label: t('ui.tooltip.maxHealth'),
        value: `+${item.maxHp}`,
        tone: 'item',
      });
  }

  if (item.quantity > 1) {
    lines.push({
      kind: 'stat',
      label: t('ui.tooltip.quantity'),
      value: `${item.quantity}`,
    });
  }

  if (equipped) {
    const deltas = comparisonLines(item, equipped);

    lines.push({
      kind: 'text',
      text: t('ui.tooltip.comparingToEquipped'),
      tone: 'section',
    });

    if (deltas.length === 0) {
      lines.push({
        kind: 'text',
        text: t('ui.tooltip.sameAsEquipped'),
      });
    } else {
      deltas.forEach((line) => {
        lines.push({
          kind: 'stat',
          label: t('ui.tooltip.statChange', { stat: line.label }),
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
        { kind: 'stat', label: t('ui.tooltip.level'), value: `${enemy.tier}` },
        { kind: 'stat', label: t('ui.tooltip.enemies'), value: '1' },
      ],
    };
  }

  const maxTier = Math.max(...enemies.map((enemy) => enemy.tier));

  return {
    title:
      structure === 'dungeon'
        ? structureTitle('dungeon')
        : t('ui.combat.enemyPartyTitle'),
    lines: [
      { kind: 'stat', label: t('ui.tooltip.level'), value: `${maxTier}` },
      {
        kind: 'stat',
        label: t('ui.tooltip.enemies'),
        value: `${enemies.length}`,
      },
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
        text: t('ui.skills.tooltip.gatheringDescription'),
      },
      {
        kind: 'stat',
        label: t('ui.skills.tooltip.baseYieldBonus'),
        value: `+${gatheringYieldBonus(level)}`,
        tone: 'item',
      },
      {
        kind: 'stat',
        label: t('ui.skills.tooltip.extraResourceChance'),
        value: `${Math.round(gatheringBonusChance(level) * 100)}%`,
        tone: 'item',
      },
      {
        kind: 'text',
        text: t('ui.skills.tooltip.nextLevelNeeds', { xp: nextLevelXp }),
      },
    ];
  }

  return [
    {
      kind: 'text',
      text: t('ui.skills.tooltip.professionDescription'),
    },
    {
      kind: 'text',
      text: t('ui.skills.tooltip.noRecipeScaling'),
    },
    {
      kind: 'text',
      text: t('ui.skills.tooltip.nextLevelNeeds', { xp: nextLevelXp }),
    },
  ];
}

function consumableEffectDescription(item: Item) {
  if (item.name === t(HOME_SCROLL_ITEM_NAME_KEY)) {
    return t('ui.tooltip.consumable.homeScroll');
  }

  const effects = [
    item.healing > 0 ? `recover ${item.healing} HP` : null,
    item.hunger > 0 ? `restore ${item.hunger} hunger` : null,
    (item.thirst ?? 0) > 0 ? `restore ${item.thirst} thirst` : null,
  ].filter((effect): effect is string => Boolean(effect));

  if (effects.length === 0) return t('ui.tooltip.consumable.generic');
  if (effects.length === 1)
    return t('ui.tooltip.consumable.oneEffect', { first: effects[0] });
  if (effects.length === 2)
    return t('ui.tooltip.consumable.twoEffects', {
      first: effects[0],
      second: effects[1],
    });
  return t('ui.tooltip.consumable.threeEffects', {
    first: effects[0],
    second: effects[1],
    third: effects[2],
  });
}

function itemTypeLabel(item: Item) {
  if (item.kind === 'weapon') return t('ui.tooltip.itemType.weapon');
  if (item.kind === 'artifact') {
    return item.slot
      ? t('ui.tooltip.itemType.slottedArtifact', { slot: slotLabel(item.slot) })
      : t('ui.tooltip.itemType.artifact');
  }
  if (item.kind === 'armor') {
    return item.slot
      ? t('ui.tooltip.itemType.slottedArmor', { slot: slotLabel(item.slot) })
      : t('ui.tooltip.itemType.armor');
  }
  return item.kind.toUpperCase();
}

function slotLabel(slot: NonNullable<Item['slot']>) {
  switch (slot) {
    case 'ringLeft':
      return t('ui.tooltip.slot.leftRing');
    case 'ringRight':
      return t('ui.tooltip.slot.rightRing');
    default:
      return t(`ui.tooltip.slot.${slot}`);
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
