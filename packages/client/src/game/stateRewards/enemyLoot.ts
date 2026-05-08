import { t } from '../../i18n';
import {
  BLOOD_MOON_EXTRA_DROP_CHANCES,
  ENEMY_GOLD_DROP_CHANCES,
  ENEMY_ITEM_BLOOD_MOON_RARITY_CHANCE_MULTIPLIER,
  ENEMY_ITEM_DROP_CHANCES,
  ENEMY_ITEM_DUNGEON_RARITY_CHANCE_MULTIPLIER,
  ENEMY_RECIPE_DROP_CHANCES,
  GAME_CONFIG,
  HOME_SCROLL_DROP_CHANCES,
  HOME_SCROLL_ITEM_NAME_KEY,
  TREASURE_GOBLIN_GOLD_MULTIPLIER,
  TREASURE_GOBLIN_ITEM_DROP_MULTIPLIERS,
  pickBloodMoonItemKind,
} from '../config';
import { createRng } from '../random';
import { itemName } from '../content/i18n';
import { ItemId } from '../content/ids';
import { buildItemFromConfig, getConsumableItemKeys } from '../content/items';
import { isTreasureGoblinLikeEnemyLootSource } from '../content/enemies';
import { TERRAFORMING_CONSUMABLE_ITEM_KEYS } from '../content/items/terraformingConsumables';
import { GAME_TAGS } from '../content/tags';
import { enemyRarityIndex, isAnimalEnemy } from '../combat';
import { RECIPE_BOOK_RECIPES } from '../crafting';
import { makeRecipePage } from '../craftingOutputs';
import { hexKey } from '../hex';
import { CHEST_KEY_DROP_CHANCE, LOCKPICK_DROP_CHANCE } from '../lockedChests';
import { addLog } from '../logs';
import {
  addItemToInventory,
  makeGoldStack,
  makeHomeScroll,
  makeResourceStack,
} from '../inventory';
import { gainSkillXp } from '../progression';
import { noise } from '../shared';
import { isTreasureGoblinEnemy } from '../stateCombatTreasureGoblin';
import {
  ensureTileState,
  makeArmor,
  makeArtifact,
  makeOffhand,
  makeWeapon,
} from '../world';
import {
  Skill,
  type Enemy,
  type GameState,
  type Item,
  type ItemRarity,
} from '../types';

type EnemyItemKind = keyof typeof ENEMY_ITEM_DROP_CHANCES.kindChances;

export function dropEnemyRewards(state: GameState, enemy: Enemy) {
  maybeDropEnemyGold(state, enemy);
  maybeDropEnemyItem(state, enemy);
  maybeDropLockedChestOpener(state, enemy, {
    itemKey: ItemId.Lockpick,
    chance: LOCKPICK_DROP_CHANCE,
  });
  maybeDropLockedChestOpener(state, enemy, {
    itemKey: ItemId.ChestKey,
    chance: CHEST_KEY_DROP_CHANCE,
  });
  maybeDropTerraformingConsumable(state, enemy);
  maybeDropEnemyRecipe(state, enemy);
  maybeDropHomeScroll(state, enemy);
  maybeDropBloodMoonLoot(state, enemy);
  maybeSkinEnemy(state, enemy);
}

export function maybeDropLockedChestOpener(
  state: GameState,
  enemy: Enemy,
  {
    itemKey,
    chance,
  }: {
    itemKey: ItemId.Lockpick | ItemId.ChestKey;
    chance: number;
  },
) {
  if (chance <= 0) return;

  const rng = createRng(
    `${state.seed}:enemy:${itemKey}:${enemy.id}:${state.turn}`,
  );
  if (rng() >= chance) return;

  addEnemyDrop(
    state,
    enemy,
    buildItemFromConfig(itemKey, {
      id: `${itemKey}:${enemy.id}:${state.turn}`,
    }),
  );
}

export function getEnemyItemDropChance(enemy: Enemy) {
  const baseChance = Math.min(
    ENEMY_ITEM_DROP_CHANCES.chance.max,
    ENEMY_ITEM_DROP_CHANCES.chance.base +
      enemyRarityIndex(enemy.rarity) * ENEMY_ITEM_DROP_CHANCES.chance.perRarity,
  );
  return clampChance(
    baseChance *
      (hasTreasureGoblinItemRewardMultipliers(enemy)
        ? TREASURE_GOBLIN_ITEM_DROP_MULTIPLIERS.chanceMultiplier
        : 1),
  );
}

export function getEnemyDropRarityChanceScale(state: GameState, enemy: Enemy) {
  const tile = state.tiles[hexKey(enemy.coord)];
  const dungeonMultiplier =
    enemy.tags?.includes(GAME_TAGS.enemy.dungeon) ||
    tile?.structure === 'dungeon'
      ? ENEMY_ITEM_DUNGEON_RARITY_CHANCE_MULTIPLIER
      : 1;
  const bloodMoonMultiplier = state.bloodMoonActive
    ? ENEMY_ITEM_BLOOD_MOON_RARITY_CHANCE_MULTIPLIER
    : 1;
  const treasureGoblinMultiplier = hasTreasureGoblinItemRewardMultipliers(enemy)
    ? TREASURE_GOBLIN_ITEM_DROP_MULTIPLIERS.rarityMultiplier
    : 1;
  return dungeonMultiplier * bloodMoonMultiplier * treasureGoblinMultiplier;
}

function maybeDropEnemyGold(state: GameState, enemy: Enemy) {
  const rng = createRng(`${state.seed}:enemy-gold:${enemy.id}:${state.turn}`);
  const rarityRank = enemyRarityIndex(enemy.rarity);
  if (enemy.worldBoss) {
    const { minimumQuantity, tierScaling, randomRange } =
      ENEMY_GOLD_DROP_CHANCES.boss;
    const quantity = Math.max(
      minimumQuantity,
      enemy.tier * tierScaling + Math.floor(rng() * randomRange),
    );
    addEnemyDrop(
      state,
      enemy,
      makeGoldStack(quantity),
      t('game.message.enemyDrop.gold', {
        enemy: enemy.name,
        amount: quantity,
      }),
    );
    return;
  }

  const chance = state.bloodMoonActive
    ? ENEMY_GOLD_DROP_CHANCES.bloodMoon
    : Math.min(
        ENEMY_GOLD_DROP_CHANCES.max,
        ENEMY_GOLD_DROP_CHANCES.base +
          enemy.tier * ENEMY_GOLD_DROP_CHANCES.perTier +
          rarityRank * ENEMY_GOLD_DROP_CHANCES.perRarity +
          (enemy.elite ? ENEMY_GOLD_DROP_CHANCES.eliteBonus : 0),
      );
  if (rng() > chance) return;

  const quantity = Math.max(
    ENEMY_GOLD_DROP_CHANCES.quantity.minimum,
    Math.floor(
      enemy.tier * ENEMY_GOLD_DROP_CHANCES.quantity.tierWeight +
        rarityRank * ENEMY_GOLD_DROP_CHANCES.quantity.rarityWeight +
        rng() *
          (ENEMY_GOLD_DROP_CHANCES.quantity.randomBase +
            rarityRank * ENEMY_GOLD_DROP_CHANCES.quantity.randomRarityWeight),
    ),
  );
  const bloodMoonQuantity = state.bloodMoonActive
    ? Math.max(
        quantity +
          enemy.tier * ENEMY_GOLD_DROP_CHANCES.bloodMoonMultiplier.tierWeight,
        Math.ceil(
          quantity * ENEMY_GOLD_DROP_CHANCES.bloodMoonMultiplier.quantity,
        ),
      )
    : quantity;
  const finalQuantity = isTreasureGoblinEnemy(enemy)
    ? bloodMoonQuantity * TREASURE_GOBLIN_GOLD_MULTIPLIER
    : bloodMoonQuantity;

  addEnemyDrop(
    state,
    enemy,
    makeGoldStack(finalQuantity),
    t('game.message.enemyDrop.gold', {
      enemy: enemy.name,
      amount: finalQuantity,
    }),
  );
}

function maybeDropEnemyItem(state: GameState, enemy: Enemy) {
  const chance = getEnemyItemDropChance(enemy);
  const rarityChanceScale = getEnemyDropRarityChanceScale(state, enemy);
  const rng = createRng(`${state.seed}:enemy-item:${enemy.id}:${state.turn}`);
  if (rng() >= chance) return;

  const sortedKinds = getSortedEnemyItemKinds();
  for (const [kind, kindChance] of sortedKinds) {
    if (rng() >= clampChance(kindChance)) continue;
    const drop = makeEnemyDrop(state, enemy, kind, rng, rarityChanceScale);
    if (!drop) continue;
    addEnemyDrop(state, enemy, drop);
  }
}

function maybeDropTerraformingConsumable(state: GameState, enemy: Enemy) {
  const chance = GAME_CONFIG.drops.terraformingConsumableChance;
  if (chance <= 0) return;
  const rng = createRng(
    `${state.seed}:enemy-terraforming-consumable:${enemy.id}:${state.turn}`,
  );
  if (rng() >= chance) return;
  if (TERRAFORMING_CONSUMABLE_ITEM_KEYS.length === 0) return;

  const index = Math.floor(rng() * TERRAFORMING_CONSUMABLE_ITEM_KEYS.length);
  const itemKey = TERRAFORMING_CONSUMABLE_ITEM_KEYS[index];
  if (!itemKey) return;

  const item = buildItemFromConfig(itemKey, {
    id: `${state.seed}:enemy-terraforming-consumable:${enemy.id}:${state.turn}`,
    rarity: 'common',
    tier: 1,
  });
  addEnemyDrop(state, enemy, item);
}

function makeEnemyDrop(
  state: GameState,
  enemy: Enemy,
  kind: EnemyItemKind,
  rng: () => number,
  rarityChanceScale: number,
) {
  const minimumRarity = getEnemyMinimumDropRarity(enemy);
  const tier = Math.max(1, enemy.tier);
  const seed = `${state.seed}:enemy-item:${enemy.id}:${state.turn}:${kind}`;

  switch (kind) {
    case 'artifact':
      return makeArtifact(
        seed,
        enemy.coord,
        tier,
        minimumRarity,
        rarityChanceScale,
      );
    case 'weapon':
      return makeWeapon(
        seed,
        enemy.coord,
        tier,
        minimumRarity,
        rarityChanceScale,
      );
    case 'offhand':
      return makeOffhand(
        seed,
        enemy.coord,
        tier,
        minimumRarity,
        rarityChanceScale,
      );
    case 'armor':
      return makeArmor(
        seed,
        enemy.coord,
        tier,
        minimumRarity,
        rarityChanceScale,
      );
    default:
      return makeEnemyConsumableDrop(enemy, seed, tier, state.turn, rng);
  }
}

function getSortedEnemyItemKinds() {
  return (
    Object.entries(ENEMY_ITEM_DROP_CHANCES.kindChances) as Array<
      [EnemyItemKind, number]
    >
  ).sort(([kindA, chanceA], [kindB, chanceB]) => {
    const chanceDelta = chanceA - chanceB;
    return chanceDelta === 0 ? kindA.localeCompare(kindB) : chanceDelta;
  });
}

function makeEnemyConsumableDrop(
  enemy: Enemy,
  seed: string,
  tier: number,
  turn: number,
  rng: () => number,
) {
  const keys = getConsumableItemKeys();
  const itemKey = keys[Math.floor(rng() * keys.length)] ?? ItemId.Apple;

  return buildItemFromConfig(itemKey, {
    id: `${seed}:consumable:${enemy.id}:${turn}`,
    tier,
  });
}

function getEnemyMinimumDropRarity(enemy: Enemy): ItemRarity {
  return enemy.worldBoss ? 'legendary' : 'common';
}

function addEnemyDrop(
  state: GameState,
  enemy: Enemy,
  item: Item,
  logText?: string,
) {
  ensureTileState(state, enemy.coord);
  const key = hexKey(enemy.coord);
  const tile = state.tiles[key];
  addItemToInventory(tile.items, item);
  state.tiles[key] = { ...tile, items: [...tile.items] };
  addLog(
    state,
    'loot',
    logText ??
      t('game.message.enemyDrop.item', {
        enemy: enemy.name,
        item: item.name,
      }),
  );
}

function clampChance(chance: number) {
  return Math.max(0, Math.min(1, chance));
}

function maybeDropEnemyRecipe(state: GameState, enemy: Enemy) {
  const unlearnedRecipes = RECIPE_BOOK_RECIPES.filter(
    (recipe) => !state.player.learnedRecipeIds.includes(recipe.id),
  );
  if (unlearnedRecipes.length === 0) return;

  const rng = createRng(`${state.seed}:enemy-recipe:${enemy.id}:${state.turn}`);
  const rarityRank = enemyRarityIndex(enemy.rarity);
  const baseChance = Math.min(
    ENEMY_RECIPE_DROP_CHANCES.max,
    ENEMY_RECIPE_DROP_CHANCES.base +
      enemy.tier * ENEMY_RECIPE_DROP_CHANCES.perTier +
      rarityRank * ENEMY_RECIPE_DROP_CHANCES.perRarity,
  );
  const chance = state.bloodMoonActive
    ? Math.min(
        ENEMY_RECIPE_DROP_CHANCES.bloodMoonMax,
        baseChance + ENEMY_RECIPE_DROP_CHANCES.bloodMoonBonus,
      )
    : baseChance;
  if (rng() >= chance) return;

  const recipe = unlearnedRecipes[Math.floor(rng() * unlearnedRecipes.length)];
  if (!recipe) return;

  addEnemyDrop(
    state,
    enemy,
    makeRecipePage(recipe),
    t('game.message.enemyDrop.recipe', {
      enemy: enemy.name,
      recipe: recipe.name,
    }),
  );
}

function maybeDropHomeScroll(state: GameState, enemy: Enemy) {
  const rng = createRng(
    `${state.seed}:enemy-home-scroll:${enemy.id}:${state.turn}`,
  );
  if (
    rng() >=
    Math.min(
      HOME_SCROLL_DROP_CHANCES.max,
      HOME_SCROLL_DROP_CHANCES.base +
        enemyRarityIndex(enemy.rarity) * HOME_SCROLL_DROP_CHANCES.perRarity,
    )
  ) {
    return;
  }

  addEnemyDrop(
    state,
    enemy,
    makeHomeScroll(`home-scroll:${enemy.id}:${state.turn}`),
    t('game.message.enemyDrop.item', {
      enemy: enemy.name,
      item: t(HOME_SCROLL_ITEM_NAME_KEY),
    }),
  );
}

function maybeDropBloodMoonLoot(state: GameState, enemy: Enemy) {
  if (!state.bloodMoonActive && !enemy.worldBoss) return;

  ensureTileState(state, enemy.coord);
  const key = hexKey(enemy.coord);
  const tile = state.tiles[key];
  const rarityRank = enemyRarityIndex(enemy.rarity);
  const baseTier = Math.max(
    1,
    enemy.tier +
      Math.max(
        ENEMY_ITEM_DROP_CHANCES.bonuses.bloodMoon.minimumTierBonus,
        Math.floor(
          rarityRank / ENEMY_ITEM_DROP_CHANCES.bonuses.bloodMoon.rarityStep,
        ),
      ),
  );
  const minimumRarity = enemy.worldBoss ? 'legendary' : 'common';
  const rarityChanceScale = getEnemyDropRarityChanceScale(state, enemy);
  addItemToInventory(
    tile.items,
    makeBloodMoonDrop(
      state,
      enemy,
      0,
      baseTier,
      minimumRarity,
      rarityChanceScale,
    ),
  );

  const rng = createRng(
    `${state.seed}:blood-moon-loot:${enemy.id}:${state.turn}`,
  );
  if (enemy.worldBoss) {
    addItemToInventory(
      tile.items,
      makeBloodMoonDrop(
        state,
        enemy,
        1,
        baseTier + 1,
        'legendary',
        rarityChanceScale,
      ),
    );
  } else if (
    rarityRank >= 2 ||
    rng() <
      BLOOD_MOON_EXTRA_DROP_CHANCES.base +
        rarityRank * BLOOD_MOON_EXTRA_DROP_CHANCES.perRarity
  ) {
    addItemToInventory(
      tile.items,
      makeBloodMoonDrop(
        state,
        enemy,
        1,
        baseTier + 1,
        minimumRarity,
        rarityChanceScale,
      ),
    );
  }

  state.tiles[key] = { ...tile, items: [...tile.items] };
  addLog(
    state,
    'loot',
    t('game.message.enemyDrop.bloodMoon', { enemy: enemy.name }),
  );
}

function maybeSkinEnemy(state: GameState, enemy: Enemy) {
  if (!isAnimalEnemy(enemy)) return;

  ensureTileState(state, enemy.coord);
  const key = hexKey(enemy.coord);
  const tile = state.tiles[key];
  const quantity = Math.max(
    ENEMY_ITEM_DROP_CHANCES.bonuses.skinnedAnimal.minimum,
    Math.ceil(
      enemy.tier / ENEMY_ITEM_DROP_CHANCES.bonuses.skinnedAnimal.tierDivisor,
    ) +
      (state.bloodMoonActive
        ? ENEMY_ITEM_DROP_CHANCES.bonuses.skinnedAnimal.bloodMoonBonus
        : 0),
  );
  addItemToInventory(
    tile.items,
    makeResourceStack(ItemId.LeatherScraps, enemy.tier, quantity),
  );
  addItemToInventory(
    tile.items,
    makeResourceStack('meat', enemy.tier, quantity),
  );
  state.tiles[key] = { ...tile, items: [...tile.items] };
  gainSkillXp(state, Skill.Skinning, quantity, addLog);
  addLog(
    state,
    'loot',
    t('game.message.skinning.success', {
      enemy: enemy.name,
      quantity,
      item: itemName('leather-scraps'),
    }),
  );
  addLog(
    state,
    'loot',
    t('game.message.skinning.meat', {
      enemy: enemy.name,
      quantity,
      item: itemName('meat'),
    }),
  );
}

function makeBloodMoonDrop(
  state: GameState,
  enemy: Enemy,
  index: number,
  tier: number,
  minimumRarity: ItemRarity,
  rarityChanceScale: number,
) {
  const coord = enemy.coord;
  const seed = `${state.seed}:blood-moon-drop:${enemy.id}:${state.turn}:${index}`;
  switch (pickBloodMoonItemKind(noise(`${seed}:roll`, coord))) {
    case 'artifact':
      return makeArtifact(seed, coord, tier, minimumRarity, rarityChanceScale);
    case 'weapon':
      return makeWeapon(seed, coord, tier, minimumRarity, rarityChanceScale);
    case 'offhand':
      return makeOffhand(seed, coord, tier, minimumRarity, rarityChanceScale);
    default:
      return makeArmor(seed, coord, tier, minimumRarity, rarityChanceScale);
  }
}

function hasTreasureGoblinItemRewardMultipliers(enemy: Enemy) {
  return isTreasureGoblinLikeEnemyLootSource(enemy);
}
