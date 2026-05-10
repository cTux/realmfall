import { getAbilityDefinition } from '@realmfall/core/game/abilities';
import { getConsumableEffectDescriptors } from '@realmfall/core/game/consumables';
import {
  getItemCategory,
  inferItemTags,
} from '@realmfall/core/game/content/items';
import { EquipmentSlotId } from '@realmfall/core/game/content/ids';
import {
  canSellItem,
  canWearItem,
  getItemRequiredLevel,
  isRecipePage,
  sellValue,
} from '@realmfall/core/game/inventory';
import { getLockpickBreakChance } from '@realmfall/core/game/lockedChests';
import {
  getDisplayedItemSecondaryStats,
  getVisibleItemSecondaryEmptySlotCount,
} from '@realmfall/core/game/itemModifications';
import type { Item } from '@realmfall/core/game/stateTypes';
import type { SecondaryStatKey } from '@realmfall/core/game/stateTypes';
import { t } from '../../i18n';
import {
  formatEquipmentSlotLabel,
  formatSecondaryStatLabel,
} from '../../i18n/labels';
import { Icons } from '../icons';
import { resolveIconAsset } from '../iconAssets';
import { type TooltipLine, tagTooltipLines } from './shared';

interface ItemTooltipOptions {
  lockpickingLevel?: number;
  recipeLearned?: boolean;
  replacedOffhand?: Item;
  quickSellHint?: boolean;
  playerLevel?: number;
  showTags?: boolean;
}

const SELL_VALUE_TINT = '#fbbf24';

export function comparisonLines(
  item: Item,
  equipped?: Item,
  replacedOffhand?: Item,
) {
  const category = getItemCategory(item);
  if (category === 'consumable' || category === 'resource') return [];
  const compare = summarizeComparedItems(equipped, replacedOffhand);
  return [
    { label: t('ui.tooltip.attack'), value: item.power - compare.power },
    { label: t('ui.tooltip.defense'), value: item.defense - compare.defense },
    { label: t('ui.tooltip.maxHealth'), value: item.maxHp - compare.maxHp },
    ...secondaryStatDeltaLines(item, compare.secondaryStats),
  ].filter((line) => line.value !== 0);
}

export function itemTooltipLines(
  item: Item,
  equipped?: Item,
  options: ItemTooltipOptions = {},
): TooltipLine[] {
  const tags = item.tags ?? inferItemTags(item);
  const category = getItemCategory(item);
  const showComparisonStats =
    category !== 'consumable' &&
    category !== 'resource' &&
    Boolean(equipped || options.replacedOffhand);
  const lockpickingLevel = options.lockpickingLevel ?? 1;
  const playerLevel = options.playerLevel ?? 1;
  const showTags = options.showTags ?? true;
  const requiredLevel = getItemRequiredLevel(item);
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
  const requiredLevelLine =
    requiredLevel == null ||
    category === 'consumable' ||
    category === 'resource'
      ? null
      : {
          kind: 'text' as const,
          text: t('ui.tooltip.requiredLevel', {
            requiredLevel,
          }),
          tone: canWearItem(item, playerLevel)
            ? ('subtle' as const)
            : ('negative' as const),
        };
  const abilityLine = item.grantedAbilityId
    ? (() => {
        const ability = getAbilityDefinition(item.grantedAbilityId);
        return {
          kind: 'stat' as const,
          label: t('ui.tooltip.grantedAbilityLabel'),
          value: ability.name,
          icon: resolveIconAsset(ability.icon),
          tone: 'item' as const,
        };
      })()
    : null;

  if (category === 'consumable') {
    const lines: TooltipLine[] = requiredLevelLine ? [requiredLevelLine] : [];
    const sellLine = itemSellLine(item);
    lines.push(
      ...[
        ...consumableEffectLines(item, lockpickingLevel),
        ...tagTooltipLines(tags, showTags),
        ...(sellLine ? [sellLine] : []),
      ],
    );
    if (options.quickSellHint) {
      lines.push({
        kind: 'text' as const,
        text: t('ui.tooltip.sellQuickShift'),
        tone: 'subtle' as const,
      });
    }
    return lines;
  }

  const lines: TooltipLine[] =
    category === 'resource'
      ? []
      : [
          ...(requiredLevelLine ? [requiredLevelLine] : []),
          {
            kind: 'text' as const,
            text: itemTierLabel(item),
            tone: 'subtle' as const,
          },
        ];

  if (category !== 'resource' && !showComparisonStats) {
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
    for (const stat of secondaryStatLines) {
      lines.push({
        ...stat,
      });
    }
  }

  if (showComparisonStats) {
    const deltas = comparisonLines(item, equipped, options.replacedOffhand);

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
  lines.push(...tagTooltipLines(tags, showTags));
  const sellLine = itemSellLine(item);
  if (sellLine) {
    lines.push(sellLine);
  }

  if (options.quickSellHint) {
    lines.push({
      kind: 'text',
      text: t('ui.tooltip.sellQuickShift'),
      tone: 'subtle' as const,
    });
  }

  return lines;
}

function consumableEffectLines(
  item: Item,
  lockpickingLevel: number,
): TooltipLine[] {
  const effects = getConsumableEffectDescriptors(item);

  if (effects.some((effect) => effect.kind === 'homeScroll')) {
    return [{ kind: 'text', text: t('ui.tooltip.consumable.homeScroll') }];
  }

  if (effects.some((effect) => effect.kind === 'lockpick')) {
    return [
      {
        kind: 'text',
        text: t('game.message.lockedChest.requiresChest', {
          item: item.name,
        }),
      },
      {
        kind: 'stat',
        label: t('ui.tooltip.lockpickBreakChance'),
        value: `${Math.round(getLockpickBreakChance(lockpickingLevel) * 100)}%`,
        tone: 'item',
      },
    ];
  }

  if (effects.some((effect) => effect.kind === 'lockedChestKey')) {
    return [
      {
        kind: 'text',
        text: t('game.message.lockedChest.requiresChest', {
          item: item.name,
        }),
      },
      {
        kind: 'text',
        text: t('ui.tooltip.chestKeyUse'),
      },
    ];
  }

  const restoreLines = effects.flatMap<TooltipLine>((effect) => {
    switch (effect.kind) {
      case 'foodRestorePercent':
        return [
          consumableRestoreLine(t('ui.hero.hp'), effect.amount, 'hp'),
          consumableRestoreLine(t('ui.combat.mp'), effect.amount, 'mana'),
        ];
      case 'healingPercent':
        return [consumableRestoreLine(t('ui.hero.hp'), effect.amount, 'hp')];
      case 'manaPercent':
        return [
          consumableRestoreLine(t('ui.combat.mp'), effect.amount, 'mana'),
        ];
      case 'hunger':
        return [
          consumableRestoreLine(t('ui.hero.hunger'), effect.amount, 'hunger'),
        ];
      case 'thirst':
        return [
          consumableRestoreLine(t('ui.hero.thirst'), effect.amount, 'thirst'),
        ];
      case 'lockpick':
      case 'lockedChestKey':
      case 'terrain':
      case 'homeScroll':
        return [];
    }
  });

  if (restoreLines.length === 0) {
    return [{ kind: 'text', text: t('ui.tooltip.consumable.generic') }];
  }

  return [
    {
      kind: 'text',
      text: t('ui.tooltip.consumable.restores'),
      tone: 'section',
    },
    ...restoreLines,
  ];
}

function consumableRestoreLine(
  label: string,
  amount: number,
  tone: 'hp' | 'mana' | 'hunger' | 'thirst',
): TooltipLine {
  return {
    kind: 'stat',
    label,
    value: `${amount}%`,
    tone,
  };
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
  if (!canSellItem(item)) {
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

function capitalize(value: string) {
  if (value.length === 0) return value;
  return value[0].toUpperCase() + value.slice(1);
}

function summarizeComparedItems(...items: Array<Item | undefined>) {
  const secondaryStatsMap = new Map<SecondaryStatKey, number>();

  items.forEach((item) => {
    if (!item) return;
    item.secondaryStats?.forEach((stat) => {
      secondaryStatsMap.set(
        stat.key,
        (secondaryStatsMap.get(stat.key) ?? 0) + stat.value,
      );
    });
  });

  return {
    power: items.reduce((total, item) => total + (item?.power ?? 0), 0),
    defense: items.reduce((total, item) => total + (item?.defense ?? 0), 0),
    maxHp: items.reduce((total, item) => total + (item?.maxHp ?? 0), 0),
    secondaryStats: [...secondaryStatsMap.entries()].map(([key, value]) => ({
      key,
      value,
    })),
  };
}

function secondaryStatDeltaLines(
  item: Item,
  equippedSecondaryStats: Item['secondaryStats'] = [],
) {
  const equippedMap = new Map(
    equippedSecondaryStats.map((stat) => [stat.key, stat.value]),
  );
  const itemMap = new Map(
    (item.secondaryStats ?? []).map((stat) => [stat.key, stat.value]),
  );
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
  const stats = getDisplayedItemSecondaryStats(item);
  const emptySlots = getVisibleItemSecondaryEmptySlotCount(item);

  return [
    ...stats.map(
      ({ stat, source }) =>
        ({
          kind: 'stat',
          label: formatSecondaryStatLabel(stat.key),
          value: formatSecondaryStatValue(stat.key, stat.value),
          tone:
            source === 'reforged'
              ? 'reforged'
              : source === 'enchanted'
                ? 'enchanted'
                : 'item',
        }) satisfies TooltipLine,
    ),
    ...Array.from({ length: emptySlots }, () => ({
      kind: 'text' as const,
      text: t('ui.tooltip.secondaryStatEmpty'),
      tone: 'subtle' as const,
    })),
  ];
}
