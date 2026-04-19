import { buildEquippedAbilityIds } from './abilityRuntime';
import {
  GATHERING_BONUS_MAX,
  GATHERING_BONUS_PER_LEVEL,
  MAX_PLAYER_LEVEL,
} from './config';
import { StatusEffectTypeId } from './content/ids';
import { t } from '../i18n';
import { formatSkillLabel } from '../i18n/labels';
import {
  DEFAULT_CRITICAL_STRIKE_CHANCE,
  DEFAULT_CRITICAL_STRIKE_DAMAGE,
  DEFAULT_DODGE_CHANCE,
  DEFAULT_LIFESTEAL_AMOUNT,
  DEFAULT_LIFESTEAL_CHANCE_AMOUNT,
  DEFAULT_SUPPRESS_DAMAGE_CHANCE,
  DEFAULT_SUPPRESS_DAMAGE_REDUCTION,
  DEFAULT_SUPPRESS_DEBUFF_CHANCE,
  getEquipmentSecondaryStatTotal,
} from './itemSecondaryStats';
import { createRng } from './random';
import { hexKey } from './hex';
import {
  Skill,
  type GameState,
  type Player,
  type PlayerStatusEffect,
  type StatusEffectId,
  type SkillName,
  type SkillProgress,
} from './types';

export function makeStartingSkills(): Record<SkillName, SkillProgress> {
  return {
    [Skill.Gathering]: { level: 1, xp: 0 },
    [Skill.Logging]: { level: 1, xp: 0 },
    [Skill.Mining]: { level: 1, xp: 0 },
    [Skill.Skinning]: { level: 1, xp: 0 },
    [Skill.Fishing]: { level: 1, xp: 0 },
    [Skill.Cooking]: { level: 1, xp: 0 },
    [Skill.Smelting]: { level: 1, xp: 0 },
    [Skill.Crafting]: { level: 1, xp: 0 },
  };
}

export function getPlayerStats(player: Player) {
  const equipped = Object.values(player.equipment);
  const statusEffects = player.statusEffects ?? [];
  const recentDeathPenalty = getStatusEffectValue(
    statusEffects,
    StatusEffectTypeId.RecentDeath,
    10,
  );
  const powerBonus = getStatusEffectValue(
    statusEffects,
    StatusEffectTypeId.Power,
    10,
  );
  const frenzyBonus = getStatusEffectValue(
    statusEffects,
    StatusEffectTypeId.Frenzy,
    20,
  );
  const chillingPenalty = getStatusEffectValue(
    statusEffects,
    StatusEffectTypeId.Chilling,
    20,
  );
  const guardBonus = getStatusEffectValue(
    statusEffects,
    StatusEffectTypeId.Guard,
    15,
  );
  const weakenedPenalty = getStatusEffectValue(
    statusEffects,
    StatusEffectTypeId.Weakened,
    15,
  );
  const shockedPenalty = getStatusEffectValue(
    statusEffects,
    StatusEffectTypeId.Shocked,
    15,
  );
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
  const rawMaxHp = player.baseMaxHp + maxHpBonus;
  const maxHp = Math.max(
    1,
    Math.floor(rawMaxHp * (1 - recentDeathPenalty / 100)),
  );
  const rawAttack = Math.max(0, player.baseAttack + attackBonus);
  const rawDefense = Math.max(0, player.baseDefense + defenseBonus);
  const hungerDebuffActive = player.hunger <= 30;
  const thirstDebuffActive = (player.thirst ?? 100) <= 30;
  const combatMultiplier =
    (hungerDebuffActive ? 0.9 : 1) *
    (1 + powerBonus / 100) *
    (1 - weakenedPenalty / 100);
  const baseAttackSpeed =
    1 + getEquipmentSecondaryStatTotal(equipped, 'attackSpeed') / 100;
  const attackSpeed =
    baseAttackSpeed *
    (thirstDebuffActive ? 0.8 : 1) *
    (1 - chillingPenalty / 100) *
    (1 + frenzyBonus / 100);
  const attack = Math.max(0, Math.floor(rawAttack * combatMultiplier));
  const defense = Math.max(
    0,
    Math.floor(rawDefense * (hungerDebuffActive ? 0.9 : 1) * (1 + guardBonus / 100) * (1 - shockedPenalty / 100)),
  );
  const criticalStrikeChance = getEquipmentSecondaryStatTotal(
    equipped,
    'criticalStrikeChance',
  ) + DEFAULT_CRITICAL_STRIKE_CHANCE;
  const criticalStrikeDamage =
    DEFAULT_CRITICAL_STRIKE_DAMAGE +
    getEquipmentSecondaryStatTotal(equipped, 'criticalStrikeDamage');
  const lifestealChance = getEquipmentSecondaryStatTotal(
    equipped,
    'lifestealChance',
  );
  const lifestealAmount =
    (lifestealChance > 0
      ? DEFAULT_LIFESTEAL_CHANCE_AMOUNT
      : DEFAULT_LIFESTEAL_AMOUNT) +
    getEquipmentSecondaryStatTotal(equipped, 'lifestealAmount');
  const dodgeChance =
    DEFAULT_DODGE_CHANCE +
    getEquipmentSecondaryStatTotal(equipped, 'dodgeChance');
  const blockChance = getEquipmentSecondaryStatTotal(equipped, 'blockChance');
  const suppressDamageChance = getEquipmentSecondaryStatTotal(
    equipped,
    'suppressDamageChance',
  ) + DEFAULT_SUPPRESS_DAMAGE_CHANCE;
  const suppressDamageReduction =
    DEFAULT_SUPPRESS_DAMAGE_REDUCTION +
    getEquipmentSecondaryStatTotal(equipped, 'suppressDamageReduction');
  const suppressDebuffChance =
    DEFAULT_SUPPRESS_DEBUFF_CHANCE +
    getEquipmentSecondaryStatTotal(equipped, 'suppressDebuffChance');
  const bleedChance = getEquipmentSecondaryStatTotal(equipped, 'bleedChance');
  const poisonChance = getEquipmentSecondaryStatTotal(equipped, 'poisonChance');
  const burningChance = getEquipmentSecondaryStatTotal(equipped, 'burningChance');
  const chillingChance = getEquipmentSecondaryStatTotal(
    equipped,
    'chillingChance',
  );
  const powerBuffChance = getEquipmentSecondaryStatTotal(
    equipped,
    'powerBuffChance',
  );
  const frenzyBuffChance = getEquipmentSecondaryStatTotal(
    equipped,
    'frenzyBuffChance',
  );

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
    criticalStrikeChance,
    criticalStrikeDamage,
    lifestealChance,
    lifestealAmount,
    dodgeChance,
    blockChance,
    suppressDamageChance,
    suppressDamageReduction,
    suppressDebuffChance,
    bleedChance,
    poisonChance,
    burningChance,
    chillingChance,
    powerBuffChance,
    frenzyBuffChance,
    secondaryStats: equipped.flatMap((item) => item?.secondaryStats ?? []),
    statusEffects: statusEffects.map(
      (effect) =>
        ({
          id: effect.id,
          value: effect.value,
          tickIntervalMs: effect.tickIntervalMs,
          stacks: effect.stacks,
        }) satisfies Pick<
          PlayerStatusEffect,
          'id' | 'value' | 'tickIntervalMs' | 'stacks'
        >,
    ),
    buffs: [
      ...statusEffects
        .filter(
          (effect) =>
            effect.id === StatusEffectTypeId.Restoration ||
            effect.id === StatusEffectTypeId.Power ||
            effect.id === StatusEffectTypeId.Frenzy ||
            effect.id === StatusEffectTypeId.Guard,
        )
        .map((effect) => effect.id),
    ] as StatusEffectId[],
    debuffs: [
      ...statusEffects
        .filter(
          (effect) =>
            effect.id === StatusEffectTypeId.RecentDeath ||
            effect.id === StatusEffectTypeId.Bleeding ||
            effect.id === StatusEffectTypeId.Poison ||
            effect.id === StatusEffectTypeId.Burning ||
            effect.id === StatusEffectTypeId.Chilling ||
            effect.id === StatusEffectTypeId.Weakened ||
            effect.id === StatusEffectTypeId.Shocked,
        )
        .map((effect) => effect.id),
      ...(hungerDebuffActive ? (['hunger'] as StatusEffectId[]) : []),
      ...(thirstDebuffActive ? (['thirst'] as StatusEffectId[]) : []),
    ] as StatusEffectId[],
    abilityIds: buildEquippedAbilityIds([
      player.equipment.weapon,
      player.equipment.offhand,
    ]),
    level: player.level,
    masteryLevel: player.masteryLevel,
    xp: player.xp,
    nextLevelXp,
    skills: player.skills,
  };
}

function getStatusEffectValue(
  effects: Player['statusEffects'],
  effectId: StatusEffectId,
  defaultValue = 0,
) {
  return effects
    .filter((effect) => effect.id === effectId)
    .reduce(
      (highest, effect) => Math.max(highest, effect.value ?? defaultValue),
      0,
    );
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
  return Math.min(GATHERING_BONUS_MAX, level * GATHERING_BONUS_PER_LEVEL);
}
