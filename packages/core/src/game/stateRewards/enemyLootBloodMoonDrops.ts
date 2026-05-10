import {
  BLOOD_MOON_EXTRA_DROP_CHANCES,
  ENEMY_ITEM_DROP_CHANCES,
  pickBloodMoonItemKind,
} from '../config';
import { createRng } from '../random';
import { noise } from '../shared';
import { enemyRarityIndex } from '../combat';
import { makeArmor, makeArtifact, makeOffhand, makeWeapon } from '../world';
import { t } from '../../i18n';
import { addLog } from '../logs';
import { addEnemyDrops } from './enemyLootDropSink';
import { type Enemy, type GameState, type ItemRarity } from '../types';
import { getEnemyDropRarityChanceScale } from './enemyLootItemDrops';

export function maybeDropBloodMoonLoot(state: GameState, enemy: Enemy) {
  if (!state.bloodMoonActive && !enemy.worldBoss) return;

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
  const drops = [
    {
      item: makeBloodMoonDrop(
        state,
        enemy,
        0,
        baseTier,
        minimumRarity,
        rarityChanceScale,
      ),
      suppressLog: true,
    },
  ];

  const rng = createRng(
    `${state.seed}:blood-moon-loot:${enemy.id}:${state.turn}`,
  );
  if (enemy.worldBoss) {
    drops.push({
      item: makeBloodMoonDrop(
        state,
        enemy,
        1,
        baseTier + 1,
        'legendary',
        rarityChanceScale,
      ),
      suppressLog: true,
    });
  } else if (
    rarityRank >= 2 ||
    rng() <
      BLOOD_MOON_EXTRA_DROP_CHANCES.base +
        rarityRank * BLOOD_MOON_EXTRA_DROP_CHANCES.perRarity
  ) {
    drops.push({
      item: makeBloodMoonDrop(
        state,
        enemy,
        1,
        baseTier + 1,
        minimumRarity,
        rarityChanceScale,
      ),
      suppressLog: true,
    });
  }

  addEnemyDrops(state, enemy, drops);

  addLog(
    state,
    'loot',
    t('game.message.enemyDrop.bloodMoon', { enemy: enemy.name }),
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
