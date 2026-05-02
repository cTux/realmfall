import {
  getWorldHexSize,
  tileToPoint,
} from '../../../ui/world/renderSceneMath';
import { createGame } from '../../../game/stateFactory';
import { createWorldClickHandler } from './pixiWorldClickNavigation';

describe('createWorldClickHandler', () => {
  const app = {
    screen: { width: 800, height: 600 },
  } as const;

  it('queues an adjacent click through the movement controller', () => {
    const game = createGame(2, 'adjacent-click-command');
    const replaceQueuedPath = vi.fn();
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
      movementController: { replaceQueuedPath },
    });

    handleClick(320, 240);

    expect(replaceQueuedPath).toHaveBeenCalledWith([{ q: 1, r: 0 }]);
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
    const replaceQueuedPath = vi.fn();

    const handleClick = createWorldClickHandler({
      app: app as never,
      gameRef: { current: game },
      getScenePoint: () => ({ x: adjacentPoint.x, y: adjacentPoint.y }),
      pausedRef: { current: false },
      playerCoordRef: { current: game.player.coord },
      renderInvalidationRef: { current: 0 },
      selectedRef: { current: game.player.coord },
      movementController: { replaceQueuedPath },
    });

    handleClick(320, 240);

    expect(replaceQueuedPath).not.toHaveBeenCalled();
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
    const replaceQueuedPath = vi.fn();

    const handleClick = createWorldClickHandler({
      app: app as never,
      gameRef: { current: game },
      getScenePoint: () => ({ x: adjacentPoint.x, y: adjacentPoint.y }),
      pausedRef: { current: false },
      playerCoordRef: { current: game.player.coord },
      renderInvalidationRef: { current: 0 },
      selectedRef: { current: game.player.coord },
      movementController: { replaceQueuedPath },
    });

    handleClick(320, 240);

    expect(replaceQueuedPath).not.toHaveBeenCalled();
  });

  it('queues the resolved safe path instead of applying movement immediately', () => {
    const game = createGame(3, 'safe-path-click-command');
    const replaceQueuedPath = vi.fn();
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
      movementController: { replaceQueuedPath },
    });

    handleClick(320, 240);

    expect(replaceQueuedPath).toHaveBeenCalledWith([
      { q: 1, r: 0 },
      { q: 2, r: 0 },
    ]);
  });

  it('ignores unrevealed distant clicks before pathfinding', async () => {
    const pathfindingModule = await import('../../../game/statePathfinding');
    const getSafePathToTileSpy = vi.spyOn(
      pathfindingModule,
      'getSafePathToTile',
    );
    const game = createGame(3, 'unrevealed-safe-path-click');
    const replaceQueuedPath = vi.fn();
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
      movementController: { replaceQueuedPath },
    });

    try {
      handleClick(320, 240);

      expect(getSafePathToTileSpy).not.toHaveBeenCalled();
      expect(replaceQueuedPath).not.toHaveBeenCalled();
    } finally {
      getSafePathToTileSpy.mockRestore();
    }
  });
});
