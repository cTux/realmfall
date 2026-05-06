import { describe, expect, it } from 'vitest';
import { createPendingCombatEncounter } from '../../../game/stateCombatEngagement';
import { createGame } from '../../../game/stateFactory';
import type { GameState } from '../../../game/stateTypes';
import { WORLD_COMBAT_LUNGE_DURATION_MS } from '../../../game/worldCombatPresentation';
import type { WorldMovementTransition } from './movement/worldMovementTransition';
import {
  autoStartPendingCombat,
  getPendingCombatApproachDelayMs,
  getPendingCombatUpdatePlan,
  getPostCombatAutoStepTransition,
  stampPendingCombatIntro,
} from './pixiWorldPendingCombat';

function createPendingCombatGame() {
  const game = createGame(3, 'pixi-world-pending-combat');
  const targetCoord = { q: 1, r: 0 };
  const enemyId = 'enemy-1,0-0';

  game.player.coord = { q: 0, r: 0 };
  game.tiles['1,0'] = {
    coord: targetCoord,
    terrain: 'plains',
    items: [],
    enemyIds: [enemyId],
  };
  game.enemies[enemyId] = {
    id: enemyId,
    enemyTypeId: 'wolf',
    name: 'Wolf',
    coord: targetCoord,
    tier: 1,
    hp: 999,
    maxHp: 999,
    attack: 0,
    defense: 0,
    xp: 1,
    elite: false,
  };
  game.combat = createPendingCombatEncounter(game, {
    autoStepOnVictory: true,
    engageMode: 'staged-click',
    enemyIds: [enemyId],
    originCoord: { q: 0, r: 0 },
    stagingCoord: { q: 0, r: 0 },
    targetCoord,
    worldTimeMs: game.worldTimeMs,
  });

  return game;
}

describe('pixiWorldPendingCombat', () => {
  it('returns zero approach delay when the pending combat has no lunge phase', () => {
    const game = createPendingCombatGame();
    if (!game.combat?.engagement) {
      throw new Error('Expected pending combat engagement.');
    }

    game.combat.engagement.stagingCoord = { q: 1, r: 0 };

    expect(
      getPendingCombatApproachDelayMs({
        combat: game.combat,
        movementTransition: null,
        nowMs: 250,
        playerCoord: { q: 1, r: 0 },
      }),
    ).toBe(0);
  });

  it('schedules the combat-intro stamp after the remaining movement transition', () => {
    const game = createPendingCombatGame();
    if (!game.combat) {
      throw new Error('Expected pending combat.');
    }

    const movementTransition: WorldMovementTransition = {
      displayTiles: [],
      durationMs: 1000,
      fromCoord: { q: 0, r: 0 },
      incomingTiles: [],
      outgoingTiles: [],
      startedAtMs: 100,
      toCoord: { q: 1, r: 0 },
    };

    expect(
      getPendingCombatUpdatePlan({
        combat: game.combat,
        movementNowMs: 450,
        movementTransition,
        playerCoord: { q: 1, r: 0 },
        worldTimeMs: 9_999,
      }),
    ).toEqual({
      action: 'stamp',
      delayMs: 650,
    });
  });

  it('stamps startedAtMs only once for a pending combat intro', () => {
    const game = createPendingCombatGame();
    const gameRef = { current: game };

    const stamped = stampPendingCombatIntro({
      current: game,
      gameRef,
      worldTimeMs: 900,
    });
    const unchanged = stampPendingCombatIntro({
      current: stamped,
      gameRef,
      worldTimeMs: 1200,
    });

    expect(stamped.combat?.startedAtMs).toBe(900);
    expect(unchanged.combat?.startedAtMs).toBe(900);
    expect(gameRef.current.combat?.startedAtMs).toBe(900);
  });

  it('auto-starts combat after the intro delay completes', () => {
    const game = createPendingCombatGame();
    if (!game.combat) {
      throw new Error('Expected pending combat.');
    }

    game.combat.startedAtMs = 100;

    expect(
      getPendingCombatUpdatePlan({
        combat: game.combat,
        movementNowMs: 5,
        movementTransition: null,
        playerCoord: game.player.coord,
        worldTimeMs: 100 + WORLD_COMBAT_LUNGE_DURATION_MS,
      }),
    ).toEqual({
      action: 'start',
      delayMs: 0,
    });

    const started = autoStartPendingCombat({
      current: game,
      gameRef: { current: game },
      worldTimeMs: 100 + WORLD_COMBAT_LUNGE_DURATION_MS,
    });

    expect(started.combat?.started).toBe(true);
  });

  it('captures victory carryover offset and cooldown seeding for an auto-step', () => {
    const previousGame = createPendingCombatGame();
    if (!previousGame.combat) {
      throw new Error('Expected combat.');
    }

    previousGame.worldTimeMs = WORLD_COMBAT_LUNGE_DURATION_MS;
    previousGame.combat.started = true;
    previousGame.combat.startedAtMs = 0;
    previousGame.player.coord = { q: 0, r: 0 };
    const game = structuredClone(previousGame) as GameState;
    game.player.coord = { q: 1, r: 0 };
    game.combat = null;

    const transition = getPostCombatAutoStepTransition({
      app: {
        screen: {
          width: 1280,
          height: 720,
        },
      } as never,
      game,
      nowMs: 500,
      previousGame,
    });

    expect(transition?.cooldownEndAtMs).toBe(500 + 1000);
    expect(transition?.pendingVictoryTransitionOffset).toMatchObject({
      fromCoord: { q: 0, r: 0 },
      toCoord: { q: 1, r: 0 },
    });
  });

  it('returns null when carryover prerequisites are missing', () => {
    const previousGame = createPendingCombatGame();
    const game = structuredClone(previousGame) as GameState;
    game.combat = null;

    expect(
      getPostCombatAutoStepTransition({
        app: null,
        game,
        nowMs: 500,
        previousGame,
      }),
    ).toBeNull();
  });
});
