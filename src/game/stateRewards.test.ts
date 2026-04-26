import { dropEnemyRewards } from './stateRewards';
import {
  ENEMY_GOLD_DROP_CHANCES,
  ENEMY_ITEM_DROP_CHANCES,
  ENEMY_RECIPE_DROP_CHANCES,
  HOME_SCROLL_DROP_CHANCES,
} from './config';
import {
  createCombatEncounterGame,
  seedCombatEncounter,
} from './stateCombatTestHelpers';
import { getItemCategory } from './content/items';
import { getTileAt } from './state';

const originalEnemyItemDropChances = {
  chance: { ...ENEMY_ITEM_DROP_CHANCES.chance },
  kindChances: { ...ENEMY_ITEM_DROP_CHANCES.kindChances },
};
const originalEnemyGoldDropChances = { ...ENEMY_GOLD_DROP_CHANCES };
const originalEnemyRecipeDropChances = { ...ENEMY_RECIPE_DROP_CHANCES };
const originalHomeScrollDropChances = { ...HOME_SCROLL_DROP_CHANCES };

function resetDropChances() {
  ENEMY_ITEM_DROP_CHANCES.chance = { ...originalEnemyItemDropChances.chance };
  ENEMY_ITEM_DROP_CHANCES.kindChances = {
    ...originalEnemyItemDropChances.kindChances,
  };
  ENEMY_GOLD_DROP_CHANCES.base = originalEnemyGoldDropChances.base;
  ENEMY_GOLD_DROP_CHANCES.perTier = originalEnemyGoldDropChances.perTier;
  ENEMY_GOLD_DROP_CHANCES.perRarity = originalEnemyGoldDropChances.perRarity;
  ENEMY_GOLD_DROP_CHANCES.eliteBonus = originalEnemyGoldDropChances.eliteBonus;
  ENEMY_GOLD_DROP_CHANCES.max = originalEnemyGoldDropChances.max;
  ENEMY_GOLD_DROP_CHANCES.bloodMoon = originalEnemyGoldDropChances.bloodMoon;
  ENEMY_RECIPE_DROP_CHANCES.base = originalEnemyRecipeDropChances.base;
  ENEMY_RECIPE_DROP_CHANCES.perTier = originalEnemyRecipeDropChances.perTier;
  ENEMY_RECIPE_DROP_CHANCES.perRarity =
    originalEnemyRecipeDropChances.perRarity;
  ENEMY_RECIPE_DROP_CHANCES.max = originalEnemyRecipeDropChances.max;
  ENEMY_RECIPE_DROP_CHANCES.bloodMoonBonus =
    originalEnemyRecipeDropChances.bloodMoonBonus;
  ENEMY_RECIPE_DROP_CHANCES.bloodMoonMax =
    originalEnemyRecipeDropChances.bloodMoonMax;
  HOME_SCROLL_DROP_CHANCES.base = originalHomeScrollDropChances.base;
  HOME_SCROLL_DROP_CHANCES.perRarity = originalHomeScrollDropChances.perRarity;
  HOME_SCROLL_DROP_CHANCES.max = originalHomeScrollDropChances.max;
}

describe('state rewards', () => {
  afterEach(() => {
    resetDropChances();
  });

  it('checks enemy item kinds in ascending chance order and supports partial drops', () => {
    const game = createCombatEncounterGame('o:52');
    const target = { q: 2, r: 0 };
    seedCombatEncounter(game, {
      id: 'enemy-test',
      name: 'Raider',
      coord: target,
      tier: 1,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
      xp: 5,
      elite: false,
    });

    ENEMY_ITEM_DROP_CHANCES.chance.base = 1;
    ENEMY_ITEM_DROP_CHANCES.chance.perRarity = 0;
    ENEMY_ITEM_DROP_CHANCES.chance.max = 1;
    ENEMY_ITEM_DROP_CHANCES.kindChances = {
      artifact: 0.1,
      armor: 0.2,
      offhand: 0.3,
      weapon: 0.4,
      consumable: 0.5,
    };
    ENEMY_GOLD_DROP_CHANCES.base = 0;
    ENEMY_GOLD_DROP_CHANCES.max = 0;
    ENEMY_RECIPE_DROP_CHANCES.base = 0;
    ENEMY_RECIPE_DROP_CHANCES.max = 0;
    HOME_SCROLL_DROP_CHANCES.max = 0;

    dropEnemyRewards(game, game.enemies['enemy-test']!);
    const tileItems = getTileAt(game, target).items;

    expect(tileItems).toHaveLength(3);
    expect(tileItems.map((item) => getItemCategory(item)).sort()).toEqual(
      ['armor', 'artifact', 'offhand'].sort(),
    );
  });

  it('can drop multiple enemy item kinds when every kind check succeeds', () => {
    const game = createCombatEncounterGame('o:52');
    const target = { q: 2, r: 0 };
    seedCombatEncounter(game, {
      id: 'enemy-test',
      name: 'Raider',
      coord: target,
      tier: 1,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
      xp: 5,
      elite: false,
    });

    ENEMY_ITEM_DROP_CHANCES.chance.base = 1;
    ENEMY_ITEM_DROP_CHANCES.chance.perRarity = 0;
    ENEMY_ITEM_DROP_CHANCES.chance.max = 1;
    ENEMY_ITEM_DROP_CHANCES.kindChances = {
      artifact: 1,
      armor: 1,
      offhand: 1,
      weapon: 1,
      consumable: 1,
    };
    ENEMY_GOLD_DROP_CHANCES.base = 0;
    ENEMY_GOLD_DROP_CHANCES.max = 0;
    ENEMY_RECIPE_DROP_CHANCES.base = 0;
    ENEMY_RECIPE_DROP_CHANCES.max = 0;
    HOME_SCROLL_DROP_CHANCES.max = 0;

    dropEnemyRewards(game, game.enemies['enemy-test']!);
    const tileItems = getTileAt(game, target).items;

    expect(tileItems).toHaveLength(5);
    expect(tileItems.map((item) => getItemCategory(item)).sort()).toEqual(
      ['armor', 'artifact', 'consumable', 'offhand', 'weapon'].sort(),
    );
  });
});
