import {
  ENEMY_BASE_STATS,
  ENEMY_POST_LEVEL_100_PER_LEVEL,
  ITEM_BASE_STAT_RANGE,
  ITEM_SECONDARY_STAT_RANGE,
  MAX_ITEM_LEVEL,
  MAX_PLAYER_LEVEL,
  PLAYER_BASE_STATS,
  SECONDARY_STAT_CAP,
} from './config';
import type { Player } from './types';

export interface BattleStatAnchor {
  maxHp: number;
  attack: number;
  defense: number;
}

export interface SecondaryStatValue {
  raw: number;
  effective: number;
}

export function clampPlayerLevel(level: number) {
  return clampRounded(level, 1, MAX_PLAYER_LEVEL);
}

export function clampItemLevel(level: number) {
  return clampRounded(level, 1, MAX_ITEM_LEVEL);
}

export function clampEnemyLevel(level: number) {
  return Math.max(1, Math.round(level));
}

export function getPlayerBaseStatsForLevel(level: number): BattleStatAnchor {
  return interpolateStatAnchor(
    clampPlayerLevel(level),
    PLAYER_BASE_STATS.level1,
    PLAYER_BASE_STATS.level100,
    MAX_PLAYER_LEVEL,
  );
}

export function getEnemyBaseStatsForLevel(level: number): BattleStatAnchor {
  const enemyLevel = clampEnemyLevel(level);

  if (enemyLevel <= MAX_PLAYER_LEVEL) {
    return interpolateStatAnchor(
      enemyLevel,
      ENEMY_BASE_STATS.level1,
      ENEMY_BASE_STATS.level100,
      MAX_PLAYER_LEVEL,
    );
  }

  const overLevel = enemyLevel - MAX_PLAYER_LEVEL;
  const multiplier = 1 + overLevel * ENEMY_POST_LEVEL_100_PER_LEVEL;

  return {
    maxHp: Math.round(ENEMY_BASE_STATS.level100.maxHp * multiplier),
    attack: Math.round(ENEMY_BASE_STATS.level100.attack * multiplier),
    defense: Math.round(ENEMY_BASE_STATS.level100.defense * multiplier),
  };
}

export function scaleMainItemStatForLevel(level: number) {
  return interpolateScalar(
    clampItemLevel(level),
    ITEM_BASE_STAT_RANGE.level1,
    ITEM_BASE_STAT_RANGE.level100,
    MAX_ITEM_LEVEL,
  );
}

export function scaleSecondaryItemStatForLevel(level: number) {
  return interpolateScalar(
    clampItemLevel(level),
    ITEM_SECONDARY_STAT_RANGE.level1,
    ITEM_SECONDARY_STAT_RANGE.level100,
    MAX_ITEM_LEVEL,
  );
}

export function resolveSecondaryStatValue(
  rawValue: number,
  maximum = SECONDARY_STAT_CAP,
): SecondaryStatValue {
  const normalized = Math.max(0, Math.round(rawValue));
  return {
    raw: normalized,
    effective: Math.min(maximum, normalized),
  };
}

export function syncPlayerBaseStats<
  T extends Pick<Player, 'level' | 'baseMaxHp' | 'baseAttack' | 'baseDefense'>,
>(player: T) {
  const baseStats = getPlayerBaseStatsForLevel(player.level);
  player.baseMaxHp = baseStats.maxHp;
  player.baseAttack = baseStats.attack;
  player.baseDefense = baseStats.defense;
  return player;
}

function interpolateStatAnchor(
  level: number,
  level1: BattleStatAnchor,
  level100: BattleStatAnchor,
  maxLevel: number,
): BattleStatAnchor {
  return {
    maxHp: interpolateScalar(level, level1.maxHp, level100.maxHp, maxLevel),
    attack: interpolateScalar(level, level1.attack, level100.attack, maxLevel),
    defense: interpolateScalar(
      level,
      level1.defense,
      level100.defense,
      maxLevel,
    ),
  };
}

function interpolateScalar(
  level: number,
  level1: number,
  level100: number,
  maxLevel: number,
) {
  if (maxLevel <= 1) return Math.round(level100);

  const normalizedLevel = clampRounded(level, 1, maxLevel);
  const ratio = (normalizedLevel - 1) / (maxLevel - 1);
  return Math.round(level1 + (level100 - level1) * ratio);
}

function clampRounded(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(value)));
}
