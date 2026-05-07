import { syncPlayerBaseStats } from '../game/balance';
import { cloneEquipment, clonePlayer } from '../game/stateClone';
import type { GameState, Item } from '../game/stateTypes';
import { normalizeStatusEffects } from './normalizeItems';
import { normalizeItem } from './normalizeItems';
import {
  getSkillNames,
  isEquipmentSlot,
  isFiniteNumber,
  isRecord,
  isStringArray,
  normalizeHexCoord,
} from './normalizeShared';
import { normalizeItemArray } from './normalizeInventoryState';

export function normalizePlayer(
  value: unknown,
  fallback: GameState['player'],
): GameState['player'] {
  if (!isRecord(value)) {
    return clonePlayer(fallback);
  }

  const coord = normalizeHexCoord(value.coord) ?? fallback.coord;
  const skills = normalizeSkills(value.skills, fallback.skills);
  const inventory = normalizeItemArray(value.inventory, fallback.inventory);
  const equipment = normalizeEquipment(value.equipment, fallback.equipment);

  return syncPlayerBaseStats({
    coord,
    level: isFiniteNumber(value.level) ? value.level : fallback.level,
    masteryLevel: isFiniteNumber(value.masteryLevel)
      ? value.masteryLevel
      : fallback.masteryLevel,
    xp: isFiniteNumber(value.xp) ? value.xp : fallback.xp,
    hp: isFiniteNumber(value.hp) ? value.hp : fallback.hp,
    baseMaxHp: isFiniteNumber(value.baseMaxHp)
      ? value.baseMaxHp
      : fallback.baseMaxHp,
    mana: isFiniteNumber(value.mana) ? value.mana : fallback.mana,
    baseMaxMana: isFiniteNumber(value.baseMaxMana)
      ? value.baseMaxMana
      : fallback.baseMaxMana,
    hunger: isFiniteNumber(value.hunger) ? value.hunger : fallback.hunger,
    ...(isFiniteNumber(value.thirst)
      ? { thirst: value.thirst }
      : fallback.thirst === undefined
        ? {}
        : { thirst: fallback.thirst }),
    baseAttack: isFiniteNumber(value.baseAttack)
      ? value.baseAttack
      : fallback.baseAttack,
    baseDefense: isFiniteNumber(value.baseDefense)
      ? value.baseDefense
      : fallback.baseDefense,
    skills,
    learnedRecipeIds: isStringArray(value.learnedRecipeIds)
      ? [...value.learnedRecipeIds]
      : [...fallback.learnedRecipeIds],
    favoriteRecipeIds: isStringArray(value.favoriteRecipeIds)
      ? [...value.favoriteRecipeIds]
      : [...fallback.favoriteRecipeIds],
    inventory,
    equipment,
    statusEffects: value.statusEffects
      ? (normalizeStatusEffects(value.statusEffects) ?? [
          ...fallback.statusEffects,
        ])
      : [...fallback.statusEffects],
    ...(isFiniteNumber(value.consumableCooldownEndsAt)
      ? { consumableCooldownEndsAt: value.consumableCooldownEndsAt }
      : fallback.consumableCooldownEndsAt === undefined
        ? {}
        : { consumableCooldownEndsAt: fallback.consumableCooldownEndsAt }),
  });
}

function normalizeSkills(
  value: unknown,
  fallback: GameState['player']['skills'],
): GameState['player']['skills'] {
  return Object.fromEntries(
    getSkillNames().map((skill) => {
      const progress = isRecord(value) ? value[skill] : undefined;
      const fallbackProgress = fallback[skill];

      if (
        isRecord(progress) &&
        isFiniteNumber(progress.level) &&
        isFiniteNumber(progress.xp)
      ) {
        return [skill, { level: progress.level, xp: progress.xp }] as const;
      }

      return [
        skill,
        { level: fallbackProgress.level, xp: fallbackProgress.xp },
      ] as const;
    }),
  ) as GameState['player']['skills'];
}

function normalizeEquipment(
  value: unknown,
  fallback: GameState['player']['equipment'],
): GameState['player']['equipment'] {
  if (!isRecord(value)) {
    return cloneEquipment(fallback);
  }

  const entries = Object.entries(value).flatMap(([key, item]) => {
    if (!isEquipmentSlot(key)) {
      return [];
    }

    const normalizedItem = normalizeItem(item);
    return normalizedItem ? [[key, normalizedItem] as const] : [];
  });

  if (entries.length === 0) {
    return cloneEquipment(fallback);
  }

  return Object.fromEntries(
    entries as Array<readonly [string, Item]>,
  ) as GameState['player']['equipment'];
}
