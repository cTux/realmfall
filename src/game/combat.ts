import { BLOOD_MOON_STAT_SCALE } from './config';
import { t } from '../i18n';
import { isAnimalEnemyType, pickEnemyConfig } from './content/enemies';
import type {
  AbilityDefinition,
  AbilityId,
  CombatActorState,
  Enemy,
  StructureType,
  Terrain,
} from './types';
import type { HexCoord } from './hex';
import { noise, terrainTier } from './shared';
import { isWorldBossEnemyId } from './worldBoss';

export const DEFAULT_GLOBAL_COOLDOWN_MS = 1500;

export const ABILITIES: Record<AbilityId, AbilityDefinition> = {
  kick: {
    id: 'kick',
    name: t('game.ability.kick.name'),
    manaCost: 0,
    cooldownMs: 1000,
    castTimeMs: 0,
  },
};

export function enemyKey(coord: HexCoord, index: number) {
  return `enemy-${coord.q},${coord.r}-${index}`;
}

export function createCombatActorState(
  worldTimeMs: number,
  abilityIds: AbilityId[] = ['kick'],
  globalCooldownMs = DEFAULT_GLOBAL_COOLDOWN_MS,
): CombatActorState {
  return {
    abilityIds: [...abilityIds],
    globalCooldownMs,
    effectiveGlobalCooldownMs: globalCooldownMs,
    globalCooldownEndsAt: worldTimeMs,
    cooldownEndsAt: {},
    effectiveCooldownMs: {},
    casting: null,
  };
}

export function getAbilityDefinition(abilityId: AbilityId) {
  return ABILITIES[abilityId];
}

export function enemyIndexFromId(enemyId: string) {
  const parts = enemyId.split('-');
  return Number(parts[parts.length - 1] ?? '0') || 0;
}

export function makeEnemy(
  seed: string,
  coord: HexCoord,
  terrain: Terrain,
  index = 0,
  structure?: StructureType,
  bloodMoonActive = false,
  options?: {
    enemyId?: string;
    aggressive?: boolean;
    name?: string;
    worldBoss?: boolean;
  },
): Enemy {
  const tier = terrainTier(coord, terrain) + (structure === 'dungeon' ? 2 : 0);
  const roll = noise(`${seed}:enemy:type:${index}`, coord);
  const elite = structure === 'dungeon';
  const worldBoss =
    options?.worldBoss ?? isWorldBossEnemyId(options?.enemyId ?? '');
  const config = worldBoss
    ? pickEnemyConfig(terrain, roll, false, true)
    : pickEnemyConfig(terrain, roll, elite);
  const baseMaxHp = 8 + tier * 6 + (elite ? 10 : 0);
  const baseAttack = 2 + tier * 2 + (elite ? 3 : 0);
  const baseDefense = 1 + tier + (elite ? 2 : 0);
  const scaledMaxHp = worldBoss ? baseMaxHp * 50 : baseMaxHp;
  const scaledAttack = worldBoss ? baseAttack * 5 : baseAttack;
  const scaledDefense = worldBoss
    ? Math.max(baseDefense + tier * 3, baseDefense * 3)
    : baseDefense;
  const enemy: Enemy = {
    id: options?.enemyId ?? enemyKey(coord, index),
    name: options?.name ?? config.name,
    coord,
    tier: worldBoss ? tier + 3 : elite ? tier + 1 : tier,
    baseMaxHp: worldBoss ? scaledMaxHp : baseMaxHp,
    maxHp: scaledMaxHp,
    hp: scaledMaxHp,
    baseAttack: worldBoss ? scaledAttack : baseAttack,
    attack: scaledAttack,
    baseDefense: worldBoss ? scaledDefense : baseDefense,
    defense: scaledDefense,
    xp: (18 + tier * 14 + (elite ? 25 : 0)) * (worldBoss ? 10 : 1),
    elite: elite || worldBoss,
    worldBoss,
    aggressive: options?.aggressive ?? true,
  };

  setEnemyBloodMoonState(enemy, bloodMoonActive);
  return enemy;
}

export function syncEnemyBloodMoonState(
  enemies: Record<string, Enemy>,
  active: boolean,
) {
  Object.values(enemies).forEach((enemy) => {
    setEnemyBloodMoonState(enemy, active);
  });
}

export function nextEnemySpawnIndex(enemyIds: string[]) {
  return (
    enemyIds.reduce(
      (highest, enemyId) => Math.max(highest, enemyIndexFromId(enemyId)),
      -1,
    ) + 1
  );
}

export function makeBloodMoonDropKind(
  roll: number,
): 'artifact' | 'weapon' | 'offhand' | 'armor' {
  if (roll > 0.8) return 'artifact';
  if (roll > 0.5) return 'weapon';
  if (roll > 0.25) return 'offhand';
  return 'armor';
}

export function isAnimalEnemy(name: string) {
  return isAnimalEnemyType(name);
}

export function scaledBloodMoonStat(value: number) {
  return Math.max(1, Math.round(value * BLOOD_MOON_STAT_SCALE));
}

function setEnemyBloodMoonState(enemy: Enemy, active: boolean) {
  const baseMaxHp = enemy.baseMaxHp ?? enemy.maxHp;
  const baseAttack = enemy.baseAttack ?? enemy.attack;
  const baseDefense = enemy.baseDefense ?? enemy.defense;
  const currentRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 1;
  const maxHp = active ? scaledBloodMoonStat(baseMaxHp) : baseMaxHp;

  enemy.baseMaxHp = baseMaxHp;
  enemy.baseAttack = baseAttack;
  enemy.baseDefense = baseDefense;
  enemy.maxHp = maxHp;
  enemy.hp = Math.max(0, Math.min(maxHp, Math.round(maxHp * currentRatio)));
  enemy.attack = active ? scaledBloodMoonStat(baseAttack) : baseAttack;
  enemy.defense = active ? scaledBloodMoonStat(baseDefense) : baseDefense;
}
