import { clampItemLevel } from '../game/balance';
import { getItemConfigByKey } from '../game/content/items';
import type { Enemy, Item } from '../game/stateTypes';
import {
  isEquipmentSlot,
  isFiniteNumber,
  isItemRarity,
  isRecord,
  isStringArray,
} from './normalizeShared';

export function normalizeSavedUiItem(item: unknown) {
  return normalizeItem(item);
}

export function normalizeItems(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }

  const items = value.map((item) => normalizeItem(item));
  return items.every((item): item is Item => item !== null) ? items : null;
}

export function normalizeItem(value: unknown): Item | null {
  if (!isRecord(value)) {
    return null;
  }

  const secondaryStats = normalizeSecondaryStats(value.secondaryStats);
  if (
    typeof value.id !== 'string' ||
    typeof value.name !== 'string' ||
    !isFiniteNumber(value.quantity) ||
    !isFiniteNumber(value.tier) ||
    !isItemRarity(value.rarity) ||
    !isFiniteNumber(value.power) ||
    !isFiniteNumber(value.defense) ||
    !isFiniteNumber(value.maxHp) ||
    !isFiniteNumber(value.healing) ||
    secondaryStats === null
  ) {
    return null;
  }

  if (
    (value.itemKey !== undefined && typeof value.itemKey !== 'string') ||
    (value.tags !== undefined && !isStringArray(value.tags)) ||
    (value.recipeId !== undefined && typeof value.recipeId !== 'string') ||
    (value.locked !== undefined && typeof value.locked !== 'boolean') ||
    (value.slot !== undefined && !isEquipmentSlot(value.slot)) ||
    (value.icon !== undefined && typeof value.icon !== 'string') ||
    (value.hunger !== undefined && !isFiniteNumber(value.hunger)) ||
    (value.thirst !== undefined && !isFiniteNumber(value.thirst)) ||
    (value.secondaryStatCapacity !== undefined &&
      !isFiniteNumber(value.secondaryStatCapacity)) ||
    (value.reforgedSecondaryStatIndex !== undefined &&
      !isFiniteNumber(value.reforgedSecondaryStatIndex)) ||
    (value.enchantedSecondaryStatIndex !== undefined &&
      !isFiniteNumber(value.enchantedSecondaryStatIndex)) ||
    (value.corrupted !== undefined && typeof value.corrupted !== 'boolean') ||
    (value.grantedAbilityId !== undefined &&
      typeof value.grantedAbilityId !== 'string')
  ) {
    return null;
  }

  const validReforgedSecondaryStatIndex =
    value.reforgedSecondaryStatIndex !== undefined &&
    secondaryStats !== undefined &&
    Number.isInteger(value.reforgedSecondaryStatIndex) &&
    value.reforgedSecondaryStatIndex >= 0 &&
    value.reforgedSecondaryStatIndex < secondaryStats.length
      ? value.reforgedSecondaryStatIndex
      : undefined;
  const validEnchantedSecondaryStatIndex =
    value.enchantedSecondaryStatIndex !== undefined &&
    secondaryStats !== undefined &&
    Number.isInteger(value.enchantedSecondaryStatIndex) &&
    value.enchantedSecondaryStatIndex >= 0 &&
    value.enchantedSecondaryStatIndex < secondaryStats.length
      ? value.enchantedSecondaryStatIndex
      : undefined;

  return {
    id: value.id,
    ...(value.itemKey === undefined ? {} : { itemKey: value.itemKey }),
    ...(value.tags === undefined
      ? {}
      : { tags: [...value.tags] as Item['tags'] }),
    ...(value.recipeId === undefined ? {} : { recipeId: value.recipeId }),
    ...(value.locked === undefined ? {} : { locked: value.locked }),
    ...(value.slot === undefined ? {} : { slot: value.slot }),
    ...(value.icon === undefined ? {} : { icon: value.icon }),
    name:
      (value.itemKey !== undefined
        ? getItemConfigByKey(value.itemKey)?.name
        : undefined) ?? value.name,
    quantity: value.quantity,
    tier: clampItemLevel(value.tier),
    rarity: value.rarity,
    power: value.power,
    defense: value.defense,
    maxHp: value.maxHp,
    healing: value.healing,
    hunger: value.hunger ?? 0,
    ...(value.thirst === undefined ? {} : { thirst: value.thirst }),
    ...(value.secondaryStatCapacity === undefined
      ? {}
      : { secondaryStatCapacity: value.secondaryStatCapacity }),
    ...(secondaryStats === undefined
      ? {}
      : { secondaryStats: secondaryStats as Item['secondaryStats'] }),
    ...(validReforgedSecondaryStatIndex === undefined
      ? {}
      : { reforgedSecondaryStatIndex: validReforgedSecondaryStatIndex }),
    ...(validEnchantedSecondaryStatIndex === undefined
      ? {}
      : { enchantedSecondaryStatIndex: validEnchantedSecondaryStatIndex }),
    ...(value.corrupted === undefined ? {} : { corrupted: value.corrupted }),
    ...(value.grantedAbilityId === undefined
      ? {}
      : { grantedAbilityId: value.grantedAbilityId }),
  };
}

export function normalizeStatusEffects(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const statusEffects = value.map((effect) => {
    if (!isRecord(effect) || typeof effect.id !== 'string') {
      return null;
    }

    if (
      (effect.tags !== undefined && !isStringArray(effect.tags)) ||
      (effect.expiresAt !== undefined && !isFiniteNumber(effect.expiresAt)) ||
      (effect.tickIntervalMs !== undefined &&
        !isFiniteNumber(effect.tickIntervalMs)) ||
      (effect.lastProcessedAt !== undefined &&
        !isFiniteNumber(effect.lastProcessedAt)) ||
      (effect.stacks !== undefined && !isFiniteNumber(effect.stacks)) ||
      (effect.value !== undefined && !isFiniteNumber(effect.value))
    ) {
      return null;
    }

    return {
      id: effect.id,
      ...(effect.tags === undefined ? {} : { tags: [...effect.tags] }),
      ...(effect.expiresAt === undefined
        ? {}
        : { expiresAt: effect.expiresAt }),
      ...(effect.tickIntervalMs === undefined
        ? {}
        : { tickIntervalMs: effect.tickIntervalMs }),
      ...(effect.lastProcessedAt === undefined
        ? {}
        : { lastProcessedAt: effect.lastProcessedAt }),
      ...(effect.stacks === undefined ? {} : { stacks: effect.stacks }),
      ...(effect.value === undefined ? {} : { value: effect.value }),
    };
  });

  return statusEffects.every(
    (
      effect,
    ): effect is NonNullable<NonNullable<Enemy['statusEffects']>[number]> =>
      effect !== null,
  )
    ? statusEffects
    : null;
}

function normalizeSecondaryStats(value: unknown) {
  if (value === undefined) {
    return undefined;
  }

  if (!Array.isArray(value)) {
    return null;
  }

  const secondaryStats = value.map((stat) => {
    if (
      !isRecord(stat) ||
      typeof stat.key !== 'string' ||
      !isFiniteNumber(stat.value)
    ) {
      return null;
    }

    return { key: stat.key, value: stat.value };
  });

  return secondaryStats.every(
    (stat): stat is { key: string; value: number } => stat !== null,
  )
    ? secondaryStats
    : null;
}
