import { afterEach, beforeEach, vi } from 'vitest';
import { createGame } from '../../game/stateFactory';
import { hexKey, hexNeighbors } from '../../game/hex';
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
    EMPTY: { icon: undefined },
    from: textureFrom,
  },
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

export function getCloudLayer(app: MockApp) {
  return app.stage.children[5] as MockContainer;
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
