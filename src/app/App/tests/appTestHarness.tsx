import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { createGame } from '../../../game/state';
import { GAME_DAY_DURATION_MS, GAME_DAY_MINUTES } from '../../../game/config';

export const renderScene = vi.fn();
export const loadEncryptedState = vi.fn();
export const saveEncryptedState = vi.fn();
export const clearEncryptedState = vi.fn();
export const tickerCallbacks = new Set<() => void>();
export const applicationOptions: Array<Record<string, unknown>> = [];
export const ensureWorldIconTexturesLoaded = vi.fn(async () => undefined);
export const getVisibleWorldIconAssetIds = vi.fn(() => ['visible-start-icon']);
export const warmWorldIconTexturesInBackground = vi.fn();

class MockStage {
  children: unknown[] = [];

  removeChildren() {
    return [];
  }

  addChild(...children: unknown[]) {
    this.children.push(...children);
  }
}

vi.mock('pixi.js', () => {
  const assetsGet = vi.fn(() => undefined);
  const assetsLoad = vi.fn(async () => []);
  const extensionsAdd = vi.fn();
  const textureFrom = vi.fn((icon: string) => ({ icon }));

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
    pivot = { set: vi.fn() };
    scale = { set: vi.fn() };

    addChild(...children: unknown[]) {
      this.children.push(...children);
      return children[0];
    }
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
    ellipse = vi.fn(
      (x: number, y: number, radiusX: number, radiusY: number) => {
        this.drawEllipse(x, y, radiusX, radiusY);
        return this;
      },
    );
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

    constructor(structure: Record<string, { value: unknown; type: string }>) {
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

  class MockApplication {
    stage = new MockStage();
    screen = { width: 800, height: 600 };
    renderer = {
      resize: vi.fn((width: number, height: number) => {
        this.screen = { width, height };
      }),
      resolution: 1,
    };
    ticker = {
      add: vi.fn((callback: () => void) => {
        tickerCallbacks.add(callback);
      }),
      remove: vi.fn((callback: () => void) => {
        tickerCallbacks.delete(callback);
      }),
    };
    canvas = document.createElement('canvas');
    destroy = vi.fn();

    constructor() {
      Object.defineProperty(this.canvas, 'getBoundingClientRect', {
        value: () => ({ left: 0, top: 0, width: 800, height: 600 }),
      });
    }

    async init(options: {
      width: number;
      height: number;
      resolution?: number;
      autoDensity?: boolean;
    }) {
      applicationOptions.push(options as unknown as Record<string, unknown>);
      this.screen = { width: options.width, height: options.height };
      this.renderer.resolution = options.resolution ?? 1;
    }

    get view() {
      return this.canvas;
    }
  }

  return {
    Assets: {
      get: assetsGet,
      load: assetsLoad,
    },
    Application: MockApplication,
    Container: MockContainer,
    Filter: MockFilter,
    GlProgram: {
      from: vi.fn((options: Record<string, unknown>) => options),
    },
    Graphics: MockGraphics,
    extensions: {
      add: extensionsAdd,
    },
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
  };
});

vi.mock('../../../persistence/storage', () => ({
  clearEncryptedState,
  loadEncryptedState,
  saveEncryptedState,
}));

vi.mock('../../../ui/world/renderScene', () => ({
  renderScene,
}));

vi.mock('../../../ui/world/worldIcons', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('../../../ui/world/worldIcons')
  >();

  return {
    ...actual,
    ensureWorldIconTexturesLoaded,
    getVisibleWorldIconAssetIds,
    warmWorldIconTexturesInBackground,
  };
});

vi.mock('../../audio/VoiceAudioControllerBridge', () => ({
  VoiceAudioControllerBridge: () => null,
}));

export async function flushLazyModules() {
  await act(async () => {
    for (let index = 0; index < 20; index += 1) {
      await vi.dynamicImportSettled();
      await Promise.resolve();

      if (applicationOptions.length > 0) {
        break;
      }
    }
  });
}

export async function flushAnimationFrame() {
  await act(async () => {
    vi.advanceTimersByTime(16);
    await Promise.resolve();
  });
}

export async function renderApp() {
  const { App } = await import('../index');
  const host = document.createElement('div');
  document.body.appendChild(host);
  const root = createRoot(host);

  await act(async () => {
    root.render(<App />);
  });

  return { host, root };
}

export function createHydratedAppGame() {
  const game = createGame(3, 'app-test-seed');
  game.homeHex = { q: 2, r: -1 };
  game.worldTimeMs =
    2 * GAME_DAY_DURATION_MS + (15 / GAME_DAY_MINUTES) * GAME_DAY_DURATION_MS;
  game.tiles['0,0'] = {
    ...game.tiles['0,0'],
    structure: 'forge',
    items: [
      {
        id: 'loot-gold',
        name: 'Gold',
        quantity: 5,
        tier: 1,
        rarity: 'common',
        power: 0,
        defense: 0,
        maxHp: 0,
        healing: 0,
        hunger: 0,
      },
    ],
  };
  game.player.inventory = [
    {
      id: 'food-1',
      name: 'Trail Ration',
      quantity: 1,
      tier: 1,
      rarity: 'common',
      power: 0,
      defense: 0,
      maxHp: 0,
      healing: 8,
      hunger: 12,
    },
    {
      id: 'armor-1',
      slot: 'head',
      name: 'Scout Hood',
      quantity: 1,
      tier: 1,
      rarity: 'uncommon',
      power: 0,
      defense: 1,
      maxHp: 0,
      healing: 0,
      hunger: 0,
    },
  ];
  game.tiles['1,0'] = {
    coord: { q: 1, r: 0 },
    terrain: 'plains',
    items: [],
    structure: undefined,
    enemyIds: ['enemy-1,0-0'],
  };
  game.enemies['enemy-1,0-0'] = {
    id: 'enemy-1,0-0',
    name: 'Wolf',
    coord: { q: 1, r: 0 },
    tier: 1,
    hp: 1,
    maxHp: 1,
    attack: 0,
    defense: 0,
    xp: 2,
    elite: false,
  };

  return game;
}

beforeAll(() => {
  (
    globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  vi.useFakeTimers();

  class ResizeObserverMock {
    observe() {}
    disconnect() {}
  }

  vi.stubGlobal('ResizeObserver', ResizeObserverMock);
});

afterAll(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

beforeEach(() => {
  vi.clearAllMocks();
  tickerCallbacks.clear();
  applicationOptions.length = 0;
  window.localStorage.clear();
});
