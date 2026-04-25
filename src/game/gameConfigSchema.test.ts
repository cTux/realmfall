import { describe, expect, it } from 'vitest';

import rawGameConfig from '../../game.config';
import { GAME_CONFIG } from './config';
import { defineGameConfig } from './gameConfigSchema';

describe('game config schema', () => {
  it('keeps the shared config helper as an identity function', () => {
    const sampleConfig = {
      balance: {
        combat: {
          globalCooldownMs: 1,
        },
        player: {
          maxLevel: 1,
          baseStats: {
            level1: {
              maxHp: 1,
              attack: 1,
              defense: 1,
            },
            level100: {
              maxHp: 1,
              attack: 1,
              defense: 1,
            },
          },
        },
        enemy: {
          baseStats: {
            level1: {
              maxHp: 1,
              attack: 1,
              defense: 1,
            },
            level100: {
              maxHp: 1,
              attack: 1,
              defense: 1,
            },
          },
          postLevel100PerLevel: 0,
          rarityMultiplier: {
            common: 1,
            uncommon: 1,
            rare: 1,
            epic: 1,
            legendary: 1,
          },
        },
        items: {
          maxLevel: 1,
          baseStat: {
            level1: 1,
            level100: 1,
          },
          secondaryStat: {
            level1: 1,
            level100: 1,
            cap: 1,
          },
          modification: {
            reforge: {
              baseCost: 1,
              perTier: 1,
              perRarity: 1,
            },
            enchant: {
              baseCost: 1,
              perTier: 1,
              perRarity: 1,
            },
            corrupt: {
              baseCost: 1,
              perTier: 1,
              perRarity: 1,
              breakChance: 0,
              statBonus: 0,
            },
          },
        },
        economy: {
          townBuyPrice: {
            minimum: 1,
            perTier: 0,
            consumable: {
              minimum: 1,
              baseMultiplier: 1,
              perTier: 0,
              rarityMultiplier: {
                common: 1,
                uncommon: 1,
                rare: 1,
                epic: 1,
                legendary: 1,
              },
            },
            consumableCraftedFood: {
              minimum: 1,
              baseMultiplier: 1,
              perTier: 0,
              rarityMultiplier: {
                common: 1,
                uncommon: 1,
                rare: 1,
                epic: 1,
                legendary: 1,
              },
            },
            rarityMultiplier: {
              common: 1,
              uncommon: 1,
              rare: 1,
              epic: 1,
              legendary: 1,
            },
          },
        },
      },
      progression: {
        playerXp: {
          enemyBase: 1,
          firstLevelRequirement: 1,
          lastLevelRequirement: 1,
          masteryBaseRequirement: 1,
          masteryGrowthRate: 0,
          levelDifference: {
            penaltyPerLevelBelowPlayer: 0,
            maxPenaltyLevels: 0,
            bonusPerLevelAbovePlayer: 0,
            maxBonusLevels: 0,
          },
        },
        gatheringBonus: {
          perLevel: 0,
          max: 0,
        },
        itemRarity: {
          uncommon: 1,
          rare: 1,
          epic: 1,
          legendary: 1,
        },
      },
      worldClock: {
        dayDurationMs: 1,
      },
      worldGeneration: {
        terrain: {
          plains: 1,
          meadow: 1,
          forest: 1,
          grove: 1,
          highlands: 1,
          mountain: 1,
          swamp: 1,
          marsh: 1,
          desert: 1,
          dunes: 1,
          badlands: 1,
          steppe: 1,
          blasted: 1,
          rift: 1,
        },
        enemySpawn: {
          tile: 1,
        },
        ambush: {
          chance: 1,
        },
        loot: {
          dungeon: 1,
          guardedBase: 1,
          guardedPerTier: 1,
          guardedMax: 1,
          unguarded: 1,
          bonusCache: 1,
        },
        generatedItemKind: {
          artifact: 1,
          weapon: 1,
          offhand: 1,
          armor: 1,
          consumable: 1,
        },
        structure: {
          globalAppearanceThreshold: {},
          appearanceChanceByTerrain: {},
        },
      },
      events: {
        bloodMoon: {
          activation: 1,
          enemySpawnNear: 1,
          enemySpawnMid: 1,
          enemySpawnFar: 1,
          bonusLootExtraDropBase: 1,
          bonusLootExtraDropPerRarity: 1,
        },
        harvestMoon: {
          activation: 1,
          resourceSpawnNear: 1,
          resourceSpawnFar: 1,
          resourceType: {
            herbs: 1,
            tree: 1,
            'copper-ore': 1,
            'iron-ore': 1,
            'coal-ore': 1,
          },
        },
        earthshake: {
          activation: 1,
        },
      },
      drops: {
        enemyGold: {
          base: 1,
          perTier: 1,
          perRarity: 1,
          eliteBonus: 1,
          max: 1,
          bloodMoon: 1,
        },
        enemyRecipe: {
          base: 1,
          perTier: 1,
          perRarity: 1,
          max: 1,
          bloodMoonBonus: 1,
          bloodMoonMax: 1,
        },
        homeScroll: {
          base: 1,
          perRarity: 1,
          max: 1,
        },
        gatheringByproduct: {
          tree: 1,
          ore: 1,
        },
        bloodMoonItemKind: {
          artifact: 1,
          weapon: 1,
          offhand: 1,
          armor: 1,
        },
      },
      territories: {
        factionRegion: {
          spawn: 1,
        },
        structures: {
          forge: 1,
          workshop: 1,
          camp: 1,
          none: 1,
        },
      },
    } as const;

    expect(defineGameConfig(sampleConfig)).toBe(sampleConfig);
  });

  it('reuses the typed root config object in the runtime config surface', () => {
    expect(GAME_CONFIG).toBe(rawGameConfig);
  });
});
