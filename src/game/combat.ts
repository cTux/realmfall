import { BLOOD_MOON_STAT_SCALE } from './config';
import type { Enemy, StructureType, Terrain } from './types';
import type { HexCoord } from './hex';
import { noise, terrainTier } from './shared';

export function enemyKey(coord: HexCoord, index: number) {
  return `enemy-${coord.q},${coord.r}-${index}`;
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
): Enemy {
  const tier = terrainTier(coord, terrain) + (structure === 'dungeon' ? 2 : 0);
  const roll = noise(`${seed}:enemy:type:${index}`, coord);
  const elite = structure === 'dungeon';
  const baseMaxHp = 8 + tier * 6 + (elite ? 10 : 0);
  const baseAttack = 2 + tier * 2 + (elite ? 3 : 0);
  const baseDefense = 1 + tier + (elite ? 2 : 0);
  const enemy: Enemy = {
    id: enemyKey(coord, index),
    name: pickEnemyName(terrain, roll, elite),
    coord,
    tier: elite ? tier + 1 : tier,
    baseMaxHp,
    maxHp: baseMaxHp,
    hp: baseMaxHp,
    baseAttack,
    attack: baseAttack,
    baseDefense,
    defense: baseDefense,
    xp: 18 + tier * 14 + (elite ? 25 : 0),
    elite,
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
  return name === 'Wolf' || name === 'Boar' || name === 'Stag';
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

function pickEnemyName(terrain: Terrain, roll: number, elite: boolean) {
  if (elite) return roll > 0.5 ? 'Marauder' : 'Raider';
  if (terrain === 'forest') {
    return roll > 0.72
      ? 'Wolf'
      : roll > 0.44
        ? 'Boar'
        : roll > 0.18
          ? 'Spider'
          : 'Raider';
  }
  if (terrain === 'plains') {
    return roll > 0.66 ? 'Stag' : roll > 0.33 ? 'Boar' : 'Marauder';
  }
  if (terrain === 'swamp') {
    return roll > 0.6 ? 'Boar' : roll > 0.25 ? 'Spider' : 'Wolf';
  }
  return roll > 0.5 ? 'Raider' : 'Marauder';
}
