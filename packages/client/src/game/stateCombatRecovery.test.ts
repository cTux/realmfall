import {
  createGame,
  getPlayerCombatStats,
  moveToTile,
  startCombat,
  syncPlayerStatusEffects,
} from './state';
import {
  createCombatEncounterGame,
  seedCombatEncounter,
} from './stateCombatTestHelpers';

describe('game state combat recovery', () => {
  it('respawns the player at the home hex with death effects applied', () => {
    const game = createCombatEncounterGame('death-respawn-seed');
    seedCombatEncounter(game, {
      id: 'enemy-2,0-0',
      name: 'Wolf',
      tier: 1,
      hp: 200,
      maxHp: 200,
      attack: 60,
      defense: 0,
      xp: 1,
      elite: false,
    });
    game.homeHex = { q: -2, r: 1 };
    game.player.hunger = 7;
    game.player.thirst = 3;
    game.player.hp = 5;
    game.player.mana = 9;
    game.player.consumableCooldownEndsAt = 80_000;

    const respawned = startCombat(moveToTile(game, { q: 2, r: 0 }));
    const stats = getPlayerCombatStats(respawned.player);

    expect(respawned.player.coord).toEqual(game.homeHex);
    expect(respawned.player.hunger).toBe(300);
    expect(respawned.player.thirst).toBe(300);
    expect(respawned.player.hp).toBe(1);
    expect(respawned.player.mana).toBe(1);
    expect(stats.maxHp).toBe(Math.floor(respawned.player.baseMaxHp * 0.9));
    expect(respawned.player.statusEffects.map((effect) => effect.id)).toEqual([
      'recentDeath',
    ]);
    expect(respawned.player.consumableCooldownEndsAt).toBe(0);
  });

  it('regenerates 1 percent hp and mp per second outside combat', () => {
    const game = createGame(3, 'death-restoration-seed');
    game.player.baseMaxHp = 1_000;
    game.player.baseMaxMana = 100;
    game.player.hp = 1;
    game.player.mana = 1;
    game.player.statusEffects = [{ id: 'recentDeath' }];

    const afterOneSecond = syncPlayerStatusEffects(game, 1_000);
    expect(afterOneSecond.player.hp).toBe(10);
    expect(afterOneSecond.player.mana).toBe(2);
    expect(
      afterOneSecond.player.statusEffects.some(
        (effect) => effect.id === 'restoration',
      ),
    ).toBe(false);

    const afterExpiry = syncPlayerStatusEffects(afterOneSecond, 100_000);
    expect(afterExpiry.player.hp).toBe(900);
    expect(afterExpiry.player.mana).toBe(100);
    expect(
      afterExpiry.player.statusEffects.some(
        (effect) => effect.id === 'restoration',
      ),
    ).toBe(false);
    expect(
      afterExpiry.player.statusEffects.some(
        (effect) => effect.id === 'recentDeath',
      ),
    ).toBe(true);
  });
});
