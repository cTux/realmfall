import {
  GATHERING_BONUS_MAX,
  GATHERING_BONUS_PER_LEVEL,
  MASTERY_BASE_XP_REQUIREMENT,
  MASTERY_XP_GROWTH_RATE,
  MAX_PLAYER_LEVEL,
  PLAYER_FIRST_LEVEL_XP_REQUIREMENT,
  PLAYER_LAST_LEVEL_XP_REQUIREMENT,
} from '../config';

const ORDINARY_LEVEL_GROWTH_FACTOR = Math.pow(
  PLAYER_LAST_LEVEL_XP_REQUIREMENT / PLAYER_FIRST_LEVEL_XP_REQUIREMENT,
  1 / Math.max(1, MAX_PLAYER_LEVEL - 2),
);

export function levelThreshold(level: number) {
  const clampedLevel = clampOrdinaryThresholdLevel(level);
  const exponent = clampedLevel - 1;

  return Math.round(
    PLAYER_FIRST_LEVEL_XP_REQUIREMENT *
      Math.pow(ORDINARY_LEVEL_GROWTH_FACTOR, exponent),
  );
}

export function masteryLevelThreshold(masteryLevel: number) {
  return Math.round(
    MASTERY_BASE_XP_REQUIREMENT *
      Math.pow(MASTERY_XP_GROWTH_RATE + 1, Math.max(0, masteryLevel)),
  );
}

export function skillLevelThreshold(level: number) {
  return 5 + level * 3;
}

export function gatheringYieldBonus(level: number) {
  return Math.floor((level - 1) / 4);
}

export function gatheringBonusChance(level: number) {
  return Math.min(GATHERING_BONUS_MAX, level * GATHERING_BONUS_PER_LEVEL);
}

function clampOrdinaryThresholdLevel(level: number) {
  return Math.max(
    1,
    Math.min(Math.round(level), Math.max(1, MAX_PLAYER_LEVEL - 1)),
  );
}
