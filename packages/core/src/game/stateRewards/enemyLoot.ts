import { ItemId } from '../content/ids';
import { CHEST_KEY_DROP_CHANCE, LOCKPICK_DROP_CHANCE } from '../lockedChests';
import type { Enemy, GameState } from '../types';
import {
  maybeDropEnemyGold,
  maybeDropEnemyRecipe,
  maybeDropHomeScroll,
  maybeDropLockedChestOpener,
  maybeDropTerraformingConsumable,
} from './enemyLootGoldAndUtilityDrops';
import { maybeDropBloodMoonLoot } from './enemyLootBloodMoonDrops';
import {
  getEnemyDropRarityChanceScale,
  getEnemyItemDropChance,
  maybeDropEnemyItem,
} from './enemyLootItemDrops';
import { maybeSkinEnemy } from './enemyLootSkinning';

type EnemyLootHandler = (state: GameState, enemy: Enemy) => void;

type EnemyLootLockedChestDrop = {
  itemKey: ItemId.Lockpick | ItemId.ChestKey;
  chance: number;
};

type EnemyRewardStep = EnemyLootHandler | EnemyLootLockedChestDrop;

const ENEMY_REWARD_STEPS: EnemyRewardStep[] = [
  maybeDropEnemyGold,
  maybeDropEnemyItem,
  { itemKey: ItemId.Lockpick, chance: LOCKPICK_DROP_CHANCE },
  { itemKey: ItemId.ChestKey, chance: CHEST_KEY_DROP_CHANCE },
  maybeDropTerraformingConsumable,
  maybeDropEnemyRecipe,
  maybeDropHomeScroll,
  maybeDropBloodMoonLoot,
  maybeSkinEnemy,
];

export function dropEnemyRewards(state: GameState, enemy: Enemy) {
  for (const step of ENEMY_REWARD_STEPS) {
    if (typeof step === 'function') {
      step(state, enemy);
      continue;
    }

    maybeDropLockedChestOpener(state, enemy, step);
  }
}

export {
  getEnemyDropRarityChanceScale,
  getEnemyItemDropChance,
  maybeDropLockedChestOpener,
};
