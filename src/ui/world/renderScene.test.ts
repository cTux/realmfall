import { createGame, getVisibleTiles } from '../../game/state';
import forestClearingIcon from '../../assets/forest-pack/forest_03_clearing.png';
import forestFewTreesIcon from '../../assets/forest-pack/forest_02_fewTrees.png';
import forestTempleIcon from '../../assets/forest-pack/forest_20_temple.png';

const spriteFrom = vi.fn((icon: string) => ({
  icon,
  anchor: { set: vi.fn() },
  position: { set: vi.fn() },
  width: 0,
  height: 0,
  tint: 0,
  alpha: 1,
  visible: true,
}));

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
  drawPolygon = vi.fn();
  drawEllipse = vi.fn();
  drawRect = vi.fn();
  endFill = vi.fn();
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
  constructor(
    public vertexSrc: string | undefined,
    public fragmentSrc: string,
    public uniforms: Record<string, unknown>,
  ) {}
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
  BLEND_MODES: { ADD: 'add' },
  Container: MockContainer,
  Filter: MockFilter,
  Graphics: MockGraphics,
  Rectangle: MockRectangle,
  Sprite: { from: spriteFrom },
  Text: MockText,
  TextStyle: MockTextStyle,
}));

describe('renderScene', () => {
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
          kind: 'resource',
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
    expect(spriteFrom).toHaveBeenCalled();
    expect(
      spriteFrom.mock.calls.some(([icon]) => typeof icon === 'string'),
    ).toBe(true);

    const worldMap = app.stage.children[1] as MockContainer;
    const labels = worldMap.children[2] as MockContainer;
    expect(labels.children.some((child) => child instanceof MockText)).toBe(
      false,
    );
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
        child.beginFill.mock.calls.some(([, alpha]) => alpha === 0.2),
    );

    expect(hoverOutlines).toHaveLength(0);
    expect(brightHoveredFill).toBe(true);
  });

  it('adds animated campfire glow only once the world gets dark', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-campfire-glow');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      structure: 'camp',
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
    const nightGlowEllipses = collectDescendants(nightWorld).filter(
      (child) =>
        child instanceof MockGraphics &&
        child.drawEllipse.mock.calls.length > 0,
    );

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
    expect(dayGlowEllipses).toHaveLength(0);
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

  it('spreads clouds across varied heights and adds terrain background art', async () => {
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

    const world = app.stage.children[1] as MockContainer;
    const clouds = app.stage.children[5] as MockContainer;
    const terrainSprites = collectDescendants(world).filter((child) =>
      [forestClearingIcon, forestFewTreesIcon, forestTempleIcon].includes(
        (child as { icon?: string }).icon ?? '',
      ),
    );
    const cloudYPositions = clouds.children.map(
      (child) =>
        (child as { position: { set: ReturnType<typeof vi.fn> } }).position.set
          .mock.calls[0]?.[1],
    );
    const uniqueCloudYBands = new Set(
      cloudYPositions.map((value) => Math.round(value / 24)),
    );

    expect(terrainSprites.length).toBeGreaterThanOrEqual(4);
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
    const initialSpriteCalls = spriteFrom.mock.calls.length;

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
    expect(spriteFrom.mock.calls).toHaveLength(initialSpriteCalls);
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
    const initialEllipseCalls = collectDescendants(world)
      .filter((child) => child instanceof MockGraphics)
      .reduce((sum, child) => sum + child.drawEllipse.mock.calls.length, 0);

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
    const finalEllipseCalls = collectDescendants(world)
      .filter((child) => child instanceof MockGraphics)
      .reduce((sum, child) => sum + child.drawEllipse.mock.calls.length, 0);

    expect(finalPolygonCalls).toBe(initialPolygonCalls);
    expect(finalEllipseCalls).toBeGreaterThan(initialEllipseCalls);
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
});
