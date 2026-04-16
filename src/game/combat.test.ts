import { describe, expect, it } from 'vitest';
import {
  enemyRarityIndex,
  enemyRarityMinimum,
  enemyRarityMultiplier,
  makeEnemy,
  resolveEnemyRarity,
} from './combat';

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
    const fieldEnemy = makeEnemy('combat-rarity-seed', { q: 2, r: 1 }, 'plains');
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
});
