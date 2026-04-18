import type {
  Item,
  ItemRarity,
  ItemSecondaryStat,
  MainItemStatKey,
  SecondaryStatKey,
} from './types';
import type { ItemConfig } from './content/types';

export const DEFAULT_CRITICAL_STRIKE_DAMAGE = 150;
export const DEFAULT_LIFESTEAL_CHANCE_AMOUNT = 0.5;
export const DEFAULT_LIFESTEAL_AMOUNT = 1;
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
  'suppressDamageChance',
  'suppressDamageReduction',
  'suppressDebuffChance',
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
      nextRoll,
    ),
    defense: buildGeneratedMainStatValue(
      'defense',
      tier,
      generatedStats.baseDefense,
      generatedStats.defensePerTier,
      selectedRandomStats,
      nextRoll,
    ),
    maxHp: buildGeneratedMainStatValue(
      'maxHp',
      tier,
      generatedStats.baseMaxHp,
      generatedStats.maxHpPerTier,
      selectedRandomStats,
      nextRoll,
    ),
  };
}

export function buildGeneratedSecondaryStats(
  context: GeneratedStatContext,
  nextRoll: () => number,
) {
  const secondarySlotRule = SECONDARY_STAT_SLOT_COUNTS[context.rarity];
  const defaultBlockChance = hasDefaultBlockChance(context.config)
    ? buildSecondaryStat('blockChance', context.tier, context.rarity, nextRoll)
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
            (secondarySlotRule.maxGenerated - secondarySlotRule.minGenerated + 1),
        );
  const stats: ItemSecondaryStat[] = defaultBlockChance ? [defaultBlockChance] : [];
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
  nextRoll: () => number,
) {
  const rawValue = Math.max(0, Math.round(baseValue + perTier * tier));
  if (rawValue === 0) return 0;
  if (selectedRandomStats.size > 0 && !selectedRandomStats.has(key)) return 0;
  return applyStatVariance(rawValue, nextRoll);
}

function applyStatVariance(value: number, nextRoll: () => number) {
  if (value <= 0) return 0;
  return Math.max(1, Math.round(value * (0.9 + nextRoll() * 0.2)));
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
  rarity: ItemRarity,
  nextRoll: () => number,
): ItemSecondaryStat {
  const rarityRank = ['common', 'uncommon', 'rare', 'epic', 'legendary'].indexOf(
    rarity,
  );
  const min = secondaryStatRange(key, tier, rarityRank).min;
  const max = secondaryStatRange(key, tier, rarityRank).max;

  return {
    key,
    value:
      min >= max ? min : min + Math.floor(nextRoll() * Math.max(1, max - min + 1)),
  };
}

function secondaryStatRange(
  key: SecondaryStatKey,
  tier: number,
  rarityRank: number,
) {
  switch (key) {
    case 'attackSpeed':
    case 'criticalStrikeChance':
    case 'lifestealChance':
    case 'dodgeChance':
    case 'suppressDebuffChance':
      return {
        min: 2 + rarityRank,
        max: 4 + rarityRank + Math.max(1, Math.floor(tier / 2)),
      };
    case 'criticalStrikeDamage':
      return {
        min: 10 + rarityRank * 3,
        max: 16 + rarityRank * 5 + tier,
      };
    case 'lifestealAmount':
      return {
        min: 1,
        max: 2 + rarityRank + Math.max(0, Math.floor(tier / 4)),
      };
    case 'blockChance':
      return {
        min: 6 + rarityRank * 2,
        max: 10 + rarityRank * 3 + Math.max(0, Math.floor(tier / 3)),
      };
    case 'suppressDamageChance':
      return {
        min: 4 + rarityRank,
        max: 8 + rarityRank * 2 + Math.max(0, Math.floor(tier / 3)),
      };
    case 'suppressDamageReduction':
      return {
        min: 5 + rarityRank * 2,
        max: 10 + rarityRank * 4 + Math.max(0, Math.floor(tier / 3)),
      };
    case 'bleedChance':
    case 'poisonChance':
    case 'burningChance':
    case 'chillingChance':
    case 'powerBuffChance':
    case 'frenzyBuffChance':
      return {
        min: 5 + rarityRank * 2,
        max: 10 + rarityRank * 4 + Math.max(0, Math.floor(tier / 2)),
      };
  }
}

function hasDefaultBlockChance(config: Pick<ItemConfig, 'slot' | 'category'>) {
  return config.slot === 'offhand' && (config.category === 'armor' || config.category === 'artifact');
}
