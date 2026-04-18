import { getAbilityDefinition } from '../game/abilities';
import {
  getStatusEffectDefinition,
  getStatusEffectTags,
} from '../game/content/statusEffects';
import { getSkillTags } from '../game/content/tags';
import { professionRecipeOutputBonus } from '../game/crafting';
import { isEquippableItem, isRecipePage, sellValue } from '../game/inventory';
import { getItemCategory, inferItemTags } from '../game/content/items';
import { EquipmentSlotId } from '../game/content/ids';
import {
  enemyRarityIndex,
  gatheringBonusChance,
  gatheringYieldBonus,
  getStructureConfig,
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
  PlayerStatusEffect,
  SecondaryStatKey,
  StatusEffectId,
} from '../game/types';
import { t } from '../i18n';
import {
  formatEnemyRarityLabel,
  formatEquipmentSlotLabel,
  formatSecondaryStatLabel,
  formatStatusEffectLabel,
} from '../i18n/labels';
import { Icons } from './icons';

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

const SELL_VALUE_TINT = '#fbbf24';

export function comparisonLines(item: Item, equipped?: Item) {
  const category = getItemCategory(item);
  if (category === 'consumable' || category === 'resource') return [];
  const compare = equipped ?? { power: 0, defense: 0, maxHp: 0 };
  return [
    { label: t('ui.tooltip.attack'), value: item.power - compare.power },
    { label: t('ui.tooltip.defense'), value: item.defense - compare.defense },
    { label: t('ui.tooltip.maxHealth'), value: item.maxHp - compare.maxHp },
    ...secondaryStatDeltaLines(item, equipped),
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
          text: t('ui.tooltip.recipe.alreadyLearned'),
          tone: 'negative' as const,
        }
      : null;
  const slotLine = item.slot
    ? {
        kind: 'text' as const,
        text: `${t('ui.tooltip.slotLabel')}: ${slotLabel(item.slot)}`,
        tone: 'subtle' as const,
      }
    : null;
  const abilityLine = item.grantedAbilityId
    ? (() => {
        const ability = getAbilityDefinition(item.grantedAbilityId);
        return {
          kind: 'stat' as const,
          label: t('ui.tooltip.grantedAbilityLabel'),
          value: ability.name,
          icon: ability.icon,
          tone: 'item' as const,
        };
      })()
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
    const secondaryStatLines = secondarySlotLines(item);
    if (secondaryStatLines.length > 0) {
      lines.push({
        kind: 'text',
        text: t('ui.tooltip.secondaryStats'),
        tone: 'section',
      });
    }
    for (const stat of secondaryStatLines) {
      lines.push({
        ...stat,
      });
    }
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
          label: line.label,
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
  if (abilityLine) {
    lines.push(abilityLine);
  }
  lines.push(...tagTooltipLines(tags));
  const sellLine = itemSellLine(item);
  if (sellLine) {
    lines.push(sellLine);
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
        ? (enemy.rarity ?? 'common')
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
    | 'description'
    | 'manaCost'
    | 'cooldownMs'
    | 'castTimeMs'
    | 'category'
    | 'effects'
    | 'tags'
  >,
  target: AbilityDefinition['target'] = 'enemy',
  attack = 0,
): TooltipLine[] {
  const damageLine =
    ability.category === 'attacking'
      ? {
          kind: 'stat' as const,
          label: t('ui.ability.damage'),
          value: `${abilityDamageValue(ability, attack)}`,
        }
      : null;

  return [
    {
      kind: 'text',
      text: ability.description,
    },
    ...abilityStatusEffectLines(ability),
    ...(damageLine ? [damageLine] : []),
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
      text: t(`ui.ability.target.${target}`),
    },
    ...tagTooltipLines(ability.tags),
  ];
}

export function statusEffectTooltipLines(
  effectId: StatusEffectId,
  tone: 'buff' | 'debuff',
  extraLines: TooltipLine[] = [],
  effect?: Pick<PlayerStatusEffect, 'id' | 'value' | 'tickIntervalMs' | 'stacks'>,
): TooltipLine[] {
  const descriptionKeyByEffect: Partial<Record<StatusEffectId, string>> = {
    hunger: 'ui.hero.effect.hunger.description',
    thirst: 'ui.hero.effect.thirst.description',
    recentDeath: 'ui.hero.effect.recentDeath.description',
    restoration: 'ui.hero.effect.restoration.description',
    bleeding: 'ui.hero.effect.bleeding.description',
    poison: 'ui.hero.effect.poison.description',
    burning: 'ui.hero.effect.burning.description',
    chilling: 'ui.hero.effect.chilling.description',
    power: 'ui.hero.effect.power.description',
    frenzy: 'ui.hero.effect.frenzy.description',
    guard: 'ui.hero.effect.guard.description',
    weakened: 'ui.hero.effect.weakened.description',
    shocked: 'ui.hero.effect.shocked.description',
  };
  const description = t(
    descriptionKeyByEffect[effectId] ??
      (tone === 'buff' ? 'ui.hero.effect.buff' : 'ui.hero.effect.debuff'),
  );

  return [
    {
      kind: 'text',
      text: description,
    },
    ...statusEffectDamageLines(effect),
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
    item.healing > 0
      ? t('game.message.useItem.healing', { amount: item.healing })
      : null,
    item.hunger > 0
      ? t('game.message.useItem.hunger', { amount: item.hunger })
      : null,
    (item.thirst ?? 0) > 0
      ? t('game.message.useItem.thirst', { amount: item.thirst })
      : null,
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
  return t('ui.tooltip.itemTier', {
    rarity: capitalize(item.rarity),
    tier: item.tier,
    type: itemTypeLabel(item),
  });
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

function itemSellLine(item: Item): TooltipLine | null {
  if (!isEquippableItem(item) && !isRecipePage(item)) {
    return null;
  }

  return {
    kind: 'stat',
    label: t('ui.tooltip.sellsFor'),
    value: `${sellValue(item)} ${t('game.item.gold.name').toLowerCase()}`,
    icon: Icons.Coins,
    iconTint: SELL_VALUE_TINT,
    tone: 'item',
  };
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
      text: t('ui.tooltip.tags', { tags: tags.join(', ') }),
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

function secondaryStatDeltaLines(item: Item, equipped?: Item) {
  const equippedMap = new Map(
    (equipped?.secondaryStats ?? []).map((stat) => [stat.key, stat.value]),
  );
  const itemMap = new Map((item.secondaryStats ?? []).map((stat) => [stat.key, stat.value]));
  const keys = [...new Set([...itemMap.keys(), ...equippedMap.keys()])];

  return keys.map((key) => ({
    label: formatSecondaryStatLabel(key),
    value: (itemMap.get(key) ?? 0) - (equippedMap.get(key) ?? 0),
  }));
}

function formatSecondaryStatValue(key: SecondaryStatKey, value: number) {
  switch (key) {
    case 'criticalStrikeDamage':
    case 'suppressDamageReduction':
      return `+${value}%`;
    case 'lifestealAmount':
      return `+${value}% max HP`;
    default:
      return `+${value}%`;
  }
}

function secondarySlotLines(item: Item): TooltipLine[] {
  const stats = item.secondaryStats ?? [];
  const capacity = Math.max(item.secondaryStatCapacity ?? stats.length, stats.length);
  const emptySlots = Math.max(0, capacity - stats.length);

  return [
    ...stats.map(
      (stat) =>
        ({
          kind: 'stat',
          label: formatSecondaryStatLabel(stat.key),
          value: formatSecondaryStatValue(stat.key, stat.value),
          tone: 'item',
        }) satisfies TooltipLine,
    ),
    ...Array.from({ length: emptySlots }, () => ({
      kind: 'text' as const,
      text: t('ui.tooltip.secondaryStatEmpty'),
      tone: 'subtle' as const,
    })),
  ];
}

function abilityDamageValue(
  ability: Pick<AbilityDefinition, 'effects'>,
  attack: number,
) {
  return ability.effects.reduce((total, effect) => {
    if (effect.kind !== 'damage') return total;

    return (
      total +
      Math.max(
        0,
        Math.round(attack * effect.powerMultiplier + (effect.flatPower ?? 0)),
      )
    );
  }, 0);
}

function abilityStatusEffectLines(
  ability: Pick<AbilityDefinition, 'effects'>,
): TooltipLine[] {
  const statusEffects = [
    ...new Set(
      ability.effects.flatMap((effect) => {
        if (effect.kind === 'heal') return [];
        return effect.statusEffectId ? [effect.statusEffectId] : [];
      }),
    ),
  ];

  return statusEffects.map((effectId) => {
    const definition = getStatusEffectDefinition(effectId);

    return {
      kind: 'stat' as const,
      label: t('ui.ability.effect'),
      value: formatStatusEffectLabel(effectId),
      icon: definition?.icon,
      iconTint: definition?.tint,
      tone: definition?.tone === 'debuff' ? ('negative' as const) : ('item' as const),
    };
  });
}

function statusEffectDamageLines(
  effect?: Pick<PlayerStatusEffect, 'id' | 'value' | 'tickIntervalMs' | 'stacks'>,
) {
  if (!effect) return [];

  const intervalSeconds = formatStatusIntervalSeconds(effect.tickIntervalMs);

  switch (effect.id) {
    case 'bleeding':
      return [
        {
          kind: 'stat' as const,
          label: t('ui.hero.effect.damage'),
          value: t('ui.hero.effect.damagePerInterval', {
            amount: Math.max(1, Math.floor(effect.value ?? 0)),
            seconds: intervalSeconds,
          }),
          tone: 'negative' as const,
        },
      ];
    case 'burning':
      return [
        {
          kind: 'stat' as const,
          label: t('ui.hero.effect.damage'),
          value: t('ui.hero.effect.damagePerInterval', {
            amount:
              Math.max(1, Math.floor(effect.value ?? 0)) *
              Math.max(1, effect.stacks ?? 1),
            seconds: intervalSeconds,
          }),
          tone: 'negative' as const,
        },
      ];
    case 'poison':
      return [
        {
          kind: 'stat' as const,
          label: t('ui.hero.effect.damage'),
          value: t('ui.hero.effect.damagePercentPerInterval', {
            amount: Math.max(1, effect.stacks ?? 1),
            seconds: intervalSeconds,
          }),
          tone: 'negative' as const,
        },
      ];
    default:
      return [];
  }
}

function formatStatusIntervalSeconds(tickIntervalMs = 1_000) {
  const seconds = tickIntervalMs / 1000;
  return Number.isInteger(seconds) ? `${seconds}` : seconds.toFixed(1);
}
