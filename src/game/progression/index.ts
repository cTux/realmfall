import { SKILL_NAMES, type SkillName, type SkillProgress } from '../types';

export {
  gainSkillXp,
  gainXp,
  resolveExperienceAward,
  rollGatheringBonus,
} from './experience';
export {
  getPlayerCombatStats,
  getPlayerOverview,
  getPlayerProgressionSummary,
} from './overview';
export {
  gatheringBonusChance,
  gatheringYieldBonus,
  levelThreshold,
  masteryLevelThreshold,
  skillLevelThreshold,
} from './thresholds';

export function makeStartingSkills(): Record<SkillName, SkillProgress> {
  return Object.fromEntries(
    SKILL_NAMES.map((skill) => [skill, { level: 1, xp: 0 }] as const),
  ) as Record<SkillName, SkillProgress>;
}
