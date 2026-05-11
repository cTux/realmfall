import {
  getWorldHexSize,
  tileToPoint,
} from '../../../ui/world/renderSceneMath';
import { WORLD_REVEAL_RADIUS } from '@realmfall/core/game/config';
import { createGame } from '@realmfall/core/game/stateFactory';
import { createWorldClickHandler } from './pixiWorldClickNavigationTestkit';

function createMovementController() {
  return {
    queueHostileApproach: vi.fn(),
    replaceQueuedPath: vi.fn(),
    startHostileEngagement: vi.fn(),
  };
}

describe('createWorldClickHandler', () => {
  const app = {
    screen: { width: 800, height: 600 },
  } as const;

  it('queues an adjacent click through the movement controller', () => {
    const game = createGame(2, 'adjacent-click-command');
    const movementController = createMovementController();
    const adjacentPoint = tileToPoint(
      { q: 1, r: 0 },
      app.screen.width / 2,
      app.screen.height / 2,
      getWorldHexSize(app.screen, game.radius),
    );

    const handleClick = createWorldClickHandler({
      app: app as never,
      gameRef: { current: game },
      getScenePoint: () => ({ x: adjacentPoint.x, y: adjacentPoint.y }),
      pausedRef: { current: false },
      playerCoordRef: { current: game.player.coord },
      renderInvalidationRef: { current: 0 },
      selectedRef: { current: game.player.coord },
      movementController,
    });

    handleClick(320, 240);

    expect(movementController.replaceQueuedPath).toHaveBeenCalledWith([
      { q: 1, r: 0 },
    ]);
  });

  it('ignores movement clicks while combat is active', () => {
    const game = createGame(2, 'combat-active-click-command');
    const movementController = createMovementController();
    game.combat = {
      coord: { q: 1, r: 0 },
      enemyIds: ['enemy-1,0-0'],
      engagement: {
        autoStepOnVictory: false,
        engageMode: 'tile-step',
        originCoord: { q: 0, r: 0 },
        stagingCoord: { q: 1, r: 0 },
        targetCoord: { q: 1, r: 0 },
      },
      started: true,
      startedAtMs: 0,
      player: {
        abilityIds: ['kick'],
        cooldownEndsAt: {},
        globalCooldownEndsAt: 0,
        globalCooldownMs: 2_000,
        hp: 10,
        mana: 5,
      },
    } as never;
    const adjacentPoint = tileToPoint(
      { q: 1, r: 0 },
      app.screen.width / 2,
      app.screen.height / 2,
      getWorldHexSize(app.screen, game.radius),
    );
    const selectedRef = { current: game.player.coord };
    const renderInvalidationRef = { current: 0 };

    const handleClick = createWorldClickHandler({
      app: app as never,
      gameRef: { current: game },
      getScenePoint: () => ({ x: adjacentPoint.x, y: adjacentPoint.y }),
      pausedRef: { current: false },
      playerCoordRef: { current: game.player.coord },
      renderInvalidationRef,
      selectedRef,
      movementController,
    });

    handleClick(320, 240);

    expect(movementController.replaceQueuedPath).not.toHaveBeenCalled();
    expect(movementController.queueHostileApproach).not.toHaveBeenCalled();
    expect(movementController.startHostileEngagement).not.toHaveBeenCalled();
    expect(selectedRef.current).toEqual(game.player.coord);
    expect(renderInvalidationRef.current).toBe(0);
  });

  it('maps clicks against the animated world center during a move transition', () => {
    const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(0);
    const game = createGame(2, 'transition-click-command');
    const movementController = createMovementController();
    game.player.coord = { q: 1, r: 0 };

    const handleClick = createWorldClickHandler({
      app: app as never,
      gameRef: { current: game },
      getScenePoint: () => ({
        x: app.screen.width / 2,
        y: app.screen.height / 2,
      }),
      pausedRef: { current: false },
      playerCoordRef: { current: game.player.coord },
      renderInvalidationRef: { current: 0 },
      selectedRef: { current: game.player.coord },
      movementTransitionRef: {
        current: {
          displayTiles: [],
          durationMs: 1_000,
          fromCoord: { q: 0, r: 0 },
          incomingTiles: [],
          outgoingTiles: [],
          startedAtMs: 0,
          toCoord: { q: 1, r: 0 },
        },
      },
      movementController,
    });

    handleClick(320, 240);

    expect(movementController.replaceQueuedPath).toHaveBeenCalledWith([
      { q: 0, r: 0 },
    ]);
    performanceNowSpy.mockRestore();
  });

  it('does not queue movement when clicking an impassable adjacent tile', () => {
    const game = createGame(2, 'blocked-click-command');
    game.tiles['1,0'] = { ...game.tiles['1,0'], terrain: 'mountain' };
    const adjacentPoint = tileToPoint(
      { q: 1, r: 0 },
      app.screen.width / 2,
      app.screen.height / 2,
      getWorldHexSize(app.screen, game.radius),
    );
    const movementController = createMovementController();

    const handleClick = createWorldClickHandler({
      app: app as never,
      gameRef: { current: game },
      getScenePoint: () => ({ x: adjacentPoint.x, y: adjacentPoint.y }),
      pausedRef: { current: false },
      playerCoordRef: { current: game.player.coord },
      renderInvalidationRef: { current: 0 },
      selectedRef: { current: game.player.coord },
      movementController,
    });

    handleClick(320, 240);

    expect(movementController.replaceQueuedPath).not.toHaveBeenCalled();
  });

  it('does not queue movement when clicking an unresolved adjacent tile', () => {
    const game = createGame(2, 'unresolved-click-command');
    delete game.tiles['1,0'];
    const adjacentPoint = tileToPoint(
      { q: 1, r: 0 },
      app.screen.width / 2,
      app.screen.height / 2,
      getWorldHexSize(app.screen, game.radius),
    );
    const movementController = createMovementController();

    const handleClick = createWorldClickHandler({
      app: app as never,
      gameRef: { current: game },
      getScenePoint: () => ({ x: adjacentPoint.x, y: adjacentPoint.y }),
      pausedRef: { current: false },
      playerCoordRef: { current: game.player.coord },
      renderInvalidationRef: { current: 0 },
      selectedRef: { current: game.player.coord },
      movementController,
    });

    handleClick(320, 240);

    expect(movementController.replaceQueuedPath).not.toHaveBeenCalled();
  });

  it('starts an adjacent hostile encounter instead of queueing movement', () => {
    const game = createGame(2, 'adjacent-hostile-click-command');
    const movementController = createMovementController();
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: ['enemy-1,0-0'],
    };
    game.enemies['enemy-1,0-0'] = {
      id: 'enemy-1,0-0',
      enemyTypeId: 'wolf',
      name: 'Wolf',
      coord: { q: 1, r: 0 },
      tier: 1,
      hp: 10,
      maxHp: 10,
      attack: 1,
      defense: 0,
      xp: 1,
      elite: false,
    };
    const hostilePoint = tileToPoint(
      { q: 1, r: 0 },
      app.screen.width / 2,
      app.screen.height / 2,
      getWorldHexSize(app.screen, game.radius),
    );

    const handleClick = createWorldClickHandler({
      app: app as never,
      gameRef: { current: game },
      getScenePoint: () => ({ x: hostilePoint.x, y: hostilePoint.y }),
      pausedRef: { current: false },
      playerCoordRef: { current: game.player.coord },
      renderInvalidationRef: { current: 0 },
      selectedRef: { current: game.player.coord },
      movementController,
    });

    handleClick(320, 240);

    expect(movementController.startHostileEngagement).toHaveBeenCalledWith({
      q: 1,
      r: 0,
    });
    expect(movementController.replaceQueuedPath).not.toHaveBeenCalled();
    expect(movementController.queueHostileApproach).not.toHaveBeenCalled();
  });

  it('queues the resolved safe path instead of applying movement immediately', () => {
    const game = createGame(3, 'safe-path-click-command');
    const movementController = createMovementController();
    game.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    const safePathPoint = tileToPoint(
      { q: 2, r: 0 },
      app.screen.width / 2,
      app.screen.height / 2,
      getWorldHexSize(app.screen, game.radius),
    );

    const handleClick = createWorldClickHandler({
      app: app as never,
      gameRef: { current: game },
      getScenePoint: () => ({ x: safePathPoint.x, y: safePathPoint.y }),
      pausedRef: { current: false },
      playerCoordRef: { current: game.player.coord },
      renderInvalidationRef: { current: 0 },
      selectedRef: { current: game.player.coord },
      movementController,
    });

    handleClick(320, 240);

    expect(movementController.replaceQueuedPath).toHaveBeenCalledWith([
      { q: 1, r: 0 },
      { q: 2, r: 0 },
    ]);
  });

  it('queues only the hostile staging path and carries the clicked hostile target', () => {
    const game = createGame(3, 'hostile-staging-click-command');
    const movementController = createMovementController();
    game.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: ['enemy-2,0-0'],
    };
    game.enemies['enemy-2,0-0'] = {
      id: 'enemy-2,0-0',
      enemyTypeId: 'wolf',
      name: 'Wolf',
      coord: { q: 2, r: 0 },
      tier: 1,
      hp: 10,
      maxHp: 10,
      attack: 1,
      defense: 0,
      xp: 1,
      elite: false,
    };
    const hostilePoint = tileToPoint(
      { q: 2, r: 0 },
      app.screen.width / 2,
      app.screen.height / 2,
      getWorldHexSize(app.screen, game.radius),
    );

    const handleClick = createWorldClickHandler({
      app: app as never,
      gameRef: { current: game },
      getScenePoint: () => ({ x: hostilePoint.x, y: hostilePoint.y }),
      pausedRef: { current: false },
      playerCoordRef: { current: game.player.coord },
      renderInvalidationRef: { current: 0 },
      selectedRef: { current: game.player.coord },
      movementController,
    });

    handleClick(320, 240);

    expect(movementController.queueHostileApproach).toHaveBeenCalledWith(
      [{ q: 1, r: 0 }],
      { q: 2, r: 0 },
    );
    expect(movementController.replaceQueuedPath).not.toHaveBeenCalled();
    expect(movementController.startHostileEngagement).not.toHaveBeenCalled();
  });

  it('does not choose a hostile neighboring tile as the hostile staging destination', () => {
    const game = createGame(3, 'hostile-staging-safe-neighbor-command');
    const movementController = createMovementController();
    game.tiles['2,0'] = {
      coord: { q: 2, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: ['enemy-2,0-0'],
    };
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: ['enemy-1,0-0'],
    };
    game.tiles['0,1'] = {
      coord: { q: 0, r: 1 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.tiles['1,1'] = {
      coord: { q: 1, r: 1 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.tiles['1,-1'] = {
      coord: { q: 1, r: -1 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.tiles['2,-1'] = {
      coord: { q: 2, r: -1 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    game.enemies['enemy-2,0-0'] = {
      id: 'enemy-2,0-0',
      enemyTypeId: 'wolf',
      name: 'Wolf',
      coord: { q: 2, r: 0 },
      tier: 1,
      hp: 10,
      maxHp: 10,
      attack: 1,
      defense: 0,
      xp: 1,
      elite: false,
    };
    game.enemies['enemy-1,0-0'] = {
      id: 'enemy-1,0-0',
      enemyTypeId: 'wolf',
      name: 'Wolf',
      coord: { q: 1, r: 0 },
      tier: 1,
      hp: 10,
      maxHp: 10,
      attack: 1,
      defense: 0,
      xp: 1,
      elite: false,
    };
    const hostilePoint = tileToPoint(
      { q: 2, r: 0 },
      app.screen.width / 2,
      app.screen.height / 2,
      getWorldHexSize(app.screen, game.radius),
    );

    const handleClick = createWorldClickHandler({
      app: app as never,
      gameRef: { current: game },
      getScenePoint: () => ({ x: hostilePoint.x, y: hostilePoint.y }),
      pausedRef: { current: false },
      playerCoordRef: { current: game.player.coord },
      renderInvalidationRef: { current: 0 },
      selectedRef: { current: game.player.coord },
      movementController,
    });

    handleClick(320, 240);

    expect(movementController.queueHostileApproach).toHaveBeenCalledWith(
      [
        { q: 0, r: 1 },
        { q: 1, r: 1 },
      ],
      { q: 2, r: 0 },
    );
  });

  it('ignores unrevealed distant clicks before tile lookup or movement', async () => {
    const pathfindingModule =
      await import('@realmfall/core/game/statePathfinding');
    const worldQueryModule =
      await import('@realmfall/core/game/stateWorldQueries');
    const getSafePathToTileSpy = vi.spyOn(
      pathfindingModule,
      'getSafePathToTile',
    );
    const getResolvedTileAtSpy = vi.spyOn(
      worldQueryModule,
      'getResolvedTileAt',
    );
    const game = createGame(3, 'unrevealed-safe-path-click');
    const movementController = createMovementController();
    const distantCoord = { q: WORLD_REVEAL_RADIUS + 2, r: 0 };
    const safePathPoint = tileToPoint(
      distantCoord,
      app.screen.width / 2,
      app.screen.height / 2,
      getWorldHexSize(app.screen, game.radius),
    );

    const handleClick = createWorldClickHandler({
      app: app as never,
      gameRef: { current: game },
      getScenePoint: () => ({ x: safePathPoint.x, y: safePathPoint.y }),
      pausedRef: { current: false },
      playerCoordRef: { current: game.player.coord },
      renderInvalidationRef: { current: 0 },
      selectedRef: { current: game.player.coord },
      movementController,
    });

    try {
      handleClick(320, 240);

      expect(getResolvedTileAtSpy).not.toHaveBeenCalled();
      expect(getSafePathToTileSpy).not.toHaveBeenCalled();
      expect(movementController.queueHostileApproach).not.toHaveBeenCalled();
      expect(movementController.replaceQueuedPath).not.toHaveBeenCalled();
      expect(movementController.startHostileEngagement).not.toHaveBeenCalled();
    } finally {
      getResolvedTileAtSpy.mockRestore();
      getSafePathToTileSpy.mockRestore();
    }
  });

  it('queues a farther safe path while the player is inside watchtower scouting range', () => {
    const game = createGame(6, 'watchtower-click-command');
    const movementController = createMovementController();
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      claim: {
        borderColor: '#22c55e',
        ownerId: 'player-territory',
        ownerName: 'Player Territory',
        ownerType: 'player',
      },
      structure: 'watchtower',
    };
    for (let q = 1; q <= 5; q += 1) {
      game.tiles[`${q},0`] = {
        coord: { q, r: 0 },
        terrain: 'plains',
        items: [],
        enemyIds: [],
      };
    }
    const distantPoint = tileToPoint(
      { q: 5, r: 0 },
      app.screen.width / 2,
      app.screen.height / 2,
      getWorldHexSize(app.screen, game.radius),
    );

    const handleClick = createWorldClickHandler({
      app: app as never,
      gameRef: { current: game },
      getScenePoint: () => ({ x: distantPoint.x, y: distantPoint.y }),
      pausedRef: { current: false },
      playerCoordRef: { current: game.player.coord },
      renderInvalidationRef: { current: 0 },
      selectedRef: { current: game.player.coord },
      movementController,
    });

    handleClick(320, 240);

    expect(movementController.replaceQueuedPath).toHaveBeenCalledWith([
      { q: 1, r: 0 },
      { q: 2, r: 0 },
      { q: 3, r: 0 },
      { q: 4, r: 0 },
      { q: 5, r: 0 },
    ]);
  });
});
