import { createGame, getVisibleTiles } from '../../game/state';
import { Icons } from '../icons';

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

vi.mock('pixi.js', () => ({
  Container: MockContainer,
  Graphics: MockGraphics,
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
      terrain: 'water',
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

    expect(app.stage.children).toHaveLength(8);
    expect(spriteFrom).toHaveBeenCalled();
    expect(
      spriteFrom.mock.calls.some(([icon]) => typeof icon === 'string'),
    ).toBe(true);

    const labels = app.stage.children[4] as MockContainer;
    expect(
      labels.children.some(
        (child) => child instanceof MockText && child.text.startsWith('L'),
      ),
    ).toBe(true);
    expect(
      labels.children.some(
        (child) => child instanceof MockText && child.text.startsWith('x'),
      ),
    ).toBe(true);
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

    const world = app.stage.children[2] as MockContainer;
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

    const world = app.stage.children[2] as MockContainer;
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
          ([color, alpha]) => color === 0x57ad57 && alpha === 1,
        ),
    );

    expect(hoverOutlines).toHaveLength(0);
    expect(brightHoveredFill).toBe(true);
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

    const clouds = app.stage.children[6] as MockContainer;
    const cloudAlphas = clouds.children.map(
      (child) => (child as { alpha: number }).alpha,
    );

    expect(cloudAlphas.length).toBeGreaterThan(0);
    expect(Math.min(...cloudAlphas)).toBeGreaterThanOrEqual(0.38);
  });

  it('spreads clouds across varied heights and adds terrain grass cover', async () => {
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

    const world = app.stage.children[2] as MockContainer;
    const clouds = app.stage.children[6] as MockContainer;
    const grassSprites = collectDescendants(world).filter(
      (child) => (child as { icon?: string }).icon === Icons.HighGrass,
    );
    const cloudYPositions = clouds.children.map(
      (child) =>
        (child as { position: { set: ReturnType<typeof vi.fn> } }).position.set
          .mock.calls[0]?.[1],
    );
    const uniqueCloudYBands = new Set(
      cloudYPositions.map((value) => Math.round(value / 24)),
    );

    expect(grassSprites.length).toBeGreaterThanOrEqual(4);
    expect(grassSprites.length).toBeLessThanOrEqual(12);
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
});
