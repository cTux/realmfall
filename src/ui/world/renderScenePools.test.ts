const getWorldIconTexture = vi.fn((icon: string) => ({ icon, revision: 1 }));

vi.mock('./worldIcons', () => ({
  getWorldIconTexture,
}));

vi.mock('pixi.js', () => {
  class MockContainer {
    children: unknown[] = [];
    visible = true;
    alpha = 1;
    rotation = 0;
    position = {
      set: vi.fn(),
    };
    scale = {
      set: vi.fn(),
    };

    addChild(child: unknown) {
      this.children.push(child);
      return child;
    }
  }

  class MockSprite {
    visible = true;
    alpha = 1;
    width = 0;
    height = 0;
    tint = 0xffffff;
    texture: unknown;
    anchor = {
      set: vi.fn(),
    };
    position = {
      set: vi.fn(),
    };

    constructor(texture: unknown) {
      this.texture = texture;
    }
  }

  class MockGraphics {}
  class MockText {
    visible = true;
    style: unknown;

    constructor(
      public text: string,
      style: unknown,
    ) {
      this.style = style;
    }
  }

  return {
    Container: MockContainer,
    Graphics: MockGraphics,
    Sprite: MockSprite,
    Text: MockText,
  };
});

describe('renderScenePools', () => {
  beforeEach(() => {
    getWorldIconTexture.mockReset();
  });

  it('refreshes pooled shadowed sprite textures when the icon texture cache updates', async () => {
    const {
      createShadowedSpritePool,
      resetShadowedSpritePool,
      takeShadowedSprite,
    } = await import('./renderScenePools');
    const { Container } = await import('pixi.js');

    const pool = createShadowedSpritePool(new Container());
    const firstTexture = { icon: 'wolf', revision: 1 } as const;
    const secondTexture = { icon: 'wolf', revision: 2 } as const;
    let currentTexture: typeof firstTexture | typeof secondTexture =
      firstTexture;

    getWorldIconTexture.mockImplementation(() => currentTexture);

    const first = takeShadowedSprite(pool, 'wolf');
    expect(first.sprite.texture).toBe(firstTexture);

    resetShadowedSpritePool(pool);
    currentTexture = secondTexture;

    const reused = takeShadowedSprite(pool, 'wolf');
    expect(reused).toBe(first);
    expect(reused.sprite.texture).toBe(secondTexture);
    expect(reused.outline.texture).toBe(secondTexture);
    expect(
      reused.shadows.every(
        (shadow) => shadow.texture === (secondTexture as unknown),
      ),
    ).toBe(true);
  });

  it('adds a black 2px outline behind configured world markers', async () => {
    const { configureShadowedSprite, createShadowedSprite } =
      await import('./renderScenePools');

    getWorldIconTexture.mockReturnValue({ icon: 'wolf', revision: 1 });

    const entry = createShadowedSprite('wolf');

    configureShadowedSprite(
      entry,
      0xff0000,
      30,
      40,
      0.8,
      { x: 3, y: 5 },
      { x: 10, y: 20 },
    );

    expect(entry.outline.tint).toBe(0x000000);
    expect(entry.outline.width).toBe(34);
    expect(entry.outline.height).toBe(44);
    expect(entry.outline.alpha).toBe(1);
    expect(entry.sprite.width).toBe(30);
    expect(entry.sprite.height).toBe(40);
  });
});
