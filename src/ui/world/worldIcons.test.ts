import { createGame } from '../../game/state';
import { Texture } from 'pixi.js';

vi.mock('pixi.js', () => ({
  ImageSource: class MockImageSource {
    constructor(public options: unknown) {}
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

    const icons = getVisibleWorldIconAssetIds(game, [game.tiles['1,0']]);

    expect(icons).toEqual(
      expect.arrayContaining([
        WorldIcons.Player,
        WorldIcons.Castle,
        WorldIcons.Village,
        enemyIconFor(game.enemies['enemy-1,0-0']),
      ]),
    );
    expect(icons).not.toContain(structureIconFor('town'));
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
});
