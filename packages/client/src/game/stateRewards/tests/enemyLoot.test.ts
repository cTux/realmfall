import {
  dropEnemyRewards,
  getEnemyDropRarityChanceScale,
  getEnemyItemDropChance,
  maybeDropLockedChestOpener,
} from '../enemyLoot';
import { isTreasureGoblinLikeEnemyLootSource } from '../../content/enemies';
import {
  ENEMY_GOLD_DROP_CHANCES,
  ENEMY_ITEM_BLOOD_MOON_RARITY_CHANCE_MULTIPLIER,
  ENEMY_ITEM_DROP_CHANCES,
  ENEMY_ITEM_DUNGEON_RARITY_CHANCE_MULTIPLIER,
  ENEMY_RECIPE_DROP_CHANCES,
  GAME_CONFIG,
  HOME_SCROLL_DROP_CHANCES,
  TREASURE_GOBLIN_GOLD_MULTIPLIER,
  TREASURE_GOBLIN_ITEM_DROP_MULTIPLIERS,
} from '../../config';
import { StateCombatTestkit } from '../../stateCombatTestkit';
import { getItemCategory, getItemConfigByKey } from '../../content/items';
import { ItemId } from '../../content/ids';
import { getTileAt } from '../../state';

const combatTestkit = new StateCombatTestkit();

const originalEnemyItemDropChances = {
  chance: { ...ENEMY_ITEM_DROP_CHANCES.chance },
  kindChances: { ...ENEMY_ITEM_DROP_CHANCES.kindChances },
};
const originalEnemyGoldDropChances = { ...ENEMY_GOLD_DROP_CHANCES };
const originalEnemyRecipeDropChances = { ...ENEMY_RECIPE_DROP_CHANCES };
const originalHomeScrollDropChances = { ...HOME_SCROLL_DROP_CHANCES };
const originalTerraformingConsumableDropChance =
  GAME_CONFIG.drops.terraformingConsumableChance;

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
  GAME_CONFIG.drops.terraformingConsumableChance =
    originalTerraformingConsumableDropChance;
}

function classifyDropKind(
  item: Parameters<typeof getItemCategory>[0] & { slot?: string },
) {
  if (item.slot === 'offhand') return 'offhand';
  return getItemCategory(item);
}

describe('state reward enemy loot', () => {
  afterEach(() => {
    resetDropChances();
  });

  it('checks enemy item kinds in ascending chance order and supports partial drops', () => {
    const game = combatTestkit.actions.createEncounterGame('o:52');
    const target = { q: 2, r: 0 };
    combatTestkit.actions.seedEncounter(game, {
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
      armor: 0.2,
      consumable: 0.3,
      artifact: 0.4,
      weapon: 0.5,
      offhand: 0.6,
    };
    ENEMY_GOLD_DROP_CHANCES.base = 0;
    ENEMY_GOLD_DROP_CHANCES.max = 0;
    ENEMY_RECIPE_DROP_CHANCES.base = 0;
    ENEMY_RECIPE_DROP_CHANCES.max = 0;
    HOME_SCROLL_DROP_CHANCES.max = 0;
    GAME_CONFIG.drops.terraformingConsumableChance = 0;

    dropEnemyRewards(game, game.enemies['enemy-test']!);
    const tileItems = getTileAt(game, target).items;

    expect(tileItems).toHaveLength(3);
    expect(tileItems.map(classifyDropKind).sort()).toEqual(
      ['artifact', 'offhand', 'weapon'].sort(),
    );
  });

  it('can drop multiple enemy item kinds when every kind check succeeds', () => {
    const game = combatTestkit.actions.createEncounterGame('o:52');
    const target = { q: 2, r: 0 };
    combatTestkit.actions.seedEncounter(game, {
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
      consumable: 1,
      offhand: 1,
      weapon: 1,
    };
    ENEMY_GOLD_DROP_CHANCES.base = 0;
    ENEMY_GOLD_DROP_CHANCES.max = 0;
    ENEMY_RECIPE_DROP_CHANCES.base = 0;
    ENEMY_RECIPE_DROP_CHANCES.max = 0;
    HOME_SCROLL_DROP_CHANCES.max = 0;
    GAME_CONFIG.drops.terraformingConsumableChance = 0;

    dropEnemyRewards(game, game.enemies['enemy-test']!);
    const tileItems = getTileAt(game, target).items;

    expect(tileItems).toHaveLength(5);
    expect(tileItems.map(classifyDropKind).sort()).toEqual(
      ['armor', 'artifact', 'consumable', 'offhand', 'weapon'].sort(),
    );
  });

  it('keeps world-boss consumable drops at their configured rarity', () => {
    const game = combatTestkit.actions.createEncounterGame(
      'world-boss-consumable-rarity',
    );
    const target = { q: 2, r: 0 };
    combatTestkit.actions.seedEncounter(game, {
      id: 'enemy-boss-consumable',
      name: 'Boss',
      coord: target,
      tier: 12,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
      xp: 50,
      elite: true,
      worldBoss: true,
      rarity: 'legendary',
    });

    ENEMY_ITEM_DROP_CHANCES.chance.base = 1;
    ENEMY_ITEM_DROP_CHANCES.chance.perRarity = 0;
    ENEMY_ITEM_DROP_CHANCES.chance.max = 1;
    ENEMY_ITEM_DROP_CHANCES.kindChances = {
      artifact: 0,
      armor: 0,
      consumable: 1,
      offhand: 0,
      weapon: 0,
    };
    ENEMY_GOLD_DROP_CHANCES.base = 0;
    ENEMY_GOLD_DROP_CHANCES.max = 0;
    ENEMY_RECIPE_DROP_CHANCES.base = 0;
    ENEMY_RECIPE_DROP_CHANCES.max = 0;
    HOME_SCROLL_DROP_CHANCES.max = 0;
    GAME_CONFIG.drops.terraformingConsumableChance = 0;

    dropEnemyRewards(game, game.enemies['enemy-boss-consumable']!);
    const droppedItem = getTileAt(game, target).items.find(
      (item) => getItemCategory(item) === 'consumable',
    );

    expect(droppedItem).toBeTruthy();
    expect(droppedItem?.itemKey).toBeTruthy();
    expect(droppedItem?.rarity).toBe(
      getItemConfigByKey(droppedItem!.itemKey!)?.rarity,
    );
  });

  it('triples treasure goblin item-drop chance', () => {
    const ordinaryGame = combatTestkit.actions.createEncounterGame(
      'treasure-goblin-item-chance',
    );
    const treasureGoblinGame = combatTestkit.actions.createEncounterGame(
      'treasure-goblin-item-chance',
    );

    combatTestkit.actions.seedEncounter(ordinaryGame, {
      id: 'enemy-drop-chance',
      name: 'Raider',
      coord: { q: 2, r: 0 },
      tier: 1,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
      xp: 5,
      elite: false,
    });
    combatTestkit.actions.seedEncounter(treasureGoblinGame, {
      id: 'enemy-drop-chance',
      name: 'Treasure Goblin',
      enemyTypeId: 'treasure-goblin',
      coord: { q: 2, r: 0 },
      tier: 1,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
      xp: 5,
      elite: false,
    });

    ENEMY_ITEM_DROP_CHANCES.chance.base = 0.2;
    ENEMY_ITEM_DROP_CHANCES.chance.perRarity = 0;
    ENEMY_ITEM_DROP_CHANCES.chance.max = 1;

    expect(
      getEnemyItemDropChance(ordinaryGame.enemies['enemy-drop-chance']!),
    ).toBe(0.2);
    expect(
      getEnemyItemDropChance(treasureGoblinGame.enemies['enemy-drop-chance']!),
    ).toBe(0.2 * TREASURE_GOBLIN_ITEM_DROP_MULTIPLIERS.chanceMultiplier);
  });

  it('triples treasure goblin item rarity scale on top of other multipliers', () => {
    const ordinaryGame = combatTestkit.actions.createEncounterGame(
      'treasure-goblin-rarity-scale',
    );
    const treasureGoblinGame = combatTestkit.actions.createEncounterGame(
      'treasure-goblin-rarity-scale',
    );
    const target = { q: 2, r: 0 };

    ordinaryGame.bloodMoonActive = true;
    treasureGoblinGame.bloodMoonActive = true;

    combatTestkit.actions.seedEncounter(
      ordinaryGame,
      {
        id: 'enemy-rarity-scale',
        name: 'Raider',
        coord: target,
        tier: 1,
        hp: 1,
        maxHp: 1,
        attack: 0,
        defense: 0,
        xp: 5,
        elite: false,
      },
      { structure: 'dungeon' },
    );
    combatTestkit.actions.seedEncounter(
      treasureGoblinGame,
      {
        id: 'enemy-rarity-scale',
        name: 'Treasure Goblin',
        enemyTypeId: 'treasure-goblin',
        coord: target,
        tier: 1,
        hp: 1,
        maxHp: 1,
        attack: 0,
        defense: 0,
        xp: 5,
        elite: false,
      },
      { structure: 'dungeon' },
    );

    const ordinaryScale = getEnemyDropRarityChanceScale(
      ordinaryGame,
      ordinaryGame.enemies['enemy-rarity-scale']!,
    );
    const treasureGoblinScale = getEnemyDropRarityChanceScale(
      treasureGoblinGame,
      treasureGoblinGame.enemies['enemy-rarity-scale']!,
    );

    expect(ordinaryScale).toBe(
      ENEMY_ITEM_DUNGEON_RARITY_CHANCE_MULTIPLIER *
        ENEMY_ITEM_BLOOD_MOON_RARITY_CHANCE_MULTIPLIER,
    );
    expect(treasureGoblinScale).toBe(
      ordinaryScale * TREASURE_GOBLIN_ITEM_DROP_MULTIPLIERS.rarityMultiplier,
    );
  });

  it('supports legacy mimic enemy ids without byproduct tags', () => {
    expect(
      isTreasureGoblinLikeEnemyLootSource({
        enemyTypeId: 'mimic',
      }),
    ).toBe(true);
  });

  it('applies treasure goblin item reward multipliers to mimics without applying treasure goblin gold scaling', () => {
    const ordinaryGame =
      combatTestkit.actions.createEncounterGame('mimic-item-rewards');
    const mimicGame =
      combatTestkit.actions.createEncounterGame('mimic-item-rewards');
    const target = { q: 2, r: 0 };

    ENEMY_ITEM_DROP_CHANCES.chance.base = 0.2;
    ENEMY_ITEM_DROP_CHANCES.chance.perRarity = 0;
    ENEMY_ITEM_DROP_CHANCES.chance.max = 1;

    combatTestkit.actions.seedEncounter(ordinaryGame, {
      id: 'ordinary-item-reward-enemy',
      name: 'Wolf',
      enemyTypeId: 'wolf',
      coord: target,
      tier: 4,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
      xp: 5,
      elite: false,
      rarity: 'legendary',
    });
    combatTestkit.actions.seedEncounter(mimicGame, {
      id: 'mimic-item-reward-enemy',
      name: 'Mimic',
      enemyTypeId: 'mimic',
      coord: target,
      tier: 4,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
      xp: 5,
      elite: false,
      rarity: 'legendary',
    });

    const ordinaryLegendary =
      ordinaryGame.enemies['ordinary-item-reward-enemy']!;
    const mimicEnemy = mimicGame.enemies['mimic-item-reward-enemy']!;

    expect(getEnemyItemDropChance(mimicEnemy)).toBe(
      getEnemyItemDropChance(ordinaryLegendary) *
        TREASURE_GOBLIN_ITEM_DROP_MULTIPLIERS.chanceMultiplier,
    );
    expect(getEnemyDropRarityChanceScale(mimicGame, mimicEnemy)).toBe(
      TREASURE_GOBLIN_ITEM_DROP_MULTIPLIERS.rarityMultiplier,
    );
    expect(isTreasureGoblinLikeEnemyLootSource(mimicEnemy)).toBe(true);
    expect(
      isTreasureGoblinLikeEnemyLootSource(ordinaryLegendary),
    ).toBe(false);
  });

  it('multiplies treasure goblin gold quantity after the normal drop succeeds', () => {
    const ordinaryGame = combatTestkit.actions.createEncounterGame(
      'treasure-goblin-gold',
    );
    const treasureGoblinGame = combatTestkit.actions.createEncounterGame(
      'treasure-goblin-gold',
    );
    const target = { q: 2, r: 0 };

    combatTestkit.actions.seedEncounter(ordinaryGame, {
      id: 'enemy-gold',
      name: 'Raider',
      coord: target,
      tier: 4,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
      xp: 5,
      elite: false,
    });
    combatTestkit.actions.seedEncounter(treasureGoblinGame, {
      id: 'enemy-gold',
      name: 'Treasure Goblin',
      enemyTypeId: 'treasure-goblin',
      coord: target,
      tier: 4,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
      xp: 5,
      elite: false,
    });

    ENEMY_GOLD_DROP_CHANCES.base = 1;
    ENEMY_GOLD_DROP_CHANCES.perTier = 0;
    ENEMY_GOLD_DROP_CHANCES.perRarity = 0;
    ENEMY_GOLD_DROP_CHANCES.eliteBonus = 0;
    ENEMY_GOLD_DROP_CHANCES.max = 1;
    ENEMY_ITEM_DROP_CHANCES.chance.base = 0;
    ENEMY_ITEM_DROP_CHANCES.chance.max = 0;
    ENEMY_RECIPE_DROP_CHANCES.base = 0;
    ENEMY_RECIPE_DROP_CHANCES.max = 0;
    HOME_SCROLL_DROP_CHANCES.max = 0;
    GAME_CONFIG.drops.terraformingConsumableChance = 0;

    dropEnemyRewards(ordinaryGame, ordinaryGame.enemies['enemy-gold']!);
    dropEnemyRewards(
      treasureGoblinGame,
      treasureGoblinGame.enemies['enemy-gold']!,
    );

    const ordinaryGoldQuantity =
      getTileAt(ordinaryGame, target).items.find(
        (item) => item.itemKey === 'gold',
      )?.quantity ?? 0;
    const treasureGoblinGoldQuantity =
      getTileAt(treasureGoblinGame, target).items.find(
        (item) => item.itemKey === 'gold',
      )?.quantity ?? 0;

    expect(ordinaryGoldQuantity).toBeGreaterThan(0);
    expect(treasureGoblinGoldQuantity).toBe(
      ordinaryGoldQuantity * TREASURE_GOBLIN_GOLD_MULTIPLIER,
    );
  });

  it('drops lockpicks and chest keys through dedicated forced-chance helpers', () => {
    const game = combatTestkit.actions.createEncounterGame(
      'locked-chest-opener-drops',
    );
    const target = combatTestkit.actions.seedEncounter(game, {
      id: 'enemy-chest-openers',
      name: 'Raider',
      coord: { q: 2, r: 0 },
      tier: 1,
      hp: 1,
      maxHp: 1,
      attack: 0,
      defense: 0,
      xp: 5,
      elite: false,
    });
    const enemy = game.enemies['enemy-chest-openers']!;

    maybeDropLockedChestOpener(game, enemy, {
      itemKey: ItemId.Lockpick,
      chance: 1,
    });
    maybeDropLockedChestOpener(game, enemy, {
      itemKey: ItemId.ChestKey,
      chance: 1,
    });

    expect(getTileAt(game, target).items.map((item) => item.itemKey)).toEqual(
      expect.arrayContaining([ItemId.Lockpick, ItemId.ChestKey]),
    );
  });
});
