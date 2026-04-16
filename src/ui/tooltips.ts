import { getStatusEffectTags } from '../game/content/statusEffects';
import { getSkillTags } from '../game/content/tags';
import { professionRecipeOutputBonus } from '../game/crafting';
import { getItemCategory, inferItemTags } from '../game/content/items';
import { EquipmentSlotId } from '../game/content/ids';
import {
  enemyRarityIndex,
  gatheringBonusChance,
  gatheringYieldBonus,
  getStructureConfig,
  isRecipePage,
  Skill,
  skillLevelThreshold,
  type Enemy,
  type Item,
  type SkillName,
  type StructureType,
  type Tile,
} from '../game/state';
import type {
  AbilityDefinition,
  EnemyRarity,
  StatusEffectId,
} from '../game/types';
import { t } from '../i18n';
import {
  formatEnemyRarityLabel,
  formatEquipmentSlotLabel,
} from '../i18n/labels';

export interface TooltipLine {
  text?: string;
  label?: string;
  value?: string;
  icon?: string;
  iconTint?: string;
  current?: number;
  max?: number;
  kind?: 'text' | 'stat' | 'bar';
  tone?: 'positive' | 'negative' | 'item' | 'section' | 'subtle';
}

interface ItemTooltipOptions {
  recipeLearned?: boolean;
}

export function comparisonLines(item: Item, equipped?: Item) {
  const category = getItemCategory(item);
  if (category === 'consumable' || category === 'resource') return [];
  const compare = equipped ?? { power: 0, defense: 0, maxHp: 0 };
  return [
    { label: t('ui.tooltip.attack'), value: item.power - compare.power },
    { label: t('ui.tooltip.defense'), value: item.defense - compare.defense },
    { label: t('ui.tooltip.maxHealth'), value: item.maxHp - compare.maxHp },
  ].filter((line) => line.value !== 0);
}

export function itemTooltipLines(
  item: Item,
  equipped?: Item,
  options: ItemTooltipOptions = {},
): TooltipLine[] {
  const tags = item.tags ?? inferItemTags(item);
  const category = getItemCategory(item);
  const recipeLearnedLine =
    isRecipePage(item) && options.recipeLearned
      ? {
          kind: 'text' as const,
          text: t('ui.tooltip.recipe.learned'),
          tone: 'positive' as const,
        }
      : null;
  const slotLine = item.slot
    ? {
        kind: 'text' as const,
        text: `${t('ui.tooltip.slotLabel')}: ${slotLabel(item.slot)}`,
        tone: 'subtle' as const,
      }
    : null;

  if (category === 'consumable') {
    return [
      { kind: 'text', text: consumableEffectDescription(item) },
      ...tagTooltipLines(tags),
    ];
  }

  const lines: TooltipLine[] =
    category === 'resource'
      ? []
      : [
          {
            kind: 'text',
            text: itemTierLabel(item),
            tone: 'subtle',
          },
        ];

  if (category !== 'resource') {
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

  if (recipeLearnedLine) {
    lines.push(recipeLearnedLine);
  }

  if (slotLine) {
    lines.push(slotLine);
  }
  lines.push(...tagTooltipLines(tags));
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
  const highestRarity = enemies.reduce<EnemyRarity>(
    (current, enemy) =>
      enemyRarityIndex(enemy.rarity) > enemyRarityIndex(current)
        ? enemy.rarity ?? 'common'
        : current,
    'common',
  );

  return {
    title:
      structure === 'dungeon'
        ? structureTitle('dungeon')
        : t('ui.combat.enemyPartyTitle'),
    lines: [
      { kind: 'stat', label: t('ui.tooltip.level'), value: `${maxTier}` },
      {
        kind: 'stat',
        label: t('ui.tooltip.rarity'),
        value: formatEnemyRarityLabel(highestRarity),
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

export function structureTooltip(
  tile: Tile,
): { title: string; lines: TooltipLine[] } | null {
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

export function skillTooltip(skill: SkillName, level: number): TooltipLine[] {
  const nextLevelXp = skillLevelThreshold(level);
  const tags = tagTooltipLines(getSkillTags(skill));

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
      ...tags,
    ];
  }

  return [
    {
      kind: 'text',
      text: t('ui.skills.tooltip.professionDescription'),
    },
    ...(skill === Skill.Cooking || skill === Skill.Smelting
      ? [
          {
            kind: 'stat' as const,
            label: t('ui.skills.tooltip.recipeOutputBonus'),
            value: `+${professionRecipeOutputBonus(skill, level)}`,
            tone: 'item' as const,
          },
        ]
      : [
          {
            kind: 'text' as const,
            text: t('ui.skills.tooltip.noRecipeScaling'),
          },
        ]),
    {
      kind: 'text',
      text: t('ui.skills.tooltip.nextLevelNeeds', { xp: nextLevelXp }),
    },
    ...tags,
  ];
}

export function abilityTooltipLines(
  ability: Pick<
    AbilityDefinition,
    'manaCost' | 'cooldownMs' | 'castTimeMs' | 'tags'
  >,
): TooltipLine[] {
  return [
    {
      kind: 'stat',
      label: t('ui.ability.aetherCost'),
      value: `${ability.manaCost}`,
    },
    {
      kind: 'stat',
      label: t('ui.ability.cooldown'),
      value: `${ability.cooldownMs / 1000}s`,
    },
    {
      kind: 'stat',
      label: t('ui.ability.castTime'),
      value:
        ability.castTimeMs === 0
          ? t('ui.ability.instant')
          : `${ability.castTimeMs / 1000}s`,
    },
    {
      kind: 'text',
      text: t('ui.ability.targeting'),
    },
    ...tagTooltipLines(ability.tags),
  ];
}

export function statusEffectTooltipLines(
  effectId: StatusEffectId,
  tone: 'buff' | 'debuff',
  extraLines: TooltipLine[] = [],
): TooltipLine[] {
  const description =
    effectId === 'hunger'
      ? t('ui.hero.effect.hunger.description')
      : effectId === 'thirst'
        ? t('ui.hero.effect.thirst.description')
        : effectId === 'recentDeath'
          ? t('ui.hero.effect.recentDeath.description')
          : effectId === 'restoration'
            ? t('ui.hero.effect.restoration.description')
            : tone === 'buff'
              ? t('ui.hero.effect.buff')
              : t('ui.hero.effect.debuff');

  return [
    {
      kind: 'text',
      text: description,
    },
    ...extraLines,
    ...tagTooltipLines(getStatusEffectTags(effectId)),
  ];
}

function consumableEffectDescription(item: Item) {
  if (item.itemKey === 'home-scroll') {
    return t('ui.tooltip.consumable.homeScroll');
  }
  if (item.itemKey === 'health-potion') {
    return t('ui.tooltip.consumable.oneEffect', {
      first: t('ui.tooltip.consumable.effect.healingPercent', { amount: 10 }),
    });
  }
  if (item.itemKey === 'mana-potion') {
    return t('ui.tooltip.consumable.oneEffect', {
      first: t('ui.tooltip.consumable.effect.manaPercent', { amount: 10 }),
    });
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
  if (item.slot) {
    return formatEquipmentSlotLabel(item.slot).toLowerCase();
  }

  return t(`ui.itemKind.${getItemCategory(item)}.label`);
}

function itemTierLabel(item: Item) {
  return `${capitalize(item.rarity)} T${item.tier} ${itemTypeLabel(item)}`;
}

function slotLabel(slot: NonNullable<Item['slot']>) {
  switch (slot) {
    case EquipmentSlotId.RingLeft:
      return t('ui.tooltip.slot.leftRing');
    case EquipmentSlotId.RingRight:
      return t('ui.tooltip.slot.rightRing');
    default:
      return t(`ui.tooltip.slot.${slot}`);
  }
}

function structureTitle(structure: StructureType) {
  return getStructureConfig(structure).title;
}

function isGatheringSkill(skill: SkillName) {
  return (
    skill === Skill.Gathering ||
    skill === Skill.Logging ||
    skill === Skill.Mining ||
    skill === Skill.Skinning ||
    skill === Skill.Fishing
  );
}

export function tagTooltipLines(tags?: string[]): TooltipLine[] {
  if (!tags || tags.length === 0) return [];

  return [
    {
      kind: 'text',
      text: `Tags: ${tags.join(', ')}`,
      tone: 'subtle',
    },
  ];
}

function uniqueTag(tag: string, index: number, values: string[]) {
  return values.indexOf(tag) === index;
}

function capitalize(value: string) {
  if (value.length === 0) return value;
  return value[0].toUpperCase() + value.slice(1);
}
