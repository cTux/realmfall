import { act } from 'react';
import { createGame } from '../../game/stateFactory';
import { Texture } from 'pixi.js';

vi.mock('pixi.js', () => ({
  ImageSource: class MockImageSource {
    constructor(public options: unknown) {}
  },
  Rectangle: class MockRectangle {
    constructor(
      public x: number,
      public y: number,
      public width: number,
      public height: number,
    ) {}
  },
  Texture: class MockTexture {
    static from = vi.fn(
      (icon: string) =>
        new MockTexture({
          icon,
          source: { destroyed: false },
        }),
    );
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
  },
}));

describe('worldIcons', () => {
  it('serves preloaded textures from the world icon cache in the browser path', async () => {
    const originalImage = globalThis.Image;
    const originalNavigatorUserAgent = globalThis.navigator.userAgent;
    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    try {
      vi.resetModules();
      vi.stubGlobal('Image', MockImage as unknown as typeof Image);
      Object.defineProperty(globalThis.navigator, 'userAgent', {
        configurable: true,
        value: 'Mozilla/5.0',
      });

      const { WorldIcons, ensureWorldIconTexturesLoaded, getWorldIconTexture } =
        await import('./worldIcons');

      await ensureWorldIconTexturesLoaded([WorldIcons.Player]);

      const texture = getWorldIconTexture(WorldIcons.Player);

      expect(texture).toBeDefined();
      expect(Texture.from).not.toHaveBeenCalled();
    } finally {
      if (originalImage === undefined) {
        vi.unstubAllGlobals();
      } else {
        vi.stubGlobal('Image', originalImage);
      }
      Object.defineProperty(globalThis.navigator, 'userAgent', {
        configurable: true,
        value: originalNavigatorUserAgent,
      });
    }
  });

  it('preloads only core and visible marker icons for the current viewport', async () => {
    const {
      WorldIcons,
      enemyIconFor,
      getVisibleWorldIconAssetIds,
      structureIconFor,
    } = await import('./worldIcons');
    const { terrainArtFor } = await import('./worldTerrainArt');

    const game = createGame(2, 'world-icons-visible-assets');
    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'plains',
      structure: 'town',
      items: [],
      enemyIds: ['enemy-1,0-0'],
      claim: {
        ownerId: 'ghostline',
        ownerType: 'faction',
        ownerName: 'Ghostline',
        borderColor: '#ffffff',
        npc: { name: 'Araken', enemyId: 'faction-npc:1' },
      },
    };
    game.tiles['-1,0'] = {
      coord: { q: -1, r: 0 },
      terrain: 'plains',
      items: [
        {
          id: 'loot-gold',
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
      name: 'Wolf',
      coord: { q: 1, r: 0 },
      tier: 1,
      hp: 2,
      maxHp: 2,
      attack: 1,
      defense: 0,
      xp: 1,
      elite: false,
    };

    const icons = getVisibleWorldIconAssetIds(game.enemies, [
      game.tiles['1,0'],
      game.tiles['-1,0'],
    ]);

    expect(icons).toEqual(
      expect.arrayContaining([
        WorldIcons.Player,
        WorldIcons.Castle,
        WorldIcons.ForgottenLoot,
        WorldIcons.Village,
        enemyIconFor(game.enemies['enemy-1,0-0']),
        terrainArtFor(game.tiles['1,0'].terrain),
      ]),
    );
    expect(icons).not.toContain(structureIconFor('town'));
  });

  it('loads generated terrain atlas once for multiple terrain frame textures', async () => {
    const originalImage = globalThis.Image;
    const originalNavigatorUserAgent = globalThis.navigator.userAgent;
    const createdImages: MockImage[] = [];

    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      srcValue = '';

      constructor() {
        createdImages.push(this);
      }

      set src(value: string) {
        this.srcValue = value;
        queueMicrotask(() => this.onload?.());
      }
    }

    try {
      vi.resetModules();
      vi.stubGlobal('Image', MockImage as unknown as typeof Image);
      Object.defineProperty(globalThis.navigator, 'userAgent', {
        configurable: true,
        value: 'Mozilla/5.0',
      });

      const { getWorldTerrainAtlasImage, terrainArtFor } =
        await import('./worldTerrainArt');
      const { ensureWorldIconTexturesLoaded, getWorldIconTexture } =
        await import('./worldIcons');

      const plains = terrainArtFor('plains');
      const forest = terrainArtFor('forest');

      await ensureWorldIconTexturesLoaded([plains, forest]);

      expect(createdImages).toHaveLength(1);
      expect(createdImages[0].srcValue).toBe(getWorldTerrainAtlasImage());
      expect(getWorldIconTexture(plains)).toBeDefined();
      expect(getWorldIconTexture(forest)).toBeDefined();
      expect(getWorldIconTexture(plains)).not.toBe(getWorldIconTexture(forest));
    } finally {
      if (originalImage === undefined) {
        vi.unstubAllGlobals();
      } else {
        vi.stubGlobal('Image', originalImage);
      }
      Object.defineProperty(globalThis.navigator, 'userAgent', {
        configurable: true,
        value: originalNavigatorUserAgent,
      });
    }
  });

  it('reloads destroyed cached textures before reusing them', async () => {
    const originalImage = globalThis.Image;
    const originalNavigatorUserAgent = globalThis.navigator.userAgent;
    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      set src(_value: string) {
        queueMicrotask(() => this.onload?.());
      }
    }

    try {
      vi.resetModules();
      vi.stubGlobal('Image', MockImage as unknown as typeof Image);
      Object.defineProperty(globalThis.navigator, 'userAgent', {
        configurable: true,
        value: 'Mozilla/5.0',
      });

      const { WorldIcons, ensureWorldIconTexturesLoaded, getWorldIconTexture } =
        await import('./worldIcons');

      await ensureWorldIconTexturesLoaded([WorldIcons.Player]);
      const initialTexture = getWorldIconTexture(
        WorldIcons.Player,
      ) as unknown as {
        destroyed: boolean;
        source: { destroyed: boolean } | null;
      };
      initialTexture.destroyed = true;
      initialTexture.source = null;

      await ensureWorldIconTexturesLoaded([WorldIcons.Player]);
      const reloadedTexture = getWorldIconTexture(WorldIcons.Player);

      expect(reloadedTexture).not.toBe(initialTexture);
    } finally {
      if (originalImage === undefined) {
        vi.unstubAllGlobals();
      } else {
        vi.stubGlobal('Image', originalImage);
      }
      Object.defineProperty(globalThis.navigator, 'userAgent', {
        configurable: true,
        value: originalNavigatorUserAgent,
      });
    }
  });

  it('allows missing icons to stream in after render-safe placeholder access and idle warmup', async () => {
    const originalImage = globalThis.Image;
    const originalNavigatorUserAgent = globalThis.navigator.userAgent;
    const originalRequestIdleCallback = window.requestIdleCallback;
    const idleCallbacks: IdleRequestCallback[] = [];
    const createdImages: MockImage[] = [];

    class MockImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;

      constructor() {
        createdImages.push(this);
      }

      set src(_value: string) {}
    }

    try {
      vi.resetModules();
      vi.stubGlobal('Image', MockImage as unknown as typeof Image);
      Object.defineProperty(globalThis.navigator, 'userAgent', {
        configurable: true,
        value: 'Mozilla/5.0',
      });
      Object.defineProperty(window, 'requestIdleCallback', {
        configurable: true,
        value: (callback: IdleRequestCallback) => {
          idleCallbacks.push(callback);
          return idleCallbacks.length;
        },
      });

      const {
        WorldIcons,
        getWorldIconTexture,
        warmWorldIconTexturesInBackground,
      } = await import('./worldIcons');

      const placeholder = getWorldIconTexture(WorldIcons.Player, {
        allowPending: true,
      });

      expect(placeholder).toBeDefined();

      createdImages[0].onload?.();
      await act(async () => {
        vi.runAllTicks();
      });

      expect(getWorldIconTexture(WorldIcons.Player)).not.toBe(placeholder);

      warmWorldIconTexturesInBackground([WorldIcons.Castle]);

      expect(idleCallbacks).toHaveLength(1);

      idleCallbacks[0]({
        didTimeout: false,
        timeRemaining: () => 50,
      } as IdleDeadline);

      createdImages[1].onload?.();
      await act(async () => {
        vi.runAllTicks();
      });

      expect(getWorldIconTexture(WorldIcons.Castle)).toBeDefined();
      expect(Texture.from).not.toHaveBeenCalled();
    } finally {
      if (originalImage === undefined) {
        vi.unstubAllGlobals();
      } else {
        vi.stubGlobal('Image', originalImage);
      }
      Object.defineProperty(globalThis.navigator, 'userAgent', {
        configurable: true,
        value: originalNavigatorUserAgent,
      });
      Object.defineProperty(window, 'requestIdleCallback', {
        configurable: true,
        value: originalRequestIdleCallback,
      });
    }
  });
});
