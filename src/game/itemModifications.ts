import { t } from '../i18n';
import { ITEM_MODIFICATION_BALANCE } from './config';
import type { Item, ItemSecondaryStat, StructureType } from './types';

export type ItemModificationKind = 'reforge' | 'enchant' | 'corrupt';
export type ItemSecondaryStatSource = 'regular' | 'reforged' | 'enchanted';

export interface DisplayedItemSecondaryStat {
  index: number;
  stat: ItemSecondaryStat;
  source: ItemSecondaryStatSource;
}

export const CORRUPTED_ITEM_COLOR = '#ef4444';

const ITEM_RARITY_INDEX: Record<Item['rarity'], number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

export function getItemDisplayName(item: Pick<Item, 'name' | 'corrupted'>) {
  return item.corrupted
    ? `${item.name} ${t('game.item.corruptedSuffix')}`
    : item.name;
}

export function getItemModificationCost(
  item: Pick<Item, 'tier' | 'rarity'>,
  kind: ItemModificationKind,
) {
  const balance = ITEM_MODIFICATION_BALANCE[kind];

  return Math.round(
    balance.baseCost +
      item.tier * balance.perTier +
      ITEM_RARITY_INDEX[item.rarity] * balance.perRarity,
  );
}

export function getItemEnchantedSecondaryStatIndex(
  item: Pick<Item, 'secondaryStats' | 'enchantedSecondaryStatIndex'>,
) {
  const stats = item.secondaryStats ?? [];
  const index = item.enchantedSecondaryStatIndex;

  return typeof index === 'number' &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < stats.length
    ? index
    : undefined;
}

export function getItemReforgedSecondaryStatIndex(
  item: Pick<
    Item,
    | 'secondaryStats'
    | 'reforgedSecondaryStatIndex'
    | 'enchantedSecondaryStatIndex'
  >,
) {
  const stats = item.secondaryStats ?? [];
  const index = item.reforgedSecondaryStatIndex;
  const enchantedIndex = getItemEnchantedSecondaryStatIndex(item);

  return typeof index === 'number' &&
    Number.isInteger(index) &&
    index >= 0 &&
    index < stats.length &&
    index !== enchantedIndex
    ? index
    : undefined;
}

export function getDisplayedItemSecondaryStats(
  item: Pick<
    Item,
    | 'secondaryStats'
    | 'reforgedSecondaryStatIndex'
    | 'enchantedSecondaryStatIndex'
  >,
): DisplayedItemSecondaryStat[] {
  const stats = item.secondaryStats ?? [];
  const enchantedIndex = getItemEnchantedSecondaryStatIndex(item);
  const reforgedIndex = getItemReforgedSecondaryStatIndex(item);

  return stats.map((stat, index) => ({
    index,
    stat,
    source:
      index === enchantedIndex
        ? 'enchanted'
        : index === reforgedIndex
          ? 'reforged'
          : 'regular',
  }));
}

export function getReforgeableItemSecondaryStats(
  item: Pick<
    Item,
    | 'secondaryStats'
    | 'reforgedSecondaryStatIndex'
    | 'enchantedSecondaryStatIndex'
  >,
) {
  const displayedStats = getDisplayedItemSecondaryStats(item).filter(
    (entry) => entry.source !== 'enchanted',
  );
  const reforgedIndex = getItemReforgedSecondaryStatIndex(item);

  return reforgedIndex === undefined
    ? displayedStats
    : displayedStats.filter((entry) => entry.index === reforgedIndex);
}

export function getBaseItemSecondaryStatCount(
  item: Pick<Item, 'secondaryStats' | 'enchantedSecondaryStatIndex'>,
) {
  const secondaryStatCount = item.secondaryStats?.length ?? 0;
  return (
    secondaryStatCount -
    (getItemEnchantedSecondaryStatIndex(item) == null ? 0 : 1)
  );
}

export function canModifyItem(item: Pick<Item, 'corrupted'>) {
  return item.corrupted !== true;
}

export function getItemModificationKindForStructure(structure?: StructureType) {
  switch (structure) {
    case 'rune-forge':
      return 'reforge' as const;
    case 'mana-font':
      return 'enchant' as const;
    case 'corruption-altar':
      return 'corrupt' as const;
    default:
      return null;
  }
}

export function getItemModificationStructureHint(structure?: StructureType) {
  switch (structure) {
    case 'rune-forge':
      return t('ui.hexInfo.structureHint.runeForge');
    case 'mana-font':
      return t('ui.hexInfo.structureHint.manaFont');
    case 'corruption-altar':
      return t('ui.hexInfo.structureHint.corruptionAltar');
    default:
      return null;
  }
}

export function applyCorruptionBonus(value: number) {
  if (value <= 0) {
    return value;
  }

  return Math.max(
    value + 1,
    Math.round(value * (1 + ITEM_MODIFICATION_BALANCE.corrupt.statBonus)),
  );
}
