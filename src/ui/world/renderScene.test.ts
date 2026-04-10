import { createGame, getVisibleTiles } from '../../game/state';

const spriteFrom = vi.fn((icon: string) => ({
  icon,
  anchor: { set: vi.fn() },
  position: { set: vi.fn() },
  width: 0,
  height: 0,
  tint: 0,
  alpha: 1,
}));

class MockContainer {
  children: unknown[] = [];
  alpha = 1;
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
  beginFill = vi.fn();
  lineStyle = vi.fn();
  drawPolygon = vi.fn();
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
    );

    expect(app.stage.children).toHaveLength(2);
    expect(spriteFrom).toHaveBeenCalled();
    expect(
      spriteFrom.mock.calls.some(([icon]) => typeof icon === 'string'),
    ).toBe(true);

    const labels = app.stage.children[1] as MockContainer;
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
});
