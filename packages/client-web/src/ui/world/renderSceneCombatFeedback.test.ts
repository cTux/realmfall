import { createGame } from '@realmfall/core/game/stateFactory';
import { getPlayerCombatStats } from '@realmfall/core/game/stateSelectors';
import { getVisibleTiles } from '@realmfall/core/game/stateSelectors';
import { getWorldRenderFrameMs } from './renderCadence';
import { getWorldHexSize } from './renderSceneMath';
import {
  collectDescendants,
  createMockApp,
  getLabelsLayer,
  getPlayerLayer,
  MockContainer,
  MockSprite,
  setupRenderSceneTestEnvironment,
} from './renderSceneTestkit';

setupRenderSceneTestEnvironment();

const CRITICAL_DAMAGE_COLOR = 0xf97316;
const HEALING_COLOR = 0x4ade80;

describe('renderScene combat feedback', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', { userAgent: 'jsdom' });
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

    const texts = getVisibleFloatingTexts(app);
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

  it('emits and renders player floating text for lifesteal healing in the shared lifesteal path', async () => {
    const { applyLifesteal } =
      await import('@realmfall/core/game/combatStatus');
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-lifesteal-floating-text');
    const app = createMockApp();

    game.player.hp -= 8;
    game.worldTimeMs = 200;

    const healed = applyLifesteal(game, 12, {
      ...getPlayerCombatStats(game.player),
      lifestealAmount: 10,
      lifestealChance: 100,
    });

    expect(healed).toBeGreaterThan(0);
    expect(game.worldFloatingTextEvents).toHaveLength(1);
    expect(game.worldFloatingTextEvents[0]).toMatchObject({
      amount: healed,
      anchor: { kind: 'player', coord: game.player.coord },
      kind: 'healing',
    });

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

    const lifestealText = getVisibleFloatingTexts(app).find(
      (text) => text.text === `${healed}`,
    );

    expect(lifestealText).toBeDefined();
    expect(getTextFill(lifestealText!)).toBe(HEALING_COLOR);
  });

  it('advances floating text smoothly between published world clock ticks', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-floating-text-smooth-progress');
    const app = createMockApp();

    game.worldFloatingTextEvents = [
      {
        id: 'player-heal',
        anchor: {
          kind: 'player',
          coord: { ...game.player.coord },
        },
        amount: 9,
        createdAtMs: 200,
        kind: 'healing',
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
        combatFeedbackWorldTimeMs: 240,
        worldRenderFps: 120,
        worldTimeMs: 200,
      } as never,
    );

    const initialText = getVisibleFloatingTexts(app).find(
      (text) => text.text === '9',
    );

    expect(initialText).toBeDefined();

    const initialY = initialText!.position.y;
    const initialAlpha = initialText!.alpha;

    renderScene(
      app as never,
      game,
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      getWorldRenderFrameMs(120),
      null,
      {
        combatFeedbackWorldTimeMs: 248,
        worldRenderFps: 120,
        worldTimeMs: 200,
      } as never,
    );

    const progressedText = getVisibleFloatingTexts(app).find(
      (text) => text.text === '9',
    );

    expect(progressedText).toBeDefined();
    expect(progressedText!.position.y).toBeLessThan(initialY);
    expect(progressedText!.alpha).toBeLessThan(initialAlpha);
  });

  it('does not apply lifesteal from the per-hit player on-hit helper', async () => {
    const { applyPlayerOnHitEffects } =
      await import('@realmfall/core/game/combatStatus');
    const game = createGame(2, 'render-scene-lifesteal-on-hit-helper');
    const enemyId = 'enemy-1,0-0';

    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'forest',
      items: [],
      enemyIds: [enemyId],
    };
    game.enemies[enemyId] = {
      id: enemyId,
      enemyTypeId: 'raider',
      name: 'Raider',
      coord: { q: 1, r: 0 },
      rarity: 'common',
      tier: 2,
      hp: 20,
      maxHp: 20,
      mana: 0,
      maxMana: 0,
      attack: 3,
      defense: 0,
      xp: 5,
      elite: false,
    };

    const playerStats = {
      ...getPlayerCombatStats(game.player),
      lifestealAmount: 12,
      lifestealChance: 100,
    };
    game.player.hp = Math.max(1, playerStats.maxHp - 6);
    const initialHp = game.player.hp;

    applyPlayerOnHitEffects(game, game.enemies[enemyId]!, 6, playerStats);

    const healingEvents = game.worldFloatingTextEvents.filter(
      (event) => event.kind === 'healing' && event.anchor.kind === 'player',
    );

    expect(game.player.hp).toBe(initialHp);
    expect(healingEvents).toHaveLength(0);
  });

  it('renders enemy floating text only when a real hostile marker anchor exists', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createGame(2, 'render-scene-floating-text-anchor-scope');
    const app = createMockApp();

    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'forest',
      items: [],
      enemyIds: ['enemy-1,0-0'],
    };
    game.tiles['0,1'] = {
      coord: { q: 0, r: 1 },
      terrain: 'plains',
      structure: 'dungeon',
      items: [],
      enemyIds: ['enemy-0,1-0'],
    };
    game.enemies['enemy-1,0-0'] = {
      id: 'enemy-1,0-0',
      enemyTypeId: 'raider',
      name: 'Scout',
      coord: { q: 1, r: 0 },
      rarity: 'common',
      tier: 2,
      hp: 8,
      maxHp: 10,
      mana: 2,
      maxMana: 8,
      attack: 3,
      defense: 1,
      xp: 5,
      aggressive: false,
      elite: false,
    };
    game.enemies['enemy-0,1-0'] = {
      id: 'enemy-0,1-0',
      enemyTypeId: 'raider',
      name: 'Delver',
      coord: { q: 0, r: 1 },
      rarity: 'common',
      tier: 2,
      hp: 8,
      maxHp: 10,
      mana: 2,
      maxMana: 8,
      attack: 3,
      defense: 1,
      xp: 5,
      elite: false,
    };
    game.worldFloatingTextEvents = [
      {
        id: 'pacified-damage',
        anchor: {
          kind: 'enemy',
          enemyId: 'enemy-1,0-0',
          coord: { q: 1, r: 0 },
        },
        amount: 5,
        createdAtMs: 200,
        kind: 'damage',
      },
      {
        id: 'dungeon-damage',
        anchor: {
          kind: 'enemy',
          enemyId: 'enemy-0,1-0',
          coord: { q: 0, r: 1 },
        },
        amount: 9,
        createdAtMs: 200,
        kind: 'damage',
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

    const texts = getVisibleFloatingTexts(app);

    expect(texts).toHaveLength(1);
    expect(texts.find((text) => text.text === '5')).toBeUndefined();
    expect(texts.find((text) => text.text === '9')).toBeDefined();
  });

  it('anchors world-boss floating text to the real boss badge geometry', async () => {
    const { renderScene } = await import('./renderScene');
    const { ENTITY_BADGE_RADIUS_SCALE } =
      await import('./renderSceneEntityBadge');
    const { getWorldHexSize, tileToPoint } = await import('./renderSceneMath');
    const { getHostileEnemyBadgeOuterRadius } =
      await import('./renderScenePlayerBars');
    const { createPlacedWorldBossRenderGame } =
      await import('./renderSceneTestkit');
    const { game, center } = createPlacedWorldBossRenderGame();
    const app = createMockApp(960, 720);
    const bossId = game.tiles['4,0']?.enemyIds[0];

    expect(bossId).toBeDefined();
    game.worldFloatingTextEvents = [
      {
        id: 'world-boss-damage',
        anchor: {
          kind: 'enemy',
          enemyId: bossId!,
          coord: center,
        },
        amount: 21,
        createdAtMs: 200,
        kind: 'damage',
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

    const bossText = getVisibleFloatingTexts(app).find(
      (text) => text.text === '21',
    );
    const origin = {
      x: app.screen.width / 2,
      y: app.screen.height / 2,
    };
    const hexSize = getWorldHexSize(app.screen, game.radius);
    const bossPoint = tileToPoint(
      {
        q: center.q - game.player.coord.q,
        r: center.r - game.player.coord.r,
      },
      origin.x,
      origin.y,
      hexSize,
    );
    const floatingTextRiseOffset = 12 + (300 / 1200) * 18;
    const genericEnemyY =
      bossPoint.y -
      2 -
      getHostileEnemyBadgeOuterRadius(hexSize * 0.945) -
      floatingTextRiseOffset;
    const bossBadgeY =
      bossPoint.y -
      hexSize * 3.4 * 0.58 * ENTITY_BADGE_RADIUS_SCALE -
      floatingTextRiseOffset;

    expect(bossText).toBeDefined();
    expect(bossText!.position.x).toBeCloseTo(bossPoint.x, 4);
    expect(bossText!.position.y).toBeCloseTo(bossBadgeY, 3);
    expect(Math.abs(bossText!.position.y - genericEnemyY)).toBeGreaterThan(12);
  });

  it('keeps the player wrapper centered when combat begins on an adjacent hostile hex and adds the battle-entity indicator', async () => {
    const { renderScene } = await import('./renderScene');
    const { getEntityBadgeArcBand } = await import('./renderSceneEntityBadge');
    const { getPlayerBadgeOuterRadius } =
      await import('./renderScenePlayerBars');
    const { COMBAT_WORLD_ICON_TINT, WorldIcons } = await import('./worldIcons');
    const game = createGame(2, 'render-scene-player-lunge');
    const baselineApp = createMockApp();
    const combatApp = createMockApp();

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
    game.worldTimeMs = 90;
    game.combat = {
      coord: { q: 0, r: 0 },
      enemyIds: ['enemy-1,0-0'],
      started: false,
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
      combatApp as never,
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
    const combatWrapper = getPlayerLayer(combatApp).children[2] as
      | MockContainer
      | undefined;
    const baselineSprite = getForegroundPlayerSprite(
      baselineWrapper,
      WorldIcons.Combat,
    );
    const combatSprite = getForegroundPlayerSprite(
      combatWrapper,
      WorldIcons.Combat,
    );
    const combatIndicatorContainer = getBattleIndicatorContainer(combatWrapper);
    const combatIndicatorSprite = getContainerSpriteByIcon(
      combatIndicatorContainer,
      WorldIcons.Combat,
    );
    const combatIndicatorShadowSprites = getVisiblePlayerShadowSprites(
      combatWrapper,
      WorldIcons.Combat,
    );
    const combatIndicatorCenterX = getEntityBadgeArcBand(
      getPlayerBadgeOuterRadius(
        getWorldHexSize(combatApp.screen, game.radius) * 0.95,
      ),
    ).outerRadius;

    expect(baselineWrapper).toBeDefined();
    expect(combatWrapper).toBeDefined();
    expect(baselineSprite?.icon).not.toBe(WorldIcons.Combat);
    expect(combatSprite?.icon).toBe(baselineSprite?.icon);
    expect(combatSprite?.tint).toBe(baselineSprite?.tint);
    expect(combatIndicatorSprite).toBeDefined();
    expect(combatIndicatorContainer).toBeDefined();
    expect(combatIndicatorSprite?.tint).toBe(COMBAT_WORLD_ICON_TINT);
    expect(combatIndicatorContainer?.position.x).toBeCloseTo(
      combatIndicatorCenterX,
      4,
    );
    expect(combatIndicatorContainer?.position.y).toBeCloseTo(0, 4);
    expect(combatIndicatorSprite?.width).toBeLessThanOrEqual(15);
    expect(combatIndicatorShadowSprites.length).toBeGreaterThan(0);
    expect(combatWrapper!.position.x).toBeCloseTo(
      baselineWrapper!.position.x,
      4,
    );
    expect(combatWrapper!.position.y).toBeCloseTo(
      baselineWrapper!.position.y,
      4,
    );
    expect(game.player.coord).toEqual({ q: 0, r: 0 });
  });

  it('keeps the player wrapper centered after the intro window while combat remains active', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createLungeCombatGame('render-scene-player-lunge-relax');
    const baselineApp = createMockApp();
    const settledApp = createMockApp();

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
        worldTimeMs: 240,
      } as never,
    );

    renderScene(
      settledApp as never,
      {
        ...game,
        worldTimeMs: 240,
      },
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        worldTimeMs: 240,
      } as never,
    );

    const baselineWrapper = getPlayerLayer(baselineApp).children[2] as
      | MockContainer
      | undefined;
    const settledWrapper = getPlayerLayer(settledApp).children[2] as
      | MockContainer
      | undefined;

    expect(baselineWrapper).toBeDefined();
    expect(settledWrapper).toBeDefined();
    expect(settledWrapper!.position.x).toBeCloseTo(
      baselineWrapper!.position.x,
      4,
    );
    expect(settledWrapper!.position.y).toBeCloseTo(
      baselineWrapper!.position.y,
      4,
    );
  });

  it('adds the player battle-entity indicator during battle start without replacing the player icon', async () => {
    const { renderScene } = await import('./renderScene');
    const { getEntityBadgeArcBand } = await import('./renderSceneEntityBadge');
    const { getPlayerBadgeOuterRadius } =
      await import('./renderScenePlayerBars');
    const { COMBAT_WORLD_ICON_TINT, WorldIcons } = await import('./worldIcons');
    const game = createLungeCombatGame('render-scene-player-icon-crossfade');
    const app = createMockApp();
    const visibleTiles = getVisibleTiles(game);

    renderScene(
      app as never,
      {
        ...game,
        combat: null,
      },
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        worldTimeMs: 240,
      } as never,
    );
    renderScene(
      app as never,
      {
        ...game,
        worldTimeMs: 240,
      },
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        worldTimeMs: 240,
      } as never,
    );
    renderScene(
      app as never,
      {
        ...game,
        worldTimeMs: 240,
      },
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      90,
      null,
      {
        worldTimeMs: 240,
      } as never,
    );

    const midWrapper = getPlayerLayer(app).children[2] as
      | MockContainer
      | undefined;
    const midIndicatorContainer = getBattleIndicatorContainer(midWrapper);
    const midIndicatorSprite = getContainerSpriteByIcon(
      midIndicatorContainer,
      WorldIcons.Combat,
    );
    const midIndicatorShadowSprites = getVisiblePlayerShadowSprites(
      midWrapper,
      WorldIcons.Combat,
    );
    const midIndicatorCenterX = getEntityBadgeArcBand(
      getPlayerBadgeOuterRadius(
        getWorldHexSize(app.screen, game.radius) * 0.95,
      ),
    ).outerRadius;

    expect(getForegroundPlayerSprite(midWrapper, WorldIcons.Combat)?.icon).toBe(
      WorldIcons.Player,
    );
    expect(midIndicatorSprite).toBeDefined();
    expect(midIndicatorContainer).toBeDefined();
    expect(midIndicatorSprite?.tint).toBe(COMBAT_WORLD_ICON_TINT);
    expect(midIndicatorContainer?.position.x).toBeCloseTo(
      midIndicatorCenterX,
      4,
    );
    expect(midIndicatorContainer?.position.y).toBeCloseTo(0, 4);
    expect(midIndicatorSprite?.width).toBeLessThanOrEqual(15);
    expect(midIndicatorShadowSprites.length).toBeGreaterThan(0);

    renderScene(
      app as never,
      {
        ...game,
        worldTimeMs: 240,
      },
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      220,
      null,
      {
        worldTimeMs: 240,
      } as never,
    );

    const settledWrapper = getPlayerLayer(app).children[2] as
      | MockContainer
      | undefined;
    const settledIndicatorContainer =
      getBattleIndicatorContainer(settledWrapper);

    expect(
      getForegroundPlayerSprite(settledWrapper, WorldIcons.Combat)?.icon,
    ).toBe(WorldIcons.Player);
    expect(settledIndicatorContainer).toBeDefined();
    expect(
      getContainerSpriteByIcon(settledIndicatorContainer, WorldIcons.Combat),
    ).toBeDefined();
  });

  it('combines a combat state with a carried movement-transition offset without extra displacement', async () => {
    const { renderScene } = await import('./renderScene');
    const game = createLungeCombatGame(
      'render-scene-player-lunge-carry-overlap',
    );
    const baselineApp = createMockApp();
    const lungeOnlyApp = createMockApp();
    const transitionOnlyApp = createMockApp();
    const combinedApp = createMockApp();
    const visibleTiles = getVisibleTiles(game);
    const movementTransition = {
      durationMs: 1_000,
      fromCoord: { q: -1, r: 0 },
      incomingTiles: [],
      nowMs: 500,
      outgoingTiles: [],
      playerOffsetAtStart: { x: 18, y: 0 },
      startedAtMs: 0,
      toCoord: game.player.coord,
    };

    renderScene(
      baselineApp as never,
      {
        ...game,
        combat: null,
      },
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        worldTimeMs: 240,
      } as never,
    );

    renderScene(
      lungeOnlyApp as never,
      {
        ...game,
        worldTimeMs: 240,
      },
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        worldTimeMs: 240,
      } as never,
    );

    renderScene(
      transitionOnlyApp as never,
      {
        ...game,
        combat: null,
      },
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        movementTransition,
        worldTimeMs: 240,
      } as never,
    );

    renderScene(
      combinedApp as never,
      {
        ...game,
        worldTimeMs: 240,
      },
      visibleTiles,
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        movementTransition,
        worldTimeMs: 240,
      } as never,
    );

    const baselineWrapper = getPlayerLayer(baselineApp).children[2] as
      | MockContainer
      | undefined;
    const lungeOnlyWrapper = getPlayerLayer(lungeOnlyApp).children[2] as
      | MockContainer
      | undefined;
    const transitionOnlyWrapper = getPlayerLayer(transitionOnlyApp)
      .children[2] as MockContainer | undefined;
    const combinedWrapper = getPlayerLayer(combinedApp).children[2] as
      | MockContainer
      | undefined;

    expect(baselineWrapper).toBeDefined();
    expect(lungeOnlyWrapper).toBeDefined();
    expect(transitionOnlyWrapper).toBeDefined();
    expect(combinedWrapper).toBeDefined();

    const combatDeltaX =
      lungeOnlyWrapper!.position.x - baselineWrapper!.position.x;
    const transitionDeltaX =
      transitionOnlyWrapper!.position.x - baselineWrapper!.position.x;
    const combinedDeltaX =
      combinedWrapper!.position.x - baselineWrapper!.position.x;

    expect(combatDeltaX).toBeCloseTo(0, 4);
    expect(transitionDeltaX).toBeCloseTo(9, 4);
    expect(combinedDeltaX).toBeCloseTo(transitionDeltaX, 4);
    expect(combinedWrapper!.position.y).toBeCloseTo(
      baselineWrapper!.position.y,
      4,
    );
  });

  it('keeps the player on the base icon before pending combat intro begins', async () => {
    const { renderScene } = await import('./renderScene');
    const { COMBAT_WORLD_ICON_TINT, WorldIcons } = await import('./worldIcons');
    const game = createLungeCombatGame('render-scene-player-lunge-pending');
    const baselineApp = createMockApp();
    const pendingApp = createMockApp();

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
        worldTimeMs: 0,
      } as never,
    );

    renderScene(
      pendingApp as never,
      {
        ...game,
        combat: {
          ...game.combat!,
          started: false,
          startedAtMs: undefined,
        },
        worldTimeMs: 0,
      },
      getVisibleTiles(game),
      game.player.coord,
      null,
      12 * 60,
      0,
      null,
      {
        worldTimeMs: 0,
      } as never,
    );

    const baselineWrapper = getPlayerLayer(baselineApp).children[2] as
      | MockContainer
      | undefined;
    const pendingWrapper = getPlayerLayer(pendingApp).children[2] as
      | MockContainer
      | undefined;
    const baselineSprite = getForegroundPlayerSprite(
      baselineWrapper,
      WorldIcons.Combat,
    );
    const pendingSprite = getForegroundPlayerSprite(
      pendingWrapper,
      WorldIcons.Combat,
    );

    expect(baselineWrapper).toBeDefined();
    expect(pendingWrapper).toBeDefined();
    expect(baselineSprite?.icon).not.toBe(WorldIcons.Combat);
    expect(pendingSprite?.icon).toBe(baselineSprite?.icon);
    expect(pendingSprite?.tint).not.toBe(COMBAT_WORLD_ICON_TINT);
    expect(
      getContainerSpriteByIcon(
        getBattleIndicatorContainer(pendingWrapper),
        WorldIcons.Combat,
      ),
    ).toBeUndefined();
    expect(pendingWrapper!.position.x).toBeCloseTo(
      baselineWrapper!.position.x,
      4,
    );
    expect(pendingWrapper!.position.y).toBeCloseTo(
      baselineWrapper!.position.y,
      4,
    );
  });

  it('keeps killing-blow text visible above the last hostile marker location after enemy cleanup', async () => {
    const {
      beginAnimatedSceneRender,
      completeAnimatedSceneRender,
      getSceneCache,
    } = await import('./renderSceneCache');
    const { renderSceneCombatFeedback } =
      await import('./renderSceneCombatFeedback');
    const { getVisibleTileRenderInputs } =
      await import('./renderSceneRenderInputs');
    const game = createGame(2, 'render-scene-killing-blow-floating-text');
    const app = createMockApp();
    const defeatedEnemyId = 'defeated-enemy-1,0-0';

    game.tiles['1,0'] = {
      coord: { q: 1, r: 0 },
      terrain: 'forest',
      items: [],
      enemyIds: [],
    };
    game.enemies[defeatedEnemyId] = {
      id: defeatedEnemyId,
      enemyTypeId: 'raider',
      name: 'Raider',
      coord: { q: 1, r: 0 },
      rarity: 'common',
      tier: 2,
      hp: 0,
      maxHp: 10,
      mana: 0,
      maxMana: 8,
      attack: 3,
      defense: 1,
      xp: 5,
      elite: false,
    };
    delete game.enemies[defeatedEnemyId];
    game.worldFloatingTextEvents = [
      {
        id: 'killing-blow',
        anchor: {
          kind: 'enemy',
          enemyId: defeatedEnemyId,
          coord: { q: 1, r: 0 },
        },
        amount: 11,
        createdAtMs: 200,
        kind: 'damage',
      },
    ];

    const scene = getSceneCache(app as never);
    const hexSize = getWorldHexSize(app.screen, game.radius);
    const visibleTileRenderInputs = getVisibleTileRenderInputs(
      game,
      getVisibleTiles(game),
    );
    beginAnimatedSceneRender(scene);
    renderSceneCombatFeedback({
      enemyIconSize: hexSize * 0.945,
      hexSize,
      origin: {
        x: app.screen.width / 2,
        y: app.screen.height / 2,
      },
      playerCoord: game.player.coord,
      playerIconSize: hexSize * 0.95,
      playerLungeOffset: { x: 0, y: 0 },
      scene,
      state: game,
      visibleTileRenderInputs,
      worldTimeMs: 500,
    });
    completeAnimatedSceneRender(scene);

    const killingBlowText = getVisibleFloatingTexts(app).find(
      (text) => text.text === '11',
    );

    expect(killingBlowText).toBeDefined();
  });
});

function getTextFill(text: { style: unknown }) {
  return (text.style as { value?: { fill?: number } }).value?.fill;
}

function getVisibleFloatingTexts(app: ReturnType<typeof createMockApp>) {
  return collectDescendants(getLabelsLayer(app)).filter(
    (child): child is FloatingTextNode =>
      isFloatingTextNode(child) && child.visible,
  );
}

type FloatingTextNode = {
  alpha: number;
  position: { x: number; y: number };
  scale: { x: number; y: number };
  style: unknown;
  text: string;
  visible: boolean;
};

function isFloatingTextNode(value: unknown): value is FloatingTextNode {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return (
    'alpha' in value &&
    'position' in value &&
    'scale' in value &&
    'style' in value &&
    'text' in value &&
    'visible' in value
  );
}

function createLungeCombatGame(seed: string) {
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
    hp: 8,
    maxHp: 10,
    mana: 4,
    maxMana: 8,
    attack: 3,
    defense: 1,
    xp: 5,
    elite: false,
  };
  game.worldTimeMs = 90;
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

  return game;
}

function getForegroundPlayerSprite(
  wrapper: MockContainer | undefined,
  excludedIcon: string,
) {
  const sprites = getVisibleForegroundPlayerSprites(wrapper);
  for (let index = sprites.length - 1; index >= 0; index -= 1) {
    const sprite = sprites[index];
    if (sprite && sprite.tint !== 0x000000 && sprite.icon !== excludedIcon) {
      return sprite;
    }
  }

  return undefined;
}

function getContainerSpriteByIcon(
  wrapper: MockContainer | undefined,
  icon: string,
) {
  return getVisibleForegroundPlayerSprites(wrapper).find(
    (sprite) => sprite.icon === icon,
  );
}

function getVisibleForegroundPlayerSprites(wrapper: MockContainer | undefined) {
  return collectDescendants(wrapper ?? new MockContainer()).filter(
    (
      sprite,
    ): sprite is {
      alpha: number;
      icon?: string;
      position: { x: number; y: number };
      tint: number;
      visible: boolean;
      width: number;
    } => isVisibleSpriteLike(sprite) && sprite.tint !== 0x000000,
  );
}

function getVisiblePlayerShadowSprites(
  wrapper: MockContainer | undefined,
  icon: string,
) {
  return collectDescendants(wrapper ?? new MockContainer()).filter(
    (sprite): sprite is MockSprite =>
      isVisibleSpriteLike(sprite) &&
      sprite.icon === icon &&
      sprite.tint === 0x000000 &&
      sprite.alpha > 0,
  );
}

function getBattleIndicatorContainer(wrapper: MockContainer | undefined) {
  const children = wrapper?.children ?? [];
  const candidate = children[children.length - 1];
  return isContainerLike(candidate) ? candidate : undefined;
}

function isContainerLike(value: unknown): value is MockContainer {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'children' in value &&
    Array.isArray((value as { children?: unknown }).children),
  );
}

function isVisibleSpriteLike(value: unknown): value is {
  alpha: number;
  icon?: string;
  position: { x: number; y: number };
  tint: number;
  visible: boolean;
  width: number;
} {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'position' in value &&
    'visible' in value &&
    'tint' in value &&
    'icon' in value &&
    'width' in value &&
    'alpha' in value &&
    (value as { visible?: boolean }).visible === true &&
    typeof (value as { tint?: unknown }).tint === 'number',
  );
}
