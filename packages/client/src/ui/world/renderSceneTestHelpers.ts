import { afterEach, beforeEach, vi } from 'vitest';
import { createGame } from '@realmfall/core/game/stateFactory';
import { hexKey, hexNeighbors } from '@realmfall/core/game/hex';
import { getVisibleTiles } from '@realmfall/core/game/stateSelectors';
import gluttonyIcon from '../../assets/icons/gluttony.svg';
import playerIcon from '../../assets/icons/visored-helm.svg';
import wolfHeadIcon from '../../assets/icons/wolf-head.svg';
import tearTracksIcon from '../../assets/icons/tear-tracks.svg';
import castleIcon from '../../assets/icons/castle.svg';

export { castleIcon, gluttonyIcon, playerIcon, tearTracksIcon, wolfHeadIcon };

export const textureFrom = vi.fn((icon: string) => ({ icon }));
const assetsGet = vi.fn(() => undefined);
const assetsLoad = vi.fn(async () => []);
const extensionsAdd = vi.fn();

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

export class MockSprite {
  icon?: string;
  private currentTexture: { icon?: string };
  anchor = { set: vi.fn() };
  position = createMutablePoint();
  width = 0;
  height = 0;
  tint = 0;
  alpha = 1;
  visible = true;

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

export class MockContainer {
  children: unknown[] = [];
  alpha = 1;
  rotation = 0;
  visible = true;
  position = createMutablePoint();
  scale = createMutablePoint(1, 1);

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

export class MockGraphics extends MockContainer {
  renderable = true;
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

export class MockText extends MockContainer {
  anchor = { set: vi.fn() };

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

class MockTexture {
  static EMPTY = { icon: undefined };
  static from = textureFrom;

  destroyed = false;
  source: { destroyed: boolean } | null;

  constructor(
    public options: {
      frame?: unknown;
      icon?: string;
      source?: { destroyed?: boolean } | null;
    },
  ) {
    this.source = options.source
      ? { destroyed: options.source.destroyed ?? false }
      : { destroyed: false };
  }
}

class MockFilter {
  resources: Record<string, unknown>;

  constructor(options?: { resources?: Record<string, unknown> }) {
    this.resources = options?.resources ?? {};
  }
}

class MockImageSource {
  constructor(public options: unknown) {}
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
  ImageSource: MockImageSource,
  loadSvg: { extension: { name: 'loadSVG' } },
  loadTextures: { extension: { name: 'loadTextures' } },
  Rectangle: MockRectangle,
  Sprite: MockSprite,
  Text: MockText,
  TextStyle: MockTextStyle,
  Texture: MockTexture,
  UniformGroup: MockUniformGroup,
}));

export interface MockApp {
  stage: MockContainer;
  screen: {
    width: number;
    height: number;
  };
}

export function setupRenderSceneTestEnvironment() {
  beforeEach(() => {
    vi.resetModules();
    textureFrom.mockClear();
    assetsGet.mockClear();
    assetsLoad.mockClear();
    extensionsAdd.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
}

export function createMockApp(width = 800, height = 600): MockApp {
  return {
    stage: new MockContainer(),
    screen: { width, height },
  };
}

type RenderSceneFrameOptions = {
  app?: MockApp;
  focusCoord?: { q: number; r: number };
  game?: ReturnType<typeof createGame>;
  nowMs?: number;
  overlayState?: unknown;
  radius?: number;
  screen?: { height: number; width: number };
  seed?: string;
  visibleTiles?: ReturnType<typeof getVisibleTiles>;
  worldTimeMinutes?: number;
};

export async function renderSceneFrame({
  app,
  focusCoord,
  game,
  nowMs = 0,
  overlayState,
  radius = 2,
  screen,
  seed = 'render-scene-test',
  visibleTiles,
  worldTimeMinutes = 12 * 60,
}: RenderSceneFrameOptions = {}) {
  const { renderScene } = await import('./renderScene');
  const nextGame = game ?? createGame(radius, seed);
  const nextApp = app ?? createMockApp(screen?.width, screen?.height);
  const nextVisibleTiles = visibleTiles ?? getVisibleTiles(nextGame);

  renderScene(
    nextApp as never,
    nextGame,
    nextVisibleTiles,
    focusCoord ?? nextGame.player.coord,
    null,
    worldTimeMinutes,
    nowMs,
    null,
    overlayState as never,
  );

  return { app: nextApp, game: nextGame, visibleTiles: nextVisibleTiles };
}

export function collectDescendants(root: MockContainer): unknown[] {
  return root.children.flatMap((child) => {
    if (child instanceof MockContainer) {
      return [child, ...collectDescendants(child)];
    }
    return [child];
  });
}

export function countDrawnPolygons(root: MockContainer) {
  return collectDescendants(root)
    .filter((child): child is MockGraphics => child instanceof MockGraphics)
    .reduce((sum, child) => sum + child.drawPolygon.mock.calls.length, 0);
}

export function getVisibleGraphics(root: MockContainer) {
  return collectDescendants(root).filter(
    (child): child is MockGraphics =>
      child instanceof MockGraphics && child.visible,
  );
}

export function getVisibleSprites(root: MockContainer) {
  return collectDescendants(root).filter(
    (child): child is MockSprite =>
      child instanceof MockSprite && child.visible,
  );
}

export function getWorldMap(app: MockApp) {
  return app.stage.children[1] as MockContainer;
}

export function getWorld(app: MockApp) {
  return getWorldMap(app).children[0] as MockContainer;
}

export function getLabelsLayer(app: MockApp) {
  return getWorldMap(app).children[2] as MockContainer;
}

export function getMarkerLayer(app: MockApp) {
  return getWorld(app).children[5] as MockContainer;
}

export function getBadgeLayer(app: MockApp) {
  return getWorld(app).children[6] as MockContainer;
}

export function getPlayerLayer(app: MockApp) {
  return getWorld(app).children[7] as MockContainer;
}

export function getWorldGroundLayer(app: MockApp) {
  return getWorld(app).children[0] as MockContainer;
}

export function getAnimatedDetailLayer(app: MockApp) {
  return getWorld(app).children[4] as MockContainer;
}

export function getCloudShadowLayer(app: MockApp) {
  return app.stage.children[4] as MockContainer;
}

export function getCloudLayer(app: MockApp) {
  return app.stage.children[5] as MockContainer;
}

export function findGraphicAt(
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

export function findSpriteAt(
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

export function findContainerAt(
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

export function getAverageGraphicY(graphic: MockGraphics) {
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

export function getMaxGraphicRadius(graphic: MockGraphics) {
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

export function getMinGraphicRadius(graphic: MockGraphics) {
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

export function getGraphicThickness(graphic: MockGraphics) {
  return getMaxGraphicRadius(graphic) - getMinGraphicRadius(graphic);
}

export function createPlacedWorldBossRenderGame() {
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
  game.player.coord = { q: 3, r: 0 };

  return { game, center };
}
