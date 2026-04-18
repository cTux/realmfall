import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ENEMY_MANA,
  enemyRarityIndex,
  enemyRarityMinimum,
  enemyRarityMultiplier,
  makeEnemy,
  resolveEnemyRarity,
} from './combat';
import { DEFAULT_CRITICAL_STRIKE_CHANCE } from './itemSecondaryStats';
import { getEnemyCriticalStrikeChance } from './state';

describe('enemy rarity', () => {
  it('promotes higher rarity tiers to larger stat multipliers', () => {
    expect(enemyRarityIndex('common')).toBe(0);
    expect(enemyRarityIndex('legendary')).toBe(4);
    expect(enemyRarityMultiplier('legendary')).toBeGreaterThan(
      enemyRarityMultiplier('epic'),
    );
    expect(enemyRarityMultiplier('epic')).toBeGreaterThan(
      enemyRarityMultiplier('rare'),
    );
  });

  it('keeps dungeon spawns at least uncommon and world bosses legendary', () => {
    expect(enemyRarityMinimum('dungeon', false)).toBe('uncommon');
    expect(enemyRarityMinimum(undefined, true)).toBe('legendary');
    expect(resolveEnemyRarity(() => 0.9, 'uncommon')).toBe('uncommon');
    expect(resolveEnemyRarity(() => 0.001, 'common')).toBe('legendary');
  });

  it('scales dungeon enemies above similar field spawns through rarity floors', () => {
    const fieldEnemy = makeEnemy(
      'combat-rarity-seed',
      { q: 2, r: 1 },
      'plains',
    );
    const dungeonEnemy = makeEnemy(
      'combat-rarity-seed',
      { q: 2, r: 1 },
      'plains',
      0,
      'dungeon',
    );

    expect(enemyRarityIndex(dungeonEnemy.rarity)).toBeGreaterThanOrEqual(
      enemyRarityIndex(fieldEnemy.rarity),
    );
    expect(dungeonEnemy.maxHp).toBeGreaterThan(fieldEnemy.maxHp);
    expect(dungeonEnemy.attack).toBeGreaterThanOrEqual(fieldEnemy.attack);
    expect(dungeonEnemy.defense).toBeGreaterThanOrEqual(fieldEnemy.defense);
    expect(dungeonEnemy.xp).toBeGreaterThan(fieldEnemy.xp);
  });

  it('keeps multi-enemy packs on the same hex to one enemy type', () => {
    const coord = { q: 3, r: -1 };
    const firstEnemy = makeEnemy('combat-pack-seed', coord, 'plains', 0);
    const secondEnemy = makeEnemy('combat-pack-seed', coord, 'plains', 1);
    const dungeonEnemy = makeEnemy(
      'combat-pack-seed',
      coord,
      'plains',
      2,
      'dungeon',
    );
    const secondDungeonEnemy = makeEnemy(
      'combat-pack-seed',
      coord,
      'plains',
      3,
      'dungeon',
    );

    expect(secondEnemy.enemyTypeId).toBe(firstEnemy.enemyTypeId);
    expect(secondEnemy.name).toBe(firstEnemy.name);
    expect(secondDungeonEnemy.enemyTypeId).toBe(dungeonEnemy.enemyTypeId);
    expect(secondDungeonEnemy.name).toBe(dungeonEnemy.name);
  });

  it('gives generated enemies a default mana pool for ability casting', () => {
    const enemy = makeEnemy('enemy-mana-seed', { q: 1, r: -1 }, 'plains');

    expect(enemy.mana).toBe(DEFAULT_ENEMY_MANA);
    expect(enemy.maxMana).toBe(DEFAULT_ENEMY_MANA);
  });

  it('gives generated enemies the baseline critical strike chance', () => {
    const enemy = makeEnemy('enemy-crit-seed', { q: 1, r: -1 }, 'plains');

    expect(getEnemyCriticalStrikeChance(enemy)).toBe(
      DEFAULT_CRITICAL_STRIKE_CHANCE,
    );
  });
});
