import { buildEquippedAbilityIds } from './abilityRuntime';
import {
  GATHERING_BONUS_MAX,
  GATHERING_BONUS_PER_LEVEL,
  MAX_PLAYER_LEVEL,
} from './config';
import { resolveSecondaryStatValue, syncPlayerBaseStats } from './balance';
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
  const attackSpeedBonus = resolveSecondaryStatValue(
    getEquipmentSecondaryStatTotal(equipped, 'attackSpeed'),
  );
  const attackSpeedStatusMultiplier =
    (thirstDebuffActive ? 0.8 : 1) *
    (1 - chillingPenalty / 100) *
    (1 + frenzyBonus / 100);
  const attackSpeed =
    (1 + attackSpeedBonus.effective / 100) * attackSpeedStatusMultiplier;
  const rawAttackSpeed =
    (1 + attackSpeedBonus.raw / 100) * attackSpeedStatusMultiplier;
  const attack = Math.max(0, Math.floor(rawAttack * combatMultiplier));
  const defense = Math.max(
    0,
    Math.floor(
      rawDefense *
        (hungerDebuffActive ? 0.9 : 1) *
        (1 + guardBonus / 100) *
        (1 - shockedPenalty / 100),
    ),
  );
  const criticalStrikeChanceBonus = resolveSecondaryStatValue(
    getEquipmentSecondaryStatTotal(equipped, 'criticalStrikeChance'),
  );
  const criticalStrikeChance =
    DEFAULT_CRITICAL_STRIKE_CHANCE + criticalStrikeChanceBonus.effective;
  const rawCriticalStrikeChance =
    DEFAULT_CRITICAL_STRIKE_CHANCE + criticalStrikeChanceBonus.raw;
  const criticalStrikeDamageBonus = resolveSecondaryStatValue(
    getEquipmentSecondaryStatTotal(equipped, 'criticalStrikeDamage'),
  );
  const criticalStrikeDamage =
    DEFAULT_CRITICAL_STRIKE_DAMAGE + criticalStrikeDamageBonus.effective;
  const rawCriticalStrikeDamage =
    DEFAULT_CRITICAL_STRIKE_DAMAGE + criticalStrikeDamageBonus.raw;
  const lifestealChanceValue = resolveSecondaryStatValue(
    getEquipmentSecondaryStatTotal(equipped, 'lifestealChance'),
  );
  const lifestealChance = lifestealChanceValue.effective;
  const rawLifestealChance = lifestealChanceValue.raw;
  const lifestealAmountBonus = resolveSecondaryStatValue(
    getEquipmentSecondaryStatTotal(equipped, 'lifestealAmount'),
  );
  const lifestealAmount =
    (lifestealChance > 0
      ? DEFAULT_LIFESTEAL_CHANCE_AMOUNT
      : DEFAULT_LIFESTEAL_AMOUNT) + lifestealAmountBonus.effective;
  const rawLifestealAmount =
    (rawLifestealChance > 0
      ? DEFAULT_LIFESTEAL_CHANCE_AMOUNT
      : DEFAULT_LIFESTEAL_AMOUNT) + lifestealAmountBonus.raw;
  const dodgeChanceBonus = resolveSecondaryStatValue(
    getEquipmentSecondaryStatTotal(equipped, 'dodgeChance'),
  );
  const dodgeChance = DEFAULT_DODGE_CHANCE + dodgeChanceBonus.effective;
  const rawDodgeChance = DEFAULT_DODGE_CHANCE + dodgeChanceBonus.raw;
  const blockChanceValue = resolveSecondaryStatValue(
    getEquipmentSecondaryStatTotal(equipped, 'blockChance'),
  );
  const blockChance = blockChanceValue.effective;
  const rawBlockChance = blockChanceValue.raw;
  const suppressDamageChanceBonus = resolveSecondaryStatValue(
    getEquipmentSecondaryStatTotal(equipped, 'suppressDamageChance'),
  );
  const suppressDamageChance =
    DEFAULT_SUPPRESS_DAMAGE_CHANCE + suppressDamageChanceBonus.effective;
  const rawSuppressDamageChance =
    DEFAULT_SUPPRESS_DAMAGE_CHANCE + suppressDamageChanceBonus.raw;
  const suppressDamageReductionBonus = resolveSecondaryStatValue(
    getEquipmentSecondaryStatTotal(equipped, 'suppressDamageReduction'),
  );
  const suppressDamageReduction =
    DEFAULT_SUPPRESS_DAMAGE_REDUCTION + suppressDamageReductionBonus.effective;
  const rawSuppressDamageReduction =
    DEFAULT_SUPPRESS_DAMAGE_REDUCTION + suppressDamageReductionBonus.raw;
  const suppressDebuffChanceValue = resolveSecondaryStatValue(
    getEquipmentSecondaryStatTotal(equipped, 'suppressDebuffChance'),
  );
  const suppressDebuffChance =
    DEFAULT_SUPPRESS_DEBUFF_CHANCE + suppressDebuffChanceValue.effective;
  const rawSuppressDebuffChance =
    DEFAULT_SUPPRESS_DEBUFF_CHANCE + suppressDebuffChanceValue.raw;
  const bleedChanceValue = resolveSecondaryStatValue(
    getEquipmentSecondaryStatTotal(equipped, 'bleedChance'),
  );
  const bleedChance = bleedChanceValue.effective;
  const rawBleedChance = bleedChanceValue.raw;
  const poisonChanceValue = resolveSecondaryStatValue(
    getEquipmentSecondaryStatTotal(equipped, 'poisonChance'),
  );
  const poisonChance = poisonChanceValue.effective;
  const rawPoisonChance = poisonChanceValue.raw;
  const burningChanceValue = resolveSecondaryStatValue(
    getEquipmentSecondaryStatTotal(equipped, 'burningChance'),
  );
  const burningChance = burningChanceValue.effective;
  const rawBurningChance = burningChanceValue.raw;
  const chillingChanceValue = resolveSecondaryStatValue(
    getEquipmentSecondaryStatTotal(equipped, 'chillingChance'),
  );
  const chillingChance = chillingChanceValue.effective;
  const rawChillingChance = chillingChanceValue.raw;
  const powerBuffChanceValue = resolveSecondaryStatValue(
    getEquipmentSecondaryStatTotal(equipped, 'powerBuffChance'),
  );
  const powerBuffChance = powerBuffChanceValue.effective;
  const rawPowerBuffChance = powerBuffChanceValue.raw;
  const frenzyBuffChanceValue = resolveSecondaryStatValue(
    getEquipmentSecondaryStatTotal(equipped, 'frenzyBuffChance'),
  );
  const frenzyBuffChance = frenzyBuffChanceValue.effective;
  const rawFrenzyBuffChance = frenzyBuffChanceValue.raw;

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
    rawAttackSpeed,
    criticalStrikeChance,
    rawCriticalStrikeChance,
    criticalStrikeDamage,
    rawCriticalStrikeDamage,
    lifestealChance,
    rawLifestealChance,
    lifestealAmount,
    rawLifestealAmount,
    dodgeChance,
    rawDodgeChance,
    blockChance,
    rawBlockChance,
    suppressDamageChance,
    rawSuppressDamageChance,
    suppressDamageReduction,
    rawSuppressDamageReduction,
    suppressDebuffChance,
    rawSuppressDebuffChance,
    bleedChance,
    rawBleedChance,
    poisonChance,
    rawPoisonChance,
    burningChance,
    rawBurningChance,
    chillingChance,
    rawChillingChance,
    powerBuffChance,
    rawPowerBuffChance,
    frenzyBuffChance,
    rawFrenzyBuffChance,
    secondaryStatTotals: {
      attackSpeed: { effective: attackSpeed, raw: rawAttackSpeed },
      criticalStrikeChance: {
        effective: criticalStrikeChance,
        raw: rawCriticalStrikeChance,
      },
      criticalStrikeDamage: {
        effective: criticalStrikeDamage,
        raw: rawCriticalStrikeDamage,
      },
      lifestealChance: { effective: lifestealChance, raw: rawLifestealChance },
      lifestealAmount: { effective: lifestealAmount, raw: rawLifestealAmount },
      dodgeChance: { effective: dodgeChance, raw: rawDodgeChance },
      blockChance: { effective: blockChance, raw: rawBlockChance },
      suppressDamageChance: {
        effective: suppressDamageChance,
        raw: rawSuppressDamageChance,
      },
      suppressDamageReduction: {
        effective: suppressDamageReduction,
        raw: rawSuppressDamageReduction,
      },
      suppressDebuffChance: {
        effective: suppressDebuffChance,
        raw: rawSuppressDebuffChance,
      },
      bleedChance: { effective: bleedChance, raw: rawBleedChance },
      poisonChance: { effective: poisonChance, raw: rawPoisonChance },
      burningChance: { effective: burningChance, raw: rawBurningChance },
      chillingChance: { effective: chillingChance, raw: rawChillingChance },
      powerBuffChance: {
        effective: powerBuffChance,
        raw: rawPowerBuffChance,
      },
      frenzyBuffChance: {
        effective: frenzyBuffChance,
        raw: rawFrenzyBuffChance,
      },
    },
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
