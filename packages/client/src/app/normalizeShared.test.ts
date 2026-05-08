import { ENEMY_TYPE_IDS } from '../game/content/ids';
import { EQUIPMENT_SLOTS, Skill, RARITY_ORDER } from '../game/stateTypes';
import { STRUCTURE_TYPES, TERRAINS } from '../game/stateTypes';
import {
  getSkillNames,
  isCooldownMap,
  isEquipmentSlot,
  isFiniteNumber,
  isItemRarity,
  isStringArray,
  isStructure,
  isTerrain,
  normalizeEnemyTypeId,
  normalizeHexCoord,
} from './normalizeSharedTestkit';

describe('normalizeShared', () => {
  it('normalizes valid hex coordinates and rejects malformed values', () => {
    expect(normalizeHexCoord({ q: 3, r: -2, ignored: true })).toEqual({
      q: 3,
      r: -2,
    });
    expect(normalizeHexCoord({ q: '3', r: -2 })).toBeNull();
    expect(normalizeHexCoord(null)).toBeNull();
  });

  it('accepts canonical runtime picklist values', () => {
    expect(getSkillNames()).toEqual(Object.values(Skill));
    expect(getSkillNames()).toContain(Skill.Lockpicking);
    expect(isTerrain(TERRAINS[TERRAINS.length - 1])).toBe(true);
    expect(isStructure('locked-chest')).toBe(true);
    expect(isStructure(STRUCTURE_TYPES[STRUCTURE_TYPES.length - 1])).toBe(true);
    expect(isItemRarity(RARITY_ORDER[RARITY_ORDER.length - 1])).toBe(true);
    expect(isEquipmentSlot(EQUIPMENT_SLOTS[EQUIPMENT_SLOTS.length - 1])).toBe(
      true,
    );
    expect(normalizeEnemyTypeId('mimic')).toBe('mimic');
    expect(
      normalizeEnemyTypeId(ENEMY_TYPE_IDS[ENEMY_TYPE_IDS.length - 1]),
    ).toBe(ENEMY_TYPE_IDS[ENEMY_TYPE_IDS.length - 1]);
  });

  it('rejects invalid numeric and collection helper values', () => {
    expect(isFiniteNumber(42)).toBe(true);
    expect(isFiniteNumber(Number.NaN)).toBe(false);
    expect(isCooldownMap({ a: 1, b: 2 })).toBe(true);
    expect(isCooldownMap({ a: Number.POSITIVE_INFINITY })).toBe(false);
    expect(isStringArray(['alpha', 'beta'])).toBe(true);
    expect(isStringArray(['alpha', 1])).toBe(false);
  });
});
