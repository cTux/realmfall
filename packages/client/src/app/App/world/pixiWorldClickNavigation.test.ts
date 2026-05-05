import {
  getWorldHexSize,
  tileToPoint,
} from '../../../ui/world/renderSceneMath';
import { createGame } from '../../../game/stateFactory';
import { createWorldClickHandler } from './pixiWorldClickNavigation';

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

  it('ignores unrevealed distant clicks before pathfinding', async () => {
    const pathfindingModule = await import('../../../game/statePathfinding');
    const getSafePathToTileSpy = vi.spyOn(
      pathfindingModule,
      'getSafePathToTile',
    );
    const game = createGame(3, 'unrevealed-safe-path-click');
    const movementController = createMovementController();
    delete game.tiles['2,0'];
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

    try {
      handleClick(320, 240);

      expect(getSafePathToTileSpy).not.toHaveBeenCalled();
      expect(movementController.replaceQueuedPath).not.toHaveBeenCalled();
    } finally {
      getSafePathToTileSpy.mockRestore();
    }
  });
});
