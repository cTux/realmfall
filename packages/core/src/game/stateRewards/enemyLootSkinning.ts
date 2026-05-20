import { ENEMY_ITEM_DROP_CHANCES } from '../config';
import { ItemId } from '../content/ids';
import { itemName } from '../content/i18n';
import { isAnimalEnemy } from '../combat';
import { makeResourceStack } from '../inventory';
import { gainSkillXp } from '../progression';
import { t } from '../../i18n';
import { Skill } from '../types';
import type { Enemy, GameState } from '../types';
import { addLog } from '../logs';
import { addEnemyDrops } from './enemyLootDropSink';

export function maybeSkinEnemy(state: GameState, enemy: Enemy) {
  if (!isAnimalEnemy(enemy)) return;

  const quantity = Math.max(
    ENEMY_ITEM_DROP_CHANCES.bonuses.skinnedAnimal.minimum,
    Math.ceil(
      enemy.tier / ENEMY_ITEM_DROP_CHANCES.bonuses.skinnedAnimal.tierDivisor,
    ) +
      (state.bloodMoonActive
        ? ENEMY_ITEM_DROP_CHANCES.bonuses.skinnedAnimal.bloodMoonBonus
        : 0),
  );

  addEnemyDrops(state, enemy, [
    {
      item: makeResourceStack(ItemId.LeatherScraps, enemy.tier, quantity),
      suppressLog: true,
    },
    {
      item: makeResourceStack('meat', enemy.tier, quantity),
      suppressLog: true,
    },
  ]);
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
