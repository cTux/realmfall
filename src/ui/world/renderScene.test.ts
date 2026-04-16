import { createGame, getVisibleTiles } from '../../game/state';
import { hexKey, hexNeighbors } from '../../game/hex';
import gluttonyIcon from '../../assets/icons/gluttony.svg';
import playerIcon from '../../assets/icons/visored-helm.svg';
import wolfHeadIcon from '../../assets/icons/wolf-head.svg';
import tearTracksIcon from '../../assets/icons/tear-tracks.svg';

const textureFrom = vi.fn((icon: string) => ({ icon }));
const assetsGet = vi.fn(() => undefined);
const assetsLoad = vi.fn(async () => []);
const extensionsAdd = vi.fn();

class MockSprite {
  icon?: string;
  texture: { icon?: string };
  anchor = { set: vi.fn() };
  position = { set: vi.fn() };
  width = 0;
  height = 0;
  tint = 0;
  alpha = 1;
  visible = true;

  constructor(texture: { icon?: string }) {
    this.texture = texture;
    this.icon = texture.icon;
  }
}

class MockContainer {
  children: unknown[] = [];
  alpha = 1;
  visible = true;
  position = { set: vi.fn() };

  addChild(...children: unknown[]) {
    this.children.push(...children);
    return children[0];
  }

  removeChildren() {
    const removed = [...this.children];
    this.children = [];
    return removed;
  }

  destroy() {}
}

class MockGraphics extends MockContainer {
  clear = vi.fn();
  beginFill = vi.fn();
  lineStyle = vi.fn();
  moveTo = vi.fn(() => this);
  lineTo = vi.fn(() => this);
  drawPolygon = vi.fn();
  drawEllipse = vi.fn();
  drawRect = vi.fn();
  endFill = vi.fn();
  poly = vi.fn((points: number[]) => {
    this.drawPolygon(points);
    return this;
  });
  ellipse = vi.fn((x: number, y: number, radiusX: number, radiusY: number) => {
    this.drawEllipse(x, y, radiusX, radiusY);
    return this;
  });
  rect = vi.fn((x: number, y: number, width: number, height: number) => {
    this.drawRect(x, y, width, height);
    return this;
  });
  fill = vi.fn((style: number | { color?: number; alpha?: number }) => {
    if (typeof style === 'number') {
      this.beginFill(style, 1);
    } else {
      this.beginFill(style.color ?? 0, style.alpha ?? 1);
    }
    this.endFill();
    return this;
  });
  stroke = vi.fn(
    (style: number | { width?: number; color?: number; alpha?: number }) => {
      if (typeof style === 'number') {
        this.lineStyle(undefined, style, undefined);
      } else {
        this.lineStyle(style.width, style.color, style.alpha);
      }
      return this;
    },
  );
}

class MockText extends MockContainer {
  constructor(
    public text: string,
    public style: unknown,
  ) {
    super();
  }
}

function collectDescendants(root: MockContainer): unknown[] {
  return root.children.flatMap((child) => {
    if (child instanceof MockContainer) {
      return [child, ...collectDescendants(child)];
    }
    return [child];
  });
}

class MockTextStyle {
  constructor(public value: unknown) {}
}

class MockFilter {
  resources: Record<string, unknown>;

  constructor(options?: { resources?: Record<string, unknown> }) {
    this.resources = options?.resources ?? {};
  }
}

class MockUniformGroup {
  uniforms: Record<string, unknown>;

  constructor(
    public structure: Record<string, { value: unknown; type: string }>,
  ) {
    this.uniforms = Object.fromEntries(
      Object.entries(structure).map(([key, value]) => [key, value.value]),
    );
  }
}

class MockRectangle {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,
  ) {}
}

vi.mock('pixi.js', () => ({
  Assets: {
    get: assetsGet,
    load: assetsLoad,
  },
  BLEND_MODES: { ADD: 'add' },
  Container: MockContainer,
  extensions: {
    add: extensionsAdd,
  },
  Filter: MockFilter,
  GlProgram: {
    from: vi.fn((options: Record<string, unknown>) => options),
  },
  Graphics: MockGraphics,
  loadSvg: { extension: { name: 'loadSVG' } },
  loadTextures: { extension: { name: 'loadTextures' } },
  Rectangle: MockRectangle,
  Sprite: MockSprite,
  Text: MockText,
  TextStyle: MockTextStyle,
  Texture: {
    from: textureFrom,
  },
  UniformGroup: MockUniformGroup,
}));

describe('renderScene', () => {
  function createPlacedWorldBossRenderGame() {
    const game = createGame(8, 'render-scene-world-boss');
    const center = { q: 4, r: 0 };
    const bossId = `world-boss-${hexKey(center)}`;

    game.tiles[hexKey(center)] = {
      coord: center,
      terrain: 'forest',
      items: [],
      structure: undefined,
      enemyIds: [bossId],
    };
    hexNeighbors(center).forEach((coord) => {
      game.tiles[hexKey(coord)] = {
        coord,
        terrain: 'forest',
        items: [],
        structure: undefined,
        enemyIds: [],
      };
    });
    game.enemies[bossId] = {
      id: bossId,
      name: 'Gluttony',
      coord: center,
      tier: 10,
      hp: 100,
      maxHp: 100,
      baseMaxHp: 100,
      attack: 25,
      baseAttack: 25,
      defense: 12,
      baseDefense: 12,
      xp: 100,
      elite: true,
      worldBoss: true,
    };
    game.player.coord = center;

    return { game, center };
  }

  it('bounds scene caches with LRU-style eviction', async () => {
    const { getCachedValue, SCENE_CACHE_LIMITS, setBoundedCachedValue } =
      await import('./renderSceneCache');

    const cache = new Map<string, string>();
    const maxEntries = 3;

    setBoundedCachedValue(cache, 'a', 'A', maxEntries);
    setBoundedCachedValue(cache, 'b', 'B', maxEntries);
    setBoundedCachedValue(cache, 'c', 'C', maxEntries);
    expect(getCachedValue(cache, 'a')).toBe('A');

    setBoundedCachedValue(cache, 'd', 'D', maxEntries);

    expect(cache.size).toBe(maxEntries);
    expect(cache.has('a')).toBe(true);
    expect(cache.has('c')).toBe(true);
    expect(cache.has('d')).toBe(true);
    expect(cache.has('b')).toBe(false);
    expect(SCENE_CACHE_LIMITS.cloudInputsBySeed).toBe(maxEntries + 1);
  });

  it('renders highlighted tiles, structures, enemies, and player markers', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-seed');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'forest',
      structure: 'town',
      items: [],
      enemyIds: ['enemy-1,0-0', 'enemy-1,0-1'],
    };
    game.tiles['0,1'] = {
      coord: { q: 0, r: 1 },
      terrain: 'plains',
      structure: 'dungeon',
      items: [],
      enemyIds: [],
    };
    game.tiles['-1,0'] = {
      coord: { q: -1, r: 0 },
      terrain: 'rift',
      items: [
        {
          id: 'gold-1',
          name: 'Gold',
          quantity: 3,
          tier: 1,
          rarity: 'common',
          power: 0,
          defense: 0,
          maxHp: 0,
          healing: 0,
          hunger: 0,
        },
      ],
      enemyIds: [],
    };
    game.enemies['enemy-1,0-0'] = {
      id: 'enemy-1,0-0',
      name: 'Raider',
      coord: { q: 1, r: 0 },
      tier: 2,
      hp: 5,
      maxHp: 5,
      attack: 3,
      defense: 1,
      xp: 5,
      elite: false,
    };
    game.enemies['enemy-1,0-1'] = {
      id: 'enemy-1,0-1',
      name: 'Wolf',
      coord: { q: 1, r: 0 },
      tier: 3,
      hp: 7,
      maxHp: 7,
      attack: 4,
      defense: 2,
      xp: 8,
      elite: true,
    };

    const app = {
      stage: new MockContainer(),
      screen: { width: 800, height: 600 },
    };

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      { q: 0, r: 1 },
      { q: 1, r: 0 },
      12 * 60,
    );

    expect(app.stage.children).toHaveLength(7);
    expect(textureFrom).toHaveBeenCalled();
    expect(
      textureFrom.mock.calls.some(([icon]) => typeof icon === 'string'),
    ).toBe(true);

    const worldMap = app.stage.children[1] as MockContainer;
    const labels = worldMap.children[2] as MockContainer;
    expect(labels.children.some((child) => child instanceof MockText)).toBe(
      false,
    );

    const world = worldMap.children[0] as MockContainer;
    const markerLayer = world.children[5] as MockContainer;
    const redEnemyMarker = collectDescendants(markerLayer).find(
      (child) =>
        child instanceof MockSprite &&
        child.icon !== playerIcon &&
        child.icon !== tearTracksIcon &&
        child.tint === 0xef4444,
    );

    expect(redEnemyMarker).toBeDefined();
  });

  it('does not draw the selected outline on the player tile', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-player-selection');
    const app = {
      stage: new MockContainer(),
      screen: { width: 800, height: 600 },
    };

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
    );

    const world = app.stage.children[1] as MockContainer;
    const selectionOutlines = collectDescendants(world).filter(
      (child) =>
        child instanceof MockGraphics &&
        child.lineStyle.mock.calls.some(
          ([width, color, alpha]) =>
            width === 3 && color === 0xf8fafc && alpha === 0.65,
        ),
    );

    expect(selectionOutlines).toHaveLength(0);
  });

  it('removes hover outline and brightens the hovered hex fill', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-hovered-tile');
    const hoveredHex = { q: 1, r: 0 };
    game.tiles['1,0'] = {
      coord: hoveredHex,
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    const app = {
      stage: new MockContainer(),
      screen: { width: 800, height: 600 },
    };

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      hoveredHex,
      12 * 60,
    );

    const world = app.stage.children[1] as MockContainer;
    const worldDescendants = collectDescendants(world);
    const hoverOutlines = worldDescendants.filter(
      (child) =>
        child instanceof MockGraphics &&
        child.lineStyle.mock.calls.some(
          ([width, color, alpha]) =>
            width === 3 && color === 0xe2e8f0 && alpha === 0.85,
        ),
    );
    const brightHoveredFill = worldDescendants.some(
      (child) =>
        child instanceof MockGraphics &&
        child.beginFill.mock.calls.some(
          ([color, alpha]) => color === 0x38bdf8 && alpha === 0.34,
        ),
    );

    expect(hoverOutlines).toHaveLength(0);
    expect(brightHoveredFill).toBe(true);
  });

  it('draws a purple tint around the home hex', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-home-hex');
    game.homeHex = { q: 1, r: 0 };
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    const app = {
      stage: new MockContainer(),
      screen: { width: 800, height: 600 },
    };

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
    );

    const world = app.stage.children[1] as MockContainer;
    const homeTint = collectDescendants(world).filter(
      (child) =>
        child instanceof MockGraphics &&
        child.beginFill.mock.calls.some(
          ([color, alpha]) => color === 0xa855f7 && alpha === 0.22,
        ),
    );

    expect(homeTint).toHaveLength(1);
  });

  it('draws player territory borders without a banner marker', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-player-claim');
    game.homeHex = { q: 2, r: -2 };
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      claim: {
        ownerId: 'player-territory',
        ownerType: 'player',
        ownerName: 'Bound Territory',
        borderColor: '#ffffff',
      },
    };
    const app = {
      stage: new MockContainer(),
      screen: { width: 800, height: 600 },
    };

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
    );

    const world = app.stage.children[1] as MockContainer;
    const territoryBorders = collectDescendants(world).filter(
      (child) =>
        child instanceof MockGraphics &&
        child.lineStyle.mock.calls.some(
          ([width, color, alpha]) =>
            width === 4 && color === 0xffffff && alpha === 0.92,
        ),
    );

    expect(territoryBorders.length).toBeGreaterThan(0);
  });

  it('does not split a territory border when a same-owner neighbor is off-screen', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-offscreen-claim-neighbor');
    game.player.coord = { q: -1, r: 0 };
    game.homeHex = { q: -2, r: 0 };
    game.tiles['0,0'] = {
      ...game.tiles['0,0'],
      claim: {
        ownerId: 'faction-1',
        ownerType: 'faction',
        ownerName: 'Ghostline',
        borderColor: '#ffffff',
      },
    };
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
      claim: {
        ownerId: 'faction-1',
        ownerType: 'faction',
        ownerName: 'Ghostline',
        borderColor: '#ffffff',
      },
    };
    const app = {
      stage: new MockContainer(),
      screen: { width: 800, height: 600 },
    };

    renderScene(
      app as never,
      game,
      [game.tiles['0,0']],
      { q: 0, r: 0 },
      null,
      12 * 60,
    );

    const world = app.stage.children[1] as MockContainer;
    const territoryBorders = collectDescendants(world).filter(
      (child) =>
        child instanceof MockGraphics &&
        child.lineStyle.mock.calls.some(
          ([width, color, alpha]) =>
            width === 3 && color === 0xffffff && alpha === 0.92,
        ),
    ) as MockGraphics[];

    expect(territoryBorders).toHaveLength(5);
  });

  it('highlights each hovered safe-path hex on the interaction layer', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(3, 'render-scene-safe-path');
    const app = {
      stage: new MockContainer(),
      screen: { width: 800, height: 600 },
    };

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      { q: 2, r: 0 },
      12 * 60,
      0,
      [
        { q: 1, r: 0 },
        { q: 2, r: 0 },
      ],
    );

    const world = app.stage.children[1] as MockContainer;
    const safePathTint = collectDescendants(world).filter(
      (child) =>
        child instanceof MockGraphics &&
        child.beginFill.mock.calls.some(
          ([color, alpha]) => color === 0x38bdf8 && alpha === 0.34,
        ),
    );

    expect(safePathTint).toHaveLength(2);
  });

  it('keeps claim borders visible above hovered safe-path overlays', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(3, 'render-scene-safe-path-claim-border');
    game.tiles['1,0'] = {
      ...game.tiles['1,0'],
      claim: {
        ownerId: 'faction-1',
        ownerType: 'faction',
        ownerName: 'Ghostline',
        borderColor: '#ffffff',
      },
    };
    const app = {
      stage: new MockContainer(),
      screen: { width: 800, height: 600 },
    };

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      { q: 2, r: 0 },
      12 * 60,
      0,
      [
        { q: 1, r: 0 },
        { q: 2, r: 0 },
      ],
    );

    const world = app.stage.children[1] as MockContainer;
    const territoryBorders = collectDescendants(world).filter(
      (child) =>
        child instanceof MockGraphics &&
        child.lineStyle.mock.calls.some(
          ([width, color, alpha]) =>
            width === 3 && color === 0xffffff && alpha === 0.92,
        ),
    ) as MockGraphics[];

    expect(territoryBorders).toHaveLength(6);
  });

  it('adds animated campfire and furnace glow only once the world gets dark', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-campfire-glow');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      structure: 'camp',
      items: [],
      enemyIds: [],
    };
    game.tiles['0,1'] = {
      coord: { q: 0, r: 1 },
      terrain: 'plains',
      structure: 'furnace',
      items: [],
      enemyIds: [],
    };

    const nightApp = {
      stage: new MockContainer(),
      screen: { width: 800, height: 600 },
    };
    renderScene(
      nightApp as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      0,
      1600,
    );

    const nightWorld = nightApp.stage.children[1] as MockContainer;
    const nightWorldRoot = nightWorld.children[0] as MockContainer;
    const nightGlowEllipses = collectDescendants(nightWorld).filter(
      (child) =>
        child instanceof MockGraphics &&
        child.drawEllipse.mock.calls.length > 0,
    );
    const nightAnimatedLayer = nightWorldRoot.children[4] as MockContainer;
    const nightMarkerLayer = nightWorldRoot.children[5] as MockContainer;

    const dayApp = {
      stage: new MockContainer(),
      screen: { width: 800, height: 600 },
    };
    renderScene(
      dayApp as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      1600,
    );

    const dayWorld = dayApp.stage.children[1] as MockContainer;
    const dayGlowEllipses = collectDescendants(dayWorld).filter(
      (child) =>
        child instanceof MockGraphics &&
        child.drawEllipse.mock.calls.length > 0,
    );

    expect(nightGlowEllipses.length).toBeGreaterThan(0);
    expect(nightGlowEllipses.length).toBeGreaterThanOrEqual(2);
    expect(dayGlowEllipses).toHaveLength(0);
    expect(nightAnimatedLayer.children.length).toBeGreaterThan(0);
    expect(nightMarkerLayer.children.length).toBeGreaterThan(0);
  });

  it('renders clouds with stronger opacity', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-cloud-opacity');
    const app = {
      stage: new MockContainer(),
      screen: { width: 800, height: 600 },
    };

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
    );

    const clouds = app.stage.children[5] as MockContainer;
    const cloudAlphas = clouds.children.map(
      (child) => (child as { alpha: number }).alpha,
    );

    expect(cloudAlphas.length).toBeGreaterThan(0);
    expect(Math.min(...cloudAlphas)).toBeGreaterThanOrEqual(0.38);
  });

  it('spreads clouds across varied heights', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(3, 'render-scene-ground-cover');
    const app = {
      stage: new MockContainer(),
      screen: { width: 960, height: 720 },
    };

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      1600,
    );

    const clouds = app.stage.children[5] as MockContainer;
    const cloudYPositions = clouds.children.map(
      (child) =>
        (child as { position: { set: ReturnType<typeof vi.fn> } }).position.set
          .mock.calls[0]?.[1],
    );
    const uniqueCloudYBands = new Set(
      cloudYPositions.map((value) => Math.round(value / 24)),
    );

    expect(uniqueCloudYBands.size).toBeGreaterThanOrEqual(8);
  });

  it('reuses persistent stage layers and sprite instances across renders', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-reuse');
    const app = {
      stage: new MockContainer(),
      screen: { width: 800, height: 600 },
    };

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      400,
    );

    const initialStageChildren = [...app.stage.children];
    const initialSpriteCalls = textureFrom.mock.calls.length;

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      { q: 1, r: 0 },
      12 * 60,
      800,
    );

    expect(app.stage.children).toEqual(initialStageChildren);
    expect(textureFrom.mock.calls).toHaveLength(initialSpriteCalls);
  });

  it('caches deterministic cloud and terrain presentation inputs', async () => {
    const randomModule = await import('../../game/random');
    const createRngSpy = vi.spyOn(randomModule, 'createRng');
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-deterministic-cache');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      structure: 'dungeon',
      items: [],
      enemyIds: [],
    };
    const visibleTiles = getVisibleTiles(game);
    const app = {
      stage: new MockContainer(),
      screen: { width: 800, height: 600 },
    };

    createRngSpy.mockClear();

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      400,
    );

    expect(createRngSpy).toHaveBeenCalled();

    createRngSpy.mockClear();

    renderScene(
      app as never,
      { ...game, turn: game.turn + 1 },
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      800,
    );

    const rerenderSeeds = createRngSpy.mock.calls.map(([seed]) => seed);

    expect(rerenderSeeds.some((seed) => seed.includes('-cloud-'))).toBe(false);
    expect(
      rerenderSeeds.some((seed) => seed.includes('-terrain-background-')),
    ).toBe(false);
  });

  it('keeps static world polygons cached across animation-only frames', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-static-cache');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      structure: 'camp',
      items: [],
      enemyIds: [],
    };
    const app = {
      stage: new MockContainer(),
      screen: { width: 800, height: 600 },
    };
    const visibleTiles = getVisibleTiles(game);

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      0,
      1200,
    );

    const world = (app.stage.children[1] as MockContainer)
      .children[0] as MockContainer;
    const initialPolygonCalls = collectDescendants(world)
      .filter((child) => child instanceof MockGraphics)
      .reduce((sum, child) => sum + child.drawPolygon.mock.calls.length, 0);
    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      0,
      1800,
    );

    const finalPolygonCalls = collectDescendants(world)
      .filter((child) => child instanceof MockGraphics)
      .reduce((sum, child) => sum + child.drawPolygon.mock.calls.length, 0);
    expect(finalPolygonCalls).toBe(initialPolygonCalls);
  });

  it('skips enemy lookups on pure animation-only frames once static layers are cached', async () => {
    const stateModule = await import('../../game/state');
    const getEnemiesAtSpy = vi.spyOn(stateModule, 'getEnemiesAt');
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-animation-only-skip');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      structure: 'camp',
      items: [],
      enemyIds: [],
    };
    const visibleTiles = getVisibleTiles(game);
    const app = {
      stage: new MockContainer(),
      screen: { width: 800, height: 600 },
    };

    getEnemiesAtSpy.mockClear();

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      0,
      1200,
    );

    const initialEnemyLookupCount = getEnemiesAtSpy.mock.calls.length;

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      0,
      1800,
    );

    expect(getEnemiesAtSpy).toHaveBeenCalledTimes(initialEnemyLookupCount);
  });

  it('keeps static and stable interaction layers cached across time-only frames', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-time-cache');
    game.homeHex = { q: 1, r: 0 };
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    const app = {
      stage: new MockContainer(),
      screen: { width: 800, height: 600 },
    };
    const visibleTiles = getVisibleTiles(game);

    renderScene(
      app as never,
      game,
      visibleTiles,
      { q: 1, r: 0 },
      null,
      0,
      1200,
    );

    const world = (app.stage.children[1] as MockContainer)
      .children[0] as MockContainer;
    const initialPolygonCalls = collectDescendants(world)
      .filter((child) => child instanceof MockGraphics)
      .reduce((sum, child) => sum + child.drawPolygon.mock.calls.length, 0);

    renderScene(
      app as never,
      game,
      visibleTiles,
      { q: 1, r: 0 },
      null,
      12 * 60,
      1800,
    );

    const finalPolygonCalls = collectDescendants(world)
      .filter((child) => child instanceof MockGraphics)
      .reduce((sum, child) => sum + child.drawPolygon.mock.calls.length, 0);

    expect(finalPolygonCalls).toBe(initialPolygonCalls);
  });

  it('keeps static and stable interaction layers cached across log-only state clones', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-log-cache');
    game.homeHex = { q: 1, r: 0 };
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: [],
    };
    const app = {
      stage: new MockContainer(),
      screen: { width: 800, height: 600 },
    };

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      { q: 1, r: 0 },
      null,
      12 * 60,
      1200,
    );

    const world = (app.stage.children[1] as MockContainer)
      .children[0] as MockContainer;
    const initialPolygonCalls = collectDescendants(world)
      .filter((child) => child instanceof MockGraphics)
      .reduce((sum, child) => sum + child.drawPolygon.mock.calls.length, 0);
    const logOnlyGame = {
      ...game,
      logs: [
        ...game.logs,
        {
          id: 'log-4',
          kind: 'system' as const,
          text: 'A quiet wind rolls over the valley.',
          turn: game.turn,
        },
      ],
    };

    renderScene(
      app as never,
      logOnlyGame,
      getVisibleTiles(logOnlyGame),
      { q: 1, r: 0 },
      null,
      12 * 60,
      1800,
    );

    const finalPolygonCalls = collectDescendants(world)
      .filter((child) => child instanceof MockGraphics)
      .reduce((sum, child) => sum + child.drawPolygon.mock.calls.length, 0);

    expect(finalPolygonCalls).toBe(initialPolygonCalls);
  });

  it('covers hexes beyond the reveal radius with fog of war', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(6, 'render-scene-fog-of-war');
    game.tiles['5,0'] = {
      coord: { q: 5, r: 0 },
      terrain: 'forest',
      structure: 'town',
      items: [],
      enemyIds: ['enemy-5,0-0'],
    };
    game.enemies['enemy-5,0-0'] = {
      id: 'enemy-5,0-0',
      name: 'Raider',
      coord: { q: 5, r: 0 },
      tier: 9,
      hp: 10,
      maxHp: 10,
      attack: 5,
      defense: 2,
      xp: 12,
      elite: false,
    };
    const app = {
      stage: new MockContainer(),
      screen: { width: 960, height: 720 },
    };

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
    );

    const worldMap = app.stage.children[1] as MockContainer;
    const world = worldMap.children[0] as MockContainer;
    const fogPolygons = collectDescendants(world).filter(
      (child) =>
        child instanceof MockGraphics &&
        child.beginFill.mock.calls.some(
          ([color, alpha]) => color === 0x020617 && alpha === 0.78,
        ),
    );
    const labels = worldMap.children[2] as MockContainer;

    expect(fogPolygons.length).toBeGreaterThan(0);
    expect(
      labels.children.some(
        (child) => child instanceof MockText && child.text === 'L9',
      ),
    ).toBe(false);
  });

  it('uses NPC marker icon on faction claim tiles', async () => {
    const { renderScene } = await import('./renderScene');
    textureFrom.mockClear();
    const game = createGame(0, 'render-scene-faction-npc-icon');
    game.tiles['0,0'] = {
      coord: { q: 0, r: 0 },
      terrain: 'plains',
      items: [],
      enemyIds: ['faction-npc:2'],
      claim: {
        ownerId: 'faction-claims',
        ownerType: 'faction',
        ownerName: 'Ghostline',
        borderColor: '#ffffff',
        npc: { name: 'Araken', enemyId: 'faction-npc:2' },
      },
    };

    const app = {
      stage: new MockContainer(),
      screen: { width: 800, height: 600 },
    };

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
    );

    const worldMap = app.stage.children[1] as MockContainer;
    const world = worldMap.children[0] as MockContainer;
    const markerLayer = world.children[5] as MockContainer;

    const markerWrappers = markerLayer.children.filter(
      (child): child is MockContainer => child instanceof MockContainer,
    );
    expect(markerWrappers).toHaveLength(1);

    const markerChildren = markerWrappers[0].children as Array<{
      icon: string;
    }>;
    expect(markerChildren.length).toBe(5);
    expect(
      markerChildren.every((sprite) => sprite.icon === tearTracksIcon),
    ).toBe(true);
    expect(markerChildren.every((sprite) => sprite.icon !== wolfHeadIcon)).toBe(
      true,
    );
    expect(markerChildren.every((sprite) => sprite.icon !== playerIcon)).toBe(
      true,
    );
  });

  it('renders world bosses across a dead-forest footprint', async () => {
    const { renderScene } = await import('./renderScene');
    textureFrom.mockClear();
    const { game } = createPlacedWorldBossRenderGame();
    const app = {
      stage: new MockContainer(),
      screen: { width: 960, height: 720 },
    };

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
    );

    const worldMap = app.stage.children[1] as MockContainer;
    const world = worldMap.children[0] as MockContainer;
    const markerLayer = world.children[5] as MockContainer;
    const markerWrappers = markerLayer.children.filter(
      (child): child is MockContainer => child instanceof MockContainer,
    );
    const worldBossWrapper = markerWrappers.find((wrapper) =>
      (wrapper.children as Array<{ icon?: string }>).some(
        (child) => child.icon === gluttonyIcon,
      ),
    );

    expect(worldBossWrapper).toBeDefined();
    const worldBossHexTints = collectDescendants(world).filter(
      (child) =>
        child instanceof MockGraphics &&
        child.beginFill.mock.calls.some(
          ([color, alpha]) => color === 0x7f1d1d && alpha === 0.22,
        ),
    );
    expect(worldBossHexTints.length).toBe(7);

    const worldBossSprites = (worldBossWrapper?.children ?? []) as Array<{
      icon?: string;
      width?: number;
      height?: number;
      tint?: number;
    }>;
    expect(
      worldBossSprites.some(
        (child) =>
          child.icon === gluttonyIcon &&
          (child.width ?? 0) >= 75 &&
          (child.width ?? 0) < 130 &&
          (child.height ?? 0) >= 75 &&
          (child.height ?? 0) < 130 &&
          child.tint === 0x7f1d1d,
      ),
    ).toBe(true);
  });
});
