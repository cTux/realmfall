import { t } from '../i18n';
import { Skill } from './types';
import {
  BLOOD_MOON_EXTRA_DROP_CHANCES,
  ENEMY_GOLD_DROP_CHANCES,
  ENEMY_RECIPE_DROP_CHANCES,
  GATHERING_BYPRODUCT_CHANCES,
  HOME_SCROLL_DROP_CHANCES,
  HOME_SCROLL_ITEM_NAME_KEY,
  pickBloodMoonItemKind,
} from './config';
import { createRng } from './random';
import { itemName } from './content/i18n';
import { buildItemFromConfig, getItemConfigByKey } from './content/items';
import { ItemId } from './content/ids';
import { getStructureConfig } from './content/structures';
import { GAME_TAGS } from './content/tags';
import { enemyRarityIndex, isAnimalEnemy } from './combat';
import { RECIPE_BOOK_RECIPES } from './crafting';
import { hexKey } from './hex';
import { addLog } from './logs';
import {
  addItemToInventory,
  describeItemStack,
  makeGoldStack,
  makeHomeScroll,
  makeRecipePage,
  makeResourceStack,
} from './inventory';
import { gainSkillXp } from './progression';
import { noise } from './shared';
import {
  ensureTileState,
  makeArmor,
  makeArtifact,
  makeOffhand,
  makeWeapon,
  structureDefinition,
} from './world';
import type { Enemy, GameState, GatheringStructureType, Item } from './types';

type GatheringDefinition = ReturnType<typeof structureDefinition>;

export function buildGatheringRewards(
  state: GameState,
  structure: GatheringStructureType,
  definition: GatheringDefinition,
  quantity: number,
) {
  if (!definition.rewardTable || definition.rewardTable.length === 0) {
    return [
      makeResourceStack(
        definition.rewardItemKey,
        definition.rewardTier,
        quantity,
      ),
    ];
  }

  const counts = new Map<string, { tier: number; quantity: number }>();
  for (let index = 0; index < quantity; index += 1) {
    const reward = pickGatheringReward(state, structure, definition, index);
    const key = reward.itemKey;
    const current = counts.get(key) ?? {
      tier: reward.rewardTier ?? definition.rewardTier,
      quantity: 0,
    };
    counts.set(key, {
      tier: current.tier,
      quantity: current.quantity + (reward.quantity ?? 1),
    });
  }

  return [...counts.entries()].map(([itemKey, reward]) =>
    makeResourceStack(itemKey, reward.tier, reward.quantity),
  );
}

export function describeItemStacks(items: Item[]) {
  if (items.length === 1) return describeItemStack(items[0]!);
  return items.map(describeItemStack).join(', ');
}

export function maybeGatherByproduct(
  state: GameState,
  structure: GatheringStructureType,
  definition: GatheringDefinition,
) {
  const structureTags = getStructureConfig(structure).tags ?? [];
  const byproductKind = structureTags.includes(GAME_TAGS.structure.tree)
    ? 'tree'
    : structureTags.includes(GAME_TAGS.structure.ore)
      ? 'ore'
      : null;
  if (!byproductKind) return null;

  const byproductItemKey =
    byproductKind === 'tree' ? ItemId.Sticks : ItemId.Stone;

  const rng = createRng(
    `${state.seed}:gather-byproduct:${structure}:${state.turn}:${hexKey(state.player.coord)}`,
  );
  if (
    rng() >=
    (byproductKind === 'tree'
      ? GATHERING_BYPRODUCT_CHANCES.tree
      : GATHERING_BYPRODUCT_CHANCES.ore)
  ) {
    return null;
  }

  return {
    item: makeResourceStack(byproductItemKey, definition.rewardTier, 1),
    text:
      byproductKind === 'tree'
        ? t('game.message.gather.byproduct.sticks', {
            item: itemName(ItemId.Sticks),
          })
        : t('game.message.gather.byproduct.stone', {
            item: itemName(ItemId.Stone),
          }),
  };
}

export function dropEnemyRewards(state: GameState, enemy: Enemy) {
  maybeDropEnemyGold(state, enemy);
  maybeDropEnemyConsumables(state, enemy);
  maybeDropEnemyRecipe(state, enemy);
  maybeDropHomeScroll(state, enemy);
  maybeDropBloodMoonLoot(state, enemy);
  maybeSkinEnemy(state, enemy);
}

function pickGatheringReward(
  state: GameState,
  structure: GatheringStructureType,
  definition: GatheringDefinition,
  rollIndex: number,
) {
  const table = definition.rewardTable;
  if (!table || table.length === 0) {
    return {
      itemKey: definition.rewardItemKey,
      rewardTier: definition.rewardTier,
      quantity: 1,
    };
  }

  const totalWeight = table.reduce((sum, entry) => sum + entry.weight, 0);
  const rng = createRng(
    `${state.seed}:gather-reward:${structure}:${state.turn}:${hexKey(state.player.coord)}:${rollIndex}`,
  );
  let remaining = rng() * totalWeight;
  for (const entry of table) {
    remaining -= entry.weight;
    if (remaining <= 0) return entry;
  }
  return table[table.length - 1]!;
}

function maybeDropEnemyGold(state: GameState, enemy: Enemy) {
  const rng = createRng(`${state.seed}:enemy-gold:${enemy.id}:${state.turn}`);
  const rarityRank = enemyRarityIndex(enemy.rarity);
  if (enemy.worldBoss) {
    const quantity = Math.max(40, enemy.tier * 12 + Math.floor(rng() * 40));
    ensureTileState(state, enemy.coord);
    const key = hexKey(enemy.coord);
    const tile = state.tiles[key];
    addItemToInventory(tile.items, makeGoldStack(quantity));
    state.tiles[key] = { ...tile, items: [...tile.items] };
    addLog(
      state,
      'loot',
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
    1,
    Math.floor(enemy.tier + rarityRank + rng() * (5 + rarityRank * 2)),
  );
  const bloodMoonQuantity = state.bloodMoonActive
    ? Math.max(quantity + enemy.tier, Math.ceil(quantity * 2.5))
    : quantity;
  ensureTileState(state, enemy.coord);
  const key = hexKey(enemy.coord);
  const tile = state.tiles[key];
  addItemToInventory(tile.items, makeGoldStack(bloodMoonQuantity));
  state.tiles[key] = { ...tile, items: [...tile.items] };
  addLog(
    state,
    'loot',
    t('game.message.enemyDrop.gold', {
      enemy: enemy.name,
      amount: bloodMoonQuantity,
    }),
  );
}

function maybeDropEnemyConsumables(state: GameState, enemy: Enemy) {
  const dropKeys = [
    ItemId.Apple,
    ItemId.WaterFlask,
    ItemId.HealthPotion,
    ItemId.ManaPotion,
  ] as const;

  dropKeys.forEach((itemKey) => {
    const configured = getItemConfigByKey(itemKey);
    const chance = Math.min(
      0.92,
      (configured?.dropChance ?? 0) + enemyRarityIndex(enemy.rarity) * 0.04,
    );
    if (chance <= 0) return;

    const rng = createRng(
      `${state.seed}:enemy-consumable:${itemKey}:${enemy.id}:${state.turn}`,
    );
    if (rng() >= chance) return;

    ensureTileState(state, enemy.coord);
    const key = hexKey(enemy.coord);
    const tile = state.tiles[key];
    addItemToInventory(
      tile.items,
      buildItemFromConfig(itemKey, {
        id: `${itemKey}:${enemy.id}:${state.turn}`,
      }),
    );
    state.tiles[key] = { ...tile, items: [...tile.items] };
    addLog(
      state,
      'loot',
      t('game.message.enemyDrop.item', {
        enemy: enemy.name,
        item: configured?.name ?? itemKey,
      }),
    );
  });
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
  ensureTileState(state, enemy.coord);
  const key = hexKey(enemy.coord);
  const tile = state.tiles[key];
  addItemToInventory(tile.items, makeRecipePage(recipe));
  state.tiles[key] = { ...tile, items: [...tile.items] };
  addLog(
    state,
    'loot',
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

  ensureTileState(state, enemy.coord);
  const key = hexKey(enemy.coord);
  const tile = state.tiles[key];
  addItemToInventory(
    tile.items,
    makeHomeScroll(`home-scroll:${enemy.id}:${state.turn}`),
  );
  state.tiles[key] = { ...tile, items: [...tile.items] };
  addLog(
    state,
    'loot',
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
    enemy.tier + Math.max(1, Math.floor(rarityRank / 2)),
  );
  const minimumRarity = enemy.worldBoss
    ? 'legendary'
    : rarityRank >= 2
      ? 'epic'
      : 'rare';
  addItemToInventory(
    tile.items,
    makeBloodMoonDrop(state, enemy, 0, baseTier, minimumRarity),
  );

  const rng = createRng(
    `${state.seed}:blood-moon-loot:${enemy.id}:${state.turn}`,
  );
  if (enemy.worldBoss) {
    addItemToInventory(
      tile.items,
      makeBloodMoonDrop(state, enemy, 1, baseTier + 1, 'legendary'),
    );
  } else if (
    rarityRank >= 2 ||
    rng() <
      BLOOD_MOON_EXTRA_DROP_CHANCES.base +
        rarityRank * BLOOD_MOON_EXTRA_DROP_CHANCES.perRarity
  ) {
    addItemToInventory(
      tile.items,
      makeBloodMoonDrop(state, enemy, 1, baseTier + 1, minimumRarity),
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
    1,
    Math.ceil(enemy.tier / 2) + (state.bloodMoonActive ? 1 : 0),
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
  minimumRarity: 'rare' | 'epic' | 'legendary',
) {
  const coord = enemy.coord;
  const seed = `${state.seed}:blood-moon-drop:${enemy.id}:${state.turn}:${index}`;
  switch (pickBloodMoonItemKind(noise(`${seed}:roll`, coord))) {
    case 'artifact':
      return makeArtifact(seed, coord, tier, minimumRarity);
    case 'weapon':
      return makeWeapon(seed, coord, tier, minimumRarity);
    case 'offhand':
      return makeOffhand(seed, coord, tier, minimumRarity);
    default:
      return makeArmor(seed, coord, tier, minimumRarity);
  }
}
