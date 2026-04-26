import {
  getEnemyCombatAttack,
  getEnemyCombatAttackSpeed,
  getEnemyCombatDefense,
  getEnemyCriticalStrikeChance,
  getEnemyCriticalStrikeDamage,
  getEnemyDodgeChance,
  getEnemySuppressDamageChance,
  getEnemySuppressDamageReduction,
} from '../../../game/stateCombat';
import type { Enemy } from '../../../game/stateTypes';
import type { SecondaryStatKey } from '../../../game/types';
import { buildStatSheetTooltipLines } from '../statSheet';

const ENEMY_STAT_SHEET_SECONDARY_KEYS: SecondaryStatKey[] = [
  'attackSpeed',
  'criticalStrikeChance',
  'criticalStrikeDamage',
  'dodgeChance',
  'suppressDamageChance',
  'suppressDamageReduction',
];

export function buildEnemyStatSheetTooltipLines(enemy: Enemy) {
  return buildStatSheetTooltipLines(
    {
      maxHp: enemy.maxHp,
      attack: getEnemyCombatAttack(enemy),
      defense: getEnemyCombatDefense(enemy),
      attackSpeed: getEnemyCombatAttackSpeed(enemy),
      criticalStrikeChance: getEnemyCriticalStrikeChance(enemy),
      criticalStrikeDamage: getEnemyCriticalStrikeDamage(enemy),
      dodgeChance: getEnemyDodgeChance(enemy),
      suppressDamageChance: getEnemySuppressDamageChance(enemy),
      suppressDamageReduction: getEnemySuppressDamageReduction(enemy),
    },
    { secondaryKeys: ENEMY_STAT_SHEET_SECONDARY_KEYS },
  );
}
