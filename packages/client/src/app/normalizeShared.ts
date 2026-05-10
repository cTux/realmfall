import * as v from 'valibot';

import {
  DUNGEON_TEMPLATE_IDS,
  DUNGEON_THEME_IDS,
  WORLD_KINDS,
} from '@realmfall/core/game/dungeons/types';
import { ENEMY_TYPE_IDS } from '@realmfall/core/game/content/ids';
import {
  EQUIPMENT_SLOTS,
  Skill,
  type Enemy,
  type GameState,
  type Item,
} from '@realmfall/core/game/stateTypes';
import {
  RARITY_ORDER,
  STRUCTURE_TYPES,
  TERRAINS,
} from '@realmfall/core/game/stateTypes';

const SKILL_NAMES = Object.values(Skill);
const ENEMY_TYPE_ID_SET = new Set<string>(ENEMY_TYPE_IDS);
const EQUIPMENT_SLOT_SET = new Set(EQUIPMENT_SLOTS);
const ITEM_RARITY_SET = new Set<string>(RARITY_ORDER);
const STRUCTURE_TYPE_SET = new Set<string>(STRUCTURE_TYPES);
const TERRAIN_SET = new Set<string>(TERRAINS);
const WORLD_KIND_SET = new Set<string>(WORLD_KINDS);
const DUNGEON_TEMPLATE_ID_SET = new Set<string>(DUNGEON_TEMPLATE_IDS);
const DUNGEON_THEME_ID_SET = new Set<string>(DUNGEON_THEME_IDS);
const finiteNumberSchema = v.pipe(v.number(), v.finite());
const hexCoordSchema = v.object({
  q: finiteNumberSchema,
  r: finiteNumberSchema,
});
const cooldownMapSchema = v.record(v.string(), finiteNumberSchema);
const stringArraySchema = v.array(v.string());
const dayPhaseSchema = v.picklist(['day', 'night'] as const);
const terrainSchema = v.picklist(TERRAINS);
const structureSchema = v.picklist(STRUCTURE_TYPES);
const itemRaritySchema = v.picklist(RARITY_ORDER);
const equipmentSlotSchema = v.picklist(EQUIPMENT_SLOTS);
const enemyTypeIdSchema = v.picklist(ENEMY_TYPE_IDS);
const worldKindSchema = v.picklist(WORLD_KINDS);
const dungeonTemplateIdSchema = v.picklist(DUNGEON_TEMPLATE_IDS);
const dungeonThemeIdSchema = v.picklist(DUNGEON_THEME_IDS);

type UnknownRecord = Record<string, unknown>;

export function getSkillNames() {
  return SKILL_NAMES;
}

export function normalizeHexCoord(value: unknown) {
  const result = v.safeParse(hexCoordSchema, value);
  return result.success ? result.output : null;
}

export function isDayPhase(value: unknown): value is GameState['dayPhase'] {
  return v.is(dayPhaseSchema, value);
}

export function isTerrain(
  value: unknown,
): value is GameState['tiles'][string]['terrain'] {
  return v.is(terrainSchema, value) && TERRAIN_SET.has(value);
}

export function isStructure(
  value: unknown,
): value is NonNullable<GameState['tiles'][string]['structure']> {
  return v.is(structureSchema, value) && STRUCTURE_TYPE_SET.has(value);
}

export function normalizeEnemyTypeId(
  value: unknown,
): NonNullable<Enemy['enemyTypeId']> | null {
  return isEnemyTypeId(value) ? value : null;
}

export function isWorldKind(value: unknown): value is 'surface' | 'dungeon' {
  return v.is(worldKindSchema, value) && WORLD_KIND_SET.has(value);
}

export function isDungeonTemplateId(
  value: unknown,
): value is (typeof DUNGEON_TEMPLATE_IDS)[number] {
  return (
    v.is(dungeonTemplateIdSchema, value) && DUNGEON_TEMPLATE_ID_SET.has(value)
  );
}

export function isDungeonThemeId(
  value: unknown,
): value is (typeof DUNGEON_THEME_IDS)[number] {
  return v.is(dungeonThemeIdSchema, value) && DUNGEON_THEME_ID_SET.has(value);
}

export function isItemRarity(value: unknown): value is Item['rarity'] {
  return v.is(itemRaritySchema, value) && ITEM_RARITY_SET.has(value);
}

export function isEquipmentSlot(
  value: unknown,
): value is NonNullable<Item['slot']> {
  return v.is(equipmentSlotSchema, value) && EQUIPMENT_SLOT_SET.has(value);
}

export function isCooldownMap(value: unknown): value is Record<string, number> {
  return v.is(cooldownMapSchema, value);
}

export function isStringArray(value: unknown): value is string[] {
  return v.is(stringArraySchema, value);
}

export function isFiniteNumber(value: unknown): value is number {
  return v.is(finiteNumberSchema, value);
}

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null;
}

function isEnemyTypeId(
  value: unknown,
): value is NonNullable<Enemy['enemyTypeId']> {
  return v.is(enemyTypeIdSchema, value) && ENEMY_TYPE_ID_SET.has(value);
}
