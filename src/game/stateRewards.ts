import { t } from '../i18n';
import { Skill } from './types';
import {
  BLOOD_MOON_EXTRA_DROP_CHANCES,
  ENEMY_ITEM_BLOOD_MOON_RARITY_CHANCE_MULTIPLIER,
  ENEMY_ITEM_DUNGEON_RARITY_CHANCE_MULTIPLIER,
  ENEMY_GOLD_DROP_CHANCES,
  ENEMY_ITEM_DROP_CHANCES,
  ENEMY_RECIPE_DROP_CHANCES,
  GATHERING_BYPRODUCT_CHANCES,
  HOME_SCROLL_DROP_CHANCES,
  HOME_SCROLL_ITEM_NAME_KEY,
  pickBloodMoonItemKind,
} from './config';
import { createRng } from './random';
import { itemName } from './content/i18n';
import { buildItemFromConfig, getConsumableItemKeys } from './content/items';
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
import { noise, pickEquipmentRarity } from './shared';
import {
  ensureTileState,
  makeArmor,
  makeArtifact,
  makeOffhand,
  makeWeapon,
  structureDefinition,
} from './world';
import type {
  Enemy,
  GameState,
  GatheringStructureType,
  Item,
  ItemRarity,
} from './types';

type EnemyItemKind = keyof typeof ENEMY_ITEM_DROP_CHANCES.kindChances;

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
      : structure === 'flax'
        ? 'flax'
        : null;
  if (!byproductKind) return null;

  const byproductItemKey =
    byproductKind === 'tree'
      ? ItemId.Sticks
      : byproductKind === 'ore'
        ? ItemId.Stone
        : ItemId.String;

  const rng = createRng(
    `${state.seed}:gather-byproduct:${structure}:${state.turn}:${hexKey(state.player.coord)}`,
  );
  if (
    rng() >=
    (byproductKind === 'tree'
      ? GATHERING_BYPRODUCT_CHANCES.tree
      : byproductKind === 'ore'
        ? GATHERING_BYPRODUCT_CHANCES.ore
        : 1)
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
        : byproductKind === 'ore'
          ? t('game.message.gather.byproduct.stone', {
              item: itemName(ItemId.Stone),
            })
          : t('game.message.gather.byproduct.string', {
              item: itemName(ItemId.String),
            }),
  };
}

export function dropEnemyRewards(state: GameState, enemy: Enemy) {
  maybeDropEnemyGold(state, enemy);
  maybeDropEnemyItem(state, enemy);
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
    const { minimumQuantity, tierScaling, randomRange } =
      ENEMY_GOLD_DROP_CHANCES.boss;
    const quantity = Math.max(
      minimumQuantity,
      enemy.tier * tierScaling + Math.floor(rng() * randomRange),
    );
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

function maybeDropEnemyItem(state: GameState, enemy: Enemy) {
  const chance = Math.min(
    ENEMY_ITEM_DROP_CHANCES.chance.max,
    ENEMY_ITEM_DROP_CHANCES.chance.base +
      enemyRarityIndex(enemy.rarity) * ENEMY_ITEM_DROP_CHANCES.chance.perRarity,
  );
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
      return makeEnemyConsumableDrop(
        state,
        enemy,
        seed,
        tier,
        minimumRarity,
        rng,
        rarityChanceScale,
      );
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
  state: GameState,
  enemy: Enemy,
  seed: string,
  tier: number,
  minimumRarity: ItemRarity,
  rng: () => number,
  rarityChanceScale: number,
) {
  const keys = getConsumableItemKeys();
  const itemKey = keys[Math.floor(rng() * keys.length)] ?? ItemId.Apple;
  const rarity = pickEquipmentRarity(
    `${seed}:consumable-rarity`,
    enemy.coord,
    tier,
    minimumRarity,
    rarityChanceScale,
  );

  return buildItemFromConfig(itemKey, {
    id: `${seed}:consumable:${enemy.id}:${state.turn}`,
    tier,
    rarity,
  });
}

function getEnemyMinimumDropRarity(enemy: Enemy): ItemRarity {
  return enemy.worldBoss ? 'legendary' : (enemy.rarity ?? 'common');
}

function addEnemyDrop(state: GameState, enemy: Enemy, item: Item) {
  ensureTileState(state, enemy.coord);
  const key = hexKey(enemy.coord);
  const tile = state.tiles[key];
  addItemToInventory(tile.items, item);
  state.tiles[key] = { ...tile, items: [...tile.items] };
  addLog(
    state,
    'loot',
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
  const BLOOD_MOON_ITEM_DROP_MINIMUM_TIER_BONUS = 1;
  const BLOOD_MOON_ITEM_DROP_RARITY_STEP = 2;
  const baseTier = Math.max(
    1,
    enemy.tier +
      Math.max(
        BLOOD_MOON_ITEM_DROP_MINIMUM_TIER_BONUS,
        Math.floor(rarityRank / BLOOD_MOON_ITEM_DROP_RARITY_STEP),
      ),
  );
  const minimumRarity = enemy.worldBoss
    ? 'legendary'
    : rarityRank >= 2
      ? 'epic'
      : 'rare';
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
  const SKINNED_ANIMAL_MINIMUM_QUANTITY = 1;
  const SKINNED_ANIMAL_TIER_DIVISOR = 2;
  const SKINNED_ANIMAL_BLOOD_MOON_BONUS = 1;
  const quantity = Math.max(
    SKINNED_ANIMAL_MINIMUM_QUANTITY,
    Math.ceil(enemy.tier / SKINNED_ANIMAL_TIER_DIVISOR) +
      (state.bloodMoonActive ? SKINNED_ANIMAL_BLOOD_MOON_BONUS : 0),
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

function getEnemyDropRarityChanceScale(state: GameState, enemy: Enemy) {
  const tile = state.tiles[hexKey(enemy.coord)];
  const dungeonMultiplier =
    tile?.structure === 'dungeon'
      ? ENEMY_ITEM_DUNGEON_RARITY_CHANCE_MULTIPLIER
      : 1;
  const bloodMoonMultiplier = state.bloodMoonActive
    ? ENEMY_ITEM_BLOOD_MOON_RARITY_CHANCE_MULTIPLIER
    : 1;
  return dungeonMultiplier * bloodMoonMultiplier;
}
