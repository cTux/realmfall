import { describe, expect, it } from 'vitest';
import { t } from '../i18n';
import { createCombatActorState } from './combat';
import { TREASURE_GOBLIN_BALANCE } from './config';
import { StatusEffectTypeId } from './content/ids';
import { hexDistance } from './hex';
import { startEnemyCasts } from './stateCombatCasting';
import { createGame } from './stateFactory';
import { applyPlayerAbility } from './stateCombatPlayerAbility';
import {
  findTreasureGoblinEscapeCoord,
  isTreasureGoblinEnemy,
} from './stateCombatTreasureGoblinTestkit';
import type { GameState } from './types';
import { processEnemyStatusEffects } from './combatStatus';
import { handleEnemyDefeat } from './stateCombatEnemyDefeat';

describe('treasure goblin combat behavior', () => {
  it('never starts attacking or casting', () => {
    const game = createTreasureGoblinCombatGame('treasure-goblin-cast');

    const changed = startEnemyCasts(game);

    expect(changed).toBe(false);
    expect(game.combat?.enemies[game.combat.enemyIds[0]!]!.casting).toBeNull();
  });

  it('teleports away and ends combat after the configured number of successful damaging hits', () => {
    const game = createTreasureGoblinCombatGame('treasure-goblin-escape');
    const enemyId = game.combat!.enemyIds[0]!;
    const escapeCoord = { q: 4, r: 0 };
    const combatTileEnemyIds = game.tiles['2,0']!.enemyIds;

    blockEscapeTilesExcept(game, escapeCoord);
    game.combat!.enemyStateById[enemyId] = {
      treasureGoblin: {
        damageHitsTaken: TREASURE_GOBLIN_BALANCE.fleeHitsMax - 1,
        fleeHitsRequired: TREASURE_GOBLIN_BALANCE.fleeHitsMax,
      },
    };

    applyPlayerAbility(game, 'kick', enemyId);

    expect(game.combat).toBeNull();
    expect(game.enemies[enemyId]?.coord).toEqual(escapeCoord);
    expect(game.tiles['2,0']?.enemyIds).toEqual(
      combatTileEnemyIds.filter((candidate) => candidate !== enemyId),
    );
    expect(game.tiles['4,0']?.enemyIds).toContain(enemyId);
    expect(
      hexDistance(game.player.coord, game.enemies[enemyId]!.coord),
    ).toBeLessThanOrEqual(TREASURE_GOBLIN_BALANCE.fleeRadius);
    expect(
      game.logs.some((entry) =>
        entry.text.endsWith(
          `${game.enemies[enemyId]!.name}: ${t('game.message.fled')}`,
        ),
      ),
    ).toBe(true);
  });

  it('opens a follow-on encounter when a treasure goblin escapes from a mixed encounter', () => {
    const game = createTreasureGoblinCombatGame('treasure-goblin-mixed-escape');
    const goblinId = game.combat!.enemyIds[0]!;
    const otherEnemyId = 'enemy-2,0-1';
    const escapeCoord = { q: 4, r: 0 };

    game.tiles['2,0']!.enemyIds.push(otherEnemyId);
    game.enemies[otherEnemyId] = {
      id: otherEnemyId,
      enemyTypeId: 'wolf',
      name: 'Wolf',
      coord: { q: 2, r: 0 },
      rarity: 'common',
      tier: 1,
      hp: 30,
      maxHp: 30,
      attack: 3,
      defense: 0,
      xp: 2,
      elite: false,
      statusEffects: [],
      abilityIds: ['kick'],
    };
    game.combat!.enemyIds.push(otherEnemyId);
    game.combat!.enemies[otherEnemyId] = createCombatActorState(0, ['kick']);
    game.combat!.enemyStateById[otherEnemyId] = {};
    game.combat!.enemyStateById[goblinId] = {
      treasureGoblin: {
        damageHitsTaken: TREASURE_GOBLIN_BALANCE.fleeHitsMax - 1,
        fleeHitsRequired: TREASURE_GOBLIN_BALANCE.fleeHitsMax,
      },
    };
    blockEscapeTilesExcept(game, escapeCoord);

    applyPlayerAbility(game, 'kick', goblinId);

    expect(game.combat).not.toBeNull();
    expect(game.combat?.started).toBe(true);
    expect(game.combat?.coord).toEqual({ q: 2, r: 0 });
    expect(game.combat?.enemyIds).toEqual([otherEnemyId]);
    expect(game.enemies[goblinId]?.coord).toEqual(escapeCoord);
    expect(game.tiles['2,0']?.enemyIds).toEqual([otherEnemyId]);
    expect(game.enemies[otherEnemyId]?.hp).toBe(30);
    expect(game.logs.some((entry) => /encounter/i.test(entry.text))).toBe(true);
    expect(game.logs.some((entry) => /battle is over/i.test(entry.text))).toBe(
      true,
    );
  });

  it('preserves a null engagement target when a goblin escape rebuilds the encounter', () => {
    const game = createTreasureGoblinCombatGame(
      'treasure-goblin-null-target-follow-on',
    );
    const goblinId = game.combat!.enemyIds[0]!;
    const otherEnemyId = 'enemy-2,0-1';
    const escapeCoord = { q: 4, r: 0 };

    game.combat!.engagement = {
      autoStepOnVictory: true,
      engageMode: 'enemy-chase',
      originCoord: { q: 1, r: 0 },
      stagingCoord: { q: 2, r: 0 },
      targetCoord: null,
    };
    game.tiles['2,0']!.enemyIds.push(otherEnemyId);
    game.enemies[otherEnemyId] = {
      id: otherEnemyId,
      enemyTypeId: 'wolf',
      name: 'Wolf',
      coord: { q: 2, r: 0 },
      rarity: 'common',
      tier: 1,
      hp: 30,
      maxHp: 30,
      attack: 3,
      defense: 0,
      xp: 2,
      elite: false,
      statusEffects: [],
      abilityIds: ['kick'],
    };
    game.combat!.enemyIds.push(otherEnemyId);
    game.combat!.enemies[otherEnemyId] = createCombatActorState(0, ['kick']);
    game.combat!.enemyStateById[otherEnemyId] = {};
    game.combat!.enemyStateById[goblinId] = {
      treasureGoblin: {
        damageHitsTaken: TREASURE_GOBLIN_BALANCE.fleeHitsMax - 1,
        fleeHitsRequired: TREASURE_GOBLIN_BALANCE.fleeHitsMax,
      },
    };
    blockEscapeTilesExcept(game, escapeCoord);

    applyPlayerAbility(game, 'kick', goblinId);

    expect(game.combat?.engagement?.targetCoord).toBeNull();
  });

  it('zero-damage hits do not advance flee progress', () => {
    const game = createTreasureGoblinCombatGame('treasure-goblin-zero-damage');
    const enemyId = game.combat!.enemyIds[0]!;

    game.enemies[enemyId]!.defense = 999;

    applyPlayerAbility(game, 'kick', enemyId);

    expect(
      game.combat?.enemyStateById[enemyId]?.treasureGoblin?.damageHitsTaken,
    ).toBe(0);
    expect(game.combat).not.toBeNull();
  });

  it('blocked destinations produce no teleport target', () => {
    const game = createTreasureGoblinCombatGame('treasure-goblin-blocked');

    blockEscapeTilesExcept(game, undefined);

    expect(
      findTreasureGoblinEscapeCoord(game, game.enemies['enemy-2,0-0']!),
    ).toBeNull();
  });

  it('counts ticking damage toward escape without defeating the goblin', () => {
    const game = createTreasureGoblinCombatGame('treasure-goblin-dot');
    const enemyId = game.combat!.enemyIds[0]!;
    const escapeCoord = { q: 4, r: 0 };

    blockEscapeTilesExcept(game, escapeCoord);
    game.combat!.enemyStateById[enemyId] = {
      treasureGoblin: {
        damageHitsTaken: TREASURE_GOBLIN_BALANCE.fleeHitsMin - 1,
        fleeHitsRequired: TREASURE_GOBLIN_BALANCE.fleeHitsMin,
      },
    };
    game.enemies[enemyId]!.statusEffects = [
      {
        id: StatusEffectTypeId.Burning,
        value: 1,
        tickIntervalMs: 1_000,
        lastProcessedAt: 0,
        expiresAt: 10_000,
      },
    ];
    game.worldTimeMs = 1_000;

    const changed = processEnemyStatusEffects(game, handleEnemyDefeat);

    expect(changed).toBe(true);
    expect(game.combat).toBeNull();
    expect(game.enemies[enemyId]?.hp).toBeGreaterThan(0);
    expect(game.enemies[enemyId]?.coord).toEqual(escapeCoord);
  });

  it('stops later player ability effects after the goblin escape ends combat', () => {
    const game = createTreasureGoblinCombatGame('treasure-goblin-stop-effects');
    const enemyId = game.combat!.enemyIds[0]!;
    const escapeCoord = { q: 4, r: 0 };

    blockEscapeTilesExcept(game, escapeCoord);
    game.combat!.enemyStateById[enemyId] = {
      treasureGoblin: {
        damageHitsTaken: TREASURE_GOBLIN_BALANCE.fleeHitsMin - 1,
        fleeHitsRequired: TREASURE_GOBLIN_BALANCE.fleeHitsMin,
      },
    };

    applyPlayerAbility(game, 'crushingBlow', enemyId);

    expect(game.combat).toBeNull();
    expect(game.enemies[enemyId]?.coord).toEqual(escapeCoord);
    expect(game.enemies[enemyId]?.statusEffects).toEqual([]);
    expect(game.logs.some((entry) => /weakened/i.test(entry.text))).toBe(false);
  });
});

function createTreasureGoblinCombatGame(seed: string) {
  const game = createGame(8, seed);
  const coord = { q: 2, r: 0 };
  const enemyId = 'enemy-2,0-0';

  game.player.coord = { q: 1, r: 0 };
  game.tiles['2,0'] = {
    coord,
    terrain: 'plains',
    items: [],
    structure: undefined,
    enemyIds: [enemyId],
  };
  game.enemies[enemyId] = {
    id: enemyId,
    enemyTypeId: 'treasure-goblin',
    name: 'Treasure Goblin',
    coord,
    rarity: 'legendary',
    tier: 3,
    hp: 200,
    maxHp: 200,
    attack: 5,
    defense: 0,
    xp: 5,
    elite: true,
    statusEffects: [],
    abilityIds: ['kick'],
  };
  game.combat = {
    coord,
    enemyIds: [enemyId],
    started: true,
    startedAtMs: 0,
    player: createCombatActorState(0, ['kick']),
    enemies: {
      [enemyId]: createCombatActorState(0, ['kick']),
    },
    enemyStateById: {
      [enemyId]: {
        treasureGoblin: {
          damageHitsTaken: 0,
          fleeHitsRequired: TREASURE_GOBLIN_BALANCE.fleeHitsMin,
        },
      },
    },
  };

  expect(isTreasureGoblinEnemy(game.enemies[enemyId]!)).toBe(true);

  return game;
}

function blockEscapeTilesExcept(
  game: GameState,
  allowedCoord?: { q: number; r: number },
) {
  for (
    let q = -TREASURE_GOBLIN_BALANCE.fleeRadius;
    q <= TREASURE_GOBLIN_BALANCE.fleeRadius;
    q += 1
  ) {
    for (
      let r = -TREASURE_GOBLIN_BALANCE.fleeRadius;
      r <= TREASURE_GOBLIN_BALANCE.fleeRadius;
      r += 1
    ) {
      const coord = {
        q: game.combat!.coord.q + q,
        r: game.combat!.coord.r + r,
      };
      if (
        hexDistance(game.combat!.coord, coord) >
        TREASURE_GOBLIN_BALANCE.fleeRadius
      ) {
        continue;
      }

      const key = `${coord.q},${coord.r}`;
      const isAllowed =
        allowedCoord?.q === coord.q && allowedCoord.r === coord.r;
      const isPlayerHex =
        coord.q === game.player.coord.q && coord.r === game.player.coord.r;
      const isCombatHex =
        coord.q === game.combat!.coord.q && coord.r === game.combat!.coord.r;
      if (isAllowed || isPlayerHex || isCombatHex) {
        game.tiles[key] = {
          coord,
          terrain: 'plains',
          items: [],
          structure: undefined,
          enemyIds: game.tiles[key]?.enemyIds ?? [],
        };
        continue;
      }

      game.tiles[key] = {
        coord,
        terrain: 'plains',
        items: [],
        structure: 'camp',
        enemyIds: [],
      };
    }
  }
}
