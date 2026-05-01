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

  it('adds a command log when clicking an adjacent passable tile moves the player', () => {
    const game = createGame(2, 'adjacent-click-command');
    let nextGame = game;
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
      setGame: (value) => {
        nextGame = typeof value === 'function' ? value(nextGame) : value;
      },
      worldTimeMsRef: { current: game.worldTimeMs },
    });

    handleClick(320, 240);

    expect(nextGame.logs[0]?.kind).toBe('command');
  });

  it('does not add a command log when clicking an impassable adjacent tile', () => {
    const game = createGame(2, 'blocked-click-command');
    game.tiles['1,0'] = { ...game.tiles['1,0'], terrain: 'mountain' };
    const adjacentPoint = tileToPoint(
      { q: 1, r: 0 },
      app.screen.width / 2,
      app.screen.height / 2,
      getWorldHexSize(app.screen, game.radius),
    );
    const setGame = vi.fn();

    const handleClick = createWorldClickHandler({
      app: app as never,
      gameRef: { current: game },
      getScenePoint: () => ({ x: adjacentPoint.x, y: adjacentPoint.y }),
      pausedRef: { current: false },
      playerCoordRef: { current: game.player.coord },
      renderInvalidationRef: { current: 0 },
      selectedRef: { current: game.player.coord },
      setGame,
      worldTimeMsRef: { current: game.worldTimeMs },
    });

    handleClick(320, 240);

    expect(setGame).not.toHaveBeenCalled();
  });

  it('does not add a command log when clicking an unresolved adjacent tile', () => {
    const game = createGame(2, 'unresolved-click-command');
    delete game.tiles['1,0'];
    const adjacentPoint = tileToPoint(
      { q: 1, r: 0 },
      app.screen.width / 2,
      app.screen.height / 2,
      getWorldHexSize(app.screen, game.radius),
    );
    const setGame = vi.fn();

    const handleClick = createWorldClickHandler({
      app: app as never,
      gameRef: { current: game },
      getScenePoint: () => ({ x: adjacentPoint.x, y: adjacentPoint.y }),
      pausedRef: { current: false },
      playerCoordRef: { current: game.player.coord },
      renderInvalidationRef: { current: 0 },
      selectedRef: { current: game.player.coord },
      setGame,
      worldTimeMsRef: { current: game.worldTimeMs },
    });

    handleClick(320, 240);

    expect(setGame).not.toHaveBeenCalled();
  });

  it('adds a command log when clicking a reachable safe-path tile', () => {
    const game = createGame(3, 'safe-path-click-command');
    let nextGame = game;
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
      setGame: (value) => {
        nextGame = typeof value === 'function' ? value(nextGame) : value;
      },
      worldTimeMsRef: { current: game.worldTimeMs },
    });

    handleClick(320, 240);

    expect(nextGame.logs[0]?.kind).toBe('command');
  });

  it('keeps the click world-time ref aligned with the moved state', () => {
    const game = createGame(2, 'adjacent-click-world-time');
    let nextGame = game;
    const worldTimeMsRef = { current: game.worldTimeMs };
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
      setGame: (value) => {
        nextGame = typeof value === 'function' ? value(nextGame) : value;
      },
      worldTimeMsRef,
    });

    handleClick(320, 240);

    expect(worldTimeMsRef.current).toBe(nextGame.worldTimeMs);
  });
});
