import { describe, expect, it } from 'vitest';
import { BASE_ENEMY_XP, MAX_PLAYER_LEVEL } from './config';
import { makeEnemy } from './combat';
import {
  gainXp,
  getPlayerStats,
  levelThreshold,
  masteryLevelThreshold,
  resolveExperienceAward,
} from './progression';
import { createGame } from './state';
import { addLog } from './logs';

describe('progression', () => {
  it('uses the exponential ordinary level curve from level 1 to level 100', () => {
    expect(levelThreshold(1)).toBe(BASE_ENEMY_XP);
    expect(levelThreshold(MAX_PLAYER_LEVEL - 1)).toBe(20_000_000);
    expect(levelThreshold(50)).toBeGreaterThan(levelThreshold(49));
    expect(levelThreshold(75)).toBeGreaterThan(levelThreshold(25));
  });

  it('starts mastery at 25,000,000 XP and grows each level by 5 percent', () => {
    expect(masteryLevelThreshold(0)).toBe(25_000_000);
    expect(masteryLevelThreshold(1)).toBe(26_250_000);
    expect(masteryLevelThreshold(2)).toBe(27_562_500);
  });

  it('lets one base enemy kill raise the player from level 1 to level 2', () => {
    const game = createGame(3, 'one-kill-level-seed');

    gainXp(game, BASE_ENEMY_XP, addLog);

    expect(game.player.level).toBe(2);
    expect(game.player.xp).toBe(0);
  });

  it('applies uncapped bonus experience from equipment to XP gains', () => {
    const game = createGame(3, 'bonus-experience-seed');
    game.player.equipment.amulet = {
      id: 'bonus-experience-amulet',
      name: 'Bonus Experience Amulet',
      slot: 'amulet',
      quantity: 1,
      tier: 100,
      rarity: 'legendary',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 0,
      hunger: 0,
      thirst: 0,
      secondaryStats: [{ key: 'bonusExperience', value: 143 }],
    };

    const stats = getPlayerStats(game.player);

    expect(stats.bonusExperience).toBe(143);
    expect(stats.secondaryStatTotals?.bonusExperience).toEqual({
      effective: 143,
      raw: 143,
    });
    expect(resolveExperienceAward(game.player, BASE_ENEMY_XP)).toBe(49);

    gainXp(game, BASE_ENEMY_XP, addLog);

    expect(game.player.level).toBe(3);
    expect(game.player.xp).toBe(49 - levelThreshold(1) - levelThreshold(2));
  });

  it('gives every generated enemy the same base XP reward', () => {
    const commonEnemy = makeEnemy('enemy-xp-seed', { q: 0, r: 0 }, 'plains');
    const dungeonEnemy = makeEnemy(
      'enemy-xp-seed',
      { q: 9, r: -4 },
      'rift',
      0,
      'dungeon',
    );
    const worldBoss = makeEnemy(
      'enemy-xp-seed',
      { q: 12, r: -6 },
      'forest',
      0,
      undefined,
      false,
      { enemyId: 'world-boss-12,-6', worldBoss: true },
    );

    expect(commonEnemy.xp).toBe(BASE_ENEMY_XP);
    expect(dungeonEnemy.xp).toBe(BASE_ENEMY_XP);
    expect(worldBoss.xp).toBe(BASE_ENEMY_XP);
  });
});
