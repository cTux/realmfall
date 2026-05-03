import { describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_ENEMY_MANA,
  enemyRarityIndex,
  enemyRarityMinimum,
  enemyRarityMultiplier,
  makeEnemy,
  resolveEnemyRarity,
} from './combat';
import { GAME_CONFIG } from './config';
import {
  DEFAULT_CRITICAL_STRIKE_CHANCE,
  DEFAULT_DODGE_CHANCE,
  DEFAULT_SUPPRESS_DAMAGE_CHANCE,
} from './itemSecondaryStats';
import {
  getEnemyCriticalStrikeChance,
  getEnemyDodgeChance,
  getEnemySuppressDamageChance,
} from './state';

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

  it('scales dungeon enemies above similar field spawns through rarity floors while keeping XP flat', () => {
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
    expect(dungeonEnemy.xp).toBe(fieldEnemy.xp);
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

  it('gives generated enemies baseline dodge and suppress-damage chances', () => {
    const enemy = makeEnemy('enemy-defense-seed', { q: 1, r: -1 }, 'plains');

    expect(getEnemyDodgeChance(enemy)).toBe(DEFAULT_DODGE_CHANCE);
    expect(getEnemySuppressDamageChance(enemy)).toBe(
      DEFAULT_SUPPRESS_DAMAGE_CHANCE,
    );
  });

  it('refreshes world boss names after i18n loads when the enemy spawned first', async () => {
    vi.resetModules();

    const i18n = await import('../i18n');
    const { makeEnemy: makeIsolatedEnemy } = await import('./combat');

    const enemy = makeIsolatedEnemy(
      'world-boss-i18n-seed',
      { q: 8, r: -4 },
      'forest',
      0,
      undefined,
      false,
      {
        enemyId: 'world-boss-8,-4',
        worldBoss: true,
      },
    );

    await i18n.loadI18n();

    expect(enemy.name).toBe('Gluttony');
  });

  it('can promote an eligible ordinary field spawn into a treasure goblin', () => {
    const previousChance =
      GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblin.chance;
    GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblin.chance = 1;

    try {
      const enemy = makeEnemy(
        'treasure-goblin-field-seed',
        { q: 2, r: 1 },
        'plains',
        0,
        undefined,
        false,
        {
          allowTreasureGoblinOverride: true,
        },
      );

      expect(enemy.enemyTypeId).toBe('treasure-goblin');
      expect(enemy.rarity).toBe('legendary');
    } finally {
      GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblin.chance =
        previousChance;
    }
  });

  it('does not promote dungeon or explicit enemy type paths into treasure goblins', () => {
    const previousChance =
      GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblin.chance;
    GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblin.chance = 1;

    try {
      const dungeonEnemy = makeEnemy(
        'treasure-goblin-dungeon-seed',
        { q: 2, r: 1 },
        'plains',
        0,
        'dungeon',
      );
      const explicitEnemy = makeEnemy(
        'treasure-goblin-explicit-seed',
        { q: 2, r: 1 },
        'plains',
        0,
        undefined,
        false,
        {
          enemyTypeId: 'wolf',
          rarity: 'legendary',
          allowTreasureGoblinOverride: true,
        },
      );

      expect(dungeonEnemy.enemyTypeId).not.toBe('treasure-goblin');
      expect(explicitEnemy.enemyTypeId).toBe('wolf');
    } finally {
      GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblin.chance =
        previousChance;
    }
  });

  it('multiplies treasure goblin HP above the ordinary legendary baseline without changing attack or defense', () => {
    const previousChance =
      GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblin.chance;
    GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblin.chance = 1;

    try {
      const baselineLegendary = makeEnemy(
        'treasure-goblin-baseline-seed',
        { q: 4, r: -2 },
        'plains',
        0,
        undefined,
        false,
        {
          enemyTypeId: 'wolf',
          rarity: 'legendary',
        },
      );
      const treasureGoblin = makeEnemy(
        'treasure-goblin-baseline-seed',
        { q: 4, r: -2 },
        'plains',
        0,
        undefined,
        false,
        {
          allowTreasureGoblinOverride: true,
        },
      );

      expect(treasureGoblin.maxHp).toBe(baselineLegendary.maxHp * 20);
      expect(treasureGoblin.attack).toBe(baselineLegendary.attack);
      expect(treasureGoblin.defense).toBe(baselineLegendary.defense);
    } finally {
      GAME_CONFIG.worldGeneration.enemySpawn.treasureGoblin.chance =
        previousChance;
    }
  });
});
