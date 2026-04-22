import { ENEMY_CONFIGS } from '../game/content/enemies';
import { ENEMY_TYPE_IDS } from '../game/content/ids';
import {
  EQUIPMENT_SLOTS,
  Skill,
  type Enemy,
  type GameState,
  type Item,
} from '../game/stateTypes';
import { RARITY_ORDER, STRUCTURE_TYPES, TERRAINS } from '../game/types';

const SKILL_NAMES = Object.values(Skill);
const ENEMY_TYPE_ID_SET = new Set<string>(ENEMY_TYPE_IDS);
const LEGACY_ENEMY_TYPE_ID_BY_NAME = Object.fromEntries(
  ENEMY_CONFIGS.map((config) => [config.name, config.id]),
) as Record<string, NonNullable<Enemy['enemyTypeId']>>;
const EQUIPMENT_SLOT_SET = new Set(EQUIPMENT_SLOTS);
const ITEM_RARITY_SET = new Set<string>(RARITY_ORDER);
const STRUCTURE_TYPE_SET = new Set<string>(STRUCTURE_TYPES);
const TERRAIN_SET = new Set<string>(TERRAINS);

type UnknownRecord = Record<string, unknown>;

export function getSkillNames() {
  return SKILL_NAMES;
}

export function normalizeHexCoord(value: unknown) {
  if (
    !isRecord(value) ||
    !isFiniteNumber(value.q) ||
    !isFiniteNumber(value.r)
  ) {
    return null;
  }

  return { q: value.q, r: value.r };
}

export function isDayPhase(value: unknown): value is GameState['dayPhase'] {
  return value === 'day' || value === 'night';
}

export function isTerrain(
  value: unknown,
): value is GameState['tiles'][string]['terrain'] {
  return typeof value === 'string' && TERRAIN_SET.has(value);
}

export function isStructure(
  value: unknown,
): value is NonNullable<GameState['tiles'][string]['structure']> {
  return typeof value === 'string' && STRUCTURE_TYPE_SET.has(value);
}

export function normalizeEnemyTypeId(
  value: unknown,
  name: unknown,
): NonNullable<Enemy['enemyTypeId']> | null {
  if (isEnemyTypeId(value)) {
    return value;
  }

  if (value !== undefined || typeof name !== 'string') {
    return null;
  }

  return LEGACY_ENEMY_TYPE_ID_BY_NAME[name] ?? null;
}

export function isItemRarity(value: unknown): value is Item['rarity'] {
  return typeof value === 'string' && ITEM_RARITY_SET.has(value);
}

export function isEquipmentSlot(
  value: unknown,
): value is NonNullable<Item['slot']> {
  return (
    typeof value === 'string' &&
    EQUIPMENT_SLOT_SET.has(value as NonNullable<Item['slot']>)
  );
}

export function isCooldownMap(value: unknown): value is Record<string, number> {
  return (
    isRecord(value) &&
    Object.values(value).every((entry) => isFiniteNumber(entry))
  );
}

export function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) && value.every((entry) => typeof entry === 'string')
  );
}

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function isEnemyTypeId(
  value: unknown,
): value is NonNullable<Enemy['enemyTypeId']> {
  return typeof value === 'string' && ENEMY_TYPE_ID_SET.has(value);
}
