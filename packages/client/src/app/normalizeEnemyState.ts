import type { Enemy, GameState } from '../game/stateTypes';
import {
  isFiniteNumber,
  isItemRarity,
  isRecord,
  isStringArray,
} from './normalizeShared';
import { normalizeConfiguredEnemyName } from '../game/configuredEnemyName';
import { normalizeEnemyTypeId } from './normalizeShared';
import { cloneEnemy, cloneEnemies } from '../game/stateClone';
import { resolveLegacyEnemyTypeId } from './normalizeCompatibility';
import { normalizeHexCoord } from './normalizeShared';
import { normalizeStatusEffects } from './normalizeItems';

export function normalizeEnemy(
  value: unknown,
  fallback?: GameState['enemies'][string],
): GameState['enemies'][string] | null {
  if (!isRecord(value)) {
    return fallback ? cloneEnemy(fallback) : null;
  }

  const coord = normalizeHexCoord(value.coord) ?? fallback?.coord ?? null;
  const statusEffects = normalizeStatusEffects(value.statusEffects);
  const enemyTypeId =
    normalizeEnemyTypeId(value.enemyTypeId) ??
    (value.enemyTypeId === undefined
      ? resolveLegacyEnemyTypeId(value.name)
      : (fallback?.enemyTypeId ?? null));
  if (!coord || typeof value.id !== 'string' || enemyTypeId === null) {
    return null;
  }

  return {
    id: value.id,
    enemyTypeId,
    ...(isStringArray(value.tags)
      ? {}
      : fallback?.tags === undefined
        ? {}
        : { tags: [...fallback.tags] as Enemy['tags'] }),
    ...(isStringArray(value.tags)
      ? { tags: [...value.tags] as Enemy['tags'] }
      : {}),
    name: normalizeConfiguredEnemyName(
      typeof value.name === 'string'
        ? value.name
        : (fallback?.name ?? value.id),
      enemyTypeId,
    ),
    coord,
    ...(normalizeHexCoord(value.dungeonSpawnCoord)
      ? {
          dungeonSpawnCoord: normalizeHexCoord(value.dungeonSpawnCoord)!,
        }
      : fallback?.dungeonSpawnCoord === undefined
        ? {}
        : { dungeonSpawnCoord: { ...fallback.dungeonSpawnCoord } }),
    ...(isFiniteNumber(value.dungeonMovementCooldownEndsAt)
      ? { dungeonMovementCooldownEndsAt: value.dungeonMovementCooldownEndsAt }
      : fallback?.dungeonMovementCooldownEndsAt === undefined
        ? {}
        : {
            dungeonMovementCooldownEndsAt:
              fallback.dungeonMovementCooldownEndsAt,
          }),
    ...(isItemRarity(value.rarity)
      ? { rarity: value.rarity }
      : fallback?.rarity === undefined
        ? {}
        : { rarity: fallback.rarity }),
    tier: isFiniteNumber(value.tier) ? value.tier : (fallback?.tier ?? 1),
    ...(isFiniteNumber(value.baseMaxHp)
      ? { baseMaxHp: value.baseMaxHp }
      : fallback?.baseMaxHp === undefined
        ? {}
        : { baseMaxHp: fallback.baseMaxHp }),
    hp: isFiniteNumber(value.hp) ? value.hp : (fallback?.hp ?? 1),
    maxHp: isFiniteNumber(value.maxHp) ? value.maxHp : (fallback?.maxHp ?? 1),
    ...(isFiniteNumber(value.mana)
      ? { mana: value.mana }
      : fallback?.mana === undefined
        ? {}
        : { mana: fallback.mana }),
    ...(isFiniteNumber(value.maxMana)
      ? { maxMana: value.maxMana }
      : fallback?.maxMana === undefined
        ? {}
        : { maxMana: fallback.maxMana }),
    ...(isFiniteNumber(value.baseAttack)
      ? { baseAttack: value.baseAttack }
      : fallback?.baseAttack === undefined
        ? {}
        : { baseAttack: fallback.baseAttack }),
    attack: isFiniteNumber(value.attack)
      ? value.attack
      : (fallback?.attack ?? 0),
    ...(isFiniteNumber(value.baseDefense)
      ? { baseDefense: value.baseDefense }
      : fallback?.baseDefense === undefined
        ? {}
        : { baseDefense: fallback.baseDefense }),
    defense: isFiniteNumber(value.defense)
      ? value.defense
      : (fallback?.defense ?? 0),
    xp: isFiniteNumber(value.xp) ? value.xp : (fallback?.xp ?? 0),
    elite:
      typeof value.elite === 'boolean'
        ? value.elite
        : (fallback?.elite ?? false),
    ...(typeof value.worldBoss === 'boolean'
      ? { worldBoss: value.worldBoss }
      : fallback?.worldBoss === undefined
        ? {}
        : { worldBoss: fallback.worldBoss }),
    ...(typeof value.aggressive === 'boolean'
      ? { aggressive: value.aggressive }
      : fallback?.aggressive === undefined
        ? {}
        : { aggressive: fallback.aggressive }),
    ...(statusEffects == null ? {} : { statusEffects }),
    ...(isStringArray(value.abilityIds)
      ? { abilityIds: [...value.abilityIds] }
      : fallback?.abilityIds === undefined
        ? {}
        : { abilityIds: [...fallback.abilityIds] }),
  };
}

export function normalizeEnemies(
  value: unknown,
  fallback: GameState['enemies'],
): GameState['enemies'] {
  if (!isRecord(value)) {
    return cloneEnemies(fallback);
  }

  const enemies = cloneEnemies(fallback);

  for (const [key, enemy] of Object.entries(value)) {
    const normalizedEnemy = normalizeEnemy(enemy, fallback[key]);
    if (normalizedEnemy) {
      enemies[key] = normalizedEnemy;
    }
  }

  return enemies;
}
