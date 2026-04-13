import { MAX_PLAYER_LEVEL } from './config';
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
  const attack = hungerDebuffActive
    ? Math.max(0, Math.floor(rawAttack * 0.9))
    : rawAttack;
  const defense = hungerDebuffActive
    ? Math.max(0, Math.floor(rawDefense * 0.9))
    : rawDefense;

  return {
    hp: player.hp,
    maxHp,
    mana: player.mana,
    maxMana: player.baseMaxMana,
    attack,
    defense,
    rawAttack,
    rawDefense,
    buffs: [] as string[],
    debuffs: hungerDebuffActive ? (['Hunger'] as string[]) : ([] as string[]),
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
    addLog(state, 'system', `You reached level ${state.player.level}.`);
  }

  while (state.player.xp >= masteryLevelThreshold(state.player.masteryLevel)) {
    state.player.xp -= masteryLevelThreshold(state.player.masteryLevel);
    state.player.masteryLevel += 1;
    addLog(
      state,
      'system',
      `You reached mastery level ${state.player.masteryLevel}.`,
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
      `Your ${skill} skill reaches level ${progress.level}.`,
    );
  }
}

export function rollGatheringBonus(state: GameState, skill: SkillName) {
  const chance = Math.min(1, state.player.skills[skill].level / 100);
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

function skillLevelThreshold(level: number) {
  return 5 + level * 3;
}
