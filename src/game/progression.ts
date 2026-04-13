import { MAX_PLAYER_LEVEL } from './config';
import { t } from '../i18n';
import { formatSkillLabel } from '../i18n/labels';
import { createRng } from './random';
import { hexKey } from './hex';
import type { GameState, Player, SkillName, SkillProgress } from './types';

export function makeStartingSkills(): Record<SkillName, SkillProgress> {
  return {
    logging: { level: 1, xp: 0 },
    mining: { level: 1, xp: 0 },
    skinning: { level: 1, xp: 0 },
    fishing: { level: 1, xp: 0 },
    cooking: { level: 1, xp: 0 },
    crafting: { level: 1, xp: 0 },
  };
}

export function getPlayerStats(player: Player) {
  const equipped = Object.values(player.equipment);
  const attackBonus = equipped.reduce(
    (sum, item) => sum + (item?.power ?? 0),
    0,
  );
  const defenseBonus = equipped.reduce(
    (sum, item) => sum + (item?.defense ?? 0),
    0,
  );
  const maxHpBonus = equipped.reduce(
    (sum, item) => sum + (item?.maxHp ?? 0),
    0,
  );
  const nextLevelXp =
    player.level >= MAX_PLAYER_LEVEL
      ? masteryLevelThreshold(player.masteryLevel)
      : levelThreshold(player.level);
  const maxHp = player.baseMaxHp + maxHpBonus;
  const rawAttack = Math.max(0, player.baseAttack + attackBonus);
  const rawDefense = Math.max(0, player.baseDefense + defenseBonus);
  const hungerDebuffActive = player.hunger <= 30;
  const thirstDebuffActive = (player.thirst ?? 100) <= 30;
  const combatMultiplier = hungerDebuffActive ? 0.9 : 1;
  const attackSpeed = thirstDebuffActive ? 0.8 : 1;
  const attack = Math.max(0, Math.floor(rawAttack * combatMultiplier));
  const defense = Math.max(0, Math.floor(rawDefense * combatMultiplier));

  return {
    hp: player.hp,
    maxHp,
    mana: player.mana,
    maxMana: player.baseMaxMana,
    attack,
    defense,
    rawAttack,
    rawDefense,
    attackSpeed,
    buffs: [] as string[],
    debuffs: [
      ...(hungerDebuffActive ? (['Hunger'] as string[]) : []),
      ...(thirstDebuffActive ? (['Thirst'] as string[]) : []),
    ],
    abilityIds: ['kick'] as Array<'kick'>,
    level: player.level,
    masteryLevel: player.masteryLevel,
    xp: player.xp,
    nextLevelXp,
    skills: player.skills,
  };
}

export function gainXp(
  state: GameState,
  amount: number,
  addLog: (state: GameState, kind: 'system', text: string) => void,
) {
  state.player.xp += amount;
  while (state.player.level < MAX_PLAYER_LEVEL) {
    const requiredXp = levelThreshold(state.player.level);
    if (state.player.xp < requiredXp) return;
    state.player.xp -= requiredXp;
    state.player.level += 1;
    state.player.baseMaxHp += 6;
    state.player.baseMaxMana += 2;
    state.player.baseAttack += 1;
    state.player.baseDefense += 1;
    state.player.hp = getPlayerStats(state.player).maxHp;
    state.player.mana = state.player.baseMaxMana;
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

export function levelThreshold(level: number) {
  return 40 + level * 25;
}

export function masteryLevelThreshold(masteryLevel: number) {
  return levelThreshold(MAX_PLAYER_LEVEL + masteryLevel) * 20;
}

export function skillLevelThreshold(level: number) {
  return 5 + level * 3;
}

export function gatheringYieldBonus(level: number) {
  return Math.floor((level - 1) / 4);
}

export function gatheringBonusChance(level: number) {
  return Math.min(1, level / 100);
}
