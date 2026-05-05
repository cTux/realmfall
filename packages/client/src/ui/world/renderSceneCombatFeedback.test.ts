import { createGame } from '../../game/stateFactory';
import { getVisibleTiles } from '../../game/stateSelectors';
import { getWorldHexSize } from './renderSceneMath';
import {
  collectDescendants,
  createMockApp,
  getLabelsLayer,
  getMarkerLayer,
  getPlayerLayer,
  MockContainer,
  MockGraphics,
  MockText,
  setupRenderSceneTestEnvironment,
} from './renderSceneTestHelpers';

setupRenderSceneTestEnvironment();

const CRITICAL_DAMAGE_COLOR = 0xf97316;

describe('renderScene combat feedback', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'OffscreenCanvas',
      class MockOffscreenCanvas {
        constructor(
          public width: number,
          public height: number,
        ) {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders critical damage text in orange with larger scale and a trailing exclamation mark', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-critical-floating-text');
    const app = createMockApp();

    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'forest',
      items: [],
      enemyIds: ['enemy-1,0-0'],
    };
    game.enemies['enemy-1,0-0'] = {
      id: 'enemy-1,0-0',
      enemyTypeId: 'raider',
      name: 'Raider',
      coord: { q: 1, r: 0 },
      rarity: 'common',
      tier: 2,
      hp: 8,
      maxHp: 10,
      mana: 4,
      maxMana: 8,
      attack: 3,
      defense: 1,
      xp: 5,
      elite: false,
    };
    game.worldFloatingTextEvents = [
      {
        id: 'enemy-damage',
        anchor: {
          kind: 'enemy',
          enemyId: 'enemy-1,0-0',
          coord: { q: 1, r: 0 },
        },
        amount: 6,
        createdAtMs: 200,
        kind: 'damage',
      },
      {
        id: 'enemy-critical',
        anchor: {
          kind: 'enemy',
          enemyId: 'enemy-1,0-0',
          coord: { q: 1, r: 0 },
        },
        amount: 18,
        createdAtMs: 200,
        kind: 'critical-damage',
      },
    ];

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        worldTimeMs: 500,
      } as never,
    );

    const texts = collectDescendants(getLabelsLayer(app)).filter(
      (child): child is MockText => child instanceof MockText && child.visible,
    );
    const normalDamageText = texts.find((text) => text.text === '6');
    const criticalDamageText = texts.find((text) => text.text === '18!');

    expect(normalDamageText).toBeDefined();
    expect(criticalDamageText).toBeDefined();
    expect(getTextFill(criticalDamageText!)).toBe(CRITICAL_DAMAGE_COLOR);
    expect(criticalDamageText!.scale.x).toBeGreaterThan(
      normalDamageText!.scale.x,
    );
    expect(criticalDamageText!.scale.y).toBeGreaterThan(
      normalDamageText!.scale.y,
    );
  });

  it('visually lunges the player wrapper toward the hostile target without changing gameplay coordinates', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-player-lunge');
    const baselineApp = createMockApp();
    const lungingApp = createMockApp();

    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'forest',
      items: [],
      enemyIds: ['enemy-1,0-0'],
    };
    game.enemies['enemy-1,0-0'] = {
      id: 'enemy-1,0-0',
      enemyTypeId: 'raider',
      name: 'Raider',
      coord: { q: 1, r: 0 },
      rarity: 'common',
      tier: 2,
      hp: 8,
      maxHp: 10,
      mana: 4,
      maxMana: 8,
      attack: 3,
      defense: 1,
      xp: 5,
      elite: false,
    };
    game.worldTimeMs = 240;
    game.combat = {
      coord: { q: 0, r: 0 },
      enemyIds: ['enemy-1,0-0'],
      started: true,
      startedAtMs: 0,
      engagement: {
        autoStepOnVictory: false,
        engageMode: 'staged-click',
        originCoord: { q: 0, r: 0 },
        stagingCoord: { q: 0, r: 0 },
        targetCoord: { q: 1, r: 0 },
      },
      player: {
        abilityIds: ['slash'],
        globalCooldownMs: 1500,
        globalCooldownEndsAt: 0,
        cooldownEndsAt: {},
        casting: null,
      },
      enemies: {
        'enemy-1,0-0': {
          abilityIds: ['kick'],
          globalCooldownMs: 1500,
          globalCooldownEndsAt: 0,
          cooldownEndsAt: {},
          casting: null,
        },
      },
      enemyStateById: {
        'enemy-1,0-0': {},
      },
    };

    renderScene(
      baselineApp as never,
      {
        ...game,
        combat: null,
      },
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        worldTimeMs: game.worldTimeMs,
      } as never,
    );

    renderScene(
      lungingApp as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        worldTimeMs: game.worldTimeMs,
      } as never,
    );

    const baselineWrapper = getPlayerLayer(baselineApp).children[2] as
      | MockContainer
      | undefined;
    const lungingWrapper = getPlayerLayer(lungingApp).children[2] as
      | MockContainer
      | undefined;

    expect(baselineWrapper).toBeDefined();
    expect(lungingWrapper).toBeDefined();
    expect(lungingWrapper!.position.x).toBeGreaterThan(
      baselineWrapper!.position.x,
    );
    expect(lungingWrapper!.position.y).toBeCloseTo(
      baselineWrapper!.position.y,
      4,
    );
    expect(
      lungingWrapper!.position.x - baselineWrapper!.position.x,
    ).toBeLessThan(getWorldHexSize(lungingApp.screen, game.radius) * 0.5);
    expect(game.player.coord).toEqual({ q: 0, r: 0 });
  });

  it('refreshes visible hostile badge HP and MP arcs during combat without requiring a new enemy map object', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createEnemyMarkerGame(
      'render-scene-live-combat-badge-refresh',
    );
    const app = createMockApp();
    const visibleTiles = getVisibleTiles(game);

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
    );

    const initialGraphics = collectDescendants(getMarkerLayer(app)).filter(
      (child): child is MockGraphics =>
        child instanceof MockGraphics && child.visible,
    );
    const initialHpArc = findMarkerArc(initialGraphics, 0xff2d55, 'top');
    const initialManaArc = findMarkerArc(initialGraphics, 0x38bdf8, 'bottom');
    const initialHpCallCount = initialHpArc?.drawPolygon.mock.calls.length ?? 0;
    const initialManaCallCount =
      initialManaArc?.drawPolygon.mock.calls.length ?? 0;
    expect(initialHpArc).toBeDefined();
    expect(initialManaArc).toBeDefined();

    game.enemies['enemy-1,0-0']!.hp = 0;
    game.enemies['enemy-1,0-0']!.mana = 1;
    game.combat = {
      coord: { q: 0, r: 0 },
      enemyIds: ['enemy-1,0-0'],
      started: true,
      startedAtMs: 0,
      engagement: {
        autoStepOnVictory: false,
        engageMode: 'staged-click',
        originCoord: { q: 0, r: 0 },
        stagingCoord: { q: 0, r: 0 },
        targetCoord: { q: 1, r: 0 },
      },
      player: {
        abilityIds: ['slash'],
        globalCooldownMs: 1500,
        globalCooldownEndsAt: 0,
        cooldownEndsAt: {},
        casting: null,
      },
      enemies: {
        'enemy-1,0-0': {
          abilityIds: ['kick'],
          globalCooldownMs: 1500,
          globalCooldownEndsAt: 0,
          cooldownEndsAt: {},
          casting: null,
        },
      },
      enemyStateById: {
        'enemy-1,0-0': {},
      },
    };

    renderScene(
      app as never,
      game,
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
    );

    const updatedGraphics = collectDescendants(getMarkerLayer(app)).filter(
      (child): child is MockGraphics =>
        child instanceof MockGraphics && child.visible,
    );
    const updatedHpArc = findMarkerArc(updatedGraphics, 0xff2d55, 'top');
    const updatedManaArc = findMarkerArc(updatedGraphics, 0x38bdf8, 'bottom');

    expect(updatedHpArc).toBe(initialHpArc);
    expect(updatedManaArc).toBe(initialManaArc);
    expect(updatedHpArc?.drawPolygon.mock.calls.length).toBeGreaterThan(
      initialHpCallCount,
    );
    expect(updatedManaArc?.drawPolygon.mock.calls.length).toBeGreaterThan(
      initialManaCallCount,
    );
  });
});

function getTextFill(text: MockText) {
  return (text.style as { value?: { fill?: number } }).value?.fill;
}

function createEnemyMarkerGame(seed: string) {
  const game = createGame(2, seed);
  game.tiles['1,0'] = {
    coord: { q: 1, r: 0 },
    terrain: 'forest',
    items: [],
    enemyIds: ['enemy-1,0-0'],
  };
  game.enemies['enemy-1,0-0'] = {
    id: 'enemy-1,0-0',
    enemyTypeId: 'raider',
    name: 'Raider',
    coord: { q: 1, r: 0 },
    rarity: 'common',
    tier: 2,
    hp: 5,
    maxHp: 10,
    mana: 3,
    maxMana: 10,
    attack: 3,
    defense: 1,
    xp: 5,
    elite: false,
  };

  return game;
}

function findMarkerArc(
  graphics: MockGraphics[],
  color: number,
  hemisphere: 'bottom' | 'top',
) {
  return graphics.find((graphic) => {
    if (
      !graphic.beginFill.mock.calls.some(([fillColor]) => fillColor === color)
    ) {
      return false;
    }

    if (graphic.drawPolygon.mock.calls.length === 0) {
      return false;
    }

    return graphic.drawPolygon.mock.calls.some(([points]) => {
      const numericPoints = points as number[];
      const averageY =
        numericPoints.reduce(
          (sum, value, index) => sum + (index % 2 === 1 ? value : 0),
          0,
        ) /
        (numericPoints.length / 2);

      return hemisphere === 'top' ? averageY < 0 : averageY > 0;
    });
  });
}
