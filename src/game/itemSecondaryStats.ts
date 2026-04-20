import type {
  Item,
  ItemRarity,
  ItemSecondaryStat,
  MainItemStatKey,
  SecondaryStatKey,
} from './types';
import type { ItemConfig } from './content/types';
import {
  scaleMainItemStatForLevel,
  scaleSecondaryItemStatForLevel,
} from './balance';

export const DEFAULT_CRITICAL_STRIKE_CHANCE = 5;
export const DEFAULT_CRITICAL_STRIKE_DAMAGE = 150;
export const DEFAULT_DODGE_CHANCE = 5;
export const DEFAULT_LIFESTEAL_CHANCE_AMOUNT = 0.5;
export const DEFAULT_LIFESTEAL_AMOUNT = 1;
export const DEFAULT_SUPPRESS_DAMAGE_CHANCE = 5;
export const DEFAULT_SUPPRESS_DAMAGE_REDUCTION = 50;
export const DEFAULT_SUPPRESS_DEBUFF_CHANCE = 0;

export const MAIN_ITEM_STAT_KEYS: MainItemStatKey[] = [
  'power',
  'defense',
  'maxHp',
];

export const UNIQUE_SECONDARY_STAT_KEYS: SecondaryStatKey[] = [
  'bleedChance',
  'poisonChance',
  'burningChance',
  'chillingChance',
  'powerBuffChance',
  'frenzyBuffChance',
];

export const STANDARD_SECONDARY_STAT_KEYS: SecondaryStatKey[] = [
  'attackSpeed',
  'criticalStrikeChance',
  'criticalStrikeDamage',
  'lifestealChance',
  'lifestealAmount',
  'dodgeChance',
  'blockChance',
  'suppressDamageChance',
  'suppressDamageReduction',
  'suppressDebuffChance',
];

// These stats are rolled as raw magnitude bonuses instead of proc-chance bonuses,
// but they keep the same item-level anchors: level 1 => 1, level 100 => 10.
export const NON_CHANCE_BASED_SECONDARY_STAT_KEYS: SecondaryStatKey[] = [
  'attackSpeed',
  'criticalStrikeDamage',
  'lifestealAmount',
  'suppressDamageReduction',
];

const ALL_SECONDARY_STAT_KEYS = [
  ...STANDARD_SECONDARY_STAT_KEYS,
  ...UNIQUE_SECONDARY_STAT_KEYS,
] as const;

const SECONDARY_STAT_SLOT_COUNTS: Record<
  ItemRarity,
  { capacity: number; minGenerated: number; maxGenerated: number }
> = {
  common: { capacity: 0, minGenerated: 0, maxGenerated: 0 },
  uncommon: { capacity: 1, minGenerated: 0, maxGenerated: 1 },
  rare: { capacity: 1, minGenerated: 0, maxGenerated: 1 },
  epic: { capacity: 2, minGenerated: 1, maxGenerated: 2 },
  legendary: { capacity: 3, minGenerated: 1, maxGenerated: 3 },
};

interface GeneratedStatContext {
  config: Pick<ItemConfig, 'key' | 'slot' | 'category'>;
  tier: number;
  rarity: ItemRarity;
}

export function getSecondaryStatValue(
  item: Pick<Item, 'secondaryStats'> | undefined,
  key: SecondaryStatKey,
) {
  return (
    item?.secondaryStats?.reduce(
      (sum, stat) => sum + (stat.key === key ? stat.value : 0),
      0,
    ) ?? 0
  );
}

export function getEquipmentSecondaryStatTotal(
  items: Array<Pick<Item, 'secondaryStats'> | undefined>,
  key: SecondaryStatKey,
) {
  return items.reduce((sum, item) => sum + getSecondaryStatValue(item, key), 0);
}

export function hasDefaultBlockChance(
  config: Pick<ItemConfig, 'slot' | 'category'>,
) {
  return (
    config.slot === 'offhand' &&
    (config.category === 'armor' || config.category === 'artifact')
  );
}

export function buildDefaultBlockChanceSecondaryStat(
  tier: number,
  rarity: ItemRarity,
  nextRoll: () => number,
) {
  return buildSecondaryStat('blockChance', tier, rarity, nextRoll);
}

export function buildGeneratedMainStats(
  config: Pick<ItemConfig, 'generatedStats'>,
  tier: number,
  nextRoll: () => number,
) {
  const generatedStats = config.generatedStats;
  if (!generatedStats) {
    return {
      power: 0,
      defense: 0,
      maxHp: 0,
    };
  }

  const randomPool = [...(generatedStats.randomMainStatPool ?? [])];
  const selectedRandomStats = new Set<MainItemStatKey>();
  const randomCount = Math.min(
    generatedStats.randomMainStatCount ?? randomPool.length,
    randomPool.length,
  );

  while (selectedRandomStats.size < randomCount && randomPool.length > 0) {
    const index = Math.floor(nextRoll() * randomPool.length);
    const [picked] = randomPool.splice(index, 1);
    if (picked) selectedRandomStats.add(picked);
  }

  return {
    power: buildGeneratedMainStatValue(
      'power',
      tier,
      generatedStats.basePower,
      generatedStats.powerPerTier,
      selectedRandomStats,
    ),
    defense: buildGeneratedMainStatValue(
      'defense',
      tier,
      generatedStats.baseDefense,
      generatedStats.defensePerTier,
      selectedRandomStats,
    ),
    maxHp: buildGeneratedMainStatValue(
      'maxHp',
      tier,
      generatedStats.baseMaxHp,
      generatedStats.maxHpPerTier,
      selectedRandomStats,
    ),
  };
}

export function buildGeneratedSecondaryStats(
  context: GeneratedStatContext,
  nextRoll: () => number,
) {
  const secondarySlotRule = SECONDARY_STAT_SLOT_COUNTS[context.rarity];
  const defaultBlockChance = hasDefaultBlockChance(context.config)
    ? buildDefaultBlockChanceSecondaryStat(
        context.tier,
        context.rarity,
        nextRoll,
      )
    : null;
  const capacity = Math.max(
    secondarySlotRule.capacity,
    defaultBlockChance ? 1 : 0,
  );

  if (capacity === 0) {
    return {
      capacity,
      stats: [] as ItemSecondaryStat[],
    };
  }

  const rolledCount =
    secondarySlotRule.maxGenerated <= secondarySlotRule.minGenerated
      ? secondarySlotRule.maxGenerated
      : secondarySlotRule.minGenerated +
        Math.floor(
          nextRoll() *
            (secondarySlotRule.maxGenerated -
              secondarySlotRule.minGenerated +
              1),
        );
  const stats: ItemSecondaryStat[] = defaultBlockChance
    ? [defaultBlockChance]
    : [];
  const targetCount = Math.min(capacity, Math.max(stats.length, rolledCount));
  const availableKeys = [...ALL_SECONDARY_STAT_KEYS].filter(
    (key) => key !== 'blockChance' && !stats.some((stat) => stat.key === key),
  );

  while (stats.length < targetCount && availableKeys.length > 0) {
    const key = pickSecondaryStatKey(availableKeys, nextRoll);
    if (!key) break;
    const keyIndex = availableKeys.indexOf(key);
    if (keyIndex >= 0) {
      availableKeys.splice(keyIndex, 1);
    }
    if (UNIQUE_SECONDARY_STAT_KEYS.includes(key)) {
      for (const uniqueKey of UNIQUE_SECONDARY_STAT_KEYS) {
        const uniqueIndex = availableKeys.indexOf(uniqueKey);
        if (uniqueIndex >= 0) {
          availableKeys.splice(uniqueIndex, 1);
        }
      }
    }
    stats.push(buildSecondaryStat(key, context.tier, context.rarity, nextRoll));
  }

  return {
    capacity,
    stats,
  };
}

export function normalizeSecondaryStats(
  secondaryStats: Item['secondaryStats'],
) {
  if (!secondaryStats || secondaryStats.length === 0) return undefined;

  const normalized: ItemSecondaryStat[] = [];
  let uniqueConsumed = false;
  for (const stat of secondaryStats) {
    if (
      !stat ||
      typeof stat.key !== 'string' ||
      !ALL_SECONDARY_STAT_KEYS.includes(stat.key as SecondaryStatKey)
    ) {
      continue;
    }
    if (normalized.some((entry) => entry.key === stat.key)) {
      continue;
    }
    if (
      UNIQUE_SECONDARY_STAT_KEYS.includes(stat.key as SecondaryStatKey) &&
      uniqueConsumed
    ) {
      continue;
    }

    normalized.push({
      key: stat.key as SecondaryStatKey,
      value: Math.max(0, Number(stat.value ?? 0) || 0),
    });
    if (UNIQUE_SECONDARY_STAT_KEYS.includes(stat.key as SecondaryStatKey)) {
      uniqueConsumed = true;
    }
  }

  return normalized.length > 0 ? normalized : undefined;
}

function buildGeneratedMainStatValue(
  key: MainItemStatKey,
  tier: number,
  baseValue = 0,
  perTier = 0,
  selectedRandomStats: Set<MainItemStatKey>,
) {
  const configured = baseValue > 0 || perTier > 0;
  if (!configured) return 0;
  if (selectedRandomStats.size > 0 && !selectedRandomStats.has(key)) return 0;
  return scaleMainItemStatForLevel(tier);
}

function pickSecondaryStatKey(
  availableKeys: SecondaryStatKey[],
  nextRoll: () => number,
) {
  if (availableKeys.length === 0) return null;
  const uniquePool = availableKeys.filter((key) =>
    UNIQUE_SECONDARY_STAT_KEYS.includes(key),
  );
  if (uniquePool.length > 0 && nextRoll() < 0.28) {
    return uniquePool[Math.floor(nextRoll() * uniquePool.length)] ?? null;
  }

  const standardPool = availableKeys.filter(
    (key) => !UNIQUE_SECONDARY_STAT_KEYS.includes(key),
  );
  const pool = standardPool.length > 0 ? standardPool : availableKeys;
  return pool[Math.floor(nextRoll() * pool.length)] ?? null;
}

function buildSecondaryStat(
  key: SecondaryStatKey,
  tier: number,
  _rarity: ItemRarity,
  _nextRoll: () => number,
): ItemSecondaryStat {
  return {
    key,
    value: buildSecondaryStatValue(key, tier),
  };
}

function buildSecondaryStatValue(key: SecondaryStatKey, tier: number) {
  const scaledValue = scaleSecondaryItemStatForLevel(tier);

  if (NON_CHANCE_BASED_SECONDARY_STAT_KEYS.includes(key)) {
    return scaledValue;
  }

  return scaledValue;
}
