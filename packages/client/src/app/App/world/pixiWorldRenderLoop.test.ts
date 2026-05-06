import { vi } from 'vitest';

const {
  getReachableWorldIconAssetIds,
  getWorldIconTextureVersion,
  setWorldIconTextureVersion,
  warmWorldIconTexturesInBackground,
} = vi.hoisted(() => {
  let iconTextureVersion = 0;

  return {
    getReachableWorldIconAssetIds: vi.fn(() => ['move-buffer-icon']),
    getWorldIconTextureVersion: () => iconTextureVersion,
    setWorldIconTextureVersion: (nextVersion: number) => {
      iconTextureVersion = nextVersion;
    },
    warmWorldIconTexturesInBackground: vi.fn(),
  };
});

vi.mock('../../../ui/world/worldIcons', () => ({
  getReachableWorldIconAssetIds,
  getWorldIconTextureVersion,
  warmWorldIconTexturesInBackground,
}));

import {
  WORLD_ANIMATION_FPS,
  configureWorldTickerCadence,
  createWorldRenderFrame,
} from './pixiWorldRenderLoop';
import { createInitialWorldRenderSnapshot } from './worldRenderSnapshot';
import {
  DEFAULT_WORLD_RENDER_FPS,
  MAX_WORLD_RENDER_FPS,
  MIN_WORLD_RENDER_FPS,
} from '../../graphicsSettings';

describe('pixiWorldRenderLoop', () => {
  beforeEach(() => {
    getReachableWorldIconAssetIds.mockClear();
    warmWorldIconTexturesInBackground.mockClear();
  });

  it('caps Pixi ticker wakeups to the selected world render FPS', () => {
    const ticker = { maxFPS: 0 };

    configureWorldTickerCadence(ticker, 144);

    expect(ticker.maxFPS).toBe(144);
  });

  it('clamps Pixi ticker wakeups to the supported world render FPS range', () => {
    const ticker = { maxFPS: 0 };

    configureWorldTickerCadence(ticker, 12);
    expect(ticker.maxFPS).toBe(MIN_WORLD_RENDER_FPS);

    configureWorldTickerCadence(ticker, 999);
    expect(ticker.maxFPS).toBe(MAX_WORLD_RENDER_FPS);
  });

  it('defaults the world render FPS to the minimum supported cadence', () => {
    expect(WORLD_ANIMATION_FPS).toBe(DEFAULT_WORLD_RENDER_FPS);
  });

  it('re-renders when world icon textures finish loading after the first frame', () => {
    const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(0);
    const renderScene = vi.fn();
    const game = { player: { coord: { q: 0, r: 0 } } };
    const visibleTiles = [{ coord: { q: 0, r: 0 }, terrain: 'plains' }];
    const selected = { q: 0, r: 0 };
    const hoveredMove = null;
    const hoveredSafePath = null;
    const renderFrame = createWorldRenderFrame({
      app: {} as never,
      renderScene,
      gameRef: { current: game } as never,
      visibleTilesRef: { current: visibleTiles } as never,
      selectedRef: { current: selected } as never,
      hoveredMoveRef: { current: hoveredMove },
      hoveredSafePathRef: { current: hoveredSafePath },
      showTerrainBackgroundsRef: { current: true },
      worldRenderFpsRef: { current: DEFAULT_WORLD_RENDER_FPS },
      pausedRef: { current: false },
      pausedAnimationMsRef: { current: null },
      worldTimeMsRef: { current: 0 },
      renderInvalidationRef: { current: 0 },
      lastRenderSnapshotRef: { current: createInitialWorldRenderSnapshot() },
    });

    renderFrame();
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(1);

    setWorldIconTextureVersion(1);
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(2);

    performanceNowSpy.mockRestore();
  });

  it('warms reachable icon assets when the player position changes', () => {
    const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(0);
    const renderScene = vi.fn();
    const game = { player: { coord: { q: 0, r: 0 } }, radius: 2 };
    const renderFrame = createWorldRenderFrame({
      app: {} as never,
      renderScene,
      gameRef: { current: game } as never,
      visibleTilesRef: {
        current: [{ coord: { q: 0, r: 0 }, terrain: 'plains' }],
      } as never,
      selectedRef: { current: { q: 0, r: 0 } } as never,
      hoveredMoveRef: { current: null },
      hoveredSafePathRef: { current: null },
      showTerrainBackgroundsRef: { current: true },
      worldRenderFpsRef: { current: DEFAULT_WORLD_RENDER_FPS },
      pausedRef: { current: false },
      pausedAnimationMsRef: { current: null },
      worldTimeMsRef: { current: 0 },
      renderInvalidationRef: { current: 0 },
      lastRenderSnapshotRef: { current: createInitialWorldRenderSnapshot() },
    });

    renderFrame();

    expect(warmWorldIconTexturesInBackground).not.toHaveBeenCalled();

    game.player.coord = { q: 1, r: 0 };
    renderFrame();

    expect(getReachableWorldIconAssetIds).toHaveBeenCalledWith(game);
    expect(warmWorldIconTexturesInBackground).toHaveBeenCalledWith([
      'move-buffer-icon',
    ]);

    performanceNowSpy.mockRestore();
  });

  it('re-renders when terrain backgrounds are toggled', () => {
    const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(0);
    const renderScene = vi.fn();
    const game = { player: { coord: { q: 0, r: 0 } } };
    const visibleTiles = [{ coord: { q: 0, r: 0 }, terrain: 'plains' }];
    const selected = { q: 0, r: 0 };
    const showTerrainBackgroundsRef = { current: true };
    const renderFrame = createWorldRenderFrame({
      app: {} as never,
      renderScene,
      gameRef: { current: game } as never,
      visibleTilesRef: { current: visibleTiles } as never,
      selectedRef: { current: selected } as never,
      hoveredMoveRef: { current: null },
      hoveredSafePathRef: { current: null },
      showTerrainBackgroundsRef,
      worldRenderFpsRef: { current: DEFAULT_WORLD_RENDER_FPS },
      pausedRef: { current: false },
      pausedAnimationMsRef: { current: null },
      worldTimeMsRef: { current: 0 },
      renderInvalidationRef: { current: 0 },
      lastRenderSnapshotRef: { current: createInitialWorldRenderSnapshot() },
    });

    renderFrame();
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(1);

    showTerrainBackgroundsRef.current = false;
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(2);
    expect(renderScene.mock.calls[1]?.[8]).toMatchObject({
      showTerrainBackgrounds: false,
      worldTimeMs: 0,
      worldRenderFps: DEFAULT_WORLD_RENDER_FPS,
    });

    performanceNowSpy.mockRestore();
  });

  it('uses the selected render FPS for animation buckets', () => {
    let now = 0;
    const performanceNowSpy = vi
      .spyOn(performance, 'now')
      .mockImplementation(() => now);
    const renderScene = vi.fn();
    const game = { player: { coord: { q: 0, r: 0 } } };
    const visibleTiles = [{ coord: { q: 0, r: 0 }, terrain: 'plains' }];
    const selected = { q: 0, r: 0 };
    const renderFrame = createWorldRenderFrame({
      app: {} as never,
      renderScene,
      gameRef: { current: game } as never,
      visibleTilesRef: { current: visibleTiles } as never,
      selectedRef: { current: selected } as never,
      hoveredMoveRef: { current: null },
      hoveredSafePathRef: { current: null },
      showTerrainBackgroundsRef: { current: true },
      worldRenderFpsRef: { current: 120 },
      pausedRef: { current: false },
      pausedAnimationMsRef: { current: null },
      worldTimeMsRef: { current: 0 },
      renderInvalidationRef: { current: 0 },
      lastRenderSnapshotRef: { current: createInitialWorldRenderSnapshot() },
    });

    renderFrame();
    now = 10;
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(2);
    expect(renderScene.mock.calls[1]?.[8]).toMatchObject({
      worldRenderFps: 120,
    });

    performanceNowSpy.mockRestore();
  });

  it('re-renders when the player movement cooldown changes', () => {
    let now = 500;
    const performanceNowSpy = vi
      .spyOn(performance, 'now')
      .mockImplementation(() => now);
    const renderScene = vi.fn();
    const movementCooldownEndAtRef = { current: null as number | null };
    const renderFrame = createWorldRenderFrame({
      app: {} as never,
      renderScene,
      gameRef: { current: { player: { coord: { q: 0, r: 0 } } } } as never,
      visibleTilesRef: {
        current: [{ coord: { q: 0, r: 0 }, terrain: 'plains' }],
      } as never,
      selectedRef: { current: { q: 0, r: 0 } } as never,
      hoveredMoveRef: { current: null },
      hoveredSafePathRef: { current: null },
      showTerrainBackgroundsRef: { current: true },
      worldRenderFpsRef: { current: DEFAULT_WORLD_RENDER_FPS },
      pausedRef: { current: false },
      pausedAnimationMsRef: { current: null },
      worldTimeMsRef: { current: 0 },
      renderInvalidationRef: { current: 0 },
      lastRenderSnapshotRef: { current: createInitialWorldRenderSnapshot() },
      movementCooldownEndAtRef,
    } as never);

    renderFrame();
    movementCooldownEndAtRef.current = 1_500;
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(2);
    expect(renderScene.mock.calls[1]?.[8]).toMatchObject({
      movementCooldown: {
        endAtMs: 1_500,
      },
    });

    now = 1_500;
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(3);
    expect(renderScene.mock.calls[2]?.[8]).toMatchObject({
      movementCooldown: {
        endAtMs: 1_500,
      },
    });

    performanceNowSpy.mockRestore();
  });

  it('suppresses the player movement cooldown render while combat is active', () => {
    const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(500);
    const renderScene = vi.fn();
    const movementCooldownEndAtRef = { current: 1_500 as number | null };
    const renderFrame = createWorldRenderFrame({
      app: {} as never,
      renderScene,
      gameRef: {
        current: {
          combat: { started: true },
          player: { coord: { q: 0, r: 0 } },
        },
      } as never,
      visibleTilesRef: {
        current: [{ coord: { q: 0, r: 0 }, terrain: 'plains' }],
      } as never,
      selectedRef: { current: { q: 0, r: 0 } } as never,
      hoveredMoveRef: { current: null },
      hoveredSafePathRef: { current: null },
      showTerrainBackgroundsRef: { current: true },
      worldRenderFpsRef: { current: DEFAULT_WORLD_RENDER_FPS },
      pausedRef: { current: false },
      pausedAnimationMsRef: { current: null },
      worldTimeMsRef: { current: 0 },
      renderInvalidationRef: { current: 0 },
      lastRenderSnapshotRef: { current: createInitialWorldRenderSnapshot() },
      movementCooldownEndAtRef,
    } as never);

    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(1);
    expect(renderScene.mock.calls[0]?.[8]).not.toHaveProperty(
      'movementCooldown',
    );

    performanceNowSpy.mockRestore();
  });

  it('keeps the player movement cooldown render during pending staged combat before the intro starts', () => {
    const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(500);
    const renderScene = vi.fn();
    const movementCooldownEndAtRef = { current: 1_500 as number | null };
    const renderFrame = createWorldRenderFrame({
      app: {} as never,
      renderScene,
      gameRef: {
        current: {
          combat: {
            started: false,
            startedAtMs: undefined,
          },
          player: { coord: { q: 0, r: 0 } },
        },
      } as never,
      visibleTilesRef: {
        current: [{ coord: { q: 0, r: 0 }, terrain: 'plains' }],
      } as never,
      selectedRef: { current: { q: 0, r: 0 } } as never,
      hoveredMoveRef: { current: null },
      hoveredSafePathRef: { current: null },
      showTerrainBackgroundsRef: { current: true },
      worldRenderFpsRef: { current: DEFAULT_WORLD_RENDER_FPS },
      pausedRef: { current: false },
      pausedAnimationMsRef: { current: null },
      worldTimeMsRef: { current: 0 },
      renderInvalidationRef: { current: 0 },
      lastRenderSnapshotRef: { current: createInitialWorldRenderSnapshot() },
      movementCooldownEndAtRef,
    } as never);

    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(1);
    expect(renderScene.mock.calls[0]?.[8]).toMatchObject({
      movementCooldown: {
        endAtMs: 1_500,
      },
    });

    performanceNowSpy.mockRestore();
  });

  it('keeps cooldown redraws on wall-clock time while world animation is paused', () => {
    let now = 500;
    const performanceNowSpy = vi
      .spyOn(performance, 'now')
      .mockImplementation(() => now);
    const renderScene = vi.fn();
    const movementCooldownEndAtRef = { current: 1_500 as number | null };
    const renderFrame = createWorldRenderFrame({
      app: {} as never,
      renderScene,
      gameRef: { current: { player: { coord: { q: 0, r: 0 } } } } as never,
      visibleTilesRef: {
        current: [{ coord: { q: 0, r: 0 }, terrain: 'plains' }],
      } as never,
      selectedRef: { current: { q: 0, r: 0 } } as never,
      hoveredMoveRef: { current: null },
      hoveredSafePathRef: { current: null },
      showTerrainBackgroundsRef: { current: true },
      worldRenderFpsRef: { current: DEFAULT_WORLD_RENDER_FPS },
      pausedRef: { current: true },
      pausedAnimationMsRef: { current: 400 },
      worldTimeMsRef: { current: 0 },
      renderInvalidationRef: { current: 0 },
      lastRenderSnapshotRef: { current: createInitialWorldRenderSnapshot() },
      movementCooldownEndAtRef,
    } as never);

    renderFrame();
    now = 1_000;
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(2);
    expect(renderScene.mock.calls[0]?.[8]).toMatchObject({
      movementCooldown: {
        nowMs: 500,
      },
    });
    expect(renderScene.mock.calls[1]?.[8]).toMatchObject({
      movementCooldown: {
        nowMs: 1_000,
      },
    });

    performanceNowSpy.mockRestore();
  });

  it('re-renders while a world movement transition is active and drops it after expiry', () => {
    let now = 0;
    const performanceNowSpy = vi
      .spyOn(performance, 'now')
      .mockImplementation(() => now);
    const renderScene = vi.fn();
    const renderFrame = createWorldRenderFrame({
      app: {} as never,
      renderScene,
      gameRef: { current: { player: { coord: { q: 1, r: 0 } } } } as never,
      visibleTilesRef: {
        current: [{ coord: { q: 1, r: 0 }, terrain: 'plains' }],
      } as never,
      selectedRef: { current: { q: 1, r: 0 } } as never,
      hoveredMoveRef: { current: null },
      hoveredSafePathRef: { current: null },
      showTerrainBackgroundsRef: { current: true },
      worldRenderFpsRef: { current: DEFAULT_WORLD_RENDER_FPS },
      pausedRef: { current: false },
      pausedAnimationMsRef: { current: null },
      worldTimeMsRef: { current: 0 },
      renderInvalidationRef: { current: 0 },
      lastRenderSnapshotRef: { current: createInitialWorldRenderSnapshot() },
      movementTransitionRef: {
        current: {
          durationMs: 1_000,
          fromCoord: { q: 0, r: 0 },
          nowMs: 0,
          outgoingTiles: [],
          startedAtMs: 0,
          toCoord: { q: 1, r: 0 },
        },
      },
    } as never);

    renderFrame();
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(1);

    now = 500;
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(2);
    expect(renderScene.mock.calls[1]?.[8]).toMatchObject({
      movementTransition: {
        durationMs: 1_000,
        fromCoord: { q: 0, r: 0 },
        nowMs: 500,
        toCoord: { q: 1, r: 0 },
      },
    });

    now = 1_000;
    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(3);
    expect(renderScene.mock.calls[2]?.[8]).not.toHaveProperty(
      'movementTransition',
    );

    performanceNowSpy.mockRestore();
  });

  it('skips rendering the intermediate frame after a move updates game state before transition refs catch up', () => {
    const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(0);
    const renderScene = vi.fn();
    const previousGame = { player: { coord: { q: 0, r: 0 } } };
    const nextGame = { player: { coord: { q: 1, r: 0 } } };
    const previousVisibleTiles = [{ coord: { q: 0, r: 0 }, terrain: 'plains' }];
    const visibleTilesRef = { current: previousVisibleTiles };
    const renderFrame = createWorldRenderFrame({
      app: {} as never,
      renderScene,
      gameRef: { current: previousGame } as never,
      visibleTilesRef: visibleTilesRef as never,
      selectedRef: { current: { q: 0, r: 0 } } as never,
      hoveredMoveRef: { current: null },
      hoveredSafePathRef: { current: null },
      showTerrainBackgroundsRef: { current: true },
      worldRenderFpsRef: { current: DEFAULT_WORLD_RENDER_FPS },
      pausedRef: { current: false },
      pausedAnimationMsRef: { current: null },
      worldTimeMsRef: { current: 0 },
      renderInvalidationRef: { current: 0 },
      lastRenderSnapshotRef: { current: createInitialWorldRenderSnapshot() },
      movementCooldownEndAtRef: { current: 1_000 },
      movementTransitionRef: { current: null },
    });

    renderFrame();

    expect(renderScene).toHaveBeenCalledTimes(1);

    const gameRef = { current: nextGame };
    const renderFrameWithMovedGame = createWorldRenderFrame({
      app: {} as never,
      renderScene,
      gameRef: gameRef as never,
      visibleTilesRef: visibleTilesRef as never,
      selectedRef: { current: { q: 1, r: 0 } } as never,
      hoveredMoveRef: { current: null },
      hoveredSafePathRef: { current: null },
      showTerrainBackgroundsRef: { current: true },
      worldRenderFpsRef: { current: DEFAULT_WORLD_RENDER_FPS },
      pausedRef: { current: false },
      pausedAnimationMsRef: { current: null },
      worldTimeMsRef: { current: 0 },
      renderInvalidationRef: { current: 0 },
      lastRenderSnapshotRef: {
        current: {
          ...createInitialWorldRenderSnapshot(),
          animationBucket: 0,
          game: previousGame as never,
          hoveredMove: null,
          hoveredSafePath: null,
          iconTextureVersion: 0,
          invalidationToken: 0,
          movementCooldownEndAtMs: null,
          movementCooldownRenderToken: -1,
          movementTransitionRenderToken: -1,
          selected: { q: 0, r: 0 },
          showTerrainBackgrounds: true,
          visibleTiles: previousVisibleTiles as never,
          worldRenderFps: DEFAULT_WORLD_RENDER_FPS,
        },
      },
      movementCooldownEndAtRef: { current: 1_000 },
      movementTransitionRef: { current: null },
    });

    renderFrameWithMovedGame();

    expect(renderScene).toHaveBeenCalledTimes(1);

    performanceNowSpy.mockRestore();
  });

  it('skips the intermediate adjacent-move frame when visible tiles update before the transition ref', () => {
    const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(0);
    const renderScene = vi.fn();
    const previousGame = { player: { coord: { q: 0, r: 0 } } };
    const nextGame = { player: { coord: { q: 1, r: 0 } } };
    const previousVisibleTiles = [{ coord: { q: 0, r: 0 }, terrain: 'plains' }];
    const nextVisibleTiles = [{ coord: { q: 1, r: 0 }, terrain: 'plains' }];
    const renderFrame = createWorldRenderFrame({
      app: {} as never,
      renderScene,
      gameRef: { current: nextGame } as never,
      visibleTilesRef: { current: nextVisibleTiles } as never,
      selectedRef: { current: { q: 1, r: 0 } } as never,
      hoveredMoveRef: { current: null },
      hoveredSafePathRef: { current: null },
      showTerrainBackgroundsRef: { current: true },
      worldRenderFpsRef: { current: DEFAULT_WORLD_RENDER_FPS },
      pausedRef: { current: false },
      pausedAnimationMsRef: { current: null },
      worldTimeMsRef: { current: 0 },
      renderInvalidationRef: { current: 0 },
      movementCooldownEndAtRef: { current: 1_000 },
      lastRenderSnapshotRef: {
        current: {
          ...createInitialWorldRenderSnapshot(),
          animationBucket: 0,
          game: previousGame as never,
          hoveredMove: null,
          hoveredSafePath: null,
          iconTextureVersion: 0,
          invalidationToken: 0,
          movementCooldownEndAtMs: null,
          movementCooldownRenderToken: -1,
          movementTransitionRenderToken: -1,
          selected: { q: 0, r: 0 },
          showTerrainBackgrounds: true,
          visibleTiles: previousVisibleTiles as never,
          worldRenderFps: DEFAULT_WORLD_RENDER_FPS,
        },
      },
      movementTransitionRef: { current: null },
    });

    renderFrame();

    expect(renderScene).not.toHaveBeenCalled();

    performanceNowSpy.mockRestore();
  });

  it('treats an expired transition ref as missing while the next adjacent move is waiting for fresh transition refs', () => {
    const performanceNowSpy = vi
      .spyOn(performance, 'now')
      .mockReturnValue(2_000);
    const renderScene = vi.fn();
    const previousGame = { player: { coord: { q: 0, r: 0 } } };
    const nextGame = { player: { coord: { q: 1, r: 0 } } };
    const renderFrame = createWorldRenderFrame({
      app: {} as never,
      renderScene,
      gameRef: { current: nextGame } as never,
      visibleTilesRef: {
        current: [{ coord: { q: 1, r: 0 }, terrain: 'plains' }],
      } as never,
      selectedRef: { current: { q: 1, r: 0 } } as never,
      hoveredMoveRef: { current: null },
      hoveredSafePathRef: { current: null },
      showTerrainBackgroundsRef: { current: true },
      worldRenderFpsRef: { current: DEFAULT_WORLD_RENDER_FPS },
      pausedRef: { current: false },
      pausedAnimationMsRef: { current: null },
      worldTimeMsRef: { current: 0 },
      renderInvalidationRef: { current: 0 },
      movementCooldownEndAtRef: { current: 3_000 },
      lastRenderSnapshotRef: {
        current: {
          ...createInitialWorldRenderSnapshot(),
          animationBucket: 0,
          game: previousGame as never,
          hoveredMove: null,
          hoveredSafePath: null,
          iconTextureVersion: 0,
          invalidationToken: 0,
          movementCooldownEndAtMs: null,
          movementCooldownRenderToken: -1,
          movementTransitionRenderToken: -1,
          selected: { q: 0, r: 0 },
          showTerrainBackgrounds: true,
          visibleTiles: [{ coord: { q: 0, r: 0 }, terrain: 'plains' }] as never,
          worldRenderFps: DEFAULT_WORLD_RENDER_FPS,
        },
      },
      movementTransitionRef: {
        current: {
          durationMs: 1_000,
          displayTiles: [],
          fromCoord: { q: -1, r: 0 },
          incomingTiles: [],
          outgoingTiles: [],
          startedAtMs: 0,
          toCoord: { q: 0, r: 0 },
        },
      },
    });

    renderFrame();

    expect(renderScene).not.toHaveBeenCalled();

    performanceNowSpy.mockRestore();
  });

  it('treats an active transition for the previous move as missing when its destination no longer matches the current player coord', () => {
    const performanceNowSpy = vi.spyOn(performance, 'now').mockReturnValue(500);
    const renderScene = vi.fn();
    const previousGame = { player: { coord: { q: 0, r: 0 } } };
    const nextGame = { player: { coord: { q: -1, r: 0 } } };
    const renderFrame = createWorldRenderFrame({
      app: {} as never,
      renderScene,
      gameRef: { current: nextGame } as never,
      visibleTilesRef: {
        current: [{ coord: { q: -1, r: 0 }, terrain: 'plains' }],
      } as never,
      selectedRef: { current: { q: -1, r: 0 } } as never,
      hoveredMoveRef: { current: null },
      hoveredSafePathRef: { current: null },
      showTerrainBackgroundsRef: { current: true },
      worldRenderFpsRef: { current: DEFAULT_WORLD_RENDER_FPS },
      pausedRef: { current: false },
      pausedAnimationMsRef: { current: null },
      worldTimeMsRef: { current: 0 },
      renderInvalidationRef: { current: 0 },
      movementCooldownEndAtRef: { current: 1_500 },
      lastRenderSnapshotRef: {
        current: {
          ...createInitialWorldRenderSnapshot(),
          animationBucket: 0,
          game: previousGame as never,
          hoveredMove: null,
          hoveredSafePath: null,
          iconTextureVersion: 0,
          invalidationToken: 0,
          movementCooldownEndAtMs: null,
          movementCooldownRenderToken: -1,
          movementTransitionRenderToken: -1,
          selected: { q: 0, r: 0 },
          showTerrainBackgrounds: true,
          visibleTiles: [{ coord: { q: 0, r: 0 }, terrain: 'plains' }] as never,
          worldRenderFps: DEFAULT_WORLD_RENDER_FPS,
        },
      },
      movementTransitionRef: {
        current: {
          durationMs: 1_000,
          displayTiles: [],
          fromCoord: { q: 0, r: 0 },
          incomingTiles: [],
          outgoingTiles: [],
          startedAtMs: 0,
          toCoord: { q: 1, r: 0 },
        },
      },
    });

    renderFrame();

    expect(renderScene).not.toHaveBeenCalled();

    performanceNowSpy.mockRestore();
  });
});
