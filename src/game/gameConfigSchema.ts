import type {
  GatheringStructureType,
  ItemRarity,
  StructureType,
  Terrain,
} from './types';

export type WeightedChanceMap<T extends string> = Record<T, number>;

export interface GameConfig {
  balance: {
    combat: {
      globalCooldownMs: number;
    };
    player: {
      maxLevel: number;
      baseStats: {
        level1: {
          maxHp: number;
          attack: number;
          defense: number;
        };
        level100: {
          maxHp: number;
          attack: number;
          defense: number;
        };
      };
    };
    enemy: {
      baseStats: {
        level1: {
          maxHp: number;
          attack: number;
          defense: number;
        };
        level100: {
          maxHp: number;
          attack: number;
          defense: number;
        };
      };
      postLevel100PerLevel: number;
      rarityMultiplier: Record<ItemRarity, number>;
    };
    items: {
      maxLevel: number;
      baseStat: {
        level1: number;
        level100: number;
      };
      secondaryStat: {
        level1: number;
        level100: number;
        cap: number;
      };
      modification: {
        reforge: {
          baseCost: number;
          perTier: number;
          perRarity: number;
        };
        enchant: {
          baseCost: number;
          perTier: number;
          perRarity: number;
        };
        corrupt: {
          baseCost: number;
          perTier: number;
          perRarity: number;
          breakChance: number;
          statBonus: number;
        };
      };
    };
    economy: {
      townBuyPrice: {
        minimum: number;
        perTier: number;
        rarityMultiplier: Record<ItemRarity, number>;
        consumable: {
          minimum: number;
          baseMultiplier: number;
          perTier: number;
          rarityMultiplier: Record<ItemRarity, number>;
        };
        consumableCraftedFood: {
          minimum: number;
          baseMultiplier: number;
          perTier: number;
          rarityMultiplier: Record<ItemRarity, number>;
        };
      };
    };
  };
  progression: {
    playerXp: {
      enemyBase: number;
      firstLevelRequirement: number;
      lastLevelRequirement: number;
      masteryBaseRequirement: number;
      masteryGrowthRate: number;
      levelDifference: {
        penaltyPerLevelBelowPlayer: number;
        maxPenaltyLevels: number;
        bonusPerLevelAbovePlayer: number;
        maxBonusLevels: number;
      };
    };
    gatheringBonus: {
      perLevel: number;
      max: number;
    };
    itemRarity: WeightedChanceMap<Exclude<ItemRarity, 'common'>>;
    itemRarityScaling: {
      bonusPerTier: number;
      bonusMax: number;
      rarityBonusMultipliers: Record<Exclude<ItemRarity, 'common'>, number>;
    };
  };
  worldClock: {
    dayDurationMs: number;
  };
  worldGeneration: {
    terrain: WeightedChanceMap<Terrain>;
    structure: {
      globalAppearanceThreshold: Partial<Record<StructureType, number>>;
      appearanceChanceByTerrain: Partial<
        Record<StructureType, Partial<Record<Terrain, number>>>
      >;
    };
    enemySpawn: {
      tile: number;
    };
    ambush: {
      chance: number;
    };
    loot: {
      dungeon: number;
      guardedBase: number;
      guardedPerTier: number;
      guardedMax: number;
      unguarded: number;
      bonusCache: number;
    };
    generatedItemKind: WeightedChanceMap<
      'artifact' | 'weapon' | 'offhand' | 'armor' | 'consumable'
    >;
    generatedItem: {
      dungeonMinimumRarity: Exclude<ItemRarity, 'common' | 'legendary'>;
      artifactTierBonus: number;
      fallbackConsumable: string;
    };
  };
  events: {
    bloodMoon: {
      activation: number;
      enemySpawnNear: number;
      enemySpawnMid: number;
      enemySpawnFar: number;
      bonusLootExtraDropBase: number;
      bonusLootExtraDropPerRarity: number;
    };
    harvestMoon: {
      activation: number;
      resourceSpawnNear: number;
      resourceSpawnFar: number;
      resourceType: WeightedChanceMap<
        Extract<
          GatheringStructureType,
          'herbs' | 'tree' | 'copper-ore' | 'iron-ore' | 'coal-ore'
        >
      >;
    };
    earthshake: {
      activation: number;
    };
  };
  drops: {
    enemyGold: {
      base: number;
      perTier: number;
      perRarity: number;
      eliteBonus: number;
      max: number;
      bloodMoon: number;
      boss: {
        minimumQuantity: number;
        tierScaling: number;
        randomRange: number;
      };
      quantity: {
        minimum: number;
        tierWeight: number;
        rarityWeight: number;
        randomBase: number;
        randomRarityWeight: number;
      };
      bloodMoonMultiplier: {
        quantity: number;
        tierWeight: number;
      };
    };
    enemyRecipe: {
      base: number;
      perTier: number;
      perRarity: number;
      max: number;
      bloodMoonBonus: number;
      bloodMoonMax: number;
    };
    enemyItem: {
      chance: {
        base: number;
        perRarity: number;
        max: number;
        bloodMoonMultiplier: number;
        dungeonMultiplier: number;
      };
      kindChances: WeightedChanceMap<
        'artifact' | 'weapon' | 'offhand' | 'armor' | 'consumable'
      >;
      bonuses: {
        bloodMoon: {
          minimumTierBonus: number;
          rarityStep: number;
        };
        skinnedAnimal: {
          minimum: number;
          tierDivisor: number;
          bloodMoonBonus: number;
        };
      };
    };
    homeScroll: {
      base: number;
      perRarity: number;
      max: number;
    };
    gatheringByproduct: {
      tree: number;
      ore: number;
    };
    bloodMoonItemKind: WeightedChanceMap<
      'artifact' | 'weapon' | 'offhand' | 'armor'
    >;
  };
  territories: {
    factionRegion: {
      spawn: number;
    };
    structures: WeightedChanceMap<'forge' | 'workshop' | 'camp' | 'none'>;
  };
}

export function defineGameConfig<const T extends GameConfig>(config: T): T {
  return config;
}
