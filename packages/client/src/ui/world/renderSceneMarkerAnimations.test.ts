import { createGame } from '../../game/stateFactory';
import { getVisibleTiles } from '../../game/stateSelectors';
import { hexKey, hexNeighbors } from '../../game/hex';

function createMutablePoint(initialX = 0, initialY = 0) {
  const point = {
    set: vi.fn((nextX: number, nextY?: number) => {
      point.x = nextX;
      point.y = nextY ?? nextX;
    }),
    x: initialX,
    y: initialY,
  };
  return point;
}

class MockSprite {
  alpha = 1;
  anchor = { set: vi.fn() };
  height = 0;
  icon?: string;
  position = createMutablePoint();
  tint = 0;
  visible = true;
  width = 0;
  private currentTexture: { icon?: string };

  constructor(texture: { icon?: string }) {
    this.currentTexture = texture;
    this.icon = texture.icon;
  }

  get texture() {
    return this.currentTexture;
  }

  set texture(texture: { icon?: string }) {
    this.currentTexture = texture;
    this.icon = texture.icon;
  }
}

class MockContainer {
  alpha = 1;
  children: unknown[] = [];
  position = createMutablePoint();
  rotation = 0;
  scale = createMutablePoint(1, 1);
  visible = true;

  addChild(...children: unknown[]) {
    this.children.push(...children);
    return children[0];
  }
}

class MockGraphics extends MockContainer {
  clear = vi.fn();
  drawPolygon = vi.fn();
  drawRect = vi.fn();
  ellipse = vi.fn(() => this);
  fill = vi.fn(() => this);
  lineTo = vi.fn(() => this);
  moveTo = vi.fn(() => this);
  poly = vi.fn((points: number[]) => {
    this.drawPolygon(points);
    return this;
  });
  rect = vi.fn((x: number, y: number, width: number, height: number) => {
    this.drawRect(x, y, width, height);
    return this;
  });
  stroke = vi.fn(() => this);
}

class MockText extends MockContainer {
  constructor(
    public text: string,
    public style: unknown,
  ) {
    super();
  }
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

  constructor(structure: Record<string, { type: string; value: unknown }>) {
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

const textureFrom = vi.fn((icon: string) => ({ icon }));

vi.mock('pixi.js', () => ({
  BLEND_MODES: { ADD: 'add' },
  Container: MockContainer,
  Filter: MockFilter,
  GlProgram: {
    from: vi.fn((options: Record<string, unknown>) => options),
  },
  Graphics: MockGraphics,
  Rectangle: MockRectangle,
  Sprite: MockSprite,
  Text: MockText,
  TextStyle: MockTextStyle,
  Texture: {
    EMPTY: { icon: undefined },
    from: textureFrom,
  },
  UniformGroup: MockUniformGroup,
}));

describe('renderScene marker animation', () => {
  it('uses a smooth hostile jump profile with eased takeoff and landing', async () => {
    const { sampleHostileMarkerJump } =
      await import('./renderSceneMarkerAnimations');

    expect(sampleHostileMarkerJump(0)).toBeCloseTo(0);
    expect(sampleHostileMarkerJump(0.125)).toBeCloseTo(0.146447, 6);
    expect(sampleHostileMarkerJump(0.25)).toBeCloseTo(0.5, 6);
    expect(sampleHostileMarkerJump(0.5)).toBeCloseTo(1, 6);
    expect(sampleHostileMarkerJump(0.75)).toBeCloseTo(0.5, 6);
    expect(sampleHostileMarkerJump(1)).toBeCloseTo(0, 6);
  });

  it('animates hostile markers on animation-only frames without rebuilding static terrain', async () => {
    const { renderScene } = await import('./renderScene');
    const { getSceneCache } = await import('./renderSceneCache');
    const game = createGame(2, 'render-scene-animated-enemy-markers');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'forest',
      items: [],
      enemyIds: ['enemy-1,0-0'],
    };
    game.enemies['enemy-1,0-0'] = {
      id: 'enemy-1,0-0',
      enemyTypeId: 'wolf',
      name: 'Wolf',
      coord: { q: 1, r: 0 },
      rarity: 'rare',
      tier: 2,
      hp: 5,
      maxHp: 5,
      attack: 3,
      defense: 1,
      xp: 5,
      elite: false,
    };
    const app = {
      screen: { height: 600, width: 800 },
      stage: new MockContainer(),
    };
    const visibleTiles = getVisibleTiles(game);

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      0,
    );

    const world = (app.stage.children[1] as MockContainer)
      .children[0] as MockContainer;
    const scene = getSceneCache(app as never);
    const animatedMarker = scene.animatedWorldMarkers.find(
      (marker) => marker.kind === 'enemy',
    );
    expect(animatedMarker).toBeDefined();
    const wrapper = animatedMarker?.entry.wrapper as unknown as MockContainer;
    const initialY = wrapper.position.y;
    const initialScale = wrapper.scale.x;
    const initialPolygonCalls = totalPolygonCalls(world);

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      240,
    );

    expect(wrapper.position.y).not.toBe(initialY);
    expect(wrapper.scale.x).not.toBe(initialScale);
    expect(totalPolygonCalls(world)).toBe(initialPolygonCalls);
  });

  it('pulses world-boss markers on animation-only frames without rebuilding static terrain', async () => {
    const { renderScene } = await import('./renderScene');
    const { getSceneCache } = await import('./renderSceneCache');
    const game = createGame(6, 'render-scene-animated-world-boss-markers');
    const center = { q: 1, r: 0 };
    const bossId = `world-boss-${hexKey(center)}`;

    game.tiles[hexKey(center)] = {
      coord: center,
      terrain: 'forest',
      items: [],
      enemyIds: [bossId],
    };
    hexNeighbors(center).forEach((coord) => {
      game.tiles[hexKey(coord)] = {
        coord,
        terrain: 'forest',
        items: [],
        enemyIds: [],
      };
    });
    game.enemies[bossId] = {
      id: bossId,
      enemyTypeId: 'gluttony',
      name: 'Gluttony',
      coord: center,
      rarity: 'legendary',
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
    game.player.coord = { q: 0, r: 0 };
    const app = {
      screen: { height: 720, width: 960 },
      stage: new MockContainer(),
    };
    const visibleTiles = getVisibleTiles(game);

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      0,
    );

    const scene = getSceneCache(app as never);
    const worldBossMarker = scene.animatedWorldMarkers.find(
      (marker) => marker.kind === 'worldBoss',
    );
    expect(worldBossMarker).toBeDefined();

    const world = (app.stage.children[1] as MockContainer)
      .children[0] as MockContainer;
    const wrapper = worldBossMarker?.entry.wrapper as unknown as MockContainer;
    const initialScale = wrapper.scale.x;
    const initialPolygonCalls = totalPolygonCalls(world);

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      240,
    );

    expect(wrapper.scale.x).not.toBe(initialScale);
    expect(wrapper.scale.x).toBeGreaterThan(1);
    expect(totalPolygonCalls(world)).toBe(initialPolygonCalls);
  });

  it('shimmers town markers on animation-only frames without rebuilding static terrain', async () => {
    const { renderScene } = await import('./renderScene');
    const { getSceneCache } = await import('./renderSceneCache');
    const game = createGame(1, 'render-scene-animated-settlement-markers');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      structure: 'town',
      items: [],
      enemyIds: [],
    };
    const app = {
      screen: { height: 600, width: 800 },
      stage: new MockContainer(),
    };
    const visibleTiles = getVisibleTiles(game);

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      0,
    );

    const world = (app.stage.children[1] as MockContainer)
      .children[0] as MockContainer;
    const scene = getSceneCache(app as never);
    const settlementMarker = scene.animatedWorldMarkers.find(
      (marker) => marker.kind === 'resource',
    );
    expect(settlementMarker).toBeDefined();
    const wrapper = settlementMarker?.entry.wrapper as unknown as MockContainer;
    const sprite = getMainSprite(wrapper);
    const initialY = wrapper.position.y;
    const initialTint = sprite.tint;
    const initialPolygonCalls = totalPolygonCalls(world);

    const shimmerObserved = [240, 480, 720, 960, 1200, 1440, 1680, 1920].some(
      (animationMs) => {
        renderScene(
          app as never,
          game,
          visibleTiles,
          game.player.coord,
          null,
          12 * 60,
          animationMs,
        );
        return wrapper.scale.x !== 1 || sprite.tint !== initialTint;
      },
    );

    expect(shimmerObserved).toBe(true);
    expect(wrapper.position.y).toBe(initialY);
    expect(totalPolygonCalls(world)).toBe(initialPolygonCalls);
  });

  it('shimmers dungeon markers on animation-only frames without rebuilding static terrain', async () => {
    const { renderScene } = await import('./renderScene');
    const { getSceneCache } = await import('./renderSceneCache');
    const game = createGame(1, 'render-scene-animated-dungeon-markers');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      structure: 'dungeon',
      items: [],
      enemyIds: [],
    };
    const app = {
      screen: { height: 600, width: 800 },
      stage: new MockContainer(),
    };
    const visibleTiles = getVisibleTiles(game);

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      0,
    );

    const world = (app.stage.children[1] as MockContainer)
      .children[0] as MockContainer;
    const scene = getSceneCache(app as never);
    const utilityMarker = scene.animatedWorldMarkers.find(
      (marker) => marker.kind === 'resource',
    );
    expect(utilityMarker).toBeDefined();
    const wrapper = utilityMarker?.entry.wrapper as unknown as MockContainer;
    const sprite = getMainSprite(wrapper);
    const initialPolygonCalls = totalPolygonCalls(world);
    const initialTint = sprite.tint;

    const shimmerObserved = [240, 480, 720, 960, 1200, 1440, 1680, 1920].some(
      (animationMs) => {
        renderScene(
          app as never,
          game,
          visibleTiles,
          game.player.coord,
          null,
          12 * 60,
          animationMs,
        );
        return wrapper.scale.x !== 1 || sprite.tint !== initialTint;
      },
    );

    expect(shimmerObserved).toBe(true);
    expect(totalPolygonCalls(world)).toBe(initialPolygonCalls);
  });

  it('animates forgotten-loot markers with a bob without rebuilding static terrain', async () => {
    const { renderScene } = await import('./renderScene');
    const { getSceneCache } = await import('./renderSceneCache');
    const game = createGame(2, 'render-scene-forgotten-loot-markers');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      items: [
        {
          id: 'forgotten-loot-gold',
          name: 'Gold',
          quantity: 1,
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
    const app = {
      screen: { height: 600, width: 800 },
      stage: new MockContainer(),
    };
    const visibleTiles = getVisibleTiles(game);

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      0,
    );

    const scene = getSceneCache(app as never);
    const forgottenLootMarker = scene.animatedWorldMarkers.find(
      (marker) => marker.kind === 'forgottenLoot',
    );
    expect(forgottenLootMarker).toBeDefined();
    const world = (app.stage.children[1] as MockContainer)
      .children[0] as MockContainer;
    const wrapper = forgottenLootMarker?.entry.wrapper as unknown as MockContainer;
    const initialScale = wrapper.scale.x;
    const initialY = wrapper.position.y;
    const initialPolygonCalls = totalPolygonCalls(world);

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      240,
    );

    expect(wrapper.scale.x).not.toBe(initialScale);
    expect(wrapper.position.y).not.toBe(initialY);
    expect(totalPolygonCalls(world)).toBe(initialPolygonCalls);
  });

  it('adds intermittent shimmer to gathering markers without rebuilding static terrain', async () => {
    const { renderScene } = await import('./renderScene');
    const { getSceneCache } = await import('./renderSceneCache');
    const game = createGame(1, 'render-scene-animated-resource-markers');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      structure: 'copper-ore',
      items: [],
      enemyIds: [],
    };
    const app = {
      screen: { height: 600, width: 800 },
      stage: new MockContainer(),
    };
    const visibleTiles = getVisibleTiles(game);

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      0,
    );

    const world = (app.stage.children[1] as MockContainer)
      .children[0] as MockContainer;
    const scene = getSceneCache(app as never);
    const resourceMarker = scene.animatedWorldMarkers.find(
      (marker) => marker.kind === 'resource',
    );
    expect(resourceMarker).toBeDefined();
    const wrapper = resourceMarker?.entry.wrapper as unknown as MockContainer;
    const sprite = getMainSprite(wrapper);
    const initialPolygonCalls = totalPolygonCalls(world);
    const initialScale = wrapper.scale.x;
    const initialTint = sprite.tint;

    const shimmerObserved = [240, 480, 720, 960, 1200, 1440, 1680, 1920].some(
      (animationMs) => {
        renderScene(
          app as never,
          game,
          visibleTiles,
          game.player.coord,
          null,
          12 * 60,
          animationMs,
        );
        return wrapper.scale.x !== initialScale || sprite.tint !== initialTint;
      },
    );

    expect(shimmerObserved).toBe(true);
    expect(totalPolygonCalls(world)).toBe(initialPolygonCalls);
  });
});

function collectDescendants(root: MockContainer): unknown[] {
  return root.children.flatMap((child) => {
    if (child instanceof MockContainer) {
      return [child, ...collectDescendants(child)];
    }
    return [child];
  });
}

function totalPolygonCalls(world: MockContainer) {
  return collectDescendants(world)
    .filter((child): child is MockGraphics => child instanceof MockGraphics)
    .reduce((sum, child) => sum + child.drawPolygon.mock.calls.length, 0);
}

function getMainSprite(wrapper: MockContainer) {
  return wrapper.children[wrapper.children.length - 1] as MockSprite;
}
