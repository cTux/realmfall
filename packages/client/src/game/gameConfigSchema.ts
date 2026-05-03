import * as v from 'valibot';
import type { BaseIssue, BaseSchema, InferOutput } from 'valibot';

import type { GatheringStructureType, ItemRarity } from './types';
import {
  GATHERING_STRUCTURE_TYPES,
  RARITY_ORDER,
  STRUCTURE_TYPES,
  TERRAINS,
} from './types';

export type WeightedChanceMap<T extends string> = Record<T, number>;
const finiteNumberSchema = v.pipe(v.number(), v.finite());

const worldGeneratedItemKinds = [
  'artifact',
  'weapon',
  'offhand',
  'armor',
  'consumable',
] as const;
const bloodMoonItemKinds = ['artifact', 'weapon', 'offhand', 'armor'] as const;
const territoryStructureKinds = ['forge', 'workshop', 'camp', 'none'] as const;
const nonCommonItemRarities = RARITY_ORDER.filter(
  (rarity): rarity is Exclude<ItemRarity, 'common'> => rarity !== 'common',
);
const harvestMoonResourceTypes = GATHERING_STRUCTURE_TYPES.filter(
  (
    structureType,
  ): structureType is Extract<
    GatheringStructureType,
    'herbs' | 'tree' | 'copper-ore' | 'iron-ore' | 'coal-ore'
  > =>
    structureType === 'herbs' ||
    structureType === 'tree' ||
    structureType === 'copper-ore' ||
    structureType === 'iron-ore' ||
    structureType === 'coal-ore',
);

function createRequiredShapeSchema<
  const TKey extends string,
  TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
>(keys: readonly TKey[], valueSchema: TSchema) {
  return v.strictObject(v.entriesFromList(Array.from(keys), valueSchema));
}

function createPartialShapeSchema<
  const TKey extends string,
  TSchema extends BaseSchema<unknown, unknown, BaseIssue<unknown>>,
>(keys: readonly TKey[], valueSchema: TSchema) {
  return v.partial(createRequiredShapeSchema(keys, valueSchema));
}

function createRequiredNumberMapSchema<const TKey extends string>(
  keys: readonly TKey[],
) {
  return createRequiredShapeSchema(keys, finiteNumberSchema);
}

function createPartialNumberMapSchema<const TKey extends string>(
  keys: readonly TKey[],
) {
  return createPartialShapeSchema(keys, finiteNumberSchema);
}

const combatStatAnchorSchema = v.strictObject({
  maxHp: finiteNumberSchema,
  attack: finiteNumberSchema,
  defense: finiteNumberSchema,
});

const level100AnchorSchema = v.strictObject({
  level1: combatStatAnchorSchema,
  level100: combatStatAnchorSchema,
});

const levelRangeSchema = v.strictObject({
  level1: finiteNumberSchema,
  level100: finiteNumberSchema,
});

const rarityMultiplierSchema = createRequiredNumberMapSchema(RARITY_ORDER);

const consumableTownBuyPriceSchema = v.strictObject({
  minimum: finiteNumberSchema,
  baseMultiplier: finiteNumberSchema,
  perTier: finiteNumberSchema,
  rarityMultiplier: rarityMultiplierSchema,
});

const structureAppearanceChanceByTerrainSchema = createPartialShapeSchema(
  STRUCTURE_TYPES,
  createPartialNumberMapSchema(TERRAINS),
);

export const gameConfigSchema = v.strictObject({
  balance: v.strictObject({
    combat: v.strictObject({
      globalCooldownMs: finiteNumberSchema,
    }),
    player: v.strictObject({
      maxLevel: finiteNumberSchema,
      baseStats: level100AnchorSchema,
    }),
    enemy: v.strictObject({
      baseStats: level100AnchorSchema,
      postLevel100PerLevel: finiteNumberSchema,
      rarityMultiplier: rarityMultiplierSchema,
      treasureGoblin: v.strictObject({
        hpMultiplier: finiteNumberSchema,
        fleeHitsMin: finiteNumberSchema,
        fleeHitsMax: finiteNumberSchema,
        fleeRadius: finiteNumberSchema,
      }),
    }),
    items: v.strictObject({
      maxLevel: finiteNumberSchema,
      baseStat: levelRangeSchema,
      secondaryStat: v.strictObject({
        level1: finiteNumberSchema,
        level100: finiteNumberSchema,
        cap: finiteNumberSchema,
      }),
      modification: v.strictObject({
        reforge: v.strictObject({
          baseCost: finiteNumberSchema,
          perTier: finiteNumberSchema,
          perRarity: finiteNumberSchema,
        }),
        enchant: v.strictObject({
          baseCost: finiteNumberSchema,
          perTier: finiteNumberSchema,
          perRarity: finiteNumberSchema,
        }),
        corrupt: v.strictObject({
          baseCost: finiteNumberSchema,
          perTier: finiteNumberSchema,
          perRarity: finiteNumberSchema,
          breakChance: finiteNumberSchema,
          statBonus: finiteNumberSchema,
        }),
      }),
    }),
    economy: v.strictObject({
      townBuyPrice: v.strictObject({
        minimum: finiteNumberSchema,
        perTier: finiteNumberSchema,
        rarityMultiplier: rarityMultiplierSchema,
        consumable: consumableTownBuyPriceSchema,
        consumableCraftedFood: consumableTownBuyPriceSchema,
        terraformingConsumable: consumableTownBuyPriceSchema,
      }),
    }),
  }),
  progression: v.strictObject({
    playerXp: v.strictObject({
      enemyBase: finiteNumberSchema,
      firstLevelRequirement: finiteNumberSchema,
      lastLevelRequirement: finiteNumberSchema,
      masteryBaseRequirement: finiteNumberSchema,
      masteryGrowthRate: finiteNumberSchema,
      levelDifference: v.strictObject({
        penaltyPerLevelBelowPlayer: finiteNumberSchema,
        maxPenaltyLevels: finiteNumberSchema,
        bonusPerLevelAbovePlayer: finiteNumberSchema,
        maxBonusLevels: finiteNumberSchema,
      }),
    }),
    gatheringBonus: v.strictObject({
      perLevel: finiteNumberSchema,
      max: finiteNumberSchema,
    }),
    itemRarity: createRequiredNumberMapSchema(nonCommonItemRarities),
    itemRarityScaling: v.strictObject({
      bonusPerTier: finiteNumberSchema,
      bonusMax: finiteNumberSchema,
      rarityBonusMultipliers: createRequiredNumberMapSchema(
        nonCommonItemRarities,
      ),
    }),
  }),
  worldClock: v.strictObject({
    dayDurationMs: finiteNumberSchema,
    moveHexCooldownMs: finiteNumberSchema,
  }),
  worldGeneration: v.strictObject({
    terrain: createRequiredNumberMapSchema(TERRAINS),
    structure: v.strictObject({
      globalAppearanceThreshold: createPartialNumberMapSchema(STRUCTURE_TYPES),
      appearanceChanceByTerrain: structureAppearanceChanceByTerrainSchema,
    }),
    enemySpawn: v.strictObject({
      tile: finiteNumberSchema,
      treasureGoblin: v.strictObject({
        chance: finiteNumberSchema,
      }),
    }),
    ambush: v.strictObject({
      chance: finiteNumberSchema,
    }),
    loot: v.strictObject({
      dungeon: finiteNumberSchema,
      guardedBase: finiteNumberSchema,
      guardedPerTier: finiteNumberSchema,
      guardedMax: finiteNumberSchema,
      unguarded: finiteNumberSchema,
      bonusCache: finiteNumberSchema,
    }),
    generatedItemKind: createRequiredNumberMapSchema(worldGeneratedItemKinds),
  }),
  events: v.strictObject({
    bloodMoon: v.strictObject({
      activation: finiteNumberSchema,
      enemySpawnNear: finiteNumberSchema,
      enemySpawnMid: finiteNumberSchema,
      enemySpawnFar: finiteNumberSchema,
      bonusLootExtraDropBase: finiteNumberSchema,
      bonusLootExtraDropPerRarity: finiteNumberSchema,
    }),
    harvestMoon: v.strictObject({
      activation: finiteNumberSchema,
      resourceSpawnNear: finiteNumberSchema,
      resourceSpawnFar: finiteNumberSchema,
      resourceType: createRequiredNumberMapSchema(harvestMoonResourceTypes),
    }),
    earthshake: v.strictObject({
      activation: finiteNumberSchema,
    }),
  }),
  drops: v.strictObject({
    enemyGold: v.strictObject({
      base: finiteNumberSchema,
      perTier: finiteNumberSchema,
      perRarity: finiteNumberSchema,
      eliteBonus: finiteNumberSchema,
      max: finiteNumberSchema,
      bloodMoon: finiteNumberSchema,
      boss: v.strictObject({
        minimumQuantity: finiteNumberSchema,
        tierScaling: finiteNumberSchema,
        randomRange: finiteNumberSchema,
      }),
      quantity: v.strictObject({
        minimum: finiteNumberSchema,
        tierWeight: finiteNumberSchema,
        rarityWeight: finiteNumberSchema,
        randomBase: finiteNumberSchema,
        randomRarityWeight: finiteNumberSchema,
      }),
      bloodMoonMultiplier: v.strictObject({
        quantity: finiteNumberSchema,
        tierWeight: finiteNumberSchema,
      }),
      treasureGoblinMultiplier: finiteNumberSchema,
    }),
    enemyRecipe: v.strictObject({
      base: finiteNumberSchema,
      perTier: finiteNumberSchema,
      perRarity: finiteNumberSchema,
      max: finiteNumberSchema,
      bloodMoonBonus: finiteNumberSchema,
      bloodMoonMax: finiteNumberSchema,
    }),
    enemyItem: v.strictObject({
      chance: v.strictObject({
        base: finiteNumberSchema,
        perRarity: finiteNumberSchema,
        max: finiteNumberSchema,
        bloodMoonMultiplier: finiteNumberSchema,
        dungeonMultiplier: finiteNumberSchema,
      }),
      treasureGoblin: v.strictObject({
        chanceMultiplier: finiteNumberSchema,
        rarityMultiplier: finiteNumberSchema,
      }),
      kindChances: createRequiredNumberMapSchema(worldGeneratedItemKinds),
      bonuses: v.strictObject({
        bloodMoon: v.strictObject({
          minimumTierBonus: finiteNumberSchema,
          rarityStep: finiteNumberSchema,
        }),
        skinnedAnimal: v.strictObject({
          minimum: finiteNumberSchema,
          tierDivisor: finiteNumberSchema,
          bloodMoonBonus: finiteNumberSchema,
        }),
      }),
    }),
    homeScroll: v.strictObject({
      base: finiteNumberSchema,
      perRarity: finiteNumberSchema,
      max: finiteNumberSchema,
    }),
    gatheringByproduct: v.strictObject({
      tree: finiteNumberSchema,
      ore: finiteNumberSchema,
    }),
    bloodMoonItemKind: createRequiredNumberMapSchema(bloodMoonItemKinds),
    terraformingConsumableChance: finiteNumberSchema,
  }),
  territories: v.strictObject({
    factionRegion: v.strictObject({
      spawn: finiteNumberSchema,
    }),
    structures: createRequiredNumberMapSchema(territoryStructureKinds),
  }),
});

export type GameConfig = InferOutput<typeof gameConfigSchema>;

function assertValidGameConfig(config: unknown): asserts config is GameConfig {
  const result = v.safeParse(gameConfigSchema, config);

  if (!result.success) {
    throw new TypeError(`Invalid game config.\n${v.summarize(result.issues)}`);
  }
}

export function defineGameConfig<const T extends GameConfig>(config: T): T {
  assertValidGameConfig(config);
  return config;
}
