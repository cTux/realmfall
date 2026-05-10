import {
  ENEMY_ITEM_BLOOD_MOON_RARITY_CHANCE_MULTIPLIER,
  ENEMY_ITEM_DUNGEON_RARITY_CHANCE_MULTIPLIER,
  ENEMY_ITEM_DROP_CHANCES,
  TREASURE_GOBLIN_ITEM_DROP_MULTIPLIERS,
} from '../config';
import { createRng } from '../random';
import { getConsumableItemKeys, buildItemFromConfig } from '../content/items';
import { ItemId } from '../content/ids';
import { isTreasureGoblinLikeEnemyLootSource } from '../content/enemies';
import { GAME_TAGS } from '../content/tags';
import { enemyRarityIndex } from '../combat';
import { hexKey } from '../hex';
import { makeArmor, makeArtifact, makeOffhand, makeWeapon } from '../world';
import { addEnemyDrop } from './enemyLootDropSink';
import type { Enemy, GameState, ItemRarity } from '../types';

type EnemyItemKind = keyof typeof ENEMY_ITEM_DROP_CHANCES.kindChances;

const hasTreasureGoblinItemRewardMultipliers = (enemy: Enemy) =>
  isTreasureGoblinLikeEnemyLootSource(enemy);

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

export function maybeDropEnemyItem(state: GameState, enemy: Enemy) {
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

function clampChance(chance: number) {
  return Math.max(0, Math.min(1, chance));
}
