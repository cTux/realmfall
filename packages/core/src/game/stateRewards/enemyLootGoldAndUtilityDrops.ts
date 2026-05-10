import { ItemId } from '../content/ids';
import { TERRAFORMING_CONSUMABLE_ITEM_KEYS } from '../content/items/terraformingConsumables';
import { RECIPE_BOOK_RECIPES } from '../crafting';
import { makeRecipePage } from '../craftingOutputs';
import { createRng } from '../random';
import {
  ENEMY_RECIPE_DROP_CHANCES,
  ENEMY_GOLD_DROP_CHANCES,
  GAME_CONFIG,
  HOME_SCROLL_DROP_CHANCES,
  HOME_SCROLL_ITEM_NAME_KEY,
  TREASURE_GOBLIN_GOLD_MULTIPLIER,
} from '../config';
import { enemyRarityIndex } from '../combat';
import { buildItemFromConfig } from '../content/items';
import { t } from '../../i18n';
import { isTreasureGoblinEnemy } from '../stateCombatTreasureGoblin';
import { makeGoldStack, makeHomeScroll } from '../inventory';
import { addEnemyDrop } from './enemyLootDropSink';
import { type Enemy, type GameState } from '../types';

export function maybeDropEnemyGold(state: GameState, enemy: Enemy) {
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
        quantity + enemy.tier * ENEMY_GOLD_DROP_CHANCES.bloodMoonMultiplier.tierWeight,
        Math.ceil(quantity * ENEMY_GOLD_DROP_CHANCES.bloodMoonMultiplier.quantity),
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

export function maybeDropTerraformingConsumable(state: GameState, enemy: Enemy) {
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

export function maybeDropEnemyRecipe(state: GameState, enemy: Enemy) {
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

export function maybeDropHomeScroll(state: GameState, enemy: Enemy) {
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
