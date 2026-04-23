import {
  PLAYER_XP_LEVEL_DIFFERENCE_BALANCE,
  BASE_ENEMY_XP,
  MAX_PLAYER_LEVEL,
} from '../config';
import { resolveSecondaryStatValue, syncPlayerBaseStats } from '../balance';
import { getEquipmentSecondaryStatTotal } from '../itemSecondaryStats';
import { createRng } from '../random';
import { hexKey } from '../hex';
import { type GameState, type Player, type SkillName } from '../types';
import { t } from '../../i18n';
import { formatSkillLabel } from '../../i18n/labels';
import {
  gatheringBonusChance,
  levelThreshold,
  masteryLevelThreshold,
  skillLevelThreshold,
} from './thresholds';

export function gainXp(
  state: GameState,
  amount: number,
  addLog: (state: GameState, kind: 'system', text: string) => void,
  enemyLevel?: number,
) {
  const awardedXp = resolveExperienceAward(state.player, amount, enemyLevel);
  if (awardedXp <= 0) return;

  state.player.xp += awardedXp;
  while (state.player.level < MAX_PLAYER_LEVEL) {
    const requiredXp = levelThreshold(state.player.level);
    if (state.player.xp < requiredXp) return;
    state.player.xp -= requiredXp;
    state.player.level += 1;
    state.player.baseMaxMana += 2;
    syncPlayerBaseStats(state.player);
    addLog(
      state,
      'system',
      t('game.progression.levelUp', { level: state.player.level }),
    );
  }

  while (state.player.xp >= masteryLevelThreshold(state.player.masteryLevel)) {
    state.player.xp -= masteryLevelThreshold(state.player.masteryLevel);
    state.player.masteryLevel += 1;
    addLog(
      state,
      'system',
      t('game.progression.masteryLevelUp', {
        level: state.player.masteryLevel,
      }),
    );
  }
}

export function gainSkillXp(
  state: GameState,
  skill: SkillName,
  amount: number,
  addLog: (state: GameState, kind: 'system', text: string) => void,
) {
  const progress = state.player.skills[skill];
  progress.xp += amount;
  while (progress.xp >= skillLevelThreshold(progress.level)) {
    progress.xp -= skillLevelThreshold(progress.level);
    progress.level += 1;
    addLog(
      state,
      'system',
      t('game.progression.skillLevelUp', {
        skill: formatSkillLabel(skill),
        level: progress.level,
      }),
    );
  }
}

export function rollGatheringBonus(state: GameState, skill: SkillName) {
  const chance = gatheringBonusChance(state.player.skills[skill].level);
  const rng = createRng(
    `${state.seed}:gather-bonus:${skill}:${state.turn}:${hexKey(state.player.coord)}`,
  );
  return rng() < chance ? 1 : 0;
}

export function resolveExperienceAward(
  player: Pick<Player, 'equipment' | 'level'>,
  baseAmount = BASE_ENEMY_XP,
  enemyLevel?: number,
) {
  const normalizedBaseAmount = Math.max(0, Math.round(baseAmount));
  if (normalizedBaseAmount === 0) return 0;

  const levelMultiplier = getEnemyLevelExperienceMultiplier(
    player.level,
    enemyLevel,
  );
  if (levelMultiplier <= 0) return 0;

  return Math.max(
    1,
    Math.round(
      normalizedBaseAmount *
        levelMultiplier *
        (1 + getBonusExperiencePercent(player) / 100),
    ),
  );
}

function getBonusExperiencePercent(player: Pick<Player, 'equipment'>) {
  return resolveSecondaryStatValue(
    getEquipmentSecondaryStatTotal(
      Object.values(player.equipment),
      'bonusExperience',
    ),
    Number.POSITIVE_INFINITY,
  ).effective;
}

function getEnemyLevelExperienceMultiplier(
  playerLevel: number,
  enemyLevel?: number,
) {
  if (enemyLevel == null) return 1;

  const levelDelta = Math.round(enemyLevel) - Math.round(playerLevel);
  if (levelDelta < 0) {
    const penaltyLevels = Math.min(
      PLAYER_XP_LEVEL_DIFFERENCE_BALANCE.maxPenaltyLevels,
      Math.abs(levelDelta),
    );
    return Math.max(
      0,
      1 -
        penaltyLevels *
          PLAYER_XP_LEVEL_DIFFERENCE_BALANCE.penaltyPerLevelBelowPlayer,
    );
  }

  const bonusLevels = Math.min(
    PLAYER_XP_LEVEL_DIFFERENCE_BALANCE.maxBonusLevels,
    levelDelta,
  );
  return (
    1 +
    bonusLevels * PLAYER_XP_LEVEL_DIFFERENCE_BALANCE.bonusPerLevelAbovePlayer
  );
}
