import { createGame } from '../../game/stateFactory';
import { hexKey, hexesInRange } from '../../game/hex';
import { getVisibleTiles } from '../../game/stateSelectors';
import {
  collectDescendants,
  createMockApp,
  getMarkerLayer,
  getPlayerLayer,
  getCloudLayer,
  getWorld,
  getWorldGroundLayer,
  MockContainer,
  MockGraphics,
  MockSprite,
  setupRenderSceneTestEnvironment,
} from './renderSceneTestHelpers';
import { getWorldHexSize, tileToPoint } from './renderSceneMath';

setupRenderSceneTestEnvironment();

describe('renderScene movement cooldown', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'OffscreenCanvas',
      class MockOffscreenCanvas {
        constructor(
          public width: number,
          public height: number,
        ) {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('draws a yellow outer cooldown arc outside the player mana ring while movement cooldown remains active', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-move-cooldown');
    const app = createMockApp();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      250,
      null,
      {
        movementCooldown: {
          durationMs: 1_000,
          endAtMs: 1_000,
          nowMs: 250,
        },
      } as never,
    );

    const cooldownGraphics = collectDescendants(getPlayerLayer(app)).filter(
      (child): child is MockGraphics =>
        child instanceof MockGraphics && child.visible,
    );

    expect(
      cooldownGraphics.some((graphic) =>
        graphic.beginFill.mock.calls.some(
          ([color, alpha]) => color === 0xfacc15 && alpha === 0.95,
        ),
      ),
    ).toBe(true);

    const cooldownFillArc = cooldownGraphics.find(
      (graphic) =>
        graphic.beginFill.mock.calls.some(
          ([color, alpha]) => color === 0xfacc15 && alpha === 0.95,
        ) && graphic.drawPolygon.mock.calls.length > 0,
    );
    const cooldownTrackArc = cooldownGraphics.find(
      (graphic) =>
        graphic.beginFill.mock.calls.some(
          ([color, alpha]) => color === 0x422006 && alpha === 0.85,
        ) && graphic.drawPolygon.mock.calls.length > 0,
    );
    const manaTrackArc = cooldownGraphics.find(
      (graphic) =>
        graphic.beginFill.mock.calls.some(
          ([color, alpha]) => color === 0x172554 && alpha === 0.94,
        ) && graphic.drawPolygon.mock.calls.length > 0,
    );

    expect(cooldownFillArc).toBeDefined();
    expect(cooldownTrackArc).toBeDefined();
    expect(manaTrackArc).toBeDefined();

    expect(getAverageGraphicY(cooldownFillArc!)).toBeGreaterThan(0);
    expect(getAverageGraphicY(cooldownTrackArc!)).toBeGreaterThan(0);
    expect(getGraphicThickness(cooldownTrackArc!)).toBeCloseTo(
      getGraphicThickness(manaTrackArc!),
      3,
    );
    expect(getMaxGraphicRadius(cooldownTrackArc!)).toBeGreaterThan(
      getMaxGraphicRadius(manaTrackArc!),
    );
  });

  it('renders queued path hexes with a green tint at a lower alpha', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(3, 'render-scene-queued-safe-path');
    const app = createMockApp();

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      { q: 2, r: 0 },
      null,
      12 * 60,
      0,
      null,
      {
        queuedPath: [
          { q: 1, r: 0 },
          { q: 2, r: 0 },
        ],
      } as never,
    );

    const queuedPathTint = collectDescendants(getWorld(app)).filter(
      (child) =>
        child instanceof MockGraphics &&
        child.beginFill.mock.calls.some(
          ([color, alpha]) => color === 0x22c55e && alpha === 0.24,
        ),
    );

    expect(queuedPathTint).toHaveLength(2);
  });

  it('hides the cooldown bar once the wall-clock deadline has passed', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-move-cooldown-expired');
    const app = createMockApp();
    const visibleTiles = getVisibleTiles(game);

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      250,
      null,
      {
        movementCooldown: {
          durationMs: 1_000,
          endAtMs: 1_000,
          nowMs: 250,
        },
      } as never,
    );

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      250,
      null,
      {
        movementCooldown: {
          durationMs: 1_000,
          endAtMs: 1_000,
          nowMs: 1_000,
        },
      } as never,
    );

    const cooldownGraphics = collectDescendants(getPlayerLayer(app)).filter(
      (child): child is MockGraphics =>
        child instanceof MockGraphics && child.visible,
    );

    expect(
      cooldownGraphics.some((graphic) => {
        const lastFillCall =
          graphic.beginFill.mock.calls[graphic.beginFill.mock.calls.length - 1];

        return lastFillCall?.[0] === 0xfacc15;
      }),
    ).toBe(false);
  });

  it('offsets the world layers during the move animation while keeping the player layer fixed', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-move-transition');
    const app = createMockApp();

    game.player.coord = { q: 1, r: 0 };

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        movementTransition: {
          durationMs: 1_000,
          fromCoord: { q: 0, r: 0 },
          incomingTiles: [],
          nowMs: 0,
          outgoingTiles: [
            {
              coord: { q: -2, r: 0 },
              enemyIds: [],
              items: [],
              terrain: 'plains',
            },
          ],
          startedAtMs: 0,
          toCoord: { q: 1, r: 0 },
        },
      } as never,
    );

    const expectedOffsetX =
      getWorldHexSize(app.screen, game.radius) * Math.sqrt(3);
    expect(getWorldGroundLayer(app).position.x).toBeCloseTo(expectedOffsetX, 4);
    expect(getWorldGroundLayer(app).position.y).toBeCloseTo(0, 4);
    expect(getPlayerLayer(app).position.x).toBe(0);
    expect(getPlayerLayer(app).position.y).toBe(0);

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        movementTransition: {
          durationMs: 1_000,
          fromCoord: { q: 0, r: 0 },
          incomingTiles: [],
          nowMs: 1_000,
          outgoingTiles: [
            {
              coord: { q: -2, r: 0 },
              enemyIds: [],
              items: [],
              terrain: 'plains',
            },
          ],
          startedAtMs: 0,
          toCoord: { q: 1, r: 0 },
        },
      } as never,
    );

    expect(getWorldGroundLayer(app).position.x).toBeCloseTo(0, 4);
    expect(getWorldGroundLayer(app).position.y).toBeCloseTo(0, 4);
  });

  it('moves cloud sprites with the transition at half the world offset', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-cloud-parallax-transition');
    const baselineApp = createMockApp();
    const transitionApp = createMockApp();

    game.player.coord = { q: 1, r: 0 };

    const visibleTiles = getVisibleTiles(game);

    renderScene(
      baselineApp as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      0,
    );

    renderScene(
      transitionApp as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        movementTransition: {
          durationMs: 1_000,
          fromCoord: { q: 0, r: 0 },
          incomingTiles: [],
          nowMs: 0,
          outgoingTiles: [
            {
              coord: { q: -2, r: 0 },
              enemyIds: [],
              items: [],
              terrain: 'plains',
            },
          ],
          startedAtMs: 0,
          toCoord: { q: 1, r: 0 },
        },
      } as never,
    );

    const expectedOffsetX =
      getWorldHexSize(transitionApp.screen, game.radius) * Math.sqrt(3) * 0.5;
    const baselineCloud = getCloudLayer(baselineApp).children[0] as MockSprite;
    const transitionCloud = getCloudLayer(transitionApp)
      .children[0] as MockSprite;

    expect(transitionCloud.position.x - baselineCloud.position.x).toBeCloseTo(
      expectedOffsetX,
      4,
    );
    expect(transitionCloud.position.y - baselineCloud.position.y).toBeCloseTo(
      0,
      4,
    );
  });

  it('keeps cloud sprites continuous between the pre-move frame and transition start', async () => {
    const { renderScene } = await import('./renderScene');
    const preMoveGame = createGame(2, 'render-scene-cloud-parallax-seam');
    const preMoveApp = createMockApp();
    const transitionGame = createGame(2, 'render-scene-cloud-parallax-seam');
    const transitionApp = createMockApp();

    renderScene(
      preMoveApp as never,
      preMoveGame,
      getVisibleTiles(preMoveGame),
      preMoveGame.player.coord,
      null,
      12 * 60,
      0,
    );

    transitionGame.player.coord = { q: 1, r: 0 };
    renderScene(
      transitionApp as never,
      transitionGame,
      getVisibleTiles(transitionGame),
      transitionGame.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        movementTransition: {
          durationMs: 1_000,
          fromCoord: { q: 0, r: 0 },
          incomingTiles: [],
          nowMs: 0,
          outgoingTiles: [
            {
              coord: { q: -2, r: 0 },
              enemyIds: [],
              items: [],
              terrain: 'plains',
            },
          ],
          startedAtMs: 0,
          toCoord: { q: 1, r: 0 },
        },
      } as never,
    );

    const preMoveCloud = getCloudLayer(preMoveApp).children[0] as MockSprite;
    const transitionCloud = getCloudLayer(transitionApp)
      .children[0] as MockSprite;

    expect(transitionCloud.position.x).toBeCloseTo(preMoveCloud.position.x, 4);
    expect(transitionCloud.position.y).toBeCloseTo(preMoveCloud.position.y, 4);
  });

  it('keeps clouds on-screen after larger world travel offsets', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-cloud-parallax-visibility');
    const app = createMockApp();

    game.player.coord = { q: 200, r: 0 };

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      0,
    );

    const visibleClouds = getCloudLayer(app).children.filter((child) => {
      const sprite = child as MockSprite;
      return (
        sprite.position.x >= -160 && sprite.position.x <= app.screen.width + 160
      );
    });

    expect(visibleClouds.length).toBeGreaterThan(0);
  });

  it('keeps outgoing terrain art present and hides incoming terrain art at the start of the transition', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-move-transition-edge-tiles');
    const app = createMockApp();

    game.player.coord = { q: 1, r: 0 };

    const visibleTiles = getVisibleTiles(game);
    const incomingTile = visibleTiles.find(
      (tile) => tile.coord.q === 3 && tile.coord.r === 0,
    );
    expect(incomingTile).toBeDefined();

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        movementTransition: {
          durationMs: 1_000,
          fromCoord: { q: 0, r: 0 },
          incomingTiles: incomingTile ? [incomingTile] : [],
          nowMs: 0,
          outgoingTiles: [
            {
              coord: { q: -2, r: 0 },
              enemyIds: [],
              items: [],
              terrain: 'plains',
            },
          ],
          startedAtMs: 0,
          toCoord: { q: 1, r: 0 },
        },
      } as never,
    );

    const terrainSprites = collectDescendants(getWorldGroundLayer(app)).filter(
      (child): child is MockSprite =>
        child instanceof MockSprite && child.visible,
    );
    const hexSize = getWorldHexSize(app.screen, game.radius);
    const outgoingPoint = tileToPoint({ q: -3, r: 0 }, 400, 300, hexSize);
    const incomingPoint = tileToPoint({ q: 2, r: 0 }, 400, 300, hexSize);
    const findTransitionSpriteAt = (point: { x: number; y: number }) =>
      terrainSprites.find(
        (sprite) =>
          Math.abs(sprite.position.x - point.x) < 0.01 &&
          Math.abs(sprite.position.y - point.y) < 0.01,
      );

    expect(findTransitionSpriteAt(outgoingPoint)).toBeDefined();
    expect(findTransitionSpriteAt(incomingPoint)?.alpha).toBeCloseTo(0, 4);
  });

  it('keeps outgoing edge tiles under fog when they were never revealed', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(6, 'render-scene-move-transition-outgoing-fog');
    const app = createMockApp(960, 720);
    const outgoingTile = {
      coord: { q: -6, r: 0 },
      enemyIds: [],
      items: [],
      structure: 'town' as const,
      terrain: 'forest' as const,
    };

    game.tiles['-6,0'] = outgoingTile;
    game.player.coord = { q: 1, r: 0 };

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        movementTransition: {
          durationMs: 1_000,
          fromCoord: { q: 0, r: 0 },
          incomingTiles: [],
          nowMs: 0,
          outgoingTiles: [outgoingTile],
          startedAtMs: 0,
          toCoord: { q: 1, r: 0 },
        },
      } as never,
    );

    const hexSize = getWorldHexSize(app.screen, game.radius);
    const outgoingPoint = tileToPoint(
      { q: -7, r: 0 },
      app.screen.width / 2,
      app.screen.height / 2,
      hexSize,
    );
    const terrainSprites = collectDescendants(getWorldGroundLayer(app)).filter(
      (child): child is MockSprite =>
        child instanceof MockSprite && child.visible,
    );
    const fogGraphics = collectDescendants(getWorld(app)).filter(
      (child): child is MockGraphics =>
        child instanceof MockGraphics &&
        child.beginFill.mock.calls.some(
          ([color, alpha]) => color === 0x020617 && alpha === 0.78,
        ),
    );

    expect(findSpriteAt(terrainSprites, outgoingPoint)).toBeUndefined();
    expect(findGraphicAt(fogGraphics, outgoingPoint)).toBeDefined();
  });

  it('keeps incoming edge tiles under fog until they are actually revealed', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(6, 'render-scene-move-transition-incoming-fog');
    const app = createMockApp(960, 720);
    const incomingTile = {
      coord: { q: 7, r: 0 },
      enemyIds: [],
      items: [],
      structure: 'town' as const,
      terrain: 'forest' as const,
    };

    game.tiles['7,0'] = incomingTile;
    game.player.coord = { q: 1, r: 0 };

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        movementTransition: {
          durationMs: 1_000,
          fromCoord: { q: 0, r: 0 },
          incomingTiles: [incomingTile],
          nowMs: 500,
          outgoingTiles: [],
          startedAtMs: 0,
          toCoord: { q: 1, r: 0 },
        },
      } as never,
    );

    const hexSize = getWorldHexSize(app.screen, game.radius);
    const incomingPoint = tileToPoint(
      { q: 6, r: 0 },
      app.screen.width / 2,
      app.screen.height / 2,
      hexSize,
    );
    const terrainSprites = collectDescendants(getWorldGroundLayer(app)).filter(
      (child): child is MockSprite =>
        child instanceof MockSprite && child.visible,
    );
    const fogGraphics = collectDescendants(getWorld(app)).filter(
      (child): child is MockGraphics =>
        child instanceof MockGraphics &&
        child.beginFill.mock.calls.some(
          ([color, alpha]) => color === 0x020617 && alpha === 0.39,
        ),
    );

    expect(findSpriteAt(terrainSprites, incomingPoint)).toBeUndefined();
    expect(findGraphicAt(fogGraphics, incomingPoint)).toBeDefined();
  });

  it('keeps outgoing marker wrappers anchored to the outgoing hex during the transition', async () => {
    const { renderScene } = await import('./renderScene');
    const { createWorldMovementTransition } =
      await import('../../app/App/world/movement/worldMovementTransition');
    const game = createGame(2, 'render-scene-move-transition-marker-anchor');
    const app = createMockApp();
    const outgoingTile = {
      coord: { q: -2, r: 0 },
      enemyIds: [],
      items: [],
      structure: 'copper-ore' as const,
      terrain: 'plains' as const,
    };
    const incomingTile = {
      coord: { q: 3, r: 0 },
      enemyIds: [],
      items: [],
      structure: 'copper-ore' as const,
      terrain: 'plains' as const,
    };

    new Set(
      [
        ...hexesInRange({ q: 0, r: 0 }, game.radius),
        ...hexesInRange({ q: 1, r: 0 }, game.radius),
      ].map((coord) => hexKey(coord)),
    ).forEach((coordKey) => {
      const [q, r] = coordKey.split(',').map(Number);
      game.tiles[coordKey] = {
        coord: { q, r },
        enemyIds: [],
        items: [],
        terrain: 'plains',
      };
    });
    game.tiles['-2,0'] = outgoingTile;
    game.tiles['3,0'] = incomingTile;

    const previousVisibleTiles = getVisibleTiles(game);

    renderScene(
      app as never,
      game,
      previousVisibleTiles,
      game.player.coord,
      null,
      12 * 60,
      0,
    );

    const hexSize = getWorldHexSize(app.screen, game.radius);
    const originalMarkerWrappers = getMarkerLayer(app).children.filter(
      (child): child is MockContainer => child instanceof MockContainer,
    );
    const originalOutgoingWrapper = originalMarkerWrappers[0];

    expect(originalMarkerWrappers).toHaveLength(1);
    expect(originalOutgoingWrapper).toBeDefined();

    game.player.coord = { q: 1, r: 0 };
    const nextVisibleTiles = getVisibleTiles(game);
    const movementTransition = createWorldMovementTransition({
      fromCoord: { q: 0, r: 0 },
      nextVisibleTiles,
      previousVisibleTiles,
      startedAtMs: 0,
      toCoord: { q: 1, r: 0 },
    });

    expect(movementTransition).toBeDefined();

    renderScene(
      app as never,
      game,
      nextVisibleTiles,
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        movementTransition: movementTransition
          ? { ...movementTransition, nowMs: 0 }
          : null,
      } as never,
    );

    const markerWrappers = getMarkerLayer(app).children.filter(
      (child): child is MockContainer => child instanceof MockContainer,
    );
    const transitionOutgoingPoint = tileToPoint(
      { q: -3, r: 0 },
      app.screen.width / 2,
      app.screen.height / 2,
      hexSize,
    );
    const transitionIncomingPoint = tileToPoint(
      { q: 2, r: 0 },
      app.screen.width / 2,
      app.screen.height / 2,
      hexSize,
    );
    const transitionOutgoingWrapper = findContainerAt(
      markerWrappers,
      transitionOutgoingPoint,
    );
    const transitionIncomingWrapper = findContainerAt(
      markerWrappers,
      transitionIncomingPoint,
    );

    expect(transitionOutgoingWrapper).toBeDefined();
    expect(transitionIncomingWrapper).toBeDefined();
    expect(transitionOutgoingWrapper).toBe(originalOutgoingWrapper);
    expect(transitionIncomingWrapper).not.toBe(originalOutgoingWrapper);
  });

  it('keeps existing same-icon markers anchored when moving off a marked player tile', async () => {
    const { renderScene } = await import('./renderScene');
    const { createWorldMovementTransition } =
      await import('../../app/App/world/movement/worldMovementTransition');
    const game = createGame(2, 'render-scene-transition-player-tile-marker');
    const app = createMockApp();
    const playerTile = {
      coord: { q: 0, r: 0 },
      enemyIds: [],
      items: [],
      structure: 'copper-ore' as const,
      terrain: 'plains' as const,
    };
    const stableTile = {
      coord: { q: 2, r: -1 },
      enemyIds: [],
      items: [],
      structure: 'copper-ore' as const,
      terrain: 'plains' as const,
    };

    new Set(
      [
        ...hexesInRange({ q: 0, r: 0 }, game.radius),
        ...hexesInRange({ q: 1, r: 0 }, game.radius),
      ].map((coord) => hexKey(coord)),
    ).forEach((coordKey) => {
      const [q, r] = coordKey.split(',').map(Number);
      game.tiles[coordKey] = {
        coord: { q, r },
        enemyIds: [],
        items: [],
        terrain: 'plains',
      };
    });
    game.tiles['0,0'] = playerTile;
    game.tiles['2,-1'] = stableTile;

    const previousVisibleTiles = getVisibleTiles(game);

    renderScene(
      app as never,
      game,
      previousVisibleTiles,
      game.player.coord,
      null,
      12 * 60,
      0,
    );

    const originalMarkerWrappers = getMarkerLayer(app).children.filter(
      (child): child is MockContainer => child instanceof MockContainer,
    );
    const originalStableWrapper = originalMarkerWrappers[0];

    expect(originalMarkerWrappers).toHaveLength(1);
    expect(originalStableWrapper).toBeDefined();

    game.player.coord = { q: 1, r: 0 };
    const nextVisibleTiles = getVisibleTiles(game);
    const movementTransition = createWorldMovementTransition({
      fromCoord: { q: 0, r: 0 },
      nextVisibleTiles,
      previousVisibleTiles,
      startedAtMs: 0,
      toCoord: { q: 1, r: 0 },
    });

    expect(movementTransition).toBeDefined();

    renderScene(
      app as never,
      game,
      nextVisibleTiles,
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        movementTransition: movementTransition
          ? { ...movementTransition, nowMs: 0 }
          : null,
      } as never,
    );

    const markerWrappers = getMarkerLayer(app).children.filter(
      (child): child is MockContainer => child instanceof MockContainer,
    );
    const hexSize = getWorldHexSize(app.screen, game.radius);
    const oldPlayerPoint = tileToPoint(
      { q: -1, r: 0 },
      app.screen.width / 2,
      app.screen.height / 2,
      hexSize,
    );
    const stableTilePoint = tileToPoint(
      { q: 1, r: -1 },
      app.screen.width / 2,
      app.screen.height / 2,
      hexSize,
    );
    const transitionOldPlayerWrapper = findContainerAt(
      markerWrappers,
      oldPlayerPoint,
    );
    const transitionStableWrapper = findContainerAt(
      markerWrappers,
      stableTilePoint,
    );

    expect(transitionOldPlayerWrapper).toBeDefined();
    expect(transitionStableWrapper).toBeDefined();
    expect(transitionStableWrapper).toBe(originalStableWrapper);
    expect(transitionOldPlayerWrapper).not.toBe(originalStableWrapper);
  });

  it('keeps each same-icon marker on its own hex across the transition frame', async () => {
    const { renderScene } = await import('./renderScene');
    const { createWorldMovementTransition } =
      await import('../../app/App/world/movement/worldMovementTransition');
    const game = createGame(2, 'render-scene-transition-multi-same-icon');
    const app = createMockApp();
    const markedTiles = [
      { key: '-2,0', coord: { q: -2, r: 0 } },
      { key: '0,0', coord: { q: 0, r: 0 } },
      { key: '2,-1', coord: { q: 2, r: -1 } },
      { key: '3,0', coord: { q: 3, r: 0 } },
    ] as const;

    new Set(
      [
        ...hexesInRange({ q: 0, r: 0 }, game.radius),
        ...hexesInRange({ q: 1, r: 0 }, game.radius),
      ].map((coord) => hexKey(coord)),
    ).forEach((coordKey) => {
      const [q, r] = coordKey.split(',').map(Number);
      game.tiles[coordKey] = {
        coord: { q, r },
        enemyIds: [],
        items: [],
        terrain: 'plains',
      };
    });
    markedTiles.forEach(({ key, coord }) => {
      game.tiles[key] = {
        coord,
        enemyIds: [],
        items: [],
        structure: 'copper-ore',
        terrain: 'plains',
      };
    });

    const previousVisibleTiles = getVisibleTiles(game);
    game.player.coord = { q: 1, r: 0 };
    const nextVisibleTiles = getVisibleTiles(game);
    const movementTransition = createWorldMovementTransition({
      fromCoord: { q: 0, r: 0 },
      nextVisibleTiles,
      previousVisibleTiles,
      startedAtMs: 0,
      toCoord: { q: 1, r: 0 },
    });

    expect(movementTransition).toBeDefined();

    renderScene(
      app as never,
      game,
      nextVisibleTiles,
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        movementTransition: movementTransition
          ? { ...movementTransition, nowMs: 0 }
          : null,
      } as never,
    );

    const markerWrappers = getMarkerLayer(app).children.filter(
      (child): child is MockContainer => child instanceof MockContainer,
    );
    const hexSize = getWorldHexSize(app.screen, game.radius);
    const expectedPoints = [
      { q: -3, r: 0 },
      { q: -1, r: 0 },
      { q: 1, r: -1 },
      { q: 2, r: 0 },
    ].map((relative) =>
      tileToPoint(
        relative,
        app.screen.width / 2,
        app.screen.height / 2,
        hexSize,
      ),
    );

    expectedPoints.forEach((point) => {
      expect(findContainerAt(markerWrappers, point)).toBeDefined();
    });
    expect(
      markerWrappers.filter((wrapper) =>
        expectedPoints.some(
          (point) =>
            Math.abs(wrapper.position.x - point.x) < 1 &&
            Math.abs(wrapper.position.y - point.y) < 1,
        ),
      ),
    ).toHaveLength(expectedPoints.length);
  });
});

function findGraphicAt(
  graphics: MockGraphics[],
  point: { x: number; y: number },
  tolerance = 0.01,
) {
  return graphics.find((graphic) => {
    const [polygon] = graphic.drawPolygon.mock.calls[0] ?? [];
    if (!Array.isArray(polygon) || polygon.length < 6) {
      return false;
    }

    const center = getPolygonCenter(polygon);
    return (
      Math.abs(center.x - point.x) < tolerance &&
      Math.abs(center.y - point.y) < tolerance
    );
  });
}

function findSpriteAt(
  sprites: MockSprite[],
  point: { x: number; y: number },
  tolerance = 0.01,
) {
  return sprites.find(
    (sprite) =>
      Math.abs(sprite.position.x - point.x) < tolerance &&
      Math.abs(sprite.position.y - point.y) < tolerance,
  );
}

function findContainerAt(
  containers: MockContainer[],
  point: { x: number; y: number },
  tolerance = 1,
) {
  return containers.find(
    (container) =>
      Math.abs(container.position.x - point.x) < tolerance &&
      Math.abs(container.position.y - point.y) < tolerance,
  );
}

function getPolygonCenter(points: number[]) {
  const vertexCount = points.length / 2;
  let sumX = 0;
  let sumY = 0;

  for (let index = 0; index < points.length; index += 2) {
    sumX += points[index]!;
    sumY += points[index + 1]!;
  }

  return {
    x: sumX / vertexCount,
    y: sumY / vertexCount,
  };
}

function getAverageGraphicY(graphic: MockGraphics) {
  const lastCall =
    graphic.drawPolygon.mock.calls[graphic.drawPolygon.mock.calls.length - 1];
  const points = lastCall?.[0] as number[] | undefined;
  if (!points || points.length === 0) {
    return 0;
  }

  return (
    points.reduce(
      (sum, value, index) => sum + (index % 2 === 1 ? value : 0),
      0,
    ) /
    (points.length / 2)
  );
}

function getMaxGraphicRadius(graphic: MockGraphics) {
  const lastCall =
    graphic.drawPolygon.mock.calls[graphic.drawPolygon.mock.calls.length - 1];
  const points = lastCall?.[0] as number[] | undefined;
  if (!points || points.length === 0) {
    return 0;
  }

  let maxRadius = 0;
  for (let index = 0; index < points.length; index += 2) {
    maxRadius = Math.max(
      maxRadius,
      Math.hypot(points[index] ?? 0, points[index + 1] ?? 0),
    );
  }

  return maxRadius;
}

function getMinGraphicRadius(graphic: MockGraphics) {
  const lastCall =
    graphic.drawPolygon.mock.calls[graphic.drawPolygon.mock.calls.length - 1];
  const points = lastCall?.[0] as number[] | undefined;
  if (!points || points.length === 0) {
    return 0;
  }

  let minRadius = Number.POSITIVE_INFINITY;
  for (let index = 0; index < points.length; index += 2) {
    minRadius = Math.min(
      minRadius,
      Math.hypot(points[index] ?? 0, points[index + 1] ?? 0),
    );
  }

  return Number.isFinite(minRadius) ? minRadius : 0;
}

function getGraphicThickness(graphic: MockGraphics) {
  return getMaxGraphicRadius(graphic) - getMinGraphicRadius(graphic);
}
